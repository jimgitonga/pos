const { v4: uuidv4 } = require('uuid');

function setupSalesHandlers(ipcMain, db) {
  // Create new sale transaction
  ipcMain.handle('sales:create', async (event, saleData) => {
    const transaction = db.transaction(() => {
      try {
        const {
          customer_id,
          items,
          payment_method,
          amount_paid,
          discount_amount = 0,
          notes = null
        } = saleData;

        // Calculate totals
        let subtotal = 0;
        let totalTax = 0;
        
        for (const item of items) {
          const product = db.prepare('SELECT unit_price, tax_rate FROM products WHERE id = ?').get(item.product_id);
          if (!product) {
            throw new Error(`Product ${item.product_id} not found`);
          }
          
          const itemTotal = item.quantity * (item.unit_price || product.unit_price);
          const itemTax = itemTotal * (product.tax_rate / 100);
          
          subtotal += itemTotal;
          totalTax += itemTax;
        }
        
        const totalAmount = subtotal + totalTax - discount_amount;
        
        // Validate payment
        if (amount_paid < totalAmount && payment_method !== 'credit') {
          throw new Error('Insufficient payment amount');
        }
        
        // Generate invoice number
        const date = new Date();
        const invoiceNumber = `INV-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}-${Date.now().toString().slice(-6)}`;
        
        // Create sale record
        const saleResult = db.prepare(`
          INSERT INTO sales (
            invoice_number, customer_id, user_id, subtotal, 
            tax_amount, discount_amount, total_amount, 
            payment_status, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          invoiceNumber,
          customer_id || null,
          event.sender.userId || 1,
          subtotal,
          totalTax,
          discount_amount,
          totalAmount,
          payment_method === 'credit' ? 'pending' : 'paid',
          notes
        );
        
        const saleId = saleResult.lastInsertRowid;
        
        // Insert sale items and update inventory
        const insertSaleItem = db.prepare(`
          INSERT INTO sale_items (
            sale_id, product_id, quantity, unit_price, 
            discount_amount, tax_amount, total_price
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);
        
        const updateInventory = db.prepare(`
          UPDATE inventory 
          SET quantity = quantity - ?, 
              updated_at = CURRENT_TIMESTAMP 
          WHERE product_id = ?
        `);
        
        const insertStockMovement = db.prepare(`
          INSERT INTO stock_movements (
            product_id, movement_type, quantity, 
            reference_type, reference_id, reason, user_id
          ) VALUES (?, 'out', ?, 'sale', ?, 'Sale transaction', ?)
        `);
        
        for (const item of items) {
          const product = db.prepare('SELECT unit_price, tax_rate, track_inventory FROM products WHERE id = ?').get(item.product_id);
          
          const unitPrice = item.unit_price || product.unit_price;
          const itemTotal = item.quantity * unitPrice;
          const itemTax = itemTotal * (product.tax_rate / 100);
          const itemDiscount = item.discount_amount || 0;
          
          // Insert sale item
          insertSaleItem.run(
            saleId,
            item.product_id,
            item.quantity,
            unitPrice,
            itemDiscount,
            itemTax,
            itemTotal - itemDiscount + itemTax
          );
          
          // Update inventory if product tracks inventory
          if (product.track_inventory) {
            // Check available stock
            const inventory = db.prepare('SELECT quantity FROM inventory WHERE product_id = ?').get(item.product_id);
            if (!inventory || inventory.quantity < item.quantity) {
              throw new Error(`Insufficient stock for product ${item.product_id}`);
            }
            
            updateInventory.run(item.quantity, item.product_id);
            insertStockMovement.run(
              item.product_id,
              item.quantity,
              saleId,
              event.sender.userId || 1
            );
          }
        }
        
        // Create payment record
        if (payment_method !== 'credit' || amount_paid > 0) {
          db.prepare(`
            INSERT INTO payments (
              sale_id, payment_method, amount, reference_number
            ) VALUES (?, ?, ?, ?)
          `).run(
            saleId,
            payment_method,
            amount_paid,
            saleData.reference_number || null
          );
        }
        
        // Update customer credit if applicable
        if (customer_id && payment_method === 'credit') {
          db.prepare(`
            UPDATE customers 
            SET outstanding_balance = outstanding_balance + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(totalAmount - amount_paid, customer_id);
        }
        
        // Update customer loyalty points
        if (customer_id) {
          const loyaltyPointsRate = db.prepare('SELECT value FROM settings WHERE key = ?').get('loyalty_points_rate');
          if (loyaltyPointsRate && parseInt(loyaltyPointsRate.value) > 0) {
            const pointsEarned = Math.floor(totalAmount / 100) * parseInt(loyaltyPointsRate.value);
            db.prepare(`
              UPDATE customers 
              SET loyalty_points = loyalty_points + ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `).run(pointsEarned, customer_id);
          }
        }
        
        // Log activity
        logActivity(
          db,
          event.sender.userId || 1,
          'create_sale',
          'sale',
          saleId,
          `Created sale ${invoiceNumber} - Total: ${totalAmount}`
        );
        
        // Get complete sale data for receipt
    //     const sale = db.prepare(`
    //       SELECT s.*, c.first_name, c.last_name, c.phone, u.full_name as cashier_name
    //       FROM sales s
    //       LEFT JOIN customers c ON s.customer_id = c.id
    //       LEFT JOIN users u ON s.user_id = u.id
    //       WHERE s.id = ?
    //     `).get(saleId);
        
    //     const saleItems = db.prepare(`
    //       SELECT si.*, p.name as product_name, p.sku
    //       FROM sale_items si
    //       JOIN products p ON si.product_id = p.id
    //       WHERE si.sale_id = ?
    //     `).all(saleId);
        
    //     sale.items = saleItems;
    //     sale.change_amount = amount_paid - totalAmount;
        
    //     return { success: true, sale };
    //   } catch (error) {
    //     throw error;
    //   }
    // });
            const sale = db.prepare(`
          SELECT s.*, c.first_name, c.last_name, c.phone, u.full_name as cashier_name
          FROM sales s
          LEFT JOIN customers c ON s.customer_id = c.id
          LEFT JOIN users u ON s.user_id = u.id
          WHERE s.id = ?
        `).get(saleId);
        
        const saleItems = db.prepare(`
          SELECT si.*, p.name as product_name, p.sku
          FROM sale_items si
          JOIN products p ON si.product_id = p.id
          WHERE si.sale_id = ?
        `).all(saleId);
        
        sale.items = saleItems;
        
        // --- ADD THESE TWO LINES ---
        // Ensure amount_paid is part of the returned sale object
        sale.amount_paid = saleData.amount_paid;
              
        // Ensure the change property name matches the frontend expectation (change_due)
        sale.change_due = amount_paid - totalAmount; 
        // --- END ADDITIONS ---
        return { success: true, sale };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Create sale error:', error);
      return { success: false, error: error.message || 'Failed to create sale' };
    }
  });

  // Get sale by ID
  ipcMain.handle('sales:getById', async (event, id) => {
    try {
      const sale = db.prepare(`
        SELECT s.*, 
               c.first_name, c.last_name, c.phone, c.email as customer_email,
               u.full_name as cashier_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.id = ?
      `).get(id);
      
      if (!sale) {
        return { success: false, error: 'Sale not found' };
      }
      
      // Get sale items
      sale.items = db.prepare(`
        SELECT si.*, p.name as product_name, p.sku, p.barcode
        FROM sale_items si
        JOIN products p ON si.product_id = p.id
        WHERE si.sale_id = ?
      `).all(id);
      
      // Get payments
      sale.payments = db.prepare(`
        SELECT * FROM payments WHERE sale_id = ?
      `).all(id);
      
      return { success: true, sale };
    } catch (error) {
      console.error('Get sale error:', error);
      return { success: false, error: 'Failed to retrieve sale' };
    }
  });

  // Get recent sales
  ipcMain.handle('sales:getRecent', async (event, limit = 20) => {
    try {
      const sales = db.prepare(`
        SELECT s.*, 
               c.first_name, c.last_name,
               u.full_name as cashier_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
        LIMIT ?
      `).all(limit);
      
      return { success: true, sales };
    } catch (error) {
      console.error('Get recent sales error:', error);
      return { success: false, error: 'Failed to retrieve sales' };
    }
  });

  // Get sales by date range
  ipcMain.handle('sales:getByDateRange', async (event, { startDate, endDate }) => {
    try {
      const sales = db.prepare(`
        SELECT s.*, 
               c.first_name, c.last_name,
               u.full_name as cashier_name
        FROM sales s
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN users u ON s.user_id = u.id
        WHERE DATE(s.created_at) BETWEEN ? AND ?
        ORDER BY s.created_at DESC
      `).all(startDate, endDate);
      
      // Calculate summary
      const summary = db.prepare(`
        SELECT 
          COUNT(*) as total_transactions,
          SUM(total_amount) as total_revenue,
          SUM(tax_amount) as total_tax,
          SUM(discount_amount) as total_discount,
          AVG(total_amount) as average_sale
        FROM sales
        WHERE DATE(created_at) BETWEEN ? AND ?
      `).get(startDate, endDate);
      
      return { success: true, sales, summary };
    } catch (error) {
      console.error('Get sales by date error:', error);
      return { success: false, error: 'Failed to retrieve sales' };
    }
  });

  // Void sale
  ipcMain.handle('sales:void', async (event, { id, reason }) => {
    const transaction = db.transaction(() => {
      try {
        const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(id);
        if (!sale) {
          throw new Error('Sale not found');
        }
        
        if (sale.payment_status === 'refunded') {
          throw new Error('Sale already voided');
        }
        
        // Update sale status
        db.prepare(`
          UPDATE sales 
          SET payment_status = 'refunded', 
              notes = COALESCE(notes || ' | ', '') || 'VOIDED: ' || ?
          WHERE id = ?
        `).run(reason, id);
        
        // Restore inventory
        const saleItems = db.prepare('SELECT * FROM sale_items WHERE sale_id = ?').all(id);
        
        for (const item of saleItems) {
          const product = db.prepare('SELECT track_inventory FROM products WHERE id = ?').get(item.product_id);
          
          if (product.track_inventory) {
            db.prepare(`
              UPDATE inventory 
              SET quantity = quantity + ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE product_id = ?
            `).run(item.quantity, item.product_id);
            
            db.prepare(`
              INSERT INTO stock_movements (
                product_id, movement_type, quantity,
                reference_type, reference_id, reason, user_id
              ) VALUES (?, 'in', ?, 'void', ?, ?, ?)
            `).run(
              item.product_id,
              item.quantity,
              id,
              `Void sale: ${reason}`,
              event.sender.userId || 1
            );
          }
        }
        
        // Update customer balance if credit sale
        if (sale.customer_id && sale.payment_status === 'pending') {
          db.prepare(`
            UPDATE customers 
            SET outstanding_balance = outstanding_balance - ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `).run(sale.total_amount, sale.customer_id);
        }
        
        // Log activity
        logActivity(
          db,
          event.sender.userId || 1,
          'void_sale',
          'sale',
          id,
          `Voided sale ${sale.invoice_number}: ${reason}`
        );
        
        return { success: true };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Void sale error:', error);
      return { success: false, error: error.message || 'Failed to void sale' };
    }
  });

  // Process return
  ipcMain.handle('sales:return', async (event, { saleId, items, reason }) => {
    const transaction = db.transaction(() => {
      try {
        const sale = db.prepare('SELECT * FROM sales WHERE id = ?').get(saleId);
        if (!sale) {
          throw new Error('Sale not found');
        }
        
        let returnTotal = 0;
        
        // Process each return item
        for (const returnItem of items) {
          const saleItem = db.prepare(`
            SELECT * FROM sale_items 
            WHERE sale_id = ? AND product_id = ?
          `).get(saleId, returnItem.product_id);
          
          if (!saleItem) {
            throw new Error(`Product ${returnItem.product_id} not found in sale`);
          }
          
          if (returnItem.quantity > saleItem.quantity) {
            throw new Error(`Return quantity exceeds sale quantity for product ${returnItem.product_id}`);
          }
          
          // Calculate return amount
          const returnAmount = (saleItem.total_price / saleItem.quantity) * returnItem.quantity;
          returnTotal += returnAmount;
          
          // Update inventory
          const product = db.prepare('SELECT track_inventory FROM products WHERE id = ?').get(returnItem.product_id);
          
          if (product.track_inventory) {
            db.prepare(`
              UPDATE inventory 
              SET quantity = quantity + ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE product_id = ?
            `).run(returnItem.quantity, returnItem.product_id);
            
            db.prepare(`
              INSERT INTO stock_movements (
                product_id, movement_type, quantity,
                reference_type, reference_id, reason, user_id
              ) VALUES (?, 'in', ?, 'return', ?, ?, ?)
            `).run(
              returnItem.product_id,
              returnItem.quantity,
              saleId,
              `Return: ${reason}`,
              event.sender.userId || 1
            );
          }
        }
        
        // Create return record (using negative sale)
        const returnInvoice = `RET-${sale.invoice_number}`;
        
        const returnResult = db.prepare(`
          INSERT INTO sales (
            invoice_number, customer_id, user_id,
            subtotal, tax_amount, discount_amount, total_amount,
            payment_status, notes
          ) VALUES (?, ?, ?, ?, 0, 0, ?, 'paid', ?)
        `).run(
          returnInvoice,
          sale.customer_id,
          event.sender.userId || 1,
          -returnTotal,
          -returnTotal,
          `Return for ${sale.invoice_number}: ${reason}`
        );
        
        // Log activity
        logActivity(
          db,
          event.sender.userId || 1,
          'process_return',
          'sale',
          saleId,
          `Processed return ${returnInvoice} - Amount: ${returnTotal}`
        );
        
        return { success: true, returnInvoice, returnTotal };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Process return error:', error);
      return { success: false, error: error.message || 'Failed to process return' };
    }
  });

  // Get daily summary
  ipcMain.handle('sales:getDailySummary', async (event, date) => {
    try {
      const summary = db.prepare(`
        SELECT 
          COUNT(CASE WHEN payment_status != 'refunded' THEN 1 END) as total_sales,
          COUNT(CASE WHEN payment_status = 'refunded' THEN 1 END) as voided_sales,
          SUM(CASE WHEN payment_status != 'refunded' THEN total_amount ELSE 0 END) as gross_revenue,
          SUM(CASE WHEN payment_status != 'refunded' THEN tax_amount ELSE 0 END) as total_tax,
          SUM(CASE WHEN payment_status != 'refunded' THEN discount_amount ELSE 0 END) as total_discount,
          AVG(CASE WHEN payment_status != 'refunded' THEN total_amount ELSE NULL END) as average_sale
        FROM sales
        WHERE DATE(created_at) = ?
      `).get(date);
      
      // Get payment method breakdown
      const paymentBreakdown = db.prepare(`
        SELECT 
          p.payment_method,
          COUNT(*) as count,
          SUM(p.amount) as total
        FROM payments p
        JOIN sales s ON p.sale_id = s.id
        WHERE DATE(s.created_at) = ? AND s.payment_status != 'refunded'
        GROUP BY p.payment_method
      `).all(date);
      
      // Get top selling products
      const topProducts = db.prepare(`
        SELECT 
          p.name,
          p.sku,
          SUM(si.quantity) as quantity_sold,
          SUM(si.total_price) as revenue
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE DATE(s.created_at) = ? AND s.payment_status != 'refunded'
        GROUP BY si.product_id
        ORDER BY revenue DESC
        LIMIT 10
      `).all(date);
      
      // Get hourly breakdown
      const hourlyBreakdown = db.prepare(`
        SELECT 
          strftime('%H', created_at) as hour,
          COUNT(*) as transactions,
          SUM(total_amount) as revenue
        FROM sales
        WHERE DATE(created_at) = ? AND payment_status != 'refunded'
        GROUP BY hour
        ORDER BY hour
      `).all(date);
      
      return {
        success: true,
        summary,
        paymentBreakdown,
        topProducts,
        hourlyBreakdown
      };
    } catch (error) {
      console.error('Get daily summary error:', error);
      return { success: false, error: 'Failed to get daily summary' };
    }
  });
}

// Helper function
function logActivity(db, userId, action, entityType, entityId, details) {
  try {
    db.prepare(`
      INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(userId, action, entityType, entityId, details);
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}

module.exports = { setupSalesHandlers };