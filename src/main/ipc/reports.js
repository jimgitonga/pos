const fs = require("fs");
const path = require("path");
const { dialog, shell } = require("electron");
const {
  generateLineChart,
  generateBarChart,
  generatePieChart,
} = require("./chartGenerator");
function setupReportsHandlers(ipcMain, db) {
  // Sales Report
  ipcMain.handle("reports:getSalesReport", async (event, params) => {
    try {
      const { startDate, endDate, groupBy = "day" } = params;

      let dateFormat;
      switch (groupBy) {
        case "hour":
          dateFormat = "%Y-%m-%d %H:00";
          break;
        case "day":
          dateFormat = "%Y-%m-%d";
          break;
        case "week":
          dateFormat = "%Y-W%W";
          break;
        case "month":
          dateFormat = "%Y-%m";
          break;
        default:
          dateFormat = "%Y-%m-%d";
      }

      const salesData = db
        .prepare(
          `
        SELECT 
          strftime('${dateFormat}', created_at) as period,
          COUNT(*) as transaction_count,
          SUM(CASE WHEN payment_status != 'refunded' THEN total_amount ELSE 0 END) as revenue,
          SUM(CASE WHEN payment_status = 'refunded' THEN total_amount ELSE 0 END) as refunds,
          SUM(tax_amount) as tax_collected,
          SUM(discount_amount) as discounts_given,
          AVG(CASE WHEN payment_status != 'refunded' THEN total_amount ELSE NULL END) as avg_transaction
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
        GROUP BY period
        ORDER BY period ASC
      `
        )
        .all(startDate, endDate);

      const paymentMethods = db
        .prepare(
          `
        SELECT 
          p.payment_method,
          COUNT(*) as count,
          SUM(p.amount) as total
        FROM payments p
        JOIN sales s ON p.sale_id = s.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
        GROUP BY p.payment_method
      `
        )
        .all(startDate, endDate);

      const topProducts = db
        .prepare(
          `
        SELECT 
          p.name,
          p.sku,
          SUM(si.quantity) as units_sold,
          SUM(si.total_price) as revenue,
          COUNT(DISTINCT s.id) as transactions
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
          AND s.payment_status != 'refunded'
        GROUP BY p.id
        ORDER BY revenue DESC
        LIMIT 20
      `
        )
        .all(startDate, endDate);

      const categories = db
        .prepare(
          `
        SELECT 
          c.name as category,
          SUM(si.quantity) as units_sold,
          SUM(si.total_price) as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
          AND s.payment_status != 'refunded'
        GROUP BY c.id
        ORDER BY revenue DESC
      `
        )
        .all(startDate, endDate);

      return {
        success: true,
        data: {
          salesData,
          paymentMethods,
          topProducts,
          categories,
        },
      };
    } catch (error) {
      console.error("Get sales report error:", error);
      return { success: false, error: "Failed to generate sales report" };
    }
  });

  // Inventory Report
//   ipcMain.handle("reports:getInventoryReport", async (event, params) => {
//     try {
//       const stockLevels = db
//         .prepare(
//           `
//         SELECT 
//           p.sku,
//           p.name,
//           c.name as category,
//           i.quantity as current_stock,
//           p.low_stock_threshold,
//           p.unit_price,
//           p.cost_price,
//           (i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as stock_value,
//           CASE 
//             WHEN i.quantity = 0 THEN 'Out of Stock'
//             WHEN i.quantity <= p.low_stock_threshold THEN 'Low Stock'
//             ELSE 'In Stock'
//           END as status
//         FROM products p
//         JOIN inventory i ON p.id = i.product_id
//         LEFT JOIN categories c ON p.category_id = c.id
//         WHERE p.is_active = 1 AND p.track_inventory = 1
//         ORDER BY i.quantity ASC
//       `
//         )
//         .all();

//       const movements = db
//         .prepare(
//           `
//         SELECT 
//           DATE(sm.created_at) as date,
//           p.name as product,
//           sm.movement_type,
//           sm.quantity,
//           sm.reason,
//           u.full_name as user
//         FROM stock_movements sm
//         JOIN products p ON sm.product_id = p.id
//         JOIN users u ON sm.user_id = u.id
//         WHERE sm.created_at >= date('now', '-30 days')
//         ORDER BY sm.created_at DESC
//         LIMIT 100
//       `
//         )
//         .all();

//       const summary = db
//         .prepare(
//           `
//         SELECT 
//           COUNT(DISTINCT p.id) as total_products,
//           SUM(i.quantity) as total_units,
//           SUM(i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as total_value,
//           COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock,
//           COUNT(CASE WHEN i.quantity > 0 AND i.quantity <= p.low_stock_threshold THEN 1 END) as low_stock
//         FROM products p
//         JOIN inventory i ON p.id = i.product_id
//         WHERE p.is_active = 1 AND p.track_inventory = 1
//       `
//         )
//         .get();
// console.log("summary is>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ",summary);
//       return {
//         success: true,
//         data: {
//           stockLevels,
//           movements,
//           summary,
//         },
//       };
//     } catch (error) {
//       console.error("Get inventory report error:", error);
//       return { success: false, error: "Failed to generate inventory report" };
//     }
//   });




// Updated getInventoryReport handler in reports.js
ipcMain.handle("reports:getInventoryReport", async (event, params) => {
  try {
    // Extract pagination parameters with defaults
    const { 
      stockPage = 1, 
      stockLimit = 10,
      movementsPage = 1,
      movementsLimit = 10 
    } = params || {};

    // Calculate offsets
    const stockOffset = (stockPage - 1) * stockLimit;
    const movementsOffset = (movementsPage - 1) * movementsLimit;

    // Get total count for stock levels
    const stockCount = db
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = 1 AND p.track_inventory = 1
      `
      )
      .get();

    // Get paginated stock levels
    const stockLevels = db
      .prepare(
        `
        SELECT 
          p.sku,
          p.name,
          c.name as category,
          i.quantity as current_stock,
          p.low_stock_threshold,
          p.unit_price,
          p.cost_price,
          (i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as stock_value,
          CASE 
            WHEN i.quantity = 0 THEN 'Out of Stock'
            WHEN i.quantity <= p.low_stock_threshold THEN 'Low Stock'
            ELSE 'In Stock'
          END as status
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND p.track_inventory = 1
        ORDER BY i.quantity ASC
        LIMIT ? OFFSET ?
      `
      )
      .all(stockLimit, stockOffset);

    // Get total count for movements
    const movementsCount = db
      .prepare(
        `
        SELECT COUNT(*) as total
        FROM stock_movements sm
        WHERE sm.created_at >= date('now', '-30 days')
      `
      )
      .get();

    // Get paginated movements
    const movements = db
      .prepare(
        `
        SELECT 
          DATE(sm.created_at) as date,
          p.name as product,
          sm.movement_type,
          sm.quantity,
          sm.reason,
          u.full_name as user
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN users u ON sm.user_id = u.id
        WHERE sm.created_at >= date('now', '-30 days')
        ORDER BY sm.created_at DESC
        LIMIT ? OFFSET ?
      `
      )
      .all(movementsLimit, movementsOffset);

    const summary = db
      .prepare(
        `
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          SUM(i.quantity) as total_units,
          SUM(i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as total_value,
          COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN i.quantity > 0 AND i.quantity <= p.low_stock_threshold THEN 1 END) as low_stock
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = 1 AND p.track_inventory = 1
      `
      )
      .get();

    console.log("summary is>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> ", summary);

    return {
      success: true,
      data: {
        stockLevels,
        stockPagination: {
          page: stockPage,
          limit: stockLimit,
          total: stockCount.total,
          totalPages: Math.ceil(stockCount.total / stockLimit)
        },
        movements,
        movementsPagination: {
          page: movementsPage,
          limit: movementsLimit,
          total: movementsCount.total,
          totalPages: Math.ceil(movementsCount.total / movementsLimit)
        },
        summary,
      },
    };
  } catch (error) {
    console.error("Get inventory report error:", error);
    return { success: false, error: "Failed to generate inventory report" };
  }
});


  // Add this handler to your reports.js file in the setupReportsHandlers function

  // Customer Analytics Report
  ipcMain.handle("reports:getCustomerAnalytics", async (event, params) => {
    try {
      const { startDate, endDate } = params;

      // Customer metrics
      const metrics = db
        .prepare(
          `
      SELECT 
        COUNT(DISTINCT c.id) as total_customers,
        COUNT(DISTINCT CASE WHEN s.created_at IS NOT NULL THEN c.id END) as active_customers,
        COUNT(DISTINCT CASE WHEN c.created_at >= DATE(?, '-30 days') THEN c.id END) as new_customers,
        AVG(c.loyalty_points) as avg_loyalty_points,
        SUM(c.loyalty_points) as total_loyalty_points
      FROM customers c
      LEFT JOIN sales s ON c.id = s.customer_id 
        AND DATE(s.created_at) BETWEEN ? AND ?
      WHERE c.is_active = 1
    `
        )
        .get(endDate, startDate, endDate);

      // Customer segmentation by purchase frequency
      const segmentation = db
        .prepare(
          `
      WITH customer_purchases AS (
        SELECT 
          c.id,
          c.customer_group,
          COUNT(s.id) as purchase_count,
          SUM(s.total_amount) as total_spent,
          AVG(s.total_amount) as avg_value
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
          AND DATE(s.created_at) BETWEEN ? AND ?
          AND s.payment_status != 'refunded'
        WHERE c.is_active = 1
        GROUP BY c.id
      )
      SELECT 
        CASE 
          WHEN purchase_count = 0 THEN 'Inactive'
          WHEN purchase_count = 1 THEN 'New'
          WHEN purchase_count BETWEEN 2 AND 5 THEN 'Regular'
          WHEN purchase_count > 5 THEN 'VIP'
        END as segment,
        COUNT(*) as count,
        AVG(total_spent) as avg_value,
        SUM(total_spent) as total_value
      FROM customer_purchases
      GROUP BY segment
      ORDER BY avg_value DESC
    `
        )
        .all(startDate, endDate);

      // Top customers
      const topCustomers = db
        .prepare(
          `
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.loyalty_points,
        COUNT(s.id) as purchase_count,
        SUM(s.total_amount) as total_spent,
        AVG(s.total_amount) as avg_purchase,
        MAX(s.created_at) as last_purchase
      FROM customers c
      JOIN sales s ON c.id = s.customer_id
      WHERE DATE(s.created_at) BETWEEN ? AND ?
        AND s.payment_status != 'refunded'
        AND c.is_active = 1
      GROUP BY c.id
      ORDER BY total_spent DESC
      LIMIT 10
    `
        )
        .all(startDate, endDate);

      // Purchase patterns
      const purchasePatterns = db
        .prepare(
          `
      SELECT 
        strftime('%w', s.created_at) as day_of_week,
        strftime('%H', s.created_at) as hour_of_day,
        COUNT(DISTINCT s.customer_id) as unique_customers,
        COUNT(*) as transactions,
        SUM(s.total_amount) as revenue
      FROM sales s
      WHERE DATE(s.created_at) BETWEEN ? AND ?
        AND s.payment_status != 'refunded'
        AND s.customer_id IS NOT NULL
      GROUP BY day_of_week, hour_of_day
    `
        )
        .all(startDate, endDate);

      // Customer lifetime value trends
      const lifetimeValues = db
        .prepare(
          `
      SELECT 
        c.customer_group,
        COUNT(DISTINCT c.id) as customer_count,
        AVG(lifetime_value) as avg_ltv,
        MAX(lifetime_value) as max_ltv
      FROM (
        SELECT 
          c.id,
          c.customer_group,
          SUM(s.total_amount) as lifetime_value
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
          AND s.payment_status != 'refunded'
        WHERE c.is_active = 1
        GROUP BY c.id
      ) c
      GROUP BY c.customer_group
    `
        )
        .all();

      return {
        success: true,
        analytics: {
          metrics,
          segmentation,
          topCustomers,
          purchasePatterns,
          lifetimeValues,
        },
      };
    } catch (error) {
      console.error("Get customer analytics error:", error);
      return { success: false, error: "Failed to generate customer analytics" };
    }
  });

  // Add the export handler to your setupReportsHandlers function
  ipcMain.handle(
    "reports:exportReport",
    async (event, { type, params, format }) => {
      try {
        // Get report data first
        let reportData;
        switch (type) {
          case "sales":
            reportData = await getReportData("sales", params, db);
            break;
          case "inventory":
            reportData = await getReportData("inventory", params, db);
            break;
          case "customers":
            reportData = await getReportData("customers", params, db);
            break;
          case "staff":
            reportData = await getReportData("staff", params, db);
            break;
          default:
            throw new Error("Invalid report type");
        }

        // Get business info for the header
        const businessInfo = {};
        const settings = db
          .prepare(
            "SELECT key, value FROM settings WHERE key LIKE 'business_%'"
          )
          .all();
        settings.forEach((setting) => {
          businessInfo[setting.key] = setting.value;
        });

        // Generate HTML
        const html = generateReportHTML(type, reportData, params, businessInfo);

        // Create a hidden window to render the HTML
        const { BrowserWindow } = require("electron");
        const pdfWindow = new BrowserWindow({
          show: false,
          webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
          },
        });

        // Load the HTML
        await pdfWindow.loadURL(
          `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
        );

        // Generate PDF
        const pdfData = await pdfWindow.webContents.printToPDF({
          marginsType: 0,
          printBackground: true,
          printSelectionOnly: false,
          landscape: false,
          pageSize: "A4",
          scaleFactor: 100,
        });

        // Close the window
        pdfWindow.close();

        // Save PDF
        const { filePath } = await dialog.showSaveDialog({
          title: "Save Report",
          defaultPath: `${type}_report_${
            new Date().toISOString().split("T")[0]
          }.pdf`,
          filters: [{ name: "PDF Files", extensions: ["pdf"] }],
        });

        if (filePath) {
          fs.writeFileSync(filePath, pdfData);

          // Open the PDF after saving
          shell.openPath(filePath);

          return { success: true, filePath };
        }

        return { success: false, error: "Save cancelled" };
      } catch (error) {
        console.error("Export report error:", error);
        return { success: false, error: error.message };
      }
    }
  );

  // Staff Performance Report
  ipcMain.handle("reports:getStaffPerformance", async (event, params) => {
    try {
      const { startDate, endDate } = params;

      const performance = db
        .prepare(
          `
        SELECT 
          u.id,
          u.full_name,
          u.role,
          COUNT(s.id) as transactions,
          SUM(CASE WHEN s.payment_status != 'refunded' THEN s.total_amount ELSE 0 END) as revenue,
          SUM(CASE WHEN s.payment_status = 'refunded' THEN 1 ELSE 0 END) as voids,
          AVG(CASE WHEN s.payment_status != 'refunded' THEN s.total_amount ELSE NULL END) as avg_sale,
          MAX(s.created_at) as last_sale
        FROM users u
        LEFT JOIN sales s ON u.id = s.user_id 
          AND DATE(s.created_at) BETWEEN ? AND ?
        WHERE u.role IN ('admin', 'manager', 'cashier')
        GROUP BY u.id
        ORDER BY revenue DESC
      `
        )
        .all(startDate, endDate);

      const hourlyActivity = db
        .prepare(
          `
        SELECT 
          u.full_name,
          strftime('%H', s.created_at) as hour,
          COUNT(*) as transactions
        FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
        GROUP BY u.id, hour
        ORDER BY u.full_name, hour
      `
        )
        .all(startDate, endDate);

      return {
        success: true,
        data: {
          performance,
          hourlyActivity,
        },
      };
    } catch (error) {
      console.error("Get staff performance error:", error);
      return {
        success: false,
        error: "Failed to generate staff performance report",
      };
    }
  });

  return ipcMain;
}

