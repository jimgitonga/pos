// src/main/ipc/categories.js
function setupCategoryHandlers(ipcMain, db) {
  // Get all categories
  ipcMain.handle('categories:getAll', async (event) => {
    try {
      const categories = db.prepare(`
        SELECT 
          c.*,
          pc.name as parent_name,
          COUNT(DISTINCT p.id) as product_count
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
        LEFT JOIN products p ON c.id = p.category_id AND p.is_active = 1
        GROUP BY c.id
        ORDER BY c.display_order ASC, c.name ASC
      `).all();
      
      // Build hierarchy
      const categoryMap = {};
      const rootCategories = [];
      
      categories.forEach(cat => {
        categoryMap[cat.id] = { ...cat, children: [] };
      });
      
      categories.forEach(cat => {
        if (cat.parent_id) {
          if (categoryMap[cat.parent_id]) {
            categoryMap[cat.parent_id].children.push(categoryMap[cat.id]);
          }
        } else {
          rootCategories.push(categoryMap[cat.id]);
        }
      });
      
      return { success: true, categories: rootCategories, flat: categories };
    } catch (error) {
      console.error('Get categories error:', error);
      return { success: false, error: 'Failed to retrieve categories' };
    }
  });

  // Get category by ID
  ipcMain.handle('categories:getById', async (event, id) => {
    try {
      const category = db.prepare(`
        SELECT 
          c.*,
          pc.name as parent_name,
          COUNT(DISTINCT p.id) as product_count
        FROM categories c
        LEFT JOIN categories pc ON c.parent_id = pc.id
        LEFT JOIN products p ON c.id = p.category_id
        WHERE c.id = ?
        GROUP BY c.id
      `).get(id);
      
      if (!category) {
        return { success: false, error: 'Category not found' };
      }
      
      // Get subcategories
      category.subcategories = db.prepare(`
        SELECT id, name, display_order, is_active
        FROM categories
        WHERE parent_id = ?
        ORDER BY display_order ASC, name ASC
      `).all(id);
      
      // Get products in this category
      category.products = db.prepare(`
        SELECT id, sku, name, unit_price, is_active
        FROM products
        WHERE category_id = ?
        ORDER BY name ASC
        LIMIT 10
      `).all(id);
      
      return { success: true, category };
    } catch (error) {
      console.error('Get category by ID error:', error);
      return { success: false, error: 'Failed to retrieve category' };
    }
  });

  // Create new category
  ipcMain.handle('categories:create', async (event, categoryData) => {
    try {
      const { name, description, parent_id, display_order } = categoryData;
      
      // Check if name already exists at the same level
      const existing = db.prepare(`
        SELECT id FROM categories 
        WHERE name = ? AND (parent_id = ? OR (parent_id IS NULL AND ? IS NULL))
      `).get(name, parent_id, parent_id);
      
      if (existing) {
        return { success: false, error: 'Category name already exists at this level' };
      }
      
      // Get next display order if not provided
      let orderValue = display_order;
      if (orderValue === undefined || orderValue === null) {
        const maxOrder = db.prepare(`
          SELECT MAX(display_order) as max_order 
          FROM categories 
          WHERE parent_id = ? OR (parent_id IS NULL AND ? IS NULL)
        `).get(parent_id, parent_id);
        
        orderValue = (maxOrder.max_order || 0) + 1;
      }
      
      const result = db.prepare(`
        INSERT INTO categories (name, description, parent_id, display_order)
        VALUES (?, ?, ?, ?)
      `).run(name, description || null, parent_id || null, orderValue);
      
      logActivity(
        db,
        event.sender.userId || 1,
        'create_category',
        'category',
        result.lastInsertRowid,
        `Created category: ${name}`
      );
      
      return { success: true, categoryId: result.lastInsertRowid };
    } catch (error) {
      console.error('Create category error:', error);
      return { success: false, error: error.message || 'Failed to create category' };
    }
  });

  // Update category
  ipcMain.handle('categories:update', async (event, { id, updates }) => {
    try {
      const updateFields = [];
      const values = [];
      
      if (updates.name !== undefined) {
        // Check if new name conflicts with existing
        const existing = db.prepare(`
          SELECT id FROM categories 
          WHERE name = ? AND id != ? 
          AND (parent_id = (SELECT parent_id FROM categories WHERE id = ?) 
            OR (parent_id IS NULL AND (SELECT parent_id FROM categories WHERE id = ?) IS NULL))
        `).get(updates.name, id, id, id);
        
        if (existing) {
          return { success: false, error: 'Category name already exists at this level' };
        }
        
        updateFields.push('name = ?');
        values.push(updates.name);
      }
      
      if (updates.description !== undefined) {
        updateFields.push('description = ?');
        values.push(updates.description);
      }
      
      if (updates.parent_id !== undefined) {
        // Prevent circular references
        if (updates.parent_id) {
          const wouldCreateCircle = checkCircularReference(db, id, updates.parent_id);
          if (wouldCreateCircle) {
            return { success: false, error: 'Cannot create circular category reference' };
          }
        }
        
        updateFields.push('parent_id = ?');
        values.push(updates.parent_id);
      }
      
      if (updates.display_order !== undefined) {
        updateFields.push('display_order = ?');
        values.push(updates.display_order);
      }
      
      if (updates.is_active !== undefined) {
        updateFields.push('is_active = ?');
        values.push(updates.is_active ? 1 : 0);
      }
      
      if (updateFields.length === 0) {
        return { success: false, error: 'No valid fields to update' };
      }
      
      values.push(id);
      
      db.prepare(`
        UPDATE categories 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `).run(...values);
      
      logActivity(
        db,
        event.sender.userId || 1,
        'update_category',
        'category',
        id,
        'Updated category information'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Update category error:', error);
      return { success: false, error: 'Failed to update category' };
    }
  });

  // Delete category
  ipcMain.handle('categories:delete', async (event, id) => {
    try {
      // Check if category has products
      const productCount = db.prepare(
        'SELECT COUNT(*) as count FROM products WHERE category_id = ?'
      ).get(id).count;
      
      if (productCount > 0) {
        return { success: false, error: `Cannot delete category with ${productCount} products. Please move or delete products first.` };
      }
      
      // Check if category has subcategories
      const subcategoryCount = db.prepare(
        'SELECT COUNT(*) as count FROM categories WHERE parent_id = ?'
      ).get(id).count;
      
      if (subcategoryCount > 0) {
        return { success: false, error: `Cannot delete category with ${subcategoryCount} subcategories. Please delete subcategories first.` };
      }
      
      // Get category name for logging
      const category = db.prepare('SELECT name FROM categories WHERE id = ?').get(id);
      
      // Delete category
      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      
      logActivity(
        db,
        event.sender.userId || 1,
        'delete_category',
        'category',
        id,
        `Deleted category: ${category.name}`
      );
      
      return { success: true, message: 'Category deleted successfully' };
    } catch (error) {
      console.error('Delete category error:', error);
      return { success: false, error: 'Failed to delete category' };
    }
  });

  // Reorder categories
  ipcMain.handle('categories:reorder', async (event, { categoryOrders }) => {
    const transaction = db.transaction(() => {
      try {
        const updateStmt = db.prepare('UPDATE categories SET display_order = ? WHERE id = ?');
        
        categoryOrders.forEach(({ id, order }) => {
          updateStmt.run(order, id);
        });
        
        logActivity(
          db,
          event.sender.userId || 1,
          'reorder_categories',
          'category',
          null,
          `Reordered ${categoryOrders.length} categories`
        );
        
        return { success: true };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Reorder categories error:', error);
      return { success: false, error: 'Failed to reorder categories' };
    }
  });

  // Get category tree for dropdown
  ipcMain.handle('categories:getTree', async (event) => {
    try {
      const categories = db.prepare(`
        SELECT id, name, parent_id, display_order, is_active
        FROM categories
        WHERE is_active = 1
        ORDER BY display_order ASC, name ASC
      `).all();
      
      // Build tree structure
      const buildTree = (parentId = null, level = 0) => {
        return categories
          .filter(cat => cat.parent_id === parentId)
          .map(cat => ({
            ...cat,
            level,
            label: '  '.repeat(level) + cat.name,
            children: buildTree(cat.id, level + 1)
          }));
      };
      
      const tree = buildTree();
      
      // Flatten tree for dropdown
      const flattenTree = (nodes) => {
        const flat = [];
        nodes.forEach(node => {
          flat.push({
            id: node.id,
            name: node.name,
            label: node.label,
            parent_id: node.parent_id
          });
          if (node.children.length > 0) {
            flat.push(...flattenTree(node.children));
          }
        });
        return flat;
      };
      
      return { 
        success: true, 
        tree,
        flat: flattenTree(tree)
      };
    } catch (error) {
      console.error('Get category tree error:', error);
      return { success: false, error: 'Failed to retrieve category tree' };
    }
  });

  // Move products between categories
  ipcMain.handle('categories:moveProducts', async (event, { productIds, targetCategoryId }) => {
    const transaction = db.transaction(() => {
      try {
        // Verify target category exists
        if (targetCategoryId) {
          const targetCategory = db.prepare('SELECT id FROM categories WHERE id = ?').get(targetCategoryId);
          if (!targetCategory) {
            throw new Error('Target category not found');
          }
        }
        
        // Update products
        const updateStmt = db.prepare('UPDATE products SET category_id = ? WHERE id = ?');
        
        productIds.forEach(productId => {
          updateStmt.run(targetCategoryId, productId);
        });
        
        logActivity(
          db,
          event.sender.userId || 1,
          'move_products',
          'category',
          targetCategoryId,
          `Moved ${productIds.length} products to category`
        );
        
        return { success: true, message: `Moved ${productIds.length} products successfully` };
      } catch (error) {
        throw error;
      }
    });
    
    try {
      return transaction();
    } catch (error) {
      console.error('Move products error:', error);
      return { success: false, error: error.message || 'Failed to move products' };
    }
  });

  // Get category statistics
  ipcMain.handle('categories:getStats', async (event) => {
    try {
      const stats = db.prepare(`
        SELECT 
          COUNT(DISTINCT c.id) as total_categories,
          COUNT(DISTINCT CASE WHEN c.parent_id IS NULL THEN c.id END) as root_categories,
          COUNT(DISTINCT CASE WHEN c.parent_id IS NOT NULL THEN c.id END) as subcategories,
          COUNT(DISTINCT p.id) as total_products,
          COUNT(DISTINCT CASE WHEN p.category_id IS NULL THEN p.id END) as uncategorized_products
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
      `).get();
      
      // Get top categories by product count
      const topCategories = db.prepare(`
        SELECT 
          c.id,
          c.name,
          COUNT(p.id) as product_count,
          SUM(CASE WHEN p.is_active = 1 THEN 1 ELSE 0 END) as active_products
        FROM categories c
        LEFT JOIN products p ON c.id = p.category_id
        GROUP BY c.id
        HAVING product_count > 0
        ORDER BY product_count DESC
        LIMIT 5
      `).all();
      
      return { 
        success: true, 
        stats,
        topCategories
      };
    } catch (error) {
      console.error('Get category stats error:', error);
      return { success: false, error: 'Failed to retrieve category statistics' };
    }
  });
}

// Helper function to check for circular references
function checkCircularReference(db, categoryId, newParentId) {
  if (categoryId === newParentId) return true;
  
  const checkParent = (parentId) => {
    if (parentId === categoryId) return true;
    
    const parent = db.prepare('SELECT parent_id FROM categories WHERE id = ?').get(parentId);
    if (parent && parent.parent_id) {
      return checkParent(parent.parent_id);
    }
    
    return false;
  };
  
  return checkParent(newParentId);
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

module.exports = { setupCategoryHandlers };