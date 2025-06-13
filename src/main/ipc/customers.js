function setupCustomerHandlers(ipcMain, db) {
  // Get all customers with filters
  ipcMain.handle('customers:getAll', async (event, filters = {}) => {
    try {
      let query = `
        SELECT 
          c.*,
          COUNT(DISTINCT s.id) as total_purchases,
          SUM(s.total_amount) as lifetime_value,
          MAX(s.created_at) as last_purchase_date
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id AND s.payment_status != 'refunded'
        WHERE 1=1
      `;
      
      const params = [];
      
      if (filters.search) {
        query += ` AND (
          c.first_name LIKE ? OR 
          c.last_name LIKE ? OR 
          c.email LIKE ? OR 
          c.phone LIKE ? OR
          c.customer_code LIKE ?
        )`;
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (filters.customer_group) {
        query += ' AND c.customer_group = ?';
        params.push(filters.customer_group);
      }
      
      if (filters.is_active !== undefined) {
        query += ' AND c.is_active = ?';
        params.push(filters.is_active ? 1 : 0);
      }
      
      if (filters.has_outstanding_balance) {
        query += ' AND c.outstanding_balance > 0';
      }
      
      query += ' GROUP BY c.id';
      
      // Add sorting
      if (filters.sortBy) {
        const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${filters.sortBy} ${sortOrder}`;
      } else {
        query += ' ORDER BY c.created_at DESC';
      }
      
      // Add pagination
      if (filters.limit) {
        query += ' LIMIT ?';
        params.push(filters.limit);
        
        if (filters.offset) {
          query += ' OFFSET ?';
          params.push(filters.offset);
        }
      }
      
      const customers = db.prepare(query).all(...params);
      
      // Get total count
      const countQuery = `
        SELECT COUNT(DISTINCT c.id) as total
        FROM customers c
        WHERE 1=1
        ${filters.search ? `AND (
          c.first_name LIKE ? OR 
          c.last_name LIKE ? OR 
          c.email LIKE ? OR 
          c.phone LIKE ? OR
          c.customer_code LIKE ?
        )` : ''}
        ${filters.customer_group ? 'AND c.customer_group = ?' : ''}
        ${filters.is_active !== undefined ? 'AND c.is_active = ?' : ''}
        ${filters.has_outstanding_balance ? 'AND c.outstanding_balance > 0' : ''}
      `;
      
      const countParams = [];
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      }
      if (filters.customer_group) countParams.push(filters.customer_group);
      if (filters.is_active !== undefined) countParams.push(filters.is_active ? 1 : 0);
      
      const { total } = db.prepare(countQuery).get(...countParams);
      
      return {
        success: true,
        customers,
        pagination: {
          total,
          limit: filters.limit || total,
          offset: filters.offset || 0
        }
      };
    } catch (error) {
      console.error('Get customers error:', error);
      return { success: false, error: 'Failed to retrieve customers' };
    }
  });

  // Get customer by ID
  ipcMain.handle('customers:getById', async (event, id) => {
    try {
      const customer = db.prepare(`
        SELECT 
          c.*,
          COUNT(DISTINCT s.id) as total_purchases,
          SUM(CASE WHEN s.payment_status != 'refunded' THEN s.total_amount ELSE 0 END) as lifetime_value,
          MAX(s.created_at) as last_purchase_date,
          AVG(CASE WHEN s.payment_status != 'refunded' THEN s.total_amount ELSE NULL END) as average_purchase
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
        WHERE c.id = ?
        GROUP BY c.id
      `).get(id);
      
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      
      // Get recent transactions
      customer.recent_transactions = db.prepare(`
        SELECT 
          s.*,
          u.full_name as cashier_name
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        WHERE s.customer_id = ?
        ORDER BY s.created_at DESC
        LIMIT 10
      `).all(id);
      
      // Get favorite products
      customer.favorite_products = db.prepare(`
        SELECT 
          p.id,
          p.name,
          p.sku,
          SUM(si.quantity) as total_quantity,
          COUNT(DISTINCT s.id) as purchase_count
        FROM sale_items si
        JOIN sales s ON si.sale_id = s.id
        JOIN products p ON si.product_id = p.id
        WHERE s.customer_id = ? AND s.payment_status != 'refunded'
        GROUP BY p.id
        ORDER BY total_quantity DESC
        LIMIT 5
      `).all(id);
      
      return { success: true, customer };
    } catch (error) {
      console.error('Get customer by ID error:', error);
      return { success: false, error: 'Failed to retrieve customer' };
    }
  });

  // Create new customer
  ipcMain.handle('customers:create', async (event, customerData) => {
    try {
      const {
        first_name, last_name, email, phone, address,
        city, postal_code, country = 'Kenya', date_of_birth,
        customer_group = 'regular', credit_limit = 0, notes
      } = customerData;
      
      // Check if email already exists
      if (email) {
        const existing = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
        if (existing) {
          return { success: false, error: 'Email already exists' };
        }
      }
      
      // Generate customer code
      const timestamp = Date.now().toString();
      const customer_code = `CUST${timestamp.slice(-8)}`;
      
      const result = db.prepare(`
        INSERT INTO customers (
          customer_code, first_name, last_name, email, phone,
          address, city, postal_code, country, date_of_birth,
          customer_group, credit_limit, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        customer_code, first_name, last_name, email || null, phone || null,
        address || null, city || null, postal_code || null, country,
        date_of_birth || null, customer_group, credit_limit, notes || null
      );
      
      logActivity(
        db,
        event.sender.userId || 1,
        'create_customer',
        'customer',
        result.lastInsertRowid,
        `Created customer: ${first_name} ${last_name}`
      );
      
      return { success: true, customerId: result.lastInsertRowid, customer_code };
    } catch (error) {
      console.error('Create customer error:', error);
      return { success: false, error: error.message || 'Failed to create customer' };
    }
  });

  // Update customer
  ipcMain.handle('customers:update', async (event, { id, updates }) => {
    try {
      const updateFields = [];
      const values = [];
      
      const allowedFields = [
        'first_name', 'last_name', 'email', 'phone', 'address',
        'city', 'postal_code', 'country', 'date_of_birth',
        'customer_group', 'credit_limit', 'notes', 'is_active'
      ];
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          updateFields.push(`${field} = ?`);
          values.push(updates[field]);
        }
      }
      
      if (updateFields.length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }
      
      // Check email uniqueness if updating email
      if (updates.email) {
        const existing = db.prepare('SELECT id FROM customers WHERE email = ? AND id != ?').get(updates.email, id);
        if (existing) {
          return { success: false, error: 'Email already exists' };
        }
      }
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      db.prepare(`
        UPDATE customers 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...values);
      
      logActivity(
        db,
        event.sender.userId || 1,
        'update_customer',
        'customer',
        id,
        'Updated customer information'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Update customer error:', error);
      return { success: false, error: 'Failed to update customer' };
    }
  });

  // Delete customer (soft delete)
  ipcMain.handle('customers:delete', async (event, id) => {
    try {
      // Check if customer has transactions
      const transactionCount = db.prepare(
        'SELECT COUNT(*) as count FROM sales WHERE customer_id = ?'
      ).get(id).count;
      
      if (transactionCount > 0) {
        // Soft delete
        db.prepare('UPDATE customers SET is_active = 0 WHERE id = ?').run(id);
        
        logActivity(
          db,
          event.sender.userId || 1,
          'deactivate_customer',
          'customer',
          id,
          'Deactivated customer (has transaction history)'
        );
        
        return { success: true, message: 'Customer deactivated' };
      } else {
        // Hard delete if no transactions
        db.prepare('DELETE FROM customers WHERE id = ?').run(id);
        
        logActivity(
          db,
          event.sender.userId || 1,
          'delete_customer',
          'customer',
          id,
          'Deleted customer'
        );
        
        return { success: true, message: 'Customer deleted' };
      }
    } catch (error) {
      console.error('Delete customer error:', error);
      return { success: false, error: 'Failed to delete customer' };
    }
  });

  // Search customers
  ipcMain.handle('customers:search', async (event, query) => {
    try {
      const searchTerm = `%${query}%`;
      
      const customers = db.prepare(`
        SELECT 
          id, customer_code, first_name, last_name, 
          email, phone, loyalty_points, credit_limit, outstanding_balance
        FROM customers
        WHERE is_active = 1
          AND (
            first_name LIKE ? OR 
            last_name LIKE ? OR 
            email LIKE ? OR 
            phone LIKE ? OR
            customer_code LIKE ?
          )
        ORDER BY 
          CASE 
            WHEN first_name LIKE ? OR last_name LIKE ? THEN 0
            ELSE 1
          END,
          first_name, last_name
        LIMIT 20
      `).all(
        searchTerm, searchTerm, searchTerm, searchTerm, searchTerm,
        query + '%', query + '%'
      );
      
      return { success: true, customers };
    } catch (error) {
      console.error('Search customers error:', error);
      return { success: false, error: 'Failed to search customers' };
    }
  });

  // Get customer transactions
  // ipcMain.handle('customers:getTransactions', async (event, { customerId, limit = 50 }) => {
  //   try {
  //     const transactions = db.prepare(`
  //       SELECT 
  //         s.*,
  //         u.full_name as cashier_name,
  //         COUNT(si.id) as item_count
  //       FROM sales s
  //       LEFT JOIN users u ON s.user_id = u.id
  //       LEFT JOIN sale_items si ON s.id = si.sale_id
  //       WHERE s.customer_id = ?
  //       GROUP BY s.id
  //       ORDER BY s.created_at DESC
  //       LIMIT ?
  //     `).all(customerId, limit);
      
  //     return { success: true, transactions };
  //   } catch (error) {
  //     console.error('Get customer transactions error:', error);
  //     return { success: false, error: 'Failed to retrieve transactions' };
  //   }
  // });

  // Get customer transactions
  ipcMain.handle('customers:getTransactions', async (event, data) => {
    try {
      // Handle both object and separate parameters
      let customerId, limit = 50;
      
      if (typeof data === 'object' && data !== null) {
        customerId = data.customerId;
        limit = data.limit || 50;
      } else {
        // If called with separate parameters
        customerId = data;
        limit = 50;
      }
      
      if (!customerId) {
        return { success: false, error: 'Customer ID is required' };
      }
      
      const transactions = db.prepare(`
        SELECT 
          s.*,
          u.full_name as cashier_name,
          COUNT(si.id) as item_count
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.customer_id = ?
        GROUP BY s.id
        ORDER BY s.created_at DESC
        LIMIT ?
      `).all(customerId, limit);
      
      return { success: true, transactions };
    } catch (error) {
      console.error('Get customer transactions error:', error);
      return { success: false, error: 'Failed to retrieve transactions' };
    }
  });

  // Update loyalty points
  ipcMain.handle('customers:updateLoyaltyPoints', async (event, { customerId, points, reason }) => {
    try {
      const customer = db.prepare('SELECT loyalty_points FROM customers WHERE id = ?').get(customerId);
      
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      
      const newPoints = customer.loyalty_points + points;
      
      if (newPoints < 0) {
        return { success: false, error: 'Insufficient loyalty points' };
      }
      
      db.prepare(`
        UPDATE customers 
        SET loyalty_points = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(newPoints, customerId);
      
      // Log the points transaction
      db.prepare(`
        INSERT INTO loyalty_transactions (
          customer_id, points, balance_after, reason, user_id
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        customerId,
        points,
        newPoints,
        reason,
        event.sender.userId || 1
      );
      
      logActivity(
        db,
        event.sender.userId || 1,
        points > 0 ? 'add_loyalty_points' : 'redeem_loyalty_points',
        'customer',
        customerId,
        `${Math.abs(points)} points ${points > 0 ? 'added' : 'redeemed'}: ${reason}`
      );
      
      return { success: true, newBalance: newPoints };
    } catch (error) {
      console.error('Update loyalty points error:', error);
      return { success: false, error: 'Failed to update loyalty points' };
    }
  });

  // Get customer credit balance and history
  ipcMain.handle('customers:getCreditBalance', async (event, customerId) => {
    try {
      const customer = db.prepare(`
        SELECT 
          credit_limit,
          outstanding_balance,
          (credit_limit - outstanding_balance) as available_credit
        FROM customers
        WHERE id = ?
      `).get(customerId);
      
      if (!customer) {
        return { success: false, error: 'Customer not found' };
      }
      
      // Get recent credit transactions
      const creditHistory = db.prepare(`
        SELECT 
          s.invoice_number,
          s.total_amount,
          s.created_at,
          s.payment_status,
          SUM(p.amount) as amount_paid
        FROM sales s
        LEFT JOIN payments p ON s.id = p.sale_id
        WHERE s.customer_id = ? 
          AND (s.payment_status = 'pending' OR s.payment_status = 'partial')
        GROUP BY s.id
        ORDER BY s.created_at DESC
      `).all(customerId);
      
      return {
        success: true,
        balance: customer,
        creditHistory
      };
    } catch (error) {
      console.error('Get credit balance error:', error);
      return { success: false, error: 'Failed to retrieve credit balance' };
    }
  });

  // Process customer payment
  ipcMain.handle('customers:processPayment', async (event, { customerId, amount, paymentMethod, reference }) => {
    const transaction = db.transaction(() => {
      try {
        const customer = db.prepare('SELECT outstanding_balance FROM customers WHERE id = ?').get(customerId);
        
        if (!customer) {
          throw new Error('Customer not found');
        }
        
        if (amount <= 0) {
          throw new Error('Invalid payment amount');
        }
        
        // Get unpaid sales
        const unpaidSales = db.prepare(`
          SELECT 
            s.id,
            s.invoice_number,
            s.total_amount,
            COALESCE(SUM(p.amount), 0) as paid_amount
          FROM sales s
          LEFT JOIN payments p ON s.id = p.sale_id
          WHERE s.customer_id = ? 
            AND s.payment_status IN ('pending', 'partial')
          GROUP BY s.id
          ORDER BY s.created_at ASC
        `).all(customerId);
        
        let remainingAmount = amount;
        const paidSales = [];
        
        // Apply payment to oldest invoices first
        for (const sale of unpaidSales) {
          if (remainingAmount <= 0) break;
          
          const amountDue = sale.total_amount - sale.paid_amount;
          const paymentAmount = Math.min(remainingAmount, amountDue);
          
          // Record payment
          db.prepare(`
            INSERT INTO payments (sale_id, payment_method, amount, reference_number)
            VALUES (?, ?, ?, ?)
          `).run(sale.id, paymentMethod, paymentAmount, reference || null);
          
          // Update sale status
          const newPaidAmount = sale.paid_amount + paymentAmount;
          const newStatus = newPaidAmount >= sale.total_amount ? 'paid' : 'partial';
          
          db.prepare(`
            UPDATE sales 
            SET payment_status = ?
            WHERE id = ?
          `).run(newStatus, sale.id);
          
          paidSales.push({
            invoice: sale.invoice_number,
            amount: paymentAmount,
            status: newStatus
          });
          
          remainingAmount -= paymentAmount;
        }
        
        // Update customer balance
        const newBalance = Math.max(0, customer.outstanding_balance - amount);
        db.prepare(`
          UPDATE customers 
          SET outstanding_balance = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(newBalance, customerId);
        
        logActivity(
          db,
          event.sender.userId || 1,
          'process_customer_payment',
          'customer',
          customerId,
          `Processed payment of ${amount} - ${paidSales.length} invoices affected`
        );
        
        return {
          success: true,
          paidSales,
          remainingCredit: remainingAmount,
          newBalance
        };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Process payment error:', error);
      return { success: false, error: error.message || 'Failed to process payment' };
    }
  });

  // Get customer groups
  ipcMain.handle('customers:getGroups', async (event) => {
    try {
      const groups = db.prepare(`
        SELECT 
          customer_group,
          COUNT(*) as customer_count,
          AVG(loyalty_points) as avg_loyalty_points,
          SUM(outstanding_balance) as total_outstanding
        FROM customers
        WHERE is_active = 1
        GROUP BY customer_group
        ORDER BY customer_count DESC
      `).all();
      
      return { success: true, groups };
    } catch (error) {
      console.error('Get customer groups error:', error);
      return { success: false, error: 'Failed to retrieve customer groups' };
    }
  });

  // Export customers
  ipcMain.handle('customers:export', async (event, { format = 'csv' }) => {
    try {
      const customers = db.prepare(`
        SELECT 
          c.*,
          COUNT(DISTINCT s.id) as total_purchases,
          SUM(CASE WHEN s.payment_status != 'refunded' THEN s.total_amount ELSE 0 END) as lifetime_value
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
        GROUP BY c.id
        ORDER BY c.created_at DESC
      `).all();
      
      if (format === 'csv') {
        const headers = [
          'Customer Code', 'First Name', 'Last Name', 'Email', 'Phone',
          'Address', 'City', 'Postal Code', 'Country', 'Date of Birth',
          'Customer Group', 'Loyalty Points', 'Credit Limit', 'Outstanding Balance',
          'Total Purchases', 'Lifetime Value', 'Status', 'Created Date'
        ];
        
        const rows = customers.map(c => [
          c.customer_code,
          c.first_name,
          c.last_name,
          c.email || '',
          c.phone || '',
          c.address || '',
          c.city || '',
          c.postal_code || '',
          c.country,
          c.date_of_birth || '',
          c.customer_group,
          c.loyalty_points,
          c.credit_limit,
          c.outstanding_balance,
          c.total_purchases,
          c.lifetime_value || 0,
          c.is_active ? 'Active' : 'Inactive',
          c.created_at
        ]);
        
        return { success: true, data: { headers, rows } };
      }
      
      return { success: true, data: customers };
    } catch (error) {
      console.error('Export customers error:', error);
      return { success: false, error: 'Failed to export customers' };
    }
  });

  // Import customers
  ipcMain.handle('customers:import', async (event, data) => {
    const transaction = db.transaction(() => {
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (const row of data) {
        try {
          const {
            first_name, last_name, email, phone,
            address, city, postal_code, country,
            customer_group = 'regular', credit_limit = 0
          } = row;
          
          // Skip if email exists
          if (email) {
            const existing = db.prepare('SELECT id FROM customers WHERE email = ?').get(email);
            if (existing) {
              results.failed++;
              results.errors.push(`Email ${email} already exists`);
              continue;
            }
          }
          
          // Generate customer code
          const timestamp = Date.now().toString();
          const customer_code = `CUST${timestamp.slice(-8)}${results.success}`;
          
          db.prepare(`
            INSERT INTO customers (
              customer_code, first_name, last_name, email, phone,
              address, city, postal_code, country, customer_group, credit_limit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            customer_code, first_name, last_name, email || null, phone || null,
            address || null, city || null, postal_code || null, country || 'Kenya',
            customer_group, credit_limit
          );
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${results.success + results.failed}: ${error.message}`);
        }
      }
      
      return results;
    });
    
    try {
      const results = transaction();
      
      logActivity(
        db,
        event.sender.userId || 1,
        'import_customers',
        'customer',
        null,
        `Imported ${results.success} customers`
      );
      
      return { success: true, results };
    } catch (error) {
      console.error('Import customers error:', error);
      return { success: false, error: 'Failed to import customers' };
    }
  });

  // Get customer analytics
  ipcMain.handle('customers:getAnalytics', async (event, { startDate, endDate }) => {
    try {
      // Overall metrics
      const metrics = db.prepare(`
        SELECT 
          COUNT(DISTINCT c.id) as total_customers,
          COUNT(DISTINCT CASE WHEN s.id IS NOT NULL THEN c.id END) as active_customers,
          COUNT(DISTINCT CASE WHEN c.created_at >= ? THEN c.id END) as new_customers,
          AVG(c.loyalty_points) as avg_loyalty_points,
          SUM(c.outstanding_balance) as total_outstanding,
          COUNT(DISTINCT CASE WHEN c.outstanding_balance > 0 THEN c.id END) as customers_with_credit
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id 
          AND s.created_at BETWEEN ? AND ?
          AND s.payment_status != 'refunded'
        WHERE c.is_active = 1
      `).get(startDate, startDate, endDate);
      
      // Customer segmentation
      const segmentation = db.prepare(`
        SELECT 
          CASE 
            WHEN lifetime_value = 0 THEN 'New'
            WHEN lifetime_value < 10000 THEN 'Regular'
            WHEN lifetime_value < 50000 THEN 'VIP'
            ELSE 'Premium'
          END as segment,
          COUNT(*) as count,
          AVG(lifetime_value) as avg_value
        FROM (
          SELECT 
            c.id,
            COALESCE(SUM(s.total_amount), 0) as lifetime_value
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id AND s.payment_status != 'refunded'
          WHERE c.is_active = 1
          GROUP BY c.id
        )
        GROUP BY segment
        ORDER BY avg_value DESC
      `).all();
      
      // Purchase frequency
      const purchaseFrequency = db.prepare(`
        SELECT 
          CASE 
            WHEN purchase_count = 0 THEN 'Never'
            WHEN purchase_count = 1 THEN 'Once'
            WHEN purchase_count <= 5 THEN '2-5 times'
            WHEN purchase_count <= 10 THEN '6-10 times'
            ELSE 'More than 10'
          END as frequency,
          COUNT(*) as customer_count
        FROM (
          SELECT 
            c.id,
            COUNT(DISTINCT s.id) as purchase_count
          FROM customers c
          LEFT JOIN sales s ON c.id = s.customer_id 
            AND s.created_at BETWEEN ? AND ?
            AND s.payment_status != 'refunded'
          WHERE c.is_active = 1
          GROUP BY c.id
        )
        GROUP BY frequency
      `).all(startDate, endDate);
      
      // Top customers
      const topCustomers = db.prepare(`
        SELECT 
          c.id,
          c.customer_code,
          c.first_name,
          c.last_name,
          COUNT(DISTINCT s.id) as purchase_count,
          SUM(s.total_amount) as total_spent,
          MAX(s.created_at) as last_purchase
        FROM customers c
        JOIN sales s ON c.id = s.customer_id
        WHERE s.created_at BETWEEN ? AND ?
          AND s.payment_status != 'refunded'
        GROUP BY c.id
        ORDER BY total_spent DESC
        LIMIT 10
      `).all(startDate, endDate);
      
      // Customer retention
      const retention = db.prepare(`
        SELECT 
          strftime('%Y-%m', first_purchase) as cohort,
          COUNT(DISTINCT customer_id) as cohort_size,
          COUNT(DISTINCT CASE WHEN returning_purchase IS NOT NULL THEN customer_id END) as returned,
          ROUND(100.0 * COUNT(DISTINCT CASE WHEN returning_purchase IS NOT NULL THEN customer_id END) / COUNT(DISTINCT customer_id), 2) as retention_rate
        FROM (
          SELECT 
            s.customer_id,
            MIN(s.created_at) as first_purchase,
            MIN(CASE WHEN s2.id IS NOT NULL THEN s2.created_at END) as returning_purchase
          FROM sales s
          LEFT JOIN sales s2 ON s.customer_id = s2.customer_id 
            AND s2.id != s.id 
            AND s2.created_at > s.created_at
            AND s2.created_at <= date(s.created_at, '+30 days')
          WHERE s.payment_status != 'refunded'
          GROUP BY s.customer_id
        )
        WHERE first_purchase BETWEEN ? AND ?
        GROUP BY cohort
        ORDER BY cohort DESC
      `).all(startDate, endDate);
      
      return {
        success: true,
        analytics: {
          metrics,
          segmentation,
          purchaseFrequency,
          topCustomers,
          retention
        }
      };
    } catch (error) {
      console.error('Get customer analytics error:', error);
      return { success: false, error: 'Failed to get customer analytics' };
    }
  });

  // Send customer communication
  ipcMain.handle('customers:sendCommunication', async (event, { customerIds, type, subject, message }) => {
    try {
      const customers = db.prepare(`
        SELECT id, email, phone, first_name, last_name
        FROM customers
        WHERE id IN (${customerIds.map(() => '?').join(',')})
          AND is_active = 1
      `).all(...customerIds);
      
      const results = {
        sent: 0,
        failed: 0,
        errors: []
      };
      
      for (const customer of customers) {
        try {
          if (type === 'email' && customer.email) {
            // In production, integrate with email service
            console.log(`Sending email to ${customer.email}: ${subject}`);
            results.sent++;
          } else if (type === 'sms' && customer.phone) {
            // In production, integrate with SMS service
            console.log(`Sending SMS to ${customer.phone}: ${message}`);
            results.sent++;
          } else {
            results.failed++;
            results.errors.push(`${customer.first_name} ${customer.last_name}: No ${type} contact`);
          }
          
          // Log communication
          db.prepare(`
            INSERT INTO customer_communications (
              customer_id, type, subject, message, sent_by, sent_at
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          `).run(
            customer.id,
            type,
            subject || null,
            message,
            event.sender.userId || 1
          );
        } catch (error) {
          results.failed++;
          results.errors.push(`${customer.first_name} ${customer.last_name}: ${error.message}`);
        }
      }
      
      logActivity(
        db,
        event.sender.userId || 1,
        'send_customer_communication',
        'customer',
        null,
        `Sent ${type} to ${results.sent} customers`
      );
      
      return { success: true, results };
    } catch (error) {
      console.error('Send communication error:', error);
      return { success: false, error: 'Failed to send communication' };
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

module.exports = { setupCustomerHandlers };