// Helper function to generate HTML for PDF
function generateReportHTML(reportType, data, dateRange, businessInfo) {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Base styles for the PDF
  const styles = `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        color: #1f2937;
        line-height: 1.6;
        background: white;
        padding: 40px;
      }
      
      .header {
        display: flex;
        justify-content: space-between;
        align-items: start;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 2px solid #e5e7eb;
      }
      
      .company-info h1 {
        font-size: 28px;
        font-weight: 700;
        color: #111827;
        margin-bottom: 8px;
      }
      
      .company-info p {
        color: #6b7280;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .report-meta {
        text-align: right;
      }
      
      .report-title {
        font-size: 20px;
        font-weight: 600;
        color: #3b82f6;
        margin-bottom: 8px;
      }
      
      .date-range {
        color: #6b7280;
        font-size: 14px;
      }
      
      .summary-cards {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        margin-bottom: 40px;
      }
      
      .summary-card {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        padding: 20px;
        border-radius: 12px;
        border: 1px solid #e5e7eb;
      }
      
      .summary-card.primary {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        color: white;
      }
      
      .summary-card h3 {
        font-size: 14px;
        font-weight: 500;
        margin-bottom: 8px;
        opacity: 0.8;
      }
      
      .summary-card .value {
        font-size: 24px;
        font-weight: 700;
      }
      
      .summary-card .change {
        font-size: 12px;
        margin-top: 4px;
      }
      
      .section {
        margin-bottom: 40px;
      }
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #111827;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .section-title::before {
        content: '';
        width: 4px;
        height: 20px;
        background: #3b82f6;
        border-radius: 2px;
      }
      
      table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
      }
      
      th {
        background: #f9fafb;
        padding: 12px;
        text-align: left;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        text-transform: uppercase;
        border-bottom: 2px solid #e5e7eb;
      }
      
      td {
        padding: 12px;
        border-bottom: 1px solid #f3f4f6;
      }
      
      tr:hover {
        background: #f9fafb;
      }
      
      .chart-container {
        background: #f9fafb;
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 20px;
        page-break-inside: avoid;
      }
      
      .footer {
        margin-top: 60px;
        padding-top: 20px;
        border-top: 2px solid #e5e7eb;
        text-align: center;
        color: #6b7280;
        font-size: 12px;
      }
      
      .badge {
        display: inline-block;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .badge.success {
        background: #d1fae5;
        color: #065f46;
      }
      
      .badge.warning {
        background: #fed7aa;
        color: #92400e;
      }
      
      .badge.danger {
        background: #fee2e2;
        color: #991b1b;
      }
      
      @media print {
        body {
          padding: 20px;
        }
        
        .section {
          page-break-inside: avoid;
        }
        
        .chart-container {
          page-break-inside: avoid;
        }
      }
    </style>
  `;

  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${
        reportType.charAt(0).toUpperCase() + reportType.slice(1)
      } Report</title>
      ${styles}
    </head>
    <body>
  `;

  // Header
  html += `
    <div class="header">
      <div class="company-info">
        <h1>${businessInfo.business_name || "POS System"}</h1>
        <p>${businessInfo.business_address || ""}</p>
        <p>${businessInfo.business_phone || ""} | ${
    businessInfo.business_email || ""
  }</p>
        <p>Tax ID: ${businessInfo.tax_number || ""}</p>
      </div>
      <div class="report-meta">
        <div class="report-title">${getReportTitle(reportType)}</div>
        <div class="date-range">${formatDateRange(dateRange)}</div>
        <div class="date-range">Generated: ${currentDate}</div>
      </div>
    </div>
  `;

  // Generate content based on report type
  switch (reportType) {
    case "sales":
      html += generateSalesReportHTML(data);
      break;
    case "inventory":
      html += generateInventoryReportHTML(data);
      break;
    case "customers":
      html += generateCustomerReportHTML(data);
      break;
    case "staff":
      html += generateStaffReportHTML(data);
      break;
  }

  // Footer
  html += `
    <div class="footer">
      <p>This report is confidential and proprietary to ${
        businessInfo.business_name || "the company"
      }</p>
      <p>© ${new Date().getFullYear()} All rights reserved</p>
    </div>
    </body>
    </html>
  `;

  return html;
}

function getReportTitle(reportType) {
  const titles = {
    sales: "Sales Performance Report",
    inventory: "Inventory Status Report",
    customers: "Customer Analytics Report",
    staff: "Staff Performance Report",
  };
  return titles[reportType] || "Report";
}

function formatDateRange(dateRange) {
  const start = new Date(dateRange.startDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const end = new Date(dateRange.endDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${start} - ${end}`;
}

