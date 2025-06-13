// function setupProductHandlers(ipcMain, db) {
//   // Get all products with optional filters
//   ipcMain.handle('products:getAll', async (event, filters = {}) => {
//     try {
//       let query = `
//         SELECT 
//           p.*,
//           c.name as category_name,
//           COALESCE(i.quantity, 0) as current_stock,
//           COALESCE(i.reserved_quantity, 0) as reserved_stock
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN inventory i ON p.id = i.product_id
//         WHERE 1=1
//       `;
      
//       const params = [];
      
//       if (filters.category_id) {
//         query += ' AND p.category_id = ?';
//         params.push(filters.category_id);
//       }
      
//       if (filters.is_active !== undefined) {
//         query += ' AND p.is_active = ?';
//         params.push(filters.is_active ? 1 : 0);
//       }
      
//       if (filters.search) {
//         query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
//         const searchTerm = `%${filters.search}%`;
//         params.push(searchTerm, searchTerm, searchTerm);
//       }
      
//       // Add sorting
//       if (filters.sortBy) {
//         const sortOrder = filters.sortOrder === 'desc' ? 'DESC' : 'ASC';
//         query += ` ORDER BY ${filters.sortBy} ${sortOrder}`;
//       } else {
//         query += ' ORDER BY p.name ASC';
//       }
      
//       // Add pagination
//       if (filters.limit) {
//         query += ' LIMIT ?';
//         params.push(filters.limit);
        
//         if (filters.offset) {
//           query += ' OFFSET ?';
//           params.push(filters.offset);
//         }
//       }
      
//       const products = db.prepare(query).all(...params);
      
//       // Get total count for pagination
//       let countQuery = `
//         SELECT COUNT(*) as total
//         FROM products p
//         WHERE 1=1
//       `;
      
//       const countParams = [];
      
//       if (filters.category_id) {
//         countQuery += ' AND p.category_id = ?';
//         countParams.push(filters.category_id);
//       }
      
//       if (filters.is_active !== undefined) {
//         countQuery += ' AND p.is_active = ?';
//         countParams.push(filters.is_active ? 1 : 0);
//       }
      
//       if (filters.search) {
//         countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)';
//         const searchTerm = `%${filters.search}%`;
//         countParams.push(searchTerm, searchTerm, searchTerm);
//       }
      
//       const { total } = db.prepare(countQuery).get(...countParams);
      
//       return { 
//         success: true, 
//         products,
//         pagination: {
//           total,
//           limit: filters.limit || total,
//           offset: filters.offset || 0
//         }
//       };
//     } catch (error) {
//       console.error('Get products error:', error);
//       return { success: false, error: 'Failed to retrieve products' };
//     }
//   });

//   // Get product by ID
//   ipcMain.handle('products:getById', async (event, id) => {
//     try {
//       const product = db.prepare(`
//         SELECT 
//           p.*,
//           c.name as category_name,
//           COALESCE(i.quantity, 0) as current_stock,
//           COALESCE(i.reserved_quantity, 0) as reserved_stock,
//           COALESCE(i.reorder_point, 0) as reorder_point,
//           COALESCE(i.reorder_quantity, 0) as reorder_quantity
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN inventory i ON p.id = i.product_id
//         WHERE p.id = ?
//       `).get(id);
      
//       if (!product) {
//         return { success: false, error: 'Product not found' };
//       }
      
//       // Get recent stock movements
//       const movements = db.prepare(`
//         SELECT 
//           sm.*,
//           u.full_name as user_name
//         FROM stock_movements sm
//         JOIN users u ON sm.user_id = u.id
//         WHERE sm.product_id = ?
//         ORDER BY sm.created_at DESC
//         LIMIT 10
//       `).all(id);
      
//       product.recent_movements = movements;
      
//       return { success: true, product };
//     } catch (error) {
//       console.error('Get product by ID error:', error);
//       return { success: false, error: 'Failed to retrieve product' };
//     }
//   });

