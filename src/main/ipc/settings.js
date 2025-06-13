// function setupSettingsHandlers(ipcMain, db) {
//   // Get all settings
//   ipcMain.handle('settings:getAll', async (event) => {
//     try {
//       const settings = db.prepare('SELECT key, value, description FROM settings').all();
      
//       // Convert to key-value object
//       const settingsObj = {};
//       settings.forEach(setting => {
//         settingsObj[setting.key] = setting.value;
//       });
      
//       return { success: true, settings: settingsObj, settingsList: settings };
//     } catch (error) {
//       console.error('Get settings error:', error);
//       return { success: false, error: 'Failed to retrieve settings' };
//     }
//   });

//   // Get specific setting
//   ipcMain.handle('settings:get', async (event, key) => {
//     try {
//       const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
//       return { success: true, value: setting?.value || null };
//     } catch (error) {
//       console.error('Get setting error:', error);
//       return { success: false, error: 'Failed to retrieve setting' };
//     }
//   });

//   // Update setting
//   ipcMain.handle('settings:update', async (event, { key, value }) => {
//     try {
//       db.prepare(`
//         UPDATE settings 
//         SET value = ?, updated_at = CURRENT_TIMESTAMP 
//         WHERE key = ?
//       `).run(value, key);
      
//       logActivity(db, event.sender.userId || 1, 'update_setting', 'settings', null, `Updated ${key}`);
      
//       return { success: true };
//     } catch (error) {
//       console.error('Update setting error:', error);
//       return { success: false, error: 'Failed to update setting' };
//     }
//   });

//   // Backup database
//   ipcMain.handle('settings:backup', async (event) => {
//     try {
//       const { app } = require('electron');
//       const fs = require('fs');
//       const path = require('path');
      
//       const dbPath = path.join(app.getPath('userData'), 'pos_database.db');
//       const backupDir = path.join(app.getPath('userData'), 'backups');
      
//       // Create backup directory if it doesn't exist
//       if (!fs.existsSync(backupDir)) {
//         fs.mkdirSync(backupDir);
//       }
      
//       const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
//       const backupPath = path.join(backupDir, `backup_${timestamp}.db`);
      
//       // Copy database file
//       fs.copyFileSync(dbPath, backupPath);
      
//       logActivity(db, event.sender.userId || 1, 'create_backup', 'system', null, `Backup created: ${backupPath}`);
      
//       return { success: true, backupPath };
//     } catch (error) {
//       console.error('Backup error:', error);
//       return { success: false, error: 'Failed to create backup' };
//     }
//   });

//   return ipcMain;
// }

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

// module.exports = { setupSettingsHandlers };

// src/main/ipc/settings.js - Updated settings handler
function setupSettingsHandlers(ipcMain, db) {
  const { app, dialog } = require('electron');
  const fs = require('fs');
  const path = require('path');

  // Get all settings
  ipcMain.handle('settings:getAll', async (event) => {
    try {
      const settings = db.prepare('SELECT key, value, description FROM settings').all();
      
      // Convert to key-value object
      const settingsObj = {};
      settings.forEach(setting => {
        settingsObj[setting.key] = setting.value;
      });
      
      return { success: true, settings: settingsObj, settingsList: settings };
    } catch (error) {
      console.error('Get settings error:', error);
      return { success: false, error: 'Failed to retrieve settings' };
    }
  });

  // Get specific setting
  ipcMain.handle('settings:get', async (event, key) => {
    try {
      const setting = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
      return { success: true, value: setting?.value || null };
    } catch (error) {
      console.error('Get setting error:', error);
      return { success: false, error: 'Failed to retrieve setting' };
    }
  });

  // Update setting
  ipcMain.handle('settings:update', async (event, { key, value }) => {
    try {
      // Check if setting exists, if not insert it
      const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(key);
      
      if (existing) {
        db.prepare(`
          UPDATE settings 
          SET value = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE key = ?
        `).run(value, key);
      } else {
        db.prepare(`
          INSERT INTO settings (key, value, updated_at) 
          VALUES (?, ?, CURRENT_TIMESTAMP)
        `).run(key, value);
      }
      
      logActivity(db, event.sender.userId || 1, 'update_setting', 'settings', null, `Updated ${key}`);
      
      return { success: true };
    } catch (error) {
      console.error('Update setting error:', error);
      return { success: false, error: 'Failed to update setting' };
    }
  });

  // Bulk update settings
  ipcMain.handle('settings:bulkUpdate', async (event, settingsObj) => {
    const transaction = db.transaction((settings) => {
      for (const [key, value] of Object.entries(settings)) {
        const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(key);
        
        if (existing) {
          db.prepare(`
            UPDATE settings 
            SET value = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE key = ?
          `).run(value, key);
        } else {
          db.prepare(`
            INSERT INTO settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `).run(key, value);
        }
      }
    });

    try {
      transaction(settingsObj);
      logActivity(db, event.sender.userId || 1, 'bulk_update_settings', 'settings', null, 'Bulk updated settings');
      return { success: true };
    } catch (error) {
      console.error('Bulk update settings error:', error);
      return { success: false, error: 'Failed to update settings' };
    }
  });

  // Get business info specifically
  ipcMain.handle('settings:getBusinessInfo', async (event) => {
    try {
      const businessKeys = [
        'business_name', 'business_address', 'business_phone', 
        'business_email', 'tax_number', 'currency'
      ];
      
      const settings = db.prepare(`
        SELECT key, value FROM settings 
        WHERE key IN (${businessKeys.map(() => '?').join(',')})
      `).all(...businessKeys);
      
      const businessInfo = {};
      settings.forEach(setting => {
        businessInfo[setting.key] = setting.value;
      });
      
      return { success: true, businessInfo };
    } catch (error) {
      console.error('Get business info error:', error);
      return { success: false, error: 'Failed to retrieve business information' };
    }
  });

  // Update business info
  ipcMain.handle('settings:updateBusinessInfo', async (event, businessInfo) => {
    const transaction = db.transaction((info) => {
      for (const [key, value] of Object.entries(info)) {
        const existing = db.prepare('SELECT id FROM settings WHERE key = ?').get(key);
        
        if (existing) {
          db.prepare(`
            UPDATE settings 
            SET value = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE key = ?
          `).run(value, key);
        } else {
          db.prepare(`
            INSERT INTO settings (key, value, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `).run(key, value);
        }
      }
    });

    try {
      transaction(businessInfo);
      logActivity(db, event.sender.userId || 1, 'update_business_info', 'settings', null, 'Updated business information');
      return { success: true };
    } catch (error) {
      console.error('Update business info error:', error);
      return { success: false, error: 'Failed to update business information' };
    }
  });

  // Backup database
  ipcMain.handle('settings:backup', async (event) => {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'pos_database.db');
      const backupDir = path.join(userDataPath, 'backups');
      
      // Create backup directory if it doesn't exist
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Save Database Backup',
        defaultPath: path.join(backupDir, `pos_backup_${new Date().toISOString().replace(/:/g, '-').split('.')[0]}.db`),
        filters: [
          { name: 'Database Files', extensions: ['db'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (result.canceled) {
        return { success: false, message: 'Backup cancelled' };
      }
      
      // Copy database file to selected location
      fs.copyFileSync(dbPath, result.filePath);
      
      logActivity(db, event.sender.userId || 1, 'create_backup', 'system', null, `Backup created: ${result.filePath}`);
      
      return { success: true, backupPath: result.filePath };
    } catch (error) {
      console.error('Backup error:', error);
      return { success: false, error: 'Failed to create backup', message: error.message };
    }
  });

  // Restore from backup
  ipcMain.handle('settings:restore', async (event, backupPath) => {
    try {
      // Verify backup file exists and is readable
      if (!fs.existsSync(backupPath)) {
        return { success: false, error: 'Backup file not found' };
      }
      
      // Verify it's a valid SQLite database
      const Database = require('better-sqlite3');
      let testDb;
      try {
        testDb = new Database(backupPath, { readonly: true });
        // Test if it has our expected tables
        const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
        const tableNames = tables.map(t => t.name);
        const requiredTables = ['users', 'products', 'sales', 'settings'];
        
        for (const table of requiredTables) {
          if (!tableNames.includes(table)) {
            testDb.close();
            return { success: false, error: `Invalid backup file: missing ${table} table` };
          }
        }
        testDb.close();
      } catch (error) {
        if (testDb) testDb.close();
        return { success: false, error: 'Invalid database file' };
      }
      
      // Close current database connection
      db.close();
      
      // Backup current database before restore
      const userDataPath = app.getPath('userData');
      const currentDbPath = path.join(userDataPath, 'pos_database.db');
      const tempBackupPath = path.join(userDataPath, `temp_backup_${Date.now()}.db`);
      
      try {
        fs.copyFileSync(currentDbPath, tempBackupPath);
      } catch (error) {
        console.warn('Could not create temporary backup:', error);
      }
      
      try {
        // Replace current database with backup
        fs.copyFileSync(backupPath, currentDbPath);
        
        // Reinitialize database connection
        const { initDatabase } = require('../database/init');
        const newDb = initDatabase();
        
        // Update the global db reference (you might need to handle this differently)
        Object.setPrototypeOf(db, Object.getPrototypeOf(newDb));
        Object.assign(db, newDb);
        
        // Remove temporary backup on success
        if (fs.existsSync(tempBackupPath)) {
          fs.unlinkSync(tempBackupPath);
        }
        
        logActivity(db, event.sender.userId || 1, 'restore_backup', 'system', null, `Restored from: ${backupPath}`);
        
        return { success: true, message: 'Database restored successfully' };
      } catch (error) {
        // Restore from temporary backup on failure
        try {
          if (fs.existsSync(tempBackupPath)) {
            fs.copyFileSync(tempBackupPath, currentDbPath);
            fs.unlinkSync(tempBackupPath);
          }
        } catch (restoreError) {
          console.error('Failed to restore from temporary backup:', restoreError);
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Restore error:', error);
      return { success: false, error: 'Failed to restore backup', message: error.message };
    }
  });

  // File selection handler
  ipcMain.handle('file:selectFile', async (event, options = {}) => {
    try {
      const result = await dialog.showOpenDialog({
        title: options.title || 'Select File',
        filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
        properties: ['openFile']
      });
      
      if (result.canceled) {
        return { success: false, canceled: true };
      }
      
      return { success: true, filePath: result.filePaths[0] };
    } catch (error) {
      console.error('File selection error:', error);
      return { success: false, error: 'Failed to select file' };
    }
  });

  // File save handler
  ipcMain.handle('file:saveFile', async (event, { data, options = {} }) => {
    try {
      const result = await dialog.showSaveDialog({
        title: options.title || 'Save File',
        filters: options.filters || [{ name: 'All Files', extensions: ['*'] }],
        defaultPath: options.defaultPath
      });
      
      if (result.canceled) {
        return { success: false, canceled: true };
      }
      
      fs.writeFileSync(result.filePath, data);
      
      return { success: true, filePath: result.filePath };
    } catch (error) {
      console.error('File save error:', error);
      return { success: false, error: 'Failed to save file' };
    }
  });

  // File read handler
  ipcMain.handle('file:readFile', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      return { success: true, data };
    } catch (error) {
      console.error('File read error:', error);
      return { success: false, error: 'Failed to read file' };
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

module.exports = { setupSettingsHandlers };