function generateSalesReportHTML(data) {
  let html = "";

  // Summary Cards

  // Summary Cards (your existing code)
  if (data.salesData && data.salesData.length > 0) {
    const totalRevenue = data.salesData.reduce(
      (sum, day) => sum + day.revenue,
      0
    );
    const totalTransactions = data.salesData.reduce(
      (sum, day) => sum + day.transaction_count,
      0
    );
    const avgTransaction = totalRevenue / totalTransactions || 0;
    const totalRefunds = data.salesData.reduce(
      (sum, day) => sum + day.refunds,
      0
    );

    html += `
      <div class="summary-cards">
        <div class="summary-card primary">
          <h3>Total Revenue</h3>
          <div class="value">KES ${totalRevenue.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Transactions</h3>
          <div class="value">${totalTransactions.toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Average Sale</h3>
          <div class="value">KES ${avgTransaction.toFixed(2)}</div>
        </div>
        <div class="summary-card">
          <h3>Refunds</h3>
          <div class="value">KES ${totalRefunds.toLocaleString()}</div>
        </div>
      </div>
    `;
  }

  if (data.salesData && data.salesData.length > 0) {
    const chartData = data.salesData.map((day) => ({
      label: new Date(day.period).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      value: day.revenue,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Revenue Trend</h2>
        <div class="chart-container">
          ${generateLineChart(chartData, { width: 700, height: 300 })}
        </div>
      </div>
    `;
  }

  // Daily Sales Table
  if (data.salesData && data.salesData.length > 0) {
    html += `
      <div class="section">
        <h2 class="section-title">Daily Sales Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Transactions</th>
              <th>Revenue</th>
              <th>Tax</th>
              <th>Discounts</th>
              <th>Net Sales</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.salesData.forEach((day) => {
      const netSales = day.revenue - day.tax_collected - day.discount_amount;
      html += `
        <tr>
          <td>${new Date(day.period).toLocaleDateString()}</td>
          <td>${day.transaction_count}</td>
          <td>KES ${day.revenue.toLocaleString()}</td>
          <td>KES ${day.tax_collected.toLocaleString()}</td>
          <td>KES ${day.discounts_given.toLocaleString()}</td>
          <td><strong>KES ${netSales.toLocaleString()}</strong></td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  // ADD THIS: Top Categories Bar Chart
  if (data.categories && data.categories.length > 0) {
    const barData = data.categories.slice(0, 5).map((cat) => ({
      label: cat.category || "Uncategorized",
      value: cat.revenue,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Top Categories by Revenue</h2>
        <div class="chart-container">
          ${generateBarChart(barData, { width: 700, height: 400 })}
        </div>
      </div>
    `;
  }

  // Top Products
  if (data.topProducts && data.topProducts.length > 0) {
    html += `
      <div class="section">
        <h2 class="section-title">Top Selling Products</h2>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>SKU</th>
              <th>Units Sold</th>
              <th>Revenue</th>
              <th>Avg. Price</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.topProducts.slice(0, 10).forEach((product, index) => {
      const avgPrice = product.revenue / product.units_sold;
      html += `
        <tr>
          <td>
            <strong>${index + 1}. ${product.name}</strong>
          </td>
          <td>${product.sku}</td>
          <td>${product.units_sold}</td>
          <td>KES ${product.revenue.toLocaleString()}</td>
          <td>KES ${avgPrice.toFixed(2)}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  if (data.paymentMethods && data.paymentMethods.length > 0) {
    const pieData = data.paymentMethods.map((method) => ({
      label: method.payment_method.toUpperCase(),
      value: method.total,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Payment Methods Distribution</h2>
        <div class="chart-container" style="text-align: center;">
          ${generatePieChart(pieData, { width: 400, height: 400 })}
        </div>
      </div>
    `;
  }

  // Payment Methods
  if (data.paymentMethods && data.paymentMethods.length > 0) {
    html += `
      <div class="section">
        <h2 class="section-title">Payment Methods Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Payment Method</th>
              <th>Transactions</th>
              <th>Total Amount</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
    `;

    const totalPayments = data.paymentMethods.reduce(
      (sum, method) => sum + method.total,
      0
    );

    data.paymentMethods.forEach((method) => {
      const percentage = ((method.total / totalPayments) * 100).toFixed(1);
      html += `
        <tr>
          <td><strong>${method.payment_method.toUpperCase()}</strong></td>
          <td>${method.count}</td>
          <td>KES ${method.total.toLocaleString()}</td>
          <td>${percentage}%</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

function generateInventoryReportHTML(data) {
  let html = "";

  // Summary Cards
  if (data.summary) {
    html += `
      <div class="summary-cards">
        <div class="summary-card primary">
          <h3>Stock Value</h3>
          <div class="value">KES ${(
            data.summary.total_value || 0
          ).toLocaleString()}</div>
        </div>
        <div class="summary-card">
          <h3>Total Products</h3>
          <div class="value">${data.summary.total_products}</div>
        </div>
        <div class="summary-card">
          <h3>Low Stock Items</h3>
          <div class="value">${data.summary.low_stock}</div>
        </div>
        <div class="summary-card">
          <h3>Out of Stock</h3>
          <div class="value">${data.summary.out_of_stock}</div>
        </div>
      </div>
    `;
  }

  // ADD THIS: Stock Status Distribution Pie Chart
  if (data.stockLevels && data.stockLevels.length > 0) {
    const stockStatusData = data.stockLevels.reduce((acc, item) => {
      const status = item.status;
      if (!acc[status]) acc[status] = 0;
      acc[status]++;
      return acc;
    }, {});

    const pieData = Object.entries(stockStatusData).map(([status, count]) => ({
      label: status,
      value: count,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Stock Status Distribution</h2>
        <div class="chart-container" style="text-align: center;">
          ${generatePieChart(pieData, {
            width: 400,
            height: 400,
            colors: ["#10b981", "#f59e0b", "#ef4444"], // Green, Orange, Red
          })}
        </div>
      </div>
    `;
  }

  // Stock Status
  if (data.stockLevels && data.stockLevels.length > 0) {
    html += `
      <div class="section">
        <h2 class="section-title">Current Stock Status</h2>
        <table>
          <thead>
            <tr>
              <th>SKU</th>
              <th>Product Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Stock Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.stockLevels.forEach((item) => {
      const statusClass =
        item.status === "Out of Stock"
          ? "danger"
          : item.status === "Low Stock"
          ? "warning"
          : "success";

      html += `
        <tr>
          <td>${item.sku}</td>
          <td><strong>${item.name}</strong></td>
          <td>${item.category || "Uncategorized"}</td>
          <td>${item.current_stock}</td>
          <td>KES ${(item.stock_value || 0).toLocaleString()}</td>
          <td><span class="badge ${statusClass}">${item.status}</span></td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

function generateCustomerReportHTML(data) {
  let html = "";

  // Summary Cards
  if (data.metrics) {
    html += `
      <div class="summary-cards">
        <div class="summary-card primary">
          <h3>Total Customers</h3>
          <div class="value">${data.metrics.total_customers}</div>
          <div class="change">+${data.metrics.new_customers} new</div>
        </div>
        <div class="summary-card">
          <h3>Active Customers</h3>
          <div class="value">${data.metrics.active_customers}</div>
        </div>
        <div class="summary-card">
          <h3>Avg. Loyalty Points</h3>
          <div class="value">${Math.round(
            data.metrics.avg_loyalty_points || 0
          )}</div>
        </div>
        <div class="summary-card">
          <h3>Total Points</h3>
          <div class="value">${(
            data.metrics.total_loyalty_points || 0
          ).toLocaleString()}</div>
        </div>
      </div>
    `;
  }

  // ADD THIS: Customer Segmentation Pie Chart
  if (data.segmentation && data.segmentation.length > 0) {
    const pieData = data.segmentation.map((segment) => ({
      label: segment.segment,
      value: segment.count,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Customer Segmentation</h2>
        <div class="chart-container" style="text-align: center;">
          ${generatePieChart(pieData, { width: 400, height: 400 })}
        </div>
      </div>
    `;
  }

  // ADD THIS: Top Customers Bar Chart
  if (data.topCustomers && data.topCustomers.length > 0) {
    const barData = data.topCustomers.slice(0, 5).map((customer) => ({
      label: `${customer.first_name} ${customer.last_name}`,
      value: customer.total_spent,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Top 5 Customers by Revenue</h2>
        <div class="chart-container">
          ${generateBarChart(barData, { width: 700, height: 400 })}
        </div>
      </div>
    `;
  }

  // Top Customers
  if (data.topCustomers && data.topCustomers.length > 0) {
    html += `
      <div class="section">
        <h2 class="section-title">Top Customers by Revenue</h2>
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Customer Name</th>
              <th>Total Purchases</th>
              <th>Total Spent</th>
              <th>Avg. Purchase</th>
              <th>Last Purchase</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.topCustomers.forEach((customer, index) => {
      const avgPurchase = customer.total_spent / customer.purchase_count;
      html += `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${customer.first_name} ${customer.last_name}</strong></td>
          <td>${customer.purchase_count}</td>
          <td>KES ${customer.total_spent.toLocaleString()}</td>
          <td>KES ${avgPurchase.toFixed(2)}</td>
          <td>${new Date(customer.last_purchase).toLocaleDateString()}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

function generateStaffReportHTML(data) {
  let html = "";



  if (data.performance && data.performance.length > 0) {
    const barData = data.performance.slice(0, 10).map((staff) => ({
      label: staff.full_name,
      value: staff.revenue || 0,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Staff Revenue Performance</h2>
        <div class="chart-container">
          ${generateBarChart(barData, { width: 700, height: 400 })}
        </div>
      </div>
    `;
  }
  // ADD THIS: Transactions by Staff Pie Chart
  if (data.performance && data.performance.length > 0) {
    const pieData = data.performance.map((staff) => ({
      label: staff.full_name,
      value: staff.transactions || 0,
    }));

    html += `
      <div class="section">
        <h2 class="section-title">Transaction Distribution by Staff</h2>
        <div class="chart-container" style="text-align: center;">
          ${generatePieChart(pieData, { width: 400, height: 400 })}
        </div>
      </div>
    `;
  }

  // Staff Performance
  if (data.performance && data.performance.length > 0) {
    html += `
      <div class="section">
        <h2 class="section-title">Staff Performance Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Role</th>
              <th>Transactions</th>
              <th>Revenue Generated</th>
              <th>Avg. Sale</th>
              <th>Void/Refunds</th>
            </tr>
          </thead>
          <tbody>
    `;

    data.performance.forEach((staff) => {
      html += `
        <tr>
          <td><strong>${staff.full_name}</strong></td>
          <td><span class="badge">${staff.role.toUpperCase()}</span></td>
          <td>${staff.transactions || 0}</td>
          <td>KES ${(staff.revenue || 0).toLocaleString()}</td>
          <td>KES ${(staff.avg_sale || 0).toFixed(2)}</td>
          <td>${staff.voids || 0}</td>
        </tr>
      `;
    });

    html += `
          </tbody>
        </table>
      </div>
    `;
  }

  return html;
}

async function getReportData(type, params, db) {
  switch (type) {
    case "sales":
      const salesResult = await getSalesReportData(params, db);
      return salesResult.data;
    case "inventory":
      const inventoryResult = await getInventoryReportData(params, db);
      return inventoryResult.data;
    case "customers":
      const customerResult = await getCustomerAnalyticsData(params, db);
      return customerResult.analytics;
    case "staff":
      const staffResult = await getStaffPerformanceData(params, db);
      return staffResult.data;
    default:
      throw new Error("Invalid report type");
  }
}

async function getSalesReportData(params, db) {
  const { startDate, endDate, groupBy = "day" } = params;

  let dateFormat;
  switch (groupBy) {
    case "hour":
      dateFormat = "%Y-%m-%d %H:00";
      break;
    case "day":
      dateFormat = "%Y-%m-%d";
      break;
    case "week":
      dateFormat = "%Y-W%W";
      break;
    case "month":
      dateFormat = "%Y-%m";
      break;
    default:
      dateFormat = "%Y-%m-%d";
  }

  const salesData = db
    .prepare(
      `
    SELECT 
      strftime('${dateFormat}', created_at) as period,
      COUNT(*) as transaction_count,
      SUM(CASE WHEN payment_status != 'refunded' THEN total_amount ELSE 0 END) as revenue,
      SUM(CASE WHEN payment_status = 'refunded' THEN total_amount ELSE 0 END) as refunds,
      SUM(tax_amount) as tax_collected,
      SUM(discount_amount) as discounts_given,
      AVG(CASE WHEN payment_status != 'refunded' THEN total_amount ELSE NULL END) as avg_transaction
    FROM sales
    WHERE DATE(created_at) BETWEEN ? AND ?
    GROUP BY period
    ORDER BY period ASC
  `
    )
    .all(startDate, endDate);

  const paymentMethods = db
    .prepare(
      `
    SELECT 
      p.payment_method,
      COUNT(*) as count,
      SUM(p.amount) as total
    FROM payments p
    JOIN sales s ON p.sale_id = s.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
    GROUP BY p.payment_method
  `
    )
    .all(startDate, endDate);

  const topProducts = db
    .prepare(
      `
    SELECT 
      p.name,
      p.sku,
      SUM(si.quantity) as units_sold,
      SUM(si.total_price) as revenue,
      COUNT(DISTINCT s.id) as transactions
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      AND s.payment_status != 'refunded'
    GROUP BY p.id
    ORDER BY revenue DESC
    LIMIT 20
  `
    )
    .all(startDate, endDate);

  const categories = db
    .prepare(
      `
    SELECT 
      c.name as category,
      SUM(si.quantity) as units_sold,
      SUM(si.total_price) as revenue
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE DATE(s.created_at) BETWEEN ? AND ?
      AND s.payment_status != 'refunded'
    GROUP BY c.id
    ORDER BY revenue DESC
  `
    )
    .all(startDate, endDate);

  return {
    success: true,
    data: {
      salesData,
      paymentMethods,
      topProducts,
      categories,
    },
  };
}
// Add these helper functions to your reports.js file after the getSalesReportData function

async function getInventoryReportData(params, db) {
  try {
    const stockLevels = db
      .prepare(
        `
        SELECT 
          p.sku,
          p.name,
          c.name as category,
          i.quantity as current_stock,
          p.low_stock_threshold,
          p.unit_price,
          p.cost_price,
          (i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as stock_value,
          CASE 
            WHEN i.quantity = 0 THEN 'Out of Stock'
            WHEN i.quantity <= p.low_stock_threshold THEN 'Low Stock'
            ELSE 'In Stock'
          END as status
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND p.track_inventory = 1
        ORDER BY i.quantity ASC
      `
      )
      .all();

    const movements = db
      .prepare(
        `
        SELECT 
          DATE(sm.created_at) as date,
          p.name as product,
          sm.movement_type,
          sm.quantity,
          sm.reason,
          u.full_name as user
        FROM stock_movements sm
        JOIN products p ON sm.product_id = p.id
        JOIN users u ON sm.user_id = u.id
        WHERE sm.created_at >= date('now', '-30 days')
        ORDER BY sm.created_at DESC
        LIMIT 100
      `
      )
      .all();

    const summary = db
      .prepare(
        `
        SELECT 
          COUNT(DISTINCT p.id) as total_products,
          SUM(i.quantity) as total_units,
          SUM(i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as total_value,
          COUNT(CASE WHEN i.quantity = 0 THEN 1 END) as out_of_stock,
          COUNT(CASE WHEN i.quantity > 0 AND i.quantity <= p.low_stock_threshold THEN 1 END) as low_stock
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = 1 AND p.track_inventory = 1
      `
      )
      .get();

    return {
      success: true,
      data: {
        stockLevels,
        movements,
        summary,
      },
    };
  } catch (error) {
    console.error("Get inventory report data error:", error);
    throw error;
  }
}

async function getCustomerAnalyticsData(params, db) {
  try {
    const { startDate, endDate } = params;

    // Customer metrics
    const metrics = db
      .prepare(
        `
        SELECT 
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(DISTINCT CASE WHEN s.created_at IS NOT NULL THEN c.id END) as active_customers,
          COUNT(DISTINCT CASE WHEN c.created_at >= DATE(?, '-30 days') THEN c.id END) as new_customers,
          AVG(c.loyalty_points) as avg_loyalty_points,
          SUM(c.loyalty_points) as total_loyalty_points
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id 
          AND DATE(s.created_at) BETWEEN ? AND ?
        WHERE c.is_active = 1
      `
      )
      .get(endDate, startDate, endDate);

    // Customer segmentation by purchase frequency
    const segmentation = db
      .prepare(
        `
        WITH customer_purchases AS (
          SELECT 
            c.id,
            c.customer_group,
            COUNT(s.id) as purchase_count,
            SUM(s.total_amount) as total_spent,
            AVG(s.total_amount) as avg_value
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
            AND DATE(s.created_at) BETWEEN ? AND ?
            AND s.payment_status != 'refunded'
          WHERE c.is_active = 1
          GROUP BY c.id
        )
        SELECT 
          CASE 
            WHEN purchase_count = 0 THEN 'Inactive'
            WHEN purchase_count = 1 THEN 'New'
            WHEN purchase_count BETWEEN 2 AND 5 THEN 'Regular'
            WHEN purchase_count > 5 THEN 'VIP'
          END as segment,
          COUNT(*) as count,
          AVG(total_spent) as avg_value,
          SUM(total_spent) as total_value
        FROM customer_purchases
        GROUP BY segment
        ORDER BY avg_value DESC
      `
      )
      .all(startDate, endDate);

    // Top customers
    const topCustomers = db
      .prepare(
        `
        SELECT 
          c.id,
          c.first_name,
          c.last_name,
          c.email,
          c.loyalty_points,
          COUNT(s.id) as purchase_count,
          SUM(s.total_amount) as total_spent,
          AVG(s.total_amount) as avg_purchase,
          MAX(s.created_at) as last_purchase
        FROM customers c
        JOIN sales s ON c.id = s.customer_id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
          AND s.payment_status != 'refunded'
          AND c.is_active = 1
        GROUP BY c.id
        ORDER BY total_spent DESC
        LIMIT 10
      `
      )
      .all(startDate, endDate);

    // Purchase patterns
    const purchasePatterns = db
      .prepare(
        `
        SELECT 
          strftime('%w', s.created_at) as day_of_week,
          strftime('%H', s.created_at) as hour_of_day,
          COUNT(DISTINCT s.customer_id) as unique_customers,
          COUNT(*) as transactions,
          SUM(s.total_amount) as revenue
        FROM sales s
        WHERE DATE(s.created_at) BETWEEN ? AND ?
          AND s.payment_status != 'refunded'
          AND s.customer_id IS NOT NULL
        GROUP BY day_of_week, hour_of_day
      `
      )
      .all(startDate, endDate);

    // Customer lifetime value trends
    const lifetimeValues = db
      .prepare(
        `
        SELECT 
          c.customer_group,
          COUNT(DISTINCT c.id) as customer_count,
          AVG(lifetime_value) as avg_ltv,
          MAX(lifetime_value) as max_ltv
        FROM (
          SELECT 
            c.id,
            c.customer_group,
            SUM(s.total_amount) as lifetime_value
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id
            AND s.payment_status != 'refunded'
          WHERE c.is_active = 1
          GROUP BY c.id
        ) c
        GROUP BY c.customer_group
      `
      )
      .all();

    return {
      success: true,
      analytics: {
        metrics,
        segmentation,
        topCustomers,
        purchasePatterns,
        lifetimeValues,
      },
    };
  } catch (error) {
    console.error("Get customer analytics data error:", error);
    throw error;
  }
}

async function getStaffPerformanceData(params, db) {
  try {
    const { startDate, endDate } = params;

    const performance = db
      .prepare(
        `
        SELECT 
          u.id,
          u.full_name,
          u.role,
          COUNT(s.id) as transactions,
          SUM(CASE WHEN s.payment_status != 'refunded' THEN s.total_amount ELSE 0 END) as revenue,
          SUM(CASE WHEN s.payment_status = 'refunded' THEN 1 ELSE 0 END) as voids,
          AVG(CASE WHEN s.payment_status != 'refunded' THEN s.total_amount ELSE NULL END) as avg_sale,
          MAX(s.created_at) as last_sale
        FROM users u
        LEFT JOIN sales s ON u.id = s.user_id 
          AND DATE(s.created_at) BETWEEN ? AND ?
        WHERE u.role IN ('admin', 'manager', 'cashier')
        GROUP BY u.id
        ORDER BY revenue DESC
      `
      )
      .all(startDate, endDate);

    const hourlyActivity = db
      .prepare(
        `
        SELECT 
          u.full_name,
          strftime('%H', s.created_at) as hour,
          COUNT(*) as transactions
        FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
        GROUP BY u.id, hour
        ORDER BY u.full_name, hour
      `
      )
      .all(startDate, endDate);

    return {
      success: true,
      data: {
        performance,
        hourlyActivity,
      },
    };
  } catch (error) {
    console.error("Get staff performance data error:", error);
    throw error;
  }
}

function logActivity(db, userId, action, entityType, entityId, details) {
  try {
    db.prepare(
      `
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `
    ).run(userId, action, entityType, entityId, details);
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}

module.exports = { setupReportsHandlers };