//   // Create new product
//   ipcMain.handle('products:create', async (event, productData) => {
//     const transaction = db.transaction(() => {
//       try {
//         const {
//           sku, barcode, name, description, category_id,
//           unit_price, cost_price, tax_rate, track_inventory,
//           low_stock_threshold, image_url, initial_stock = 0
//         } = productData;
        
//         // Check if SKU or barcode already exists
//         const existing = db.prepare(
//           'SELECT id FROM products WHERE sku = ? OR (barcode = ? AND barcode IS NOT NULL)'
//         ).get(sku, barcode);
        
//         if (existing) {
//           throw new Error('SKU or barcode already exists');
//         }
        
//         // Insert product
//         const result = db.prepare(`
//           INSERT INTO products (
//             sku, barcode, name, description, category_id,
//             unit_price, cost_price, tax_rate, track_inventory,
//             low_stock_threshold, image_url
//           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
//         `).run(
//           sku, barcode || null, name, description || null, category_id || null,
//           unit_price, cost_price || null, tax_rate || 0, track_inventory ? 1 : 0,
//           low_stock_threshold || 10, image_url || null
//         );
        
//         const productId = result.lastInsertRowid;
        
//         // Create inventory record if tracking inventory
//         if (track_inventory) {
//           db.prepare(`
//             INSERT INTO inventory (product_id, quantity, reserved_quantity)
//             VALUES (?, ?, 0)
//           `).run(productId, initial_stock);
          
//           // Log stock movement if initial stock > 0
//           if (initial_stock > 0) {
//             db.prepare(`
//               INSERT INTO stock_movements (
//                 product_id, movement_type, quantity, 
//                 reference_type, reference_id, reason, user_id
//               ) VALUES (?, 'in', ?, 'initial', ?, 'Initial stock', ?)
//             `).run(productId, initial_stock, productId, event.sender.userId || 1);
//           }
//         }
        
//         // Log activity
//         logActivity(db, event.sender.userId || 1, 'create_product', 'product', productId, `Created product: ${name}`);
        
//         return { success: true, productId };
//       } catch (error) {
//         throw error;
//       }
//     });
    
//     try {
//       return transaction();
//     } catch (error) {
//       console.error('Create product error:', error);
//       return { success: false, error: error.message || 'Failed to create product' };
//     }
//   });

//   // Update product
//   ipcMain.handle('products:update', async (event, { id, updates }) => {
//     try {
//       const updateFields = [];
//       const values = [];
      
//       const allowedFields = [
//         'name', 'description', 'category_id', 'unit_price', 
//         'cost_price', 'tax_rate', 'is_active', 'track_inventory',
//         'low_stock_threshold', 'image_url'
//       ];
      
//       for (const field of allowedFields) {
//         if (updates[field] !== undefined) {
//           updateFields.push(`${field} = ?`);
//           values.push(updates[field]);
//         }
//       }
      
//       if (updateFields.length === 0) {
//         return { success: false, error: 'No valid fields to update' };
//       }
      
//       updateFields.push('updated_at = CURRENT_TIMESTAMP');
//       values.push(id);
      
//       db.prepare(`
//         UPDATE products 
//         SET ${updateFields.join(', ')}
//         WHERE id = ?
//       `).run(...values);
      
//       // Log activity
//       logActivity(db, event.sender.userId || 1, 'update_product', 'product', id, 'Updated product information');
      
//       return { success: true };
//     } catch (error) {
//       console.error('Update product error:', error);
//       return { success: false, error: 'Failed to update product' };
//     }
//   });

//   // Delete product (soft delete)
//   ipcMain.handle('products:delete', async (event, id) => {
//     try {
//       // Check if product has been used in sales
//       const salesCount = db.prepare(
//         'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?'
//       ).get(id).count;
      
//       if (salesCount > 0) {
//         // Soft delete - just mark as inactive
//         db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
        
//         logActivity(db, event.sender.userId || 1, 'deactivate_product', 'product', id, 'Deactivated product (has sales history)');
        
//         return { success: true, message: 'Product deactivated (has sales history)' };
//       } else {
//         // Hard delete if never used
//         db.prepare('DELETE FROM inventory WHERE product_id = ?').run(id);
//         db.prepare('DELETE FROM products WHERE id = ?').run(id);
        
//         logActivity(db, event.sender.userId || 1, 'delete_product', 'product', id, 'Deleted product');
        
//         return { success: true, message: 'Product deleted' };
//       }
//     } catch (error) {
//       console.error('Delete product error:', error);
//       return { success: false, error: 'Failed to delete product' };
//     }
//   });

//   // Search products
//   ipcMain.handle('products:search', async (event, query) => {
//     try {
//       const searchTerm = `%${query}%`;
      
//       const products = db.prepare(`
//         SELECT 
//           p.id, p.sku, p.barcode, p.name, p.unit_price,
//           c.name as category_name,
//           COALESCE(i.quantity, 0) as current_stock
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN inventory i ON p.id = i.product_id
//         WHERE p.is_active = 1 
//           AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
//         ORDER BY p.name ASC
//         LIMIT 20
//       `).all(searchTerm, searchTerm, searchTerm);
      
//       return { success: true, products };
//     } catch (error) {
//       console.error('Search products error:', error);
//       return { success: false, error: 'Failed to search products' };
//     }
//   });

//   // Get product by barcode
//   ipcMain.handle('products:getByBarcode', async (event, barcode) => {
//     try {
//       const product = db.prepare(`
//         SELECT 
//           p.*,
//           c.name as category_name,
//           COALESCE(i.quantity, 0) as current_stock
//         FROM products p
//         LEFT JOIN categories c ON p.category_id = c.id
//         LEFT JOIN inventory i ON p.id = i.product_id
//         WHERE p.barcode = ? AND p.is_active = 1
//       `).get(barcode);
      
//       if (!product) {
//         return { success: false, error: 'Product not found' };
//       }
      
//       return { success: true, product };
//     } catch (error) {
//       console.error('Get product by barcode error:', error);
//       return { success: false, error: 'Failed to retrieve product' };
//     }
//   });

//   // Bulk import products
//   ipcMain.handle('products:importBulk', async (event, data) => {
//     const transaction = db.transaction(() => {
//       const results = {
//         success: 0,
//         failed: 0,
//         errors: []
//       };
      
//       for (const row of data) {
//         try {
//           const {
//             sku, barcode, name, category_name, unit_price,
//             cost_price, initial_stock, low_stock_threshold
//           } = row;
          
//           // Skip if SKU already exists
//           const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
//           if (existing) {
//             results.failed++;
//             results.errors.push(`SKU ${sku} already exists`);
//             continue;
//           }
          
//           // Find or create category
//           let category_id = null;
//           if (category_name) {
//             const category = db.prepare('SELECT id FROM categories WHERE name = ?').get(category_name);
//             if (category) {
//               category_id = category.id;
//             } else {
//               const catResult = db.prepare('INSERT INTO categories (name) VALUES (?)').run(category_name);
//               category_id = catResult.lastInsertRowid;
//             }
//           }
          
//           // Insert product
//           const result = db.prepare(`
//             INSERT INTO products (
//               sku, barcode, name, category_id, unit_price, 
//               cost_price, low_stock_threshold
//             ) VALUES (?, ?, ?, ?, ?, ?, ?)
//           `).run(
//             sku, barcode || null, name, category_id,
//             unit_price, cost_price || null, low_stock_threshold || 10
//           );
          
//           // Create inventory record
//           if (initial_stock && initial_stock > 0) {
//             db.prepare(`
//               INSERT INTO inventory (product_id, quantity)
//               VALUES (?, ?)
//             `).run(result.lastInsertRowid, initial_stock);
//           }
          
//           results.success++;
//         } catch (error) {
//           results.failed++;
//           results.errors.push(`Row ${sku}: ${error.message}`);
//         }
//       }
      
//       return results;
//     });
    
//     try {
//       const results = transaction();
      
//       logActivity(
//         db, 
//         event.sender.userId || 1, 
//         'import_products', 
//         'product', 
//         null, 
//         `Imported ${results.success} products`
//       );
      
//       return { success: true, results };
//     } catch (error) {
//       console.error('Bulk import error:', error);
//       return { success: false, error: 'Failed to import products' };
//     }
//   });
// }

// // Helper function to log activities
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

// module.exports = { setupProductHandlers };

function setupProductHandlers(ipcMain, db) {
  // Get all products with optional filters - UPDATED for inventory pagination
  ipcMain.handle('products:getAll', async (event, filters = {}) => {
    try {
      const {
        is_active,
        category_id,
        page = 1,
        limit = 50,
        search,
        stock_status,
        sortBy,
        sortOrder,
        offset // Keep for backward compatibility
      } = filters;

      // Build base query with inventory data
      let query = `
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(i.quantity, 0) as current_stock,
          COALESCE(i.reserved_quantity, 0) as reserved_stock,
          COALESCE(i.quantity, 0) - COALESCE(i.reserved_quantity, 0) as available_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE 1=1
      `;

      let countQuery = `
        SELECT COUNT(*) as total
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE 1=1
      `;

      const conditions = [];
      const params = [];

      // Apply filters
      if (is_active !== undefined) {
        conditions.push('p.is_active = ?');
        params.push(is_active ? 1 : 0);
      }

      if (category_id) {
        conditions.push('p.category_id = ?');
        params.push(category_id);
      }

      if (search) {
        conditions.push('(p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)');
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
      }

      // Stock status filter for inventory module
      if (stock_status) {
        switch (stock_status) {
          case 'in_stock':
            conditions.push('COALESCE(i.quantity, 0) > p.low_stock_threshold');
            break;
          case 'low_stock':
            conditions.push('COALESCE(i.quantity, 0) > 0 AND COALESCE(i.quantity, 0) <= p.low_stock_threshold');
            break;
          case 'out_of_stock':
            conditions.push('COALESCE(i.quantity, 0) = 0');
            break;
        }
      }

      // Add WHERE clause if we have conditions
      if (conditions.length > 0) {
        const whereClause = ' AND ' + conditions.join(' AND ');
        query += whereClause;
        countQuery += whereClause;
      }

      // Get total count first
      const totalResult = db.prepare(countQuery).get(...params);
      const total = totalResult.total;

      // Add sorting
      if (sortBy) {
        const sortOrderValue = sortOrder === 'desc' ? 'DESC' : 'ASC';
        query += ` ORDER BY ${sortBy} ${sortOrderValue}`;
      } else {
        query += ' ORDER BY p.name ASC';
      }

      // Add pagination - support both page-based and offset-based
      let paginationOffset;
      let paginationLimit;

      if (page && !offset) {
        // Page-based pagination (for inventory module)
        paginationOffset = (page - 1) * limit;
        paginationLimit = limit;
      } else if (offset !== undefined) {
        // Offset-based pagination (backward compatibility)
        paginationOffset = offset;
        paginationLimit = limit || 50;
      }

      if (paginationLimit) {
        query += ' LIMIT ? OFFSET ?';
        const products = db.prepare(query).all(...params, paginationLimit, paginationOffset);

        // Return format expected by inventory module
        if (page && !offset) {
          return {
            success: true,
            products,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit)
          };
        } else {
          // Backward compatibility format
          return { 
            success: true, 
            products,
            pagination: {
              total,
              limit: paginationLimit,
              offset: paginationOffset
            }
          };
        }
      } else {
        // No pagination
        const products = db.prepare(query).all(...params);
        return { 
          success: true, 
          products,
          total
        };
      }
    } catch (error) {
      console.error('Get products error:', error);
      return { success: false, error: 'Failed to retrieve products' };
    }
  });

  // Get product by ID
  ipcMain.handle('products:getById', async (event, id) => {
    try {
      const product = db.prepare(`
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(i.quantity, 0) as current_stock,
          COALESCE(i.reserved_quantity, 0) as reserved_stock,
          COALESCE(i.reorder_point, 0) as reorder_point,
          COALESCE(i.reorder_quantity, 0) as reorder_quantity
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.id = ?
      `).get(id);
      
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      
      // Get recent stock movements
      const movements = db.prepare(`
        SELECT 
          sm.*,
          u.full_name as user_name
        FROM stock_movements sm
        JOIN users u ON sm.user_id = u.id
        WHERE sm.product_id = ?
        ORDER BY sm.created_at DESC
        LIMIT 10
      `).all(id);
      
      product.recent_movements = movements;
      
      return { success: true, product };
    } catch (error) {
      console.error('Get product by ID error:', error);
      return { success: false, error: 'Failed to retrieve product' };
    }
  });

  // Create new product
  ipcMain.handle('products:create', async (event, productData) => {
    const transaction = db.transaction(() => {
      try {
        const {
          sku, barcode, name, description, category_id,
          unit_price, cost_price, tax_rate, track_inventory,
          low_stock_threshold, image_url, initial_stock = 0
        } = productData;
        
        // Check if SKU or barcode already exists
        const existing = db.prepare(
          'SELECT id FROM products WHERE sku = ? OR (barcode = ? AND barcode IS NOT NULL)'
        ).get(sku, barcode);
        
        if (existing) {
          throw new Error('SKU or barcode already exists');
        }
        
        // Insert product
        const result = db.prepare(`
          INSERT INTO products (
            sku, barcode, name, description, category_id,
            unit_price, cost_price, tax_rate, track_inventory,
            low_stock_threshold, image_url
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          sku, barcode || null, name, description || null, category_id || null,
          unit_price, cost_price || null, tax_rate || 0, track_inventory ? 1 : 0,
          low_stock_threshold || 10, image_url || null
        );
        
        const productId = result.lastInsertRowid;
        
        // Create inventory record if tracking inventory
        if (track_inventory) {
          db.prepare(`
            INSERT INTO inventory (product_id, quantity, reserved_quantity)
            VALUES (?, ?, 0)
          `).run(productId, initial_stock);
          
          // Log stock movement if initial stock > 0
          if (initial_stock > 0) {
            db.prepare(`
              INSERT INTO stock_movements (
                product_id, movement_type, quantity, 
                reference_type, reference_id, reason, user_id
              ) VALUES (?, 'in', ?, 'initial', ?, 'Initial stock', ?)
            `).run(productId, initial_stock, productId, event.sender.userId || 1);
          }
        }
        
        // Log activity
        logActivity(db, event.sender.userId || 1, 'create_product', 'product', productId, `Created product: ${name}`);
        
        return { success: true, productId };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Create product error:', error);
      return { success: false, error: error.message || 'Failed to create product' };
    }
  });

  // Update product
  ipcMain.handle('products:update', async (event, { id, updates }) => {
    try {
      const updateFields = [];
      const values = [];
      
      const allowedFields = [
        'name', 'description', 'category_id', 'unit_price', 
        'cost_price', 'tax_rate', 'is_active', 'track_inventory',
        'low_stock_threshold', 'image_url'
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
      
      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);
      
      db.prepare(`
        UPDATE products 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...values);
      
      // Log activity
      logActivity(db, event.sender.userId || 1, 'update_product', 'product', id, 'Updated product information');
      
      return { success: true };
    } catch (error) {
      console.error('Update product error:', error);
      return { success: false, error: 'Failed to update product' };
    }
  });

  // Delete product (soft delete)
  ipcMain.handle('products:delete', async (event, id) => {
    try {
      // Check if product has been used in sales
      const salesCount = db.prepare(
        'SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?'
      ).get(id).count;
      
      if (salesCount > 0) {
        // Soft delete - just mark as inactive
        db.prepare('UPDATE products SET is_active = 0 WHERE id = ?').run(id);
        
        logActivity(db, event.sender.userId || 1, 'deactivate_product', 'product', id, 'Deactivated product (has sales history)');
        
        return { success: true, message: 'Product deactivated (has sales history)' };
      } else {
        // Hard delete if never used
        db.prepare('DELETE FROM inventory WHERE product_id = ?').run(id);
        db.prepare('DELETE FROM products WHERE id = ?').run(id);
        
        logActivity(db, event.sender.userId || 1, 'delete_product', 'product', id, 'Deleted product');
        
        return { success: true, message: 'Product deleted' };
      }
    } catch (error) {
      console.error('Delete product error:', error);
      return { success: false, error: 'Failed to delete product' };
    }
  });

  // Search products
  ipcMain.handle('products:search', async (event, query) => {
    try {
      const searchTerm = `%${query}%`;
      
      const products = db.prepare(`
        SELECT 
          p.id, p.sku, p.barcode, p.name, p.unit_price,
          c.name as category_name,
          COALESCE(i.quantity, 0) as current_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.is_active = 1 
          AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)
        ORDER BY p.name ASC
        LIMIT 20
      `).all(searchTerm, searchTerm, searchTerm);
      
      return { success: true, products };
    } catch (error) {
      console.error('Search products error:', error);
      return { success: false, error: 'Failed to search products' };
    }
  });

  // Get product by barcode
  ipcMain.handle('products:getByBarcode', async (event, barcode) => {
    try {
      const product = db.prepare(`
        SELECT 
          p.*,
          c.name as category_name,
          COALESCE(i.quantity, 0) as current_stock
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        WHERE p.barcode = ? AND p.is_active = 1
      `).get(barcode);
      
      if (!product) {
        return { success: false, error: 'Product not found' };
      }
      
      return { success: true, product };
    } catch (error) {
      console.error('Get product by barcode error:', error);
      return { success: false, error: 'Failed to retrieve product' };
    }
  });

  // Bulk import products
  ipcMain.handle('products:importBulk', async (event, data) => {
    const transaction = db.transaction(() => {
      const results = {
        success: 0,
        failed: 0,
        errors: []
      };
      
      for (const row of data) {
        try {
          const {
            sku, barcode, name, category_name, unit_price,
            cost_price, initial_stock, low_stock_threshold
          } = row;
          
          // Skip if SKU already exists
          const existing = db.prepare('SELECT id FROM products WHERE sku = ?').get(sku);
          if (existing) {
            results.failed++;
            results.errors.push(`SKU ${sku} already exists`);
            continue;
          }
          
          // Find or create category
          let category_id = null;
          if (category_name) {
            const category = db.prepare('SELECT id FROM categories WHERE name = ?').get(category_name);
            if (category) {
              category_id = category.id;
            } else {
              const catResult = db.prepare('INSERT INTO categories (name) VALUES (?)').run(category_name);
              category_id = catResult.lastInsertRowid;
            }
          }
          
          // Insert product
          const result = db.prepare(`
            INSERT INTO products (
              sku, barcode, name, category_id, unit_price, 
              cost_price, low_stock_threshold
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            sku, barcode || null, name, category_id,
            unit_price, cost_price || null, low_stock_threshold || 10
          );
          
          // Create inventory record
          if (initial_stock && initial_stock > 0) {
            db.prepare(`
              INSERT INTO inventory (product_id, quantity)
              VALUES (?, ?)
            `).run(result.lastInsertRowid, initial_stock);
          }
          
          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Row ${sku}: ${error.message}`);
        }
      }
      
      return results;
    });
    
    try {
      const results = transaction();
      
      logActivity(
        db, 
        event.sender.userId || 1, 
        'import_products', 
        'product', 
        null, 
        `Imported ${results.success} products`
      );
      
      return { success: true, results };
    } catch (error) {
      console.error('Bulk import error:', error);
      return { success: false, error: 'Failed to import products' };
    }
  });

  // Export all products - NEW function for inventory module
  ipcMain.handle('products:exportAll', async (event) => {
    try {
      const products = db.prepare(`
        SELECT 
          p.sku,
          p.barcode,
          p.name,
          p.description,
          c.name as category,
          p.unit_price,
          p.cost_price,
          p.tax_rate,
          p.low_stock_threshold,
          COALESCE(i.quantity, 0) as current_stock,
          COALESCE(i.reserved_quantity, 0) as reserved_stock,
          p.is_active,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN inventory i ON p.id = i.product_id
        ORDER BY p.name ASC
      `).all();
      
      return { success: true, products };
    } catch (error) {
      console.error('Export products error:', error);
      return { success: false, error: 'Failed to export products' };
    }
  });
}

// Helper function to log activities
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

module.exports = { setupProductHandlers };