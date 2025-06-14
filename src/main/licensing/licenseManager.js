// // src/main/licensing/licenseManager.js
// const { app, dialog } = require('electron');
// const { machineIdSync } = require('node-machine-id');
// const os = require('os');
// const si = require('systeminformation');
// const axios = require('axios');
// const Store = require('electron-store');
// const crypto = require('crypto');

// class LicenseManager {
//   constructor(serverUrl) {
//     this.serverUrl = serverUrl || 'https://your-license-server.com';
//     this.store = new Store({ 
//       name: 'license',
//       encryptionKey: 'your-encryption-key' // Use a strong key in production
//     });
    
//     this.sessionToken = null;
//     this.deviceInfo = null;
//     this.heartbeatInterval = null;
//     this.validationInterval = null;
//     this.isValidated = false;
    
//     // Obfuscate critical functions
//     this.shutdownHandler = this._createShutdownHandler();
//   }

//   // Collect device information
//   async collectDeviceInfo() {
//     try {
//       const [cpu, system, osInfo, network] = await Promise.all([
//         si.cpu(),
//         si.system(),
//         si.osInfo(),
//         si.networkInterfaces()
//       ]);

//       // Get primary MAC address
//       const primaryInterface = network.find(iface => !iface.internal && iface.mac !== '00:00:00:00:00:00');
//       const macAddress = primaryInterface ? primaryInterface.mac : 'unknown';

//       return {
//         cpuId: cpu.manufacturer + '-' + cpu.brand,
//         macAddress: macAddress,
//         motherboardSerial: system.serial || machineIdSync(),
//         diskSerial: system.uuid || 'unknown',
//         hostname: os.hostname(),
//         platform: process.platform,
//         osVersion: osInfo.release,
//         appVersion: app.getVersion()
//       };
//     } catch (error) {
//       console.error('Error collecting device info:', error);
//       // Return minimal info as fallback
//       return {
//         cpuId: 'unknown',
//         macAddress: 'unknown',
//         motherboardSerial: machineIdSync(),
//         diskSerial: 'unknown',
//         hostname: os.hostname(),
//         platform: process.platform,
//         osVersion: os.release(),
//         appVersion: app.getVersion()
//       };
//     }
//   }

//   // Validate license
//   async validateLicense(licenseKey) {
//     try {
//       this.deviceInfo = await this.collectDeviceInfo();
      
//       const response = await axios.post(`${this.serverUrl}/api/licenses/validate`, {
//         licenseKey,
//         deviceInfo: this.deviceInfo
//       }, {
//         timeout: 10000,
//         headers: {
//           'X-App-Version': app.getVersion(),
//           'X-App-Name': app.getName()
//         }
//       });

//       if (response.data.success) {
//         this.sessionToken = response.data.sessionToken;
//         this.isValidated = true;
        
//         // Store encrypted license info
//         this.store.set('license', {
//           key: this._encrypt(licenseKey),
//           sessionToken: this._encrypt(this.sessionToken),
//           deviceId: response.data.deviceId,
//           validatedAt: new Date().toISOString()
//         });

//         // Start heartbeat
//         this.startHeartbeat();
        
//         // Periodic re-validation
//         this.startValidationCheck();

//         return {
//           success: true,
//           license: response.data.license
//         };
//       } else {
//         // Handle different error scenarios
//         if (response.data.action === 'shutdown') {
//           this.forceShutdown(response.data.error);
//         }
        
//         return {
//           success: false,
//           error: response.data.error,
//           registeredDevices: response.data.registeredDevices
//         };
//       }
//     } catch (error) {
//       console.error('License validation error:', error);
      
//       // Check offline grace period
//       if (this.isWithinGracePeriod()) {
//         return {
//           success: true,
//           offline: true,
//           warning: 'Running in offline mode. Please connect to internet within 7 days.'
//         };
//       }
      
//       return {
//         success: false,
//         error: 'Unable to validate license. Please check your internet connection.'
//       };
//     }
//   }

//   // Heartbeat to maintain session
//   startHeartbeat() {
//     // Clear existing interval
//     if (this.heartbeatInterval) {
//       clearInterval(this.heartbeatInterval);
//     }

//     // Send immediate heartbeat
//     this.sendHeartbeat();

//     // Schedule regular heartbeats
//     this.heartbeatInterval = setInterval(() => {
//       this.sendHeartbeat();
//     }, 5 * 60 * 1000); // Every 5 minutes
//   }

//   async sendHeartbeat() {
//     if (!this.sessionToken) return;

//     try {
//       const response = await axios.post(`${this.serverUrl}/api/sessions/heartbeat`, {
//         sessionToken: this.sessionToken
//       }, {
//         timeout: 5000
//       });

//       if (!response.data.success) {
//         if (response.data.action === 'shutdown') {
//           this.forceShutdown(response.data.error);
//         }
//       }
//     } catch (error) {
//       console.error('Heartbeat error:', error);
//       // Don't shutdown on heartbeat failure, rely on grace period
//     }
//   }

//   // Periodic validation check
//   startValidationCheck() {
//     if (this.validationInterval) {
//       clearInterval(this.validationInterval);
//     }

//     // Check every hour
//     this.validationInterval = setInterval(() => {
//       this.revalidateLicense();
//     }, 60 * 60 * 1000);
//   }

//   async revalidateLicense() {
//     const storedLicense = this.store.get('license');
//     if (!storedLicense) {
//       this.forceShutdown('No license found');
//       return;
//     }

//     try {
//       const licenseKey = this._decrypt(storedLicense.key);
//       await this.validateLicense(licenseKey);
//     } catch (error) {
//       console.error('Revalidation error:', error);
//     }
//   }

//   // Check offline grace period (7 days)
//   isWithinGracePeriod() {
//     const license = this.store.get('license');
//     if (!license || !license.validatedAt) return false;

//     const lastValidated = new Date(license.validatedAt);
//     const now = new Date();
//     const daysSinceValidation = (now - lastValidated) / (1000 * 60 * 60 * 24);

//     return daysSinceValidation < 7;
//   }

//   // Force shutdown with anti-tampering
//   forceShutdown(reason) {
//     // Clear stored license
//     this.store.clear();

//     // Show error dialog
//     dialog.showErrorBox(
//       'License Error',
//       `${reason}\n\nThe application will now close.`
//     );

//     // Multiple shutdown methods to prevent bypass
//     this.shutdownHandler();
//   }

//   _createShutdownHandler() {
//     // Obfuscated shutdown to make it harder to bypass
//     const methods = [
//       () => app.quit(),
//       () => app.exit(1),
//       () => process.exit(1),
//       () => { throw new Error('License validation failed'); }
//     ];

//     return () => {
//       methods.forEach(method => {
//         try { method(); } catch (e) {}
//       });
//     };
//   }

//   // Encryption helpers
//   _encrypt(text) {
//     const cipher = crypto.createCipher('aes-256-cbc', 'your-secret-key');
//     let encrypted = cipher.update(text, 'utf8', 'hex');
//     encrypted += cipher.final('hex');
//     return encrypted;
//   }

//   _decrypt(text) {
//     const decipher = crypto.createDecipher('aes-256-cbc', 'your-secret-key');
//     let decrypted = decipher.update(text, 'hex', 'utf8');
//     decrypted += decipher.final('utf8');
//     return decrypted;
//   }

//   // Clean up
//   destroy() {
//     if (this.heartbeatInterval) {
//       clearInterval(this.heartbeatInterval);
//     }
//     if (this.validationInterval) {
//       clearInterval(this.validationInterval);
//     }
//   }

//   // Get stored license info
//   getStoredLicense() {
//     const license = this.store.get('license');
//     if (!license) return null;

//     return {
//       hasLicense: true,
//       deviceId: license.deviceId,
//       validatedAt: license.validatedAt,
//       isWithinGracePeriod: this.isWithinGracePeriod()
//     };
//   }

//   // Check if app should run
//   async checkLicense() {
//     const stored = this.getStoredLicense();
    
//     if (!stored) {
//       return { valid: false, requiresActivation: true };
//     }

//     // Try to validate online
//     try {
//       const licenseKey = this._decrypt(this.store.get('license').key);
//       const result = await this.validateLicense(licenseKey);
//       return { valid: result.success, ...result };
//     } catch (error) {
//       // Check grace period for offline mode
//       if (stored.isWithinGracePeriod) {
//         return { 
//           valid: true, 
//           offline: true,
//           daysRemaining: Math.floor(7 - ((new Date() - new Date(stored.validatedAt)) / (1000 * 60 * 60 * 24)))
//         };
//       }
      
//       return { valid: false, error: 'License validation failed' };
//     }
//   }
// }

// module.exports = LicenseManager;

// src/main/licensing/licenseManager.js
const { app, dialog } = require('electron');
const { machineIdSync } = require('node-machine-id');
const os = require('os');
const si = require('systeminformation');
const axios = require('axios');
// const Store = require('electron-store'); // Remove this line
const crypto = require('crypto');

// Declare Store as a variable that will be assigned via dynamic import
let Store;

class LicenseManager {
  constructor(serverUrl) {
    this.serverUrl = serverUrl || 'https://your-license-server.com';
    // Initialize store inside an async function or ensure it's available after import
    // For now, we'll assume it's initialized before usage in methods that need it.
    this.store = null; // Will be initialized later
    
    this.sessionToken = null;
    this.deviceInfo = null;
    this.heartbeatInterval = null;
    this.validationInterval = null;
    this.isValidated = false;
    
    // Obfuscate critical functions
    this.shutdownHandler = this._createShutdownHandler();
  }

  // --- IMPORTANT: Add an async initialization method for Store ---
  async initializeStore() {
    if (!Store) {
      // Dynamically import electron-store
      const StoreModule = await import('electron-store');
      Store = StoreModule.default; // electron-store exports its class as the default export

      this.store = new Store({ 
        name: 'license',
        encryptionKey: 'your-encryption-key' // Use a strong key in production
      });
    }
  }

  // Collect device information
  async collectDeviceInfo() {
    try {
      const [cpu, system, osInfo, network] = await Promise.all([
        si.cpu(),
        si.system(),
        si.osInfo(),
        si.networkInterfaces()
      ]);

      // Get primary MAC address
      const primaryInterface = network.find(iface => !iface.internal && iface.mac !== '00:00:00:00:00:00');
      const macAddress = primaryInterface ? primaryInterface.mac : 'unknown';

      return {
        cpuId: cpu.manufacturer + '-' + cpu.brand,
        macAddress: macAddress,
        motherboardSerial: system.serial || machineIdSync(),
        diskSerial: system.uuid || 'unknown',
        hostname: os.hostname(),
        platform: process.platform,
        osVersion: osInfo.release,
        appVersion: app.getVersion()
      };
    } catch (error) {
      console.error('Error collecting device info:', error);
      // Return minimal info as fallback
      return {
        cpuId: 'unknown',
        macAddress: 'unknown',
        motherboardSerial: machineIdSync(),
        diskSerial: 'unknown',
        hostname: os.hostname(),
        platform: process.platform,
        osVersion: os.release(),
        appVersion: app.getVersion()
      };
    }
  }

  // Validate license
  async validateLicense(licenseKey) {
    await this.initializeStore(); // Ensure store is initialized
    try {
      this.deviceInfo = await this.collectDeviceInfo();
      
      const response = await axios.post(`${this.serverUrl}/api/licenses/validate`, {
        licenseKey,
        deviceInfo: this.deviceInfo
      }, {
        timeout: 10000,
        headers: {
          'X-App-Version': app.getVersion(),
          'X-App-Name': app.getName()
        }
      });

      if (response.data.success) {
        this.sessionToken = response.data.sessionToken;
        this.isValidated = true;
        
        // Store encrypted license info
        this.store.set('license', {
          key: this._encrypt(licenseKey),
          sessionToken: this._encrypt(this.sessionToken),
          deviceId: response.data.deviceId,
          validatedAt: new Date().toISOString()
        });

        // Start heartbeat
        this.startHeartbeat();
        
        // Periodic re-validation
        this.startValidationCheck();

        return {
          success: true,
          license: response.data.license
        };
      } else {
        // Handle different error scenarios
        if (response.data.action === 'shutdown') {
          this.forceShutdown(response.data.error);
        }
        
        return {
          success: false,
          error: response.data.error,
          registeredDevices: response.data.registeredDevices
        };
      }
    } catch (error) {
      console.error('License validation error:', error);
      
      // Check offline grace period
      if (this.isWithinGracePeriod()) {
        return {
          success: true,
          offline: true,
          warning: 'Running in offline mode. Please connect to internet within 7 days.'
        };
      }
      
      return {
        success: false,
        error: 'Unable to validate license. Please check your internet connection.'
      };
    }
  }

  // Heartbeat to maintain session
  startHeartbeat() {
    // Clear existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send immediate heartbeat
    this.sendHeartbeat();

    // Schedule regular heartbeats
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  async sendHeartbeat() {
    if (!this.sessionToken) return;

    try {
      const response = await axios.post(`${this.serverUrl}/api/sessions/heartbeat`, {
        sessionToken: this.sessionToken
      }, {
        timeout: 5000
      });

      if (!response.data.success) {
        if (response.data.action === 'shutdown') {
          this.forceShutdown(response.data.error);
        }
      }
    } catch (error) {
      console.error('Heartbeat error:', error);
      // Don't shutdown on heartbeat failure, rely on grace period
    }
  }

  // Periodic validation check
  startValidationCheck() {
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }

    // Check every hour
    this.validationInterval = setInterval(() => {
      this.revalidateLicense();
    }, 60 * 60 * 1000);
  }

  async revalidateLicense() {
    await this.initializeStore(); // Ensure store is initialized
    const storedLicense = this.store.get('license');
    if (!storedLicense) {
      this.forceShutdown('No license found');
      return;
    }

    try {
      const licenseKey = this._decrypt(storedLicense.key);
      await this.validateLicense(licenseKey);
    } catch (error) {
      console.error('Revalidation error:', error);
    }
  }

  // Check offline grace period (7 days)
  async isWithinGracePeriod() {
    await this.initializeStore(); // Ensure store is initialized
    const license = this.store.get('license');
    if (!license || !license.validatedAt) return false;

    const lastValidated = new Date(license.validatedAt);
    const now = new Date();
    const daysSinceValidation = (now - lastValidated) / (1000 * 60 * 60 * 24);

    return daysSinceValidation < 7;
  }

  // Force shutdown with anti-tampering
  async forceShutdown(reason) {
    await this.initializeStore(); // Ensure store is initialized
    // Clear stored license
    this.store.clear();

    // Show error dialog
    dialog.showErrorBox(
      'License Error',
      `${reason}\n\nThe application will now close.`
    );

    // Multiple shutdown methods to prevent bypass
    this.shutdownHandler();
  }

  _createShutdownHandler() {
    // Obfuscated shutdown to make it harder to bypass
    const methods = [
      () => app.quit(),
      () => app.exit(1),
      () => process.exit(1),
      () => { throw new Error('License validation failed'); }
    ];

    return () => {
      methods.forEach(method => {
        try { method(); } catch (e) {}
      });
    };
  }

  // Encryption helpers
  _encrypt(text) {
    const cipher = crypto.createCipher('aes-256-cbc', 'your-secret-key');
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  _decrypt(text) {
    const decipher = crypto.createDecipher('aes-256-cbc', 'your-secret-key');
    let decrypted = decipher.update(text, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  }

  // Clean up
  destroy() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.validationInterval) {
      clearInterval(this.validationInterval);
    }
  }

  // Get stored license info
  async getStoredLicense() {
    await this.initializeStore(); // Ensure store is initialized
    const license = this.store.get('license');
    if (!license) return null;

    return {
      hasLicense: true,
      deviceId: license.deviceId,
      validatedAt: license.validatedAt,
      isWithinGracePeriod: await this.isWithinGracePeriod() // Await this call
    };
  }

  // Check if app should run
  async checkLicense() {
    await this.initializeStore(); // Ensure store is initialized
    const stored = await this.getStoredLicense(); // Await this call
    
    if (!stored) {
      return { valid: false, requiresActivation: true };
    }

    // Try to validate online
    try {
      const licenseKey = this._decrypt(this.store.get('license').key);
      const result = await this.validateLicense(licenseKey);
      return { valid: result.success, ...result };
    } catch (error) {
      // Check grace period for offline mode
      if (stored.isWithinGracePeriod) {
        return { 
          valid: true, 
          offline: true,
          daysRemaining: Math.floor(7 - ((new Date() - new Date(stored.validatedAt)) / (1000 * 60 * 60 * 24)))
        };
      }
      
      return { valid: false, error: 'License validation failed' };
    }
  }
}

module.exports = LicenseManager;