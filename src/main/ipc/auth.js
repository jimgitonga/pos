const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function setupAuthHandlers(ipcMain, db) {
  // Login handler
  ipcMain.handle('auth:login', async (event, { username, password }) => {
    try {
      const user = db.prepare(`
        SELECT id, username, password, full_name, email, role, is_active 
        FROM users 
        WHERE username = ? OR email = ?
      `).get(username, username);

      if (!user) {
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.is_active) {
        return { success: false, error: 'Account is deactivated' };
      }

      const validPassword = await bcrypt.compare(password, user.password);
      
      if (!validPassword) {
        return { success: false, error: 'Invalid credentials' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      db.prepare(`
        INSERT INTO sessions (user_id, token, expires_at) 
        VALUES (?, ?, ?)
      `).run(user.id, sessionToken, expiresAt.toISOString());

      // Update last login
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

      // Log activity
      logActivity(db, user.id, 'login', 'user', user.id, 'User logged in');

      // Return user data without password
      delete user.password;
      
      return {
        success: true,
        user,
        token,
        sessionToken
      };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  });

  // PIN login handler for quick access
  ipcMain.handle('auth:pinLogin', async (event, { userId, pin }) => {
    try {
      const user = db.prepare(`
        SELECT id, username, pin, full_name, email, role, is_active 
        FROM users 
        WHERE id = ?
      `).get(userId);

      if (!user || !user.pin) {
        return { success: false, error: 'PIN not set' };
      }

      if (!user.is_active) {
        return { success: false, error: 'Account is deactivated' };
      }

      const validPin = await bcrypt.compare(pin, user.pin);
      
      if (!validPin) {
        return { success: false, error: 'Invalid PIN' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      // Create session
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8);

      db.prepare(`
        INSERT INTO sessions (user_id, token, expires_at) 
        VALUES (?, ?, ?)
      `).run(user.id, sessionToken, expiresAt.toISOString());

      // Update last login
      db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);

      // Log activity
      logActivity(db, user.id, 'pin_login', 'user', user.id, 'User logged in with PIN');

      delete user.pin;
      
      return {
        success: true,
        user,
        token,
        sessionToken
      };
    } catch (error) {
      console.error('PIN login error:', error);
      return { success: false, error: 'PIN login failed' };
    }
  });

  // Logout handler
  ipcMain.handle('auth:logout', async (event, { sessionToken, userId }) => {
    try {
      // Remove session
      db.prepare('DELETE FROM sessions WHERE token = ?').run(sessionToken);
      
      // Log activity
      logActivity(db, userId, 'logout', 'user', userId, 'User logged out');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  });

  // Verify session handler
  ipcMain.handle('auth:verifySession', async (event, { sessionToken }) => {
    try {
      const session = db.prepare(`
        SELECT s.*, u.id as userId, u.username, u.full_name, u.role, u.is_active
        FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > datetime('now')
      `).get(sessionToken);

      if (!session || !session.is_active) {
        return { success: false, error: 'Invalid or expired session' };
      }

      return {
        success: true,
        user: {
          id: session.userId,
          username: session.username,
          full_name: session.full_name,
          role: session.role
        }
      };
    } catch (error) {
      console.error('Session verification error:', error);
      return { success: false, error: 'Session verification failed' };
    }
  });

  // Change password handler
  // ipcMain.handle('auth:changePassword', async (event, { userId, currentPassword, newPassword }) => {
  //   try {
  //     const user = db.prepare('SELECT password FROM users WHERE id = ?').get(userId);
      
  //     if (!user) {
  //       return { success: false, error: 'User not found' };
  //     }

  //     const validPassword = await bcrypt.compare(currentPassword, user.password);
      
  //     if (!validPassword) {
  //       return { success: false, error: 'Current password is incorrect' };
  //     }

  //     const hashedPassword = await bcrypt.hash(newPassword, 10);
      
  //     db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
  //       .run(hashedPassword, userId);

  //     logActivity(db, userId, 'change_password', 'user', userId, 'Password changed');

  //     return { success: true };
  //   } catch (error) {
  //     console.error('Change password error:', error);
  //     return { success: false, error: 'Failed to change password' };
  //   }
  // });
  // Enhanced change password handler to support admin resets
// Enhanced change password handler to support admin resets with PIN
ipcMain.handle('auth:changePassword', async (event, { userId, currentPassword, newPassword, newPin, adminReset = false }) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // If it's not an admin reset, verify current password
    if (!adminReset && currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return { success: false, error: 'Current password is incorrect' };
      }
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Hash new PIN if provided
    let hashedPin = null;
    if (newPin) {
      // Validate PIN is exactly 4 digits
      if (!/^\d{4}$/.test(newPin)) {
        return { success: false, error: 'PIN must be exactly 4 digits' };
      }
      hashedPin = await bcrypt.hash(newPin, 10);
    }
    
    // Update password and PIN if provided
    if (hashedPin) {
      db.prepare('UPDATE users SET password = ?, pin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(hashedPassword, hashedPin, userId);
    } else {
      db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(hashedPassword, userId);
    }

    // Log activity
    const action = adminReset ? 'admin_password_reset' : 'password_change';
    const details = hashedPin ? 
      `Password and PIN ${adminReset ? 'reset by admin' : 'changed'} for user: ${user.username}` :
      `Password ${adminReset ? 'reset by admin' : 'changed'} for user: ${user.username}`;
    
    logActivity(db, event.sender.userId || userId, action, 'users', userId, details);

    return { success: true };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, error: 'Failed to change password' };
  }
});



  // Set/Update PIN handler
  ipcMain.handle('auth:setPin', async (event, { userId, pin }) => {
    try {
      const hashedPin = await bcrypt.hash(pin, 10);
      
      db.prepare('UPDATE users SET pin = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(hashedPin, userId);

      logActivity(db, userId, 'set_pin', 'user', userId, 'PIN updated');

      return { success: true };
    } catch (error) {
      console.error('Set PIN error:', error);
      return { success: false, error: 'Failed to set PIN' };
    }
  });

  // Get all users (admin only)
  // ipcMain.handle('auth:getUsers', async (event, { role }) => {
  //   try {
  //     if (role !== 'admin') {
  //       return { success: false, error: 'Unauthorized' };
  //     }

  //     const users = db.prepare(`
  //       SELECT id, username, full_name, email, phone, role, is_active, last_login, created_at
  //       FROM users
  //       ORDER BY created_at DESC
  //     `).all();

  //     return { success: true, users };
  //   } catch (error) {
  //     console.error('Get users error:', error);
  //     return { success: false, error: 'Failed to get users' };
  //   }
  // });
  // Get users handler (if not already implemented)
ipcMain.handle('auth:getUsers', async (event, { role }) => {
  try {
    // Check permissions
    if (role !== 'admin' && role !== 'manager') {
      return { success: false, error: 'Insufficient permissions to view users' };
    }

    let query = 'SELECT id, username, full_name, email, phone, role, is_active, last_login, created_at FROM users';
    let users;

    if (role === 'admin') {
      // Admins can see all users
      users = db.prepare(query + ' ORDER BY created_at DESC').all();
    } else {
      // Managers can only see non-admin users
      users = db.prepare(query + ' WHERE role != ? ORDER BY created_at DESC').all('admin');
    }

    return { success: true, users };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, error: 'Failed to retrieve users' };
  }
});

  // Create user (admin only)
  ipcMain.handle('auth:createUser', async (event, { currentUserRole, userData }) => {
    try {
      if (currentUserRole !== 'admin') {
        return { success: false, error: 'Unauthorized' };
      }

      const { username, password, pin, full_name, email, phone, role } = userData;

      // Check if username or email already exists
      const existing = db.prepare(
        'SELECT id FROM users WHERE username = ? OR email = ?'
      ).get(username, email);

      if (existing) {
        return { success: false, error: 'Username or email already exists' };
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const hashedPin = pin ? await bcrypt.hash(pin, 10) : null;

      const result = db.prepare(`
        INSERT INTO users (username, password, pin, full_name, email, phone, role)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(username, hashedPassword, hashedPin, full_name, email, phone, role);

      logActivity(db, event.sender.userId, 'create_user', 'user', result.lastInsertRowid, `Created user: ${username}`);

      return { success: true, userId: result.lastInsertRowid };
    } catch (error) {
      console.error('Create user error:', error);
      return { success: false, error: 'Failed to create user' };
    }
  });

  // Update user (admin only)
  // ipcMain.handle('auth:updateUser', async (event, { currentUserRole, userId, updates }) => {
  //   try {
  //     if (currentUserRole !== 'admin') {
  //       return { success: false, error: 'Unauthorized' };
  //     }

  //     const updateFields = [];
  //     const values = [];

  //     if (updates.full_name !== undefined) {
  //       updateFields.push('full_name = ?');
  //       values.push(updates.full_name);
  //     }
  //     if (updates.email !== undefined) {
  //       updateFields.push('email = ?');
  //       values.push(updates.email);
  //     }
  //     if (updates.phone !== undefined) {
  //       updateFields.push('phone = ?');
  //       values.push(updates.phone);
  //     }
  //     if (updates.role !== undefined) {
  //       updateFields.push('role = ?');
  //       values.push(updates.role);
  //     }
  //     if (updates.is_active !== undefined) {
  //       updateFields.push('is_active = ?');
  //       values.push(updates.is_active ? 1 : 0);
  //     }

  //     updateFields.push('updated_at = CURRENT_TIMESTAMP');
  //     values.push(userId);

  //     db.prepare(`
  //       UPDATE users 
  //       SET ${updateFields.join(', ')}
  //       WHERE id = ?
  //     `).run(...values);

  //     logActivity(db, event.sender.userId, 'update_user', 'user', userId, 'Updated user information');

  //     return { success: true };
  //   } catch (error) {
  //     console.error('Update user error:', error);
  //     return { success: false, error: 'Failed to update user' };
  //   }
  // });

// Update user handler
ipcMain.handle('auth:updateUser', async (event, { currentUserRole, userId, userData }) => {
  try {
    // Check permissions
    if (currentUserRole !== 'admin' && currentUserRole !== 'manager') {
      return { success: false, error: 'Insufficient permissions to update users' };
    }

    // Don't allow non-admins to create admin users or modify admin users
    if (currentUserRole !== 'admin' && userData.role === 'admin') {
      return { success: false, error: 'Only admins can modify admin users' };
    }

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existingUser) {
      return { success: false, error: 'User not found' };
    }

    // Don't allow non-admins to modify admin users
    if (currentUserRole !== 'admin' && existingUser.role === 'admin') {
      return { success: false, error: 'Only admins can modify admin users' };
    }

    // Check for unique constraints if username or email is being changed
    if (userData.username && userData.username !== existingUser.username) {
      const usernameExists = db.prepare('SELECT id FROM users WHERE username = ? AND id != ?').get(userData.username, userId);
      if (usernameExists) {
        return { success: false, error: 'Username already exists' };
      }
    }

    if (userData.email && userData.email !== existingUser.email) {
      const emailExists = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(userData.email, userId);
      if (emailExists) {
        return { success: false, error: 'Email already exists' };
      }
    }

    // Build update query dynamically based on provided fields
    const allowedFields = ['username', 'full_name', 'email', 'phone', 'role', 'is_active'];
    const updateFields = [];
    const updateValues = [];

    allowedFields.forEach(field => {
      if (userData.hasOwnProperty(field)) {
        updateFields.push(`${field} = ?`);
        updateValues.push(userData[field]);
      }
    });

    if (updateFields.length === 0) {
      return { success: false, error: 'No valid fields to update' };
    }

    // Add updated_at field
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(userId); // for WHERE clause

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;

    db.prepare(updateQuery).run(...updateValues);

    // Log activity
    logActivity(db, event.sender.userId || 1, 'update_user', 'users', userId, 
      `Updated user: ${existingUser.username}`);

    return { success: true };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, error: 'Failed to update user' };
  }
});






  // Clock in/out handler
  ipcMain.handle('auth:clockInOut', async (event, { userId, action }) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      if (action === 'in') {
        // Check if already clocked in today
        const existing = db.prepare(`
          SELECT id FROM time_tracking 
          WHERE user_id = ? AND DATE(clock_in) = ? AND clock_out IS NULL
        `).get(userId, today);

        if (existing) {
          return { success: false, error: 'Already clocked in' };
        }

        db.prepare(`
          INSERT INTO time_tracking (user_id, clock_in) 
          VALUES (?, CURRENT_TIMESTAMP)
        `).run(userId);

        logActivity(db, userId, 'clock_in', 'time_tracking', null, 'Clocked in');
      } else {
        // Clock out
        const result = db.prepare(`
          UPDATE time_tracking 
          SET clock_out = CURRENT_TIMESTAMP 
          WHERE user_id = ? AND DATE(clock_in) = ? AND clock_out IS NULL
        `).run(userId, today);

        if (result.changes === 0) {
          return { success: false, error: 'No active clock-in found' };
        }

        logActivity(db, userId, 'clock_out', 'time_tracking', null, 'Clocked out');
      }

      return { success: true };
    } catch (error) {
      console.error('Clock in/out error:', error);
      return { success: false, error: 'Failed to process clock in/out' };
    }
  });
}

// Helper function to log activities
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

module.exports = { setupAuthHandlers };