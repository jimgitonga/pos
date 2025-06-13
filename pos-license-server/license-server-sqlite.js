// license-server-sqlite.js
// Complete license server with SQLite database
// Run: node license-server-sqlite.js

const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

// Initialize Express app
const app = express();
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100
});
app.use('/api/', limiter);

// Initialize SQLite database
const db = new sqlite3.Database(path.join(dataDir, 'licenses.db'));

// Create tables
db.serialize(() => {
  // Licenses table
  db.run(`
    CREATE TABLE IF NOT EXISTS licenses (
      key TEXT PRIMARY KEY,
      max_devices INTEGER DEFAULT 1,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active INTEGER DEFAULT 1,
      customer_info TEXT
    )
  `);

  // Devices table
  db.run(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fingerprint TEXT NOT NULL,
      license_key TEXT NOT NULL,
      hostname TEXT,
      platform TEXT,
      os_version TEXT,
      app_version TEXT,
      mac_address TEXT,
      first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (license_key) REFERENCES licenses(key),
      UNIQUE(fingerprint, license_key)
    )
  `);

  // Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      license_key TEXT NOT NULL,
      device_fingerprint TEXT NOT NULL,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      FOREIGN KEY (license_key) REFERENCES licenses(key)
    )
  `);

  // Blacklisted devices table
  db.run(`
    CREATE TABLE IF NOT EXISTS blacklisted_devices (
      fingerprint TEXT PRIMARY KEY,
      reason TEXT,
      blacklisted_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Activity logs table
  db.run(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_key TEXT,
      action TEXT,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create indexes
  db.run(`CREATE INDEX IF NOT EXISTS idx_devices_license ON devices(license_key)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_license ON sessions(license_key)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_sessions_heartbeat ON sessions(last_heartbeat)`);
});

// Helper functions
function generateLicenseKey() {
  const segments = [];
  for (let i = 0; i < 4; i++) {
    segments.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return segments.join('-');
}

function createDeviceFingerprint(deviceInfo) {
  const { cpuId, macAddress, motherboardSerial, diskSerial } = deviceInfo;
  const data = `${cpuId}-${macAddress}-${motherboardSerial}-${diskSerial}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

function logActivity(licenseKey, action, details, ipAddress) {
  db.run(
    `INSERT INTO activity_logs (license_key, action, details, ip_address) VALUES (?, ?, ?, ?)`,
    [licenseKey, action, JSON.stringify(details), ipAddress]
  );
}

// API Routes

// Create new license
app.post('/api/licenses/create', (req, res) => {
  const { maxDevices = 1, expiresAt, customerInfo } = req.body;
  const key = generateLicenseKey();
  
  db.run(
    `INSERT INTO licenses (key, max_devices, expires_at, customer_info) VALUES (?, ?, ?, ?)`,
    [key, maxDevices, expiresAt, JSON.stringify(customerInfo)],
    function(err) {
      if (err) {
        return res.json({ success: false, error: err.message });
      }
      
      logActivity(key, 'license_created', { customerInfo }, req.ip);
      
      res.json({
        success: true,
        license: {
          key,
          maxDevices,
          expiresAt,
          createdAt: new Date()
        }
      });
    }
  );
});

// Validate license
app.post('/api/licenses/validate', (req, res) => {
  const { licenseKey, deviceInfo } = req.body;
  const deviceFingerprint = createDeviceFingerprint(deviceInfo);
  const ipAddress = req.ip;

  // Check if device is blacklisted
  db.get(
    `SELECT * FROM blacklisted_devices WHERE fingerprint = ?`,
    [deviceFingerprint],
    (err, blacklisted) => {
      if (blacklisted) {
        logActivity(licenseKey, 'blacklisted_device_attempt', { deviceFingerprint }, ipAddress);
        return res.json({
          success: false,
          error: 'Device has been blacklisted',
          action: 'shutdown'
        });
      }

      // Get license
      db.get(
        `SELECT * FROM licenses WHERE key = ?`,
        [licenseKey],
        (err, license) => {
          if (!license) {
            return res.json({ success: false, error: 'Invalid license key' });
          }

          if (!license.is_active) {
            return res.json({
              success: false,
              error: 'License has been deactivated',
              action: 'shutdown'
            });
          }

          // Check expiration
          if (license.expires_at && new Date(license.expires_at) < new Date()) {
            return res.json({ success: false, error: 'License has expired' });
          }

          // Check device count
          db.all(
            `SELECT * FROM devices WHERE license_key = ?`,
            [licenseKey],
            (err, devices) => {
              const existingDevice = devices.find(d => d.fingerprint === deviceFingerprint);
              
              if (!existingDevice && devices.length >= license.max_devices) {
                return res.json({
                  success: false,
                  error: `License allows only ${license.max_devices} device(s)`,
                  registeredDevices: devices.map(d => ({
                    hostname: d.hostname,
                    lastSeen: d.last_seen
                  }))
                });
              }

              // Register or update device
              const sessionToken = uuidv4();
              
              if (existingDevice) {
                db.run(
                  `UPDATE devices SET last_seen = CURRENT_TIMESTAMP WHERE fingerprint = ? AND license_key = ?`,
                  [deviceFingerprint, licenseKey]
                );
              } else {
                db.run(
                  `INSERT INTO devices (fingerprint, license_key, hostname, platform, os_version, app_version, mac_address) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    deviceFingerprint,
                    licenseKey,
                    deviceInfo.hostname,
                    deviceInfo.platform,
                    deviceInfo.osVersion,
                    deviceInfo.appVersion,
                    deviceInfo.macAddress
                  ]
                );
              }

              // Create session
              db.run(
                `INSERT INTO sessions (token, license_key, device_fingerprint, ip_address) VALUES (?, ?, ?, ?)`,
                [sessionToken, licenseKey, deviceFingerprint, ipAddress]
              );

              logActivity(licenseKey, 'license_validated', { deviceFingerprint, hostname: deviceInfo.hostname }, ipAddress);

              res.json({
                success: true,
                sessionToken,
                deviceId: deviceFingerprint,
                license: {
                  expiresAt: license.expires_at,
                  devicesUsed: existingDevice ? devices.length : devices.length + 1,
                  maxDevices: license.max_devices
                }
              });
            }
          );
        }
      );
    }
  );
});

// Heartbeat
app.post('/api/sessions/heartbeat', (req, res) => {
  const { sessionToken } = req.body;

  db.get(
    `SELECT s.*, l.is_active FROM sessions s 
     JOIN licenses l ON s.license_key = l.key 
     WHERE s.token = ?`,
    [sessionToken],
    (err, session) => {
      if (!session) {
        return res.json({
          success: false,
          error: 'Invalid session',
          action: 'shutdown'
        });
      }

      if (!session.is_active) {
        db.run(`DELETE FROM sessions WHERE token = ?`, [sessionToken]);
        return res.json({
          success: false,
          error: 'License invalid',
          action: 'shutdown'
        });
      }

      // Check if device is blacklisted
      db.get(
        `SELECT * FROM blacklisted_devices WHERE fingerprint = ?`,
        [session.device_fingerprint],
        (err, blacklisted) => {
          if (blacklisted) {
            db.run(`DELETE FROM sessions WHERE token = ?`, [sessionToken]);
            return res.json({
              success: false,
              error: 'Device blacklisted',
              action: 'shutdown'
            });
          }

          // Update heartbeat
          db.run(
            `UPDATE sessions SET last_heartbeat = CURRENT_TIMESTAMP WHERE token = ?`,
            [sessionToken]
          );

          res.json({
            success: true,
            nextHeartbeatIn: 300000 // 5 minutes
          });
        }
      );
    }
  );
});

// Admin endpoints

// Get all licenses
app.get('/api/admin/licenses', (req, res) => {
  db.all(
    `SELECT l.*, 
     (SELECT COUNT(*) FROM devices WHERE license_key = l.key) as device_count
     FROM licenses l
     ORDER BY l.created_at DESC`,
    [],
    (err, licenses) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Parse customer info and get devices for each license
      const licensesWithDetails = licenses.map(license => {
        const customerInfo = JSON.parse(license.customer_info || '{}');
        return {
          ...license,
          customerInfo,
          devices: []
        };
      });

      // Get devices for each license
      let completed = 0;
      licensesWithDetails.forEach((license, index) => {
        db.all(
          `SELECT * FROM devices WHERE license_key = ?`,
          [license.key],
          (err, devices) => {
            licensesWithDetails[index].devices = devices || [];
            completed++;
            
            if (completed === licensesWithDetails.length) {
              res.json({ licenses: licensesWithDetails });
            }
          }
        );
      });

      if (licensesWithDetails.length === 0) {
        res.json({ licenses: [] });
      }
    }
  );
});

// Get active sessions
app.get('/api/admin/sessions', (req, res) => {
  db.all(
    `SELECT * FROM sessions WHERE datetime(last_heartbeat) > datetime('now', '-10 minutes')`,
    [],
    (err, sessions) => {
      res.json({ sessions: sessions || [] });
    }
  );
});

// Deactivate license
app.post('/api/admin/licenses/:key/deactivate', (req, res) => {
  const { key } = req.params;

  db.run(
    `UPDATE licenses SET is_active = 0 WHERE key = ?`,
    [key],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'License not found' });
      }

      // Remove active sessions
      db.run(`DELETE FROM sessions WHERE license_key = ?`, [key]);

      logActivity(key, 'license_deactivated', {}, req.ip);

      res.json({ success: true });
    }
  );
});

// Blacklist device
app.post('/api/admin/devices/:fingerprint/blacklist', (req, res) => {
  const { fingerprint } = req.params;
  const { reason = 'Admin action' } = req.body;

  db.run(
    `INSERT OR REPLACE INTO blacklisted_devices (fingerprint, reason) VALUES (?, ?)`,
    [fingerprint, reason],
    (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Remove active sessions
      db.run(`DELETE FROM sessions WHERE device_fingerprint = ?`, [fingerprint]);

      logActivity(null, 'device_blacklisted', { fingerprint, reason }, req.ip);

      res.json({ success: true });
    }
  );
});

// Get activity logs
app.get('/api/admin/logs', (req, res) => {
  const { limit = 100 } = req.query;

  db.all(
    `SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT ?`,
    [limit],
    (err, logs) => {
      res.json({ logs: logs || [] });
    }
  );
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Clean up inactive sessions periodically
setInterval(() => {
  db.run(
    `DELETE FROM sessions WHERE datetime(last_heartbeat) < datetime('now', '-10 minutes')`,
    (err) => {
      if (err) console.error('Error cleaning sessions:', err);
    }
  );
}, 60000); // Every minute

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`License server running on port ${PORT}`);
  console.log(`Database location: ${path.join(dataDir, 'licenses.db')}`);
});