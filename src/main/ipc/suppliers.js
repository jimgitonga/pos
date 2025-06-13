function setupSupplierHandlers(ipcMain, db) {
  // Get all suppliers
  ipcMain.handle('suppliers:getAll', async (event) => {
    try {
      const suppliers = db.prepare(`
        SELECT * FROM suppliers 
        WHERE is_active = 1 
        ORDER BY name ASC
      `).all();
      
      return { success: true, suppliers };
    } catch (error) {
      console.error('Get suppliers error:', error);
      return { success: false, error: 'Failed to retrieve suppliers' };
    }
  });

  // Create supplier
  ipcMain.handle('suppliers:create', async (event, supplierData) => {
    try {
      const { name, contact_person, email, phone, address, city, country, payment_terms } = supplierData;
      
      // Generate supplier code
      const timestamp = Date.now().toString();
      const supplier_code = `SUP${timestamp.slice(-8)}`;
      
      const result = db.prepare(`
        INSERT INTO suppliers (
          supplier_code, name, contact_person, email, phone,
          address, city, country, payment_terms
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        supplier_code, name, contact_person || null, email || null,
        phone || null, address || null, city || null, 
        country || 'Kenya', payment_terms || null
      );
      
      logActivity(db, event.sender.userId || 1, 'create_supplier', 'supplier', result.lastInsertRowid, `Created supplier: ${name}`);
      
      return { success: true, supplierId: result.lastInsertRowid };
    } catch (error) {
      console.error('Create supplier error:', error);
      return { success: false, error: 'Failed to create supplier' };
    }
  });

  return ipcMain;
}

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

module.exports = { setupSupplierHandlers };