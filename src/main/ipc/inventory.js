// function setupInventoryHandlers(ipcMain, db) {
//   // Get stock for a product
//   ipcMain.handle('inventory:getStock', async (event, productId) => {
//     try {
//       const stock = db.prepare(`
//         SELECT 
//           i.*,
//           p.name as product_name,
//           p.sku,
//           p.low_stock_threshold,
//           p.track_inventory
//         FROM inventory i
//         JOIN products p ON i.product_id = p.id
//         WHERE i.product_id = ?
//       `).get(productId);
      
//       if (!stock) {
//         return { success: false, error: 'Stock record not found' };
//       }
      
//       // Calculate available stock (total - reserved)
//       stock.available_quantity = stock.quantity - stock.reserved_quantity;
//       stock.is_low_stock = stock.quantity <= stock.low_stock_threshold;
      
//       return { success: true, stock };
//     } catch (error) {
//       console.error('Get stock error:', error);
//       return { success: false, error: 'Failed to retrieve stock' };
//     }
//   });

//   // Update stock quantity
//   ipcMain.handle('inventory:updateStock', async (event, { productId, quantity, reason }) => {
//     const transaction = db.transaction(() => {
//       try {
//         // Get current stock
//         const currentStock = db.prepare('SELECT quantity FROM inventory WHERE product_id = ?').get(productId);
        
//         if (!currentStock) {
//           // Create inventory record if it doesn't exist
//           db.prepare(`
//             INSERT INTO inventory (product_id, quantity, reserved_quantity)
//             VALUES (?, ?, 0)
//           `).run(productId, quantity);
//         } else {
//           // Update existing stock
//           const newQuantity = currentStock.quantity + quantity;
          
//           if (newQuantity < 0) {
//             throw new Error('Insufficient stock');
//           }
          
//           db.prepare(`
//             UPDATE inventory 
//             SET quantity = ?, updated_at = CURRENT_TIMESTAMP
//             WHERE product_id = ?
//           `).run(newQuantity, productId);
//         }
        
//         // Record stock movement
//         db.prepare(`
//           INSERT INTO stock_movements (
//             product_id, movement_type, quantity, 
//             reference_type, reference_id, reason, user_id
//           ) VALUES (?, ?, ?, 'manual', NULL, ?, ?)
//         `).run(
//           productId,
//           quantity > 0 ? 'in' : 'out',
//           Math.abs(quantity),
//           reason,
//           event.sender.userId || 1
//         );
        
//         // Check if low stock alert needed
//         const updatedStock = db.prepare(`
//           SELECT i.quantity, p.low_stock_threshold, p.name
//           FROM inventory i
//           JOIN products p ON i.product_id = p.id
//           WHERE i.product_id = ?
//         `).get(productId);
        
//         if (updatedStock.quantity <= updatedStock.low_stock_threshold) {
//           // In a real app, this would trigger notifications
//           console.log(`Low stock alert: ${updatedStock.name} - ${updatedStock.quantity} units remaining`);
//         }
        
//         // Log activity
//         logActivity(
//           db,
//           event.sender.userId || 1,
//           'update_stock',
//           'inventory',
//           productId,
//           `Stock ${quantity > 0 ? 'added' : 'removed'}: ${Math.abs(quantity)} units - ${reason}`
//         );
        
//         return { success: true, newQuantity: updatedStock.quantity };
//       } catch (error) {
//         throw error;
//       }
//     });
    
//     try {
//       return transaction();
//     } catch (error) {
//       console.error('Update stock error:', error);
//       return { success: false, error: error.message || 'Failed to update stock' };
//     }
//   });

//   // Get low stock items
//   ipcMain.handle('inventory:getLowStock', async (event) => {
//     try {
//       const lowStockItems = db.prepare(`
//         SELECT 
//           p.id,
//           p.sku,
//           p.name,
//           p.barcode,
//           c.name as category_name,
//           i.quantity as current_stock,
//           i.reserved_quantity,
//           p.low_stock_threshold,
//           i.reorder_point,
//           i.reorder_quantity,
//           s.name as supplier_name,
//           s.email as supplier_email
//         FROM products p
//         JOIN inventory i ON p.id = i.product_id
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN (
//           SELECT DISTINCT po.supplier_id, poi.product_id
//           FROM purchase_order_items poi
//           JOIN purchase_orders po ON poi.order_id = po.id
//         ) AS ps ON ps.product_id = p.id
//         LEFT JOIN suppliers s ON ps.supplier_id = s.id
//         WHERE p.is_active = 1 
//           AND p.track_inventory = 1
//           AND i.quantity <= p.low_stock_threshold
//         ORDER BY (i.quantity * 1.0 / p.low_stock_threshold) ASC
//       `).all();
      
//       return { success: true, items: lowStockItems };
//     } catch (error) {
//       console.error('Get low stock error:', error);
//       return { success: false, error: 'Failed to retrieve low stock items' };
//     }
//   });

//   // Get stock movements
//   // ipcMain.handle('inventory:getStockMovements', async (event, { productId, limit = 50 }) => {
//   //   try {
//   //     let query = `
//   //       SELECT 
//   //         sm.*,
//   //         u.full_name as user_name,
//   //         p.name as product_name,
//   //         p.sku
//   //       FROM stock_movements sm
//   //       JOIN users u ON sm.user_id = u.id
//   //       JOIN products p ON sm.product_id = p.id
//   //     `;
      
//   //     const params = [];
      
//   //     if (productId) {
//   //       query += ' WHERE sm.product_id = ?';
//   //       params.push(productId);
//   //     }
      
//   //     query += ' ORDER BY sm.created_at DESC LIMIT ?';
//   //     params.push(limit);
      
//   //     const movements = db.prepare(query).all(...params);
      
//   //     return { success: true, movements };
//   //   } catch (error) {
//   //     console.error('Get stock movements error:', error);
//   //     return { success: false, error: 'Failed to retrieve stock movements' };
//   //   }
//   // });

//   // Get stock movements
// // Get stock movements
//   ipcMain.handle('inventory:getStockMovements', async (event, data = {}) => {
//     try {
//       const { productId, limit = 50 } = data;
      
//       let query = `
//         SELECT 
//           sm.*,
//           u.full_name as user_name,
//           p.name as product_name,
//           p.sku
//         FROM stock_movements sm
//         JOIN users u ON sm.user_id = u.id
//         JOIN products p ON sm.product_id = p.id
//       `;
      
//       if (productId) {
//         query += ' WHERE sm.product_id = ? ORDER BY sm.created_at DESC LIMIT ?';
//         const movements = db.prepare(query).all(productId, limit);
//         return { success: true, movements };
//       } else {
//         query += ' ORDER BY sm.created_at DESC LIMIT ?';
//         const movements = db.prepare(query).all(limit);
//         return { success: true, movements };
//       }
//     } catch (error) {
//       console.error('Get stock movements error:', error);
//       return { success: false, error: 'Failed to retrieve stock movements' };
//     }
//   });

//   // Transfer stock between locations
//   ipcMain.handle('inventory:transferStock', async (event, transferData) => {
//     const transaction = db.transaction(() => {
//       try {
//         const { productId, fromLocation, toLocation, quantity, reason } = transferData;
        
//         // In this implementation, we're using a simple single-location model
//         // For multi-location, you'd have location_id in the inventory table
        
//         // Record the transfer as two movements
//         db.prepare(`
//           INSERT INTO stock_movements (
//             product_id, movement_type, quantity,
//             reference_type, reference_id, reason, user_id
//           ) VALUES (?, 'transfer', ?, 'transfer', NULL, ?, ?)
//         `).run(
//           productId,
//           quantity,
//           `Transfer from ${fromLocation} to ${toLocation}: ${reason}`,
//           event.sender.userId || 1
//         );
        
//         logActivity(
//           db,
//           event.sender.userId || 1,
//           'transfer_stock',
//           'inventory',
//           productId,
//           `Transferred ${quantity} units from ${fromLocation} to ${toLocation}`
//         );
        
//         return { success: true };
//       } catch (error) {
//         throw error;
//       }
//     });
    
//     try {
//       return transaction();
//     } catch (error) {
//       console.error('Transfer stock error:', error);
//       return { success: false, error: error.message || 'Failed to transfer stock' };
//     }
//   });

//   // Bulk stock adjustment
//   ipcMain.handle('inventory:adjustStock', async (event, adjustments) => {
//     const transaction = db.transaction(() => {
//       try {
//         const results = {
//           success: 0,
//           failed: 0,
//           errors: []
//         };
        
//         for (const adjustment of adjustments) {
//           try {
//             const { productId, newQuantity, reason } = adjustment;
            
//             // Get current quantity
//             const current = db.prepare('SELECT quantity FROM inventory WHERE product_id = ?').get(productId);
            
//             if (!current) {
//               results.failed++;
//               results.errors.push(`Product ${productId} inventory not found`);
//               continue;
//             }
            
//             const difference = newQuantity - current.quantity;
            
//             if (difference !== 0) {
//               // Update inventory
//               db.prepare(`
//                 UPDATE inventory 
//                 SET quantity = ?, updated_at = CURRENT_TIMESTAMP
//                 WHERE product_id = ?
//               `).run(newQuantity, productId);
              
//               // Record movement
//               db.prepare(`
//                 INSERT INTO stock_movements (
//                   product_id, movement_type, quantity,
//                   reference_type, reference_id, reason, user_id
//                 ) VALUES (?, 'adjustment', ?, 'stocktake', NULL, ?, ?)
//               `).run(
//                 productId,
//                 Math.abs(difference),
//                 reason || 'Stock adjustment',
//                 event.sender.userId || 1
//               );
//             }
            
//             results.success++;
//           } catch (error) {
//             results.failed++;
//             results.errors.push(`Product ${adjustment.productId}: ${error.message}`);
//           }
//         }
        
//         logActivity(
//           db,
//           event.sender.userId || 1,
//           'bulk_stock_adjustment',
//           'inventory',
//           null,
//           `Adjusted ${results.success} products`
//         );
        
//         return { success: true, results };
//       } catch (error) {
//         throw error;
//       }
//     });
    
//     try {
//       return transaction();
//     } catch (error) {
//       console.error('Adjust stock error:', error);
//       return { success: false, error: error.message || 'Failed to adjust stock' };
//     }
//   });

//   // Get inventory valuation
//   ipcMain.handle('inventory:getValuation', async (event, { categoryId = null } = {}) => {
//     try {
//       let query = `
//         SELECT 
//           p.id,
//           p.sku,
//           p.name,
//           c.name as category_name,
//           i.quantity,
//           p.cost_price,
//           p.unit_price,
//           (i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as stock_value,
//           (i.quantity * p.unit_price) as retail_value
//         FROM products p
//         JOIN inventory i ON p.id = i.product_id
//         LEFT JOIN categories c ON p.category_id = c.id
//         WHERE p.is_active = 1 AND p.track_inventory = 1
//       `;
      
//       const params = [];
      
//       if (categoryId) {
//         query += ' AND p.category_id = ?';
//         params.push(categoryId);
//       }
      
//       query += ' ORDER BY stock_value DESC';
      
//       const items = db.prepare(query).all(...params);
      
//       // Calculate totals
//       const summary = {
//         total_items: items.length,
//         total_units: 0,
//         total_cost_value: 0,
//         total_retail_value: 0
//       };
      
//       for (const item of items) {
//         summary.total_units += item.quantity;
//         summary.total_cost_value += item.stock_value;
//         summary.total_retail_value += item.retail_value;
//       }
      
//       summary.potential_profit = summary.total_retail_value - summary.total_cost_value;
//       summary.markup_percentage = summary.total_cost_value > 0 
//         ? ((summary.potential_profit / summary.total_cost_value) * 100).toFixed(2)
//         : 0;
      
//       return { success: true, items, summary };
//     } catch (error) {
//       console.error('Get inventory valuation error:', error);
//       return { success: false, error: 'Failed to calculate inventory valuation' };
//     }
//   });

//   // Check and reserve stock for order
//   ipcMain.handle('inventory:reserveStock', async (event, { items, orderId }) => {
//     const transaction = db.transaction(() => {
//       try {
//         for (const item of items) {
//           const stock = db.prepare(`
//             SELECT quantity, reserved_quantity 
//             FROM inventory 
//             WHERE product_id = ?
//           `).get(item.productId);
          
//           if (!stock) {
//             throw new Error(`No inventory record for product ${item.productId}`);
//           }
          
//           const availableQuantity = stock.quantity - stock.reserved_quantity;
          
//           if (availableQuantity < item.quantity) {
//             throw new Error(`Insufficient stock for product ${item.productId}. Available: ${availableQuantity}`);
//           }
          
//           // Reserve the stock
//           db.prepare(`
//             UPDATE inventory 
//             SET reserved_quantity = reserved_quantity + ?,
//                 updated_at = CURRENT_TIMESTAMP
//             WHERE product_id = ?
//           `).run(item.quantity, item.productId);
//         }
        
//         logActivity(
//           db,
//           event.sender.userId || 1,
//           'reserve_stock',
//           'order',
//           orderId,
//           `Reserved stock for order ${orderId}`
//         );
        
//         return { success: true };
//       } catch (error) {
//         throw error;
//       }
//     });
    
//     try {
//       return transaction();
//     } catch (error) {
//       console.error('Reserve stock error:', error);
//       return { success: false, error: error.message || 'Failed to reserve stock' };
//     }
//   });

//   // Release reserved stock
//   ipcMain.handle('inventory:releaseStock', async (event, { items, orderId }) => {
//     const transaction = db.transaction(() => {
//       try {
//         for (const item of items) {
//           db.prepare(`
//             UPDATE inventory 
//             SET reserved_quantity = CASE 
//               WHEN reserved_quantity >= ? THEN reserved_quantity - ?
//               ELSE 0
//             END,
//             updated_at = CURRENT_TIMESTAMP
//             WHERE product_id = ?
//           `).run(item.quantity, item.quantity, item.productId);
//         }
        
//         logActivity(
//           db,
//           event.sender.userId || 1,
//           'release_stock',
//           'order',
//           orderId,
//           `Released reserved stock for order ${orderId}`
//         );
        
//         return { success: true };
//       } catch (error) {
//         throw error;
//       }
//     });
    
//     try {
//       return transaction();
//     } catch (error) {
//       console.error('Release stock error:', error);
//       return { success: false, error: error.message || 'Failed to release stock' };
//     }
//   });

//   // Get reorder suggestions
//   ipcMain.handle('inventory:getReorderSuggestions', async (event) => {
//     try {
//       const suggestions = db.prepare(`
//         SELECT 
//           p.id,
//           p.sku,
//           p.name,
//           i.quantity as current_stock,
//           i.reorder_point,
//           i.reorder_quantity,
//           p.low_stock_threshold,
//           s.supplier_id,
//           sup.name as supplier_name,
//           sup.email as supplier_email,
//           AVG(sm.quantity) as avg_daily_usage
//         FROM products p
//         JOIN inventory i ON p.id = i.product_id
//         LEFT JOIN (
//           SELECT product_id, supplier_id
//           FROM purchase_order_items poi
//           JOIN purchase_orders po ON poi.order_id = po.id
//           GROUP BY product_id
//           ORDER BY po.order_date DESC
//         ) s ON s.product_id = p.id
//         LEFT JOIN suppliers sup ON s.supplier_id = sup.id
//         LEFT JOIN (
//           SELECT 
//             product_id,
//             SUM(quantity) / 30 as quantity
//           FROM stock_movements
//           WHERE movement_type = 'out'
//             AND created_at >= date('now', '-30 days')
//           GROUP BY product_id
//         ) sm ON sm.product_id = p.id
//         WHERE p.is_active = 1
//           AND p.track_inventory = 1
//           AND (
//             i.quantity <= COALESCE(i.reorder_point, p.low_stock_threshold)
//             OR (sm.quantity > 0 AND i.quantity / sm.quantity < 7)
//           )
//         ORDER BY i.quantity ASC
//       `).all();
      
//       // Calculate suggested order quantities
//       for (const item of suggestions) {
//         if (item.reorder_quantity) {
//           item.suggested_quantity = item.reorder_quantity;
//         } else if (item.avg_daily_usage) {
//           // Suggest 30 days of stock
//           item.suggested_quantity = Math.ceil(item.avg_daily_usage * 30 - item.current_stock);
//         } else {
//           // Default to 2x the low stock threshold
//           item.suggested_quantity = item.low_stock_threshold * 2 - item.current_stock;
//         }
        
//         item.days_until_stockout = item.avg_daily_usage 
//           ? Math.floor(item.current_stock / item.avg_daily_usage)
//           : null;
//       }
      
//       return { success: true, suggestions };
//     } catch (error) {
//       console.error('Get reorder suggestions error:', error);
//       return { success: false, error: 'Failed to get reorder suggestions' };
//     }
//   });

//   // Update reorder settings
//   ipcMain.handle('inventory:updateReorderSettings', async (event, { productId, reorderPoint, reorderQuantity }) => {
//     try {
//       db.prepare(`
//         UPDATE inventory 
//         SET reorder_point = ?, 
//             reorder_quantity = ?,
//             updated_at = CURRENT_TIMESTAMP
//         WHERE product_id = ?
//       `).run(reorderPoint, reorderQuantity, productId);
      
//       logActivity(
//         db,
//         event.sender.userId || 1,
//         'update_reorder_settings',
//         'inventory',
//         productId,
//         `Updated reorder settings: Point=${reorderPoint}, Quantity=${reorderQuantity}`
//       );
      
//       return { success: true };
//     } catch (error) {
//       console.error('Update reorder settings error:', error);
//       return { success: false, error: 'Failed to update reorder settings' };
//     }
//   });

//   // Get stock history for a product
//   ipcMain.handle('inventory:getStockHistory', async (event, { productId, days = 30 }) => {
//     try {
//       const history = db.prepare(`
//         SELECT 
//           DATE(created_at) as date,
//           SUM(CASE WHEN movement_type IN ('in', 'adjustment') AND quantity > 0 THEN quantity ELSE 0 END) as stock_in,
//           SUM(CASE WHEN movement_type IN ('out', 'adjustment') AND quantity < 0 THEN ABS(quantity) ELSE 0 END) as stock_out
//         FROM stock_movements
//         WHERE product_id = ?
//           AND created_at >= date('now', '-' || ? || ' days')
//         GROUP BY DATE(created_at)
//         ORDER BY date ASC
//       `).all(productId, days);
      
//       // Get current stock level
//       const currentStock = db.prepare(`
//         SELECT quantity FROM inventory WHERE product_id = ?
//       `).get(productId);
      
//       // Calculate running balance
//       let balance = currentStock.quantity;
      
//       // Work backwards to calculate historical balances
//       for (let i = history.length - 1; i >= 0; i--) {
//         balance = balance - history[i].stock_in + history[i].stock_out;
//         history[i].balance = balance;
//       }
      
//       return { success: true, history, currentStock: currentStock.quantity };
//     } catch (error) {
//       console.error('Get stock history error:', error);
//       return { success: false, error: 'Failed to get stock history' };
//     }
//   });
// }

// // Helper function
// function logActivity(db, userId, action, entityType, entityId, details) {
//   try {
//     db.prepare(`
//       INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
//       VALUES (?, ?, ?, ?, ?)
//     `).run(userId, action, entityType, entityId, details);
//   } catch (error) {
//     console.error('Failed to log activity:', error);
//   }
// }

// module.exports = { setupInventoryHandlers };

function setupInventoryHandlers(ipcMain, db) {
  // Get stock for a product
  ipcMain.handle('inventory:getStock', async (event, productId) => {
    try {
      const stock = db.prepare(`
        SELECT 
          i.*,
          p.name as product_name,
          p.sku,
          p.low_stock_threshold,
          p.track_inventory
        FROM inventory i
        JOIN products p ON i.product_id = p.id
        WHERE i.product_id = ?
      `).get(productId);
      
      if (!stock) {
        return { success: false, error: 'Stock record not found' };
      }
      
      // Calculate available stock (total - reserved)
      stock.available_quantity = stock.quantity - stock.reserved_quantity;
      stock.is_low_stock = stock.quantity <= stock.low_stock_threshold;
      
      return { success: true, stock };
    } catch (error) {
      console.error('Get stock error:', error);
      return { success: false, error: 'Failed to retrieve stock' };
    }
  });

  // Update stock quantity
  ipcMain.handle('inventory:updateStock', async (event, { productId, quantity, reason }) => {
    const transaction = db.transaction(() => {
      try {
        // Get current stock
        const currentStock = db.prepare('SELECT quantity FROM inventory WHERE product_id = ?').get(productId);
        
        if (!currentStock) {
          // Create inventory record if it doesn't exist
          db.prepare(`
            INSERT INTO inventory (product_id, quantity, reserved_quantity)
            VALUES (?, ?, 0)
          `).run(productId, quantity);
        } else {
          // Update existing stock
          const newQuantity = currentStock.quantity + quantity;
          
          if (newQuantity < 0) {
            throw new Error('Insufficient stock');
          }
          
          db.prepare(`
            UPDATE inventory 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
          `).run(newQuantity, productId);
        }
        
        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (
            product_id, movement_type, quantity, 
            reference_type, reference_id, reason, user_id
          ) VALUES (?, ?, ?, 'manual', NULL, ?, ?)
        `).run(
          productId,
          quantity > 0 ? 'in' : 'out',
          Math.abs(quantity),
          reason,
          event.sender.userId || 1
        );
        
        // Check if low stock alert needed
        const updatedStock = db.prepare(`
          SELECT i.quantity, p.low_stock_threshold, p.name
          FROM inventory i
          JOIN products p ON i.product_id = p.id
          WHERE i.product_id = ?
        `).get(productId);
        
        if (updatedStock.quantity <= updatedStock.low_stock_threshold) {
          // In a real app, this would trigger notifications
          console.log(`Low stock alert: ${updatedStock.name} - ${updatedStock.quantity} units remaining`);
        }
        
        // Log activity
        logActivity(
          db,
          event.sender.userId || 1,
          'update_stock',
          'inventory',
          productId,
          `Stock ${quantity > 0 ? 'added' : 'removed'}: ${Math.abs(quantity)} units - ${reason}`
        );
        
        return { success: true, newQuantity: updatedStock.quantity };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Update stock error:', error);
      return { success: false, error: error.message || 'Failed to update stock' };
    }
  });

  // Get low stock items
  ipcMain.handle('inventory:getLowStock', async (event) => {
    try {
      const lowStockItems = db.prepare(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.barcode,
          c.name as category_name,
          i.quantity as current_stock,
          i.reserved_quantity,
          p.low_stock_threshold,
          i.reorder_point,
          i.reorder_quantity,
          s.name as supplier_name,
          s.email as supplier_email
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN (
          SELECT DISTINCT po.supplier_id, poi.product_id
          FROM purchase_order_items poi
          JOIN purchase_orders po ON poi.order_id = po.id
        ) AS ps ON ps.product_id = p.id
        LEFT JOIN suppliers s ON ps.supplier_id = s.id
        WHERE p.is_active = 1 
          AND p.track_inventory = 1
          AND i.quantity <= p.low_stock_threshold
        ORDER BY (i.quantity * 1.0 / p.low_stock_threshold) ASC
      `).all();
      
      return { success: true, items: lowStockItems };
    } catch (error) {
      console.error('Get low stock error:', error);
      return { success: false, error: 'Failed to retrieve low stock items' };
    }
  });

  // Get stock movements with pagination
  ipcMain.handle('inventory:getStockMovements', async (event, data = {}) => {
    try {
      const { productId, page = 1, limit = 50 } = data;
      const offset = (page - 1) * limit;
      
      let countQuery = `
        SELECT COUNT(*) as total
        FROM stock_movements sm
        JOIN users u ON sm.user_id = u.id
        JOIN products p ON sm.product_id = p.id
      `;
      
      let query = `
        SELECT 
          sm.*,
          u.full_name as user_name,
          p.name as product_name,
          p.sku
        FROM stock_movements sm
        JOIN users u ON sm.user_id = u.id
        JOIN products p ON sm.product_id = p.id
      `;
      
      const params = [];
      
      if (productId) {
        const whereClause = ' WHERE sm.product_id = ?';
        countQuery += whereClause;
        query += whereClause;
        params.push(productId);
      }
      
      // Get total count
      const totalResult = db.prepare(countQuery).get(...params);
      const total = totalResult.total;
      
      // Get paginated results
      query += ' ORDER BY sm.created_at DESC LIMIT ? OFFSET ?';
      const movements = db.prepare(query).all(...params, limit, offset);
      
      return { 
        success: true, 
        movements,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Get stock movements error:', error);
      return { success: false, error: 'Failed to retrieve stock movements' };
    }
  });

  // Transfer stock between locations
  ipcMain.handle('inventory:transferStock', async (event, transferData) => {
    const transaction = db.transaction(() => {
      try {
        const { productId, fromLocation, toLocation, quantity, reason } = transferData;
        
        // In this implementation, we're using a simple single-location model
        // For multi-location, you'd have location_id in the inventory table
        
        // Record the transfer as two movements
        db.prepare(`
          INSERT INTO stock_movements (
            product_id, movement_type, quantity,
            reference_type, reference_id, reason, user_id
          ) VALUES (?, 'transfer', ?, 'transfer', NULL, ?, ?)
        `).run(
          productId,
          quantity,
          `Transfer from ${fromLocation} to ${toLocation}: ${reason}`,
          event.sender.userId || 1
        );
        
        logActivity(
          db,
          event.sender.userId || 1,
          'transfer_stock',
          'inventory',
          productId,
          `Transferred ${quantity} units from ${fromLocation} to ${toLocation}`
        );
        
        return { success: true };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Transfer stock error:', error);
      return { success: false, error: error.message || 'Failed to transfer stock' };
    }
  });

  // Bulk stock adjustment
  ipcMain.handle('inventory:adjustStock', async (event, adjustments) => {
    const transaction = db.transaction(() => {
      try {
        const results = {
          success: 0,
          failed: 0,
          errors: []
        };
        
        for (const adjustment of adjustments) {
          try {
            const { productId, newQuantity, reason } = adjustment;
            
            // Get current quantity
            const current = db.prepare('SELECT quantity FROM inventory WHERE product_id = ?').get(productId);
            
            if (!current) {
              results.failed++;
              results.errors.push(`Product ${productId} inventory not found`);
              continue;
            }
            
            const difference = newQuantity - current.quantity;
            
            if (difference !== 0) {
              // Update inventory
              db.prepare(`
                UPDATE inventory 
                SET quantity = ?, updated_at = CURRENT_TIMESTAMP
                WHERE product_id = ?
              `).run(newQuantity, productId);
              
              // Record movement
              db.prepare(`
                INSERT INTO stock_movements (
                  product_id, movement_type, quantity,
                  reference_type, reference_id, reason, user_id
                ) VALUES (?, 'adjustment', ?, 'stocktake', NULL, ?, ?)
              `).run(
                productId,
                Math.abs(difference),
                reason || 'Stock adjustment',
                event.sender.userId || 1
              );
            }
            
            results.success++;
          } catch (error) {
            results.failed++;
            results.errors.push(`Product ${adjustment.productId}: ${error.message}`);
          }
        }
        
        logActivity(
          db,
          event.sender.userId || 1,
          'bulk_stock_adjustment',
          'inventory',
          null,
          `Adjusted ${results.success} products`
        );
        
        return { success: true, results };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Adjust stock error:', error);
      return { success: false, error: error.message || 'Failed to adjust stock' };
    }
  });

  // Get inventory valuation
  ipcMain.handle('inventory:getValuation', async (event, { categoryId = null } = {}) => {
    try {
      let query = `
        SELECT 
          p.id,
          p.sku,
          p.name,
          c.name as category_name,
          i.quantity,
          p.cost_price,
          p.unit_price,
          (i.quantity * COALESCE(p.cost_price, p.unit_price * 0.7)) as stock_value,
          (i.quantity * p.unit_price) as retail_value
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.is_active = 1 AND p.track_inventory = 1
      `;
      
      const params = [];
      
      if (categoryId) {
        query += ' AND p.category_id = ?';
        params.push(categoryId);
      }
      
      query += ' ORDER BY stock_value DESC';
      
      const items = db.prepare(query).all(...params);
      
      // Calculate totals
      const summary = {
        total_items: items.length,
        total_units: 0,
        total_cost_value: 0,
        total_retail_value: 0
      };
      
      for (const item of items) {
        summary.total_units += item.quantity;
        summary.total_cost_value += item.stock_value;
        summary.total_retail_value += item.retail_value;
      }
      
      summary.potential_profit = summary.total_retail_value - summary.total_cost_value;
      summary.markup_percentage = summary.total_cost_value > 0 
        ? ((summary.potential_profit / summary.total_cost_value) * 100).toFixed(2)
        : 0;
      
      return { success: true, items, summary };
    } catch (error) {
      console.error('Get inventory valuation error:', error);
      return { success: false, error: 'Failed to calculate inventory valuation' };
    }
  });

  // Check and reserve stock for order
  ipcMain.handle('inventory:reserveStock', async (event, { items, orderId }) => {
    const transaction = db.transaction(() => {
      try {
        for (const item of items) {
          const stock = db.prepare(`
            SELECT quantity, reserved_quantity 
            FROM inventory 
            WHERE product_id = ?
          `).get(item.productId);
          
          if (!stock) {
            throw new Error(`No inventory record for product ${item.productId}`);
          }
          
          const availableQuantity = stock.quantity - stock.reserved_quantity;
          
          if (availableQuantity < item.quantity) {
            throw new Error(`Insufficient stock for product ${item.productId}. Available: ${availableQuantity}`);
          }
          
          // Reserve the stock
          db.prepare(`
            UPDATE inventory 
            SET reserved_quantity = reserved_quantity + ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
          `).run(item.quantity, item.productId);
        }
        
        logActivity(
          db,
          event.sender.userId || 1,
          'reserve_stock',
          'order',
          orderId,
          `Reserved stock for order ${orderId}`
        );
        
        return { success: true };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Reserve stock error:', error);
      return { success: false, error: error.message || 'Failed to reserve stock' };
    }
  });

  // Release reserved stock
  ipcMain.handle('inventory:releaseStock', async (event, { items, orderId }) => {
    const transaction = db.transaction(() => {
      try {
        for (const item of items) {
          db.prepare(`
            UPDATE inventory 
            SET reserved_quantity = CASE 
              WHEN reserved_quantity >= ? THEN reserved_quantity - ?
              ELSE 0
            END,
            updated_at = CURRENT_TIMESTAMP
            WHERE product_id = ?
          `).run(item.quantity, item.quantity, item.productId);
        }
        
        logActivity(
          db,
          event.sender.userId || 1,
          'release_stock',
          'order',
          orderId,
          `Released reserved stock for order ${orderId}`
        );
        
        return { success: true };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Release stock error:', error);
      return { success: false, error: error.message || 'Failed to release stock' };
    }
  });

  // Get reorder suggestions
  ipcMain.handle('inventory:getReorderSuggestions', async (event) => {
    try {
      const suggestions = db.prepare(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          i.quantity as current_stock,
          i.reorder_point,
          i.reorder_quantity,
          p.low_stock_threshold,
          s.supplier_id,
          sup.name as supplier_name,
          sup.email as supplier_email,
          AVG(sm.quantity) as avg_daily_usage
        FROM products p
        JOIN inventory i ON p.id = i.product_id
        LEFT JOIN (
          SELECT product_id, supplier_id
          FROM purchase_order_items poi
          JOIN purchase_orders po ON poi.order_id = po.id
          GROUP BY product_id
          ORDER BY po.order_date DESC
        ) s ON s.product_id = p.id
        LEFT JOIN suppliers sup ON s.supplier_id = sup.id
        LEFT JOIN (
          SELECT 
            product_id,
            SUM(quantity) / 30 as quantity
          FROM stock_movements
          WHERE movement_type = 'out'
            AND created_at >= date('now', '-30 days')
          GROUP BY product_id
        ) sm ON sm.product_id = p.id
        WHERE p.is_active = 1
          AND p.track_inventory = 1
          AND (
            i.quantity <= COALESCE(i.reorder_point, p.low_stock_threshold)
            OR (sm.quantity > 0 AND i.quantity / sm.quantity < 7)
          )
        ORDER BY i.quantity ASC
      `).all();
      
      // Calculate suggested order quantities
      for (const item of suggestions) {
        if (item.reorder_quantity) {
          item.suggested_quantity = item.reorder_quantity;
        } else if (item.avg_daily_usage) {
          // Suggest 30 days of stock
          item.suggested_quantity = Math.ceil(item.avg_daily_usage * 30 - item.current_stock);
        } else {
          // Default to 2x the low stock threshold
          item.suggested_quantity = item.low_stock_threshold * 2 - item.current_stock;
        }
        
        item.days_until_stockout = item.avg_daily_usage 
          ? Math.floor(item.current_stock / item.avg_daily_usage)
          : null;
      }
      
      return { success: true, suggestions };
    } catch (error) {
      console.error('Get reorder suggestions error:', error);
      return { success: false, error: 'Failed to get reorder suggestions' };
    }
  });

  // Update reorder settings
  ipcMain.handle('inventory:updateReorderSettings', async (event, { productId, reorderPoint, reorderQuantity }) => {
    try {
      db.prepare(`
        UPDATE inventory 
        SET reorder_point = ?, 
            reorder_quantity = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `).run(reorderPoint, reorderQuantity, productId);
      
      logActivity(
        db,
        event.sender.userId || 1,
        'update_reorder_settings',
        'inventory',
        productId,
        `Updated reorder settings: Point=${reorderPoint}, Quantity=${reorderQuantity}`
      );
      
      return { success: true };
    } catch (error) {
      console.error('Update reorder settings error:', error);
      return { success: false, error: 'Failed to update reorder settings' };
    }
  });

  // Get stock history for a product
  ipcMain.handle('inventory:getStockHistory', async (event, { productId, days = 30 }) => {
    try {
      const history = db.prepare(`
        SELECT 
          DATE(created_at) as date,
          SUM(CASE WHEN movement_type IN ('in', 'adjustment') AND quantity > 0 THEN quantity ELSE 0 END) as stock_in,
          SUM(CASE WHEN movement_type IN ('out', 'adjustment') AND quantity < 0 THEN ABS(quantity) ELSE 0 END) as stock_out
        FROM stock_movements
        WHERE product_id = ?
          AND created_at >= date('now', '-' || ? || ' days')
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `).all(productId, days);
      
      // Get current stock level
      const currentStock = db.prepare(`
        SELECT quantity FROM inventory WHERE product_id = ?
      `).get(productId);
      
      // Calculate running balance
      let balance = currentStock.quantity;
      
      // Work backwards to calculate historical balances
      for (let i = history.length - 1; i >= 0; i--) {
        balance = balance - history[i].stock_in + history[i].stock_out;
        history[i].balance = balance;
      }
      
      return { success: true, history, currentStock: currentStock.quantity };
    } catch (error) {
      console.error('Get stock history error:', error);
      return { success: false, error: 'Failed to get stock history' };
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

module.exports = { setupInventoryHandlers };