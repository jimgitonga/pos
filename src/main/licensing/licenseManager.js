// // src/main/licensing/licenseManager.js
// const { app, dialog } = require("electron");
// const { machineIdSync } = require("node-machine-id");
// const os = require("os");
// const si = require("systeminformation");
// const axios = require("axios");
// const crypto = require("crypto");

// // Declare Store as a variable that will be assigned via dynamic import
// let Store;

// class LicenseManager {
//   constructor(serverUrl) {
//     this.serverUrl = serverUrl || "https://your-license-server.com";
//     this.store = null;
//     this.sessionToken = null;
//     this.deviceInfo = null;
//     this.heartbeatInterval = null;
//     this.validationInterval = null;
//     this.isValidated = false;
//     this.expiresAt = null;
    
//     // Heartbeat configuration
//     this.heartbeatConfig = {
//       retryCount: 0,
//       maxRetries: 3,
//       failureCount: 0,
//       maxConsecutiveFailures: 5,
//       timeout: 10000, // Increased from 5000ms to 10000ms
//       retryDelay: 2000, // Wait 2 seconds between retries
//     };

//     // Obfuscate critical functions
//     this.shutdownHandler = this._createShutdownHandler();
//   }

//   // --- IMPORTANT: Add an async initialization method for Store ---
//   async initializeStore() {
//     if (!Store) {
//       // Dynamically import electron-store
//       const StoreModule = await import("electron-store");
//       Store = StoreModule.default;

//       this.store = new Store({
//         name: "license",
//         encryptionKey: "your-encryption-key",
//       });
//     }
//   }

//   // Collect device information
//   async collectDeviceInfo() {
//     try {
//       const [cpu, system, osInfo, network] = await Promise.all([
//         si.cpu(),
//         si.system(),
//         si.osInfo(),
//         si.networkInterfaces(),
//       ]);

//       // Get primary MAC address
//       const primaryInterface = network.find(
//         (iface) => !iface.internal && iface.mac !== "00:00:00:00:00:00"
//       );
//       const macAddress = primaryInterface ? primaryInterface.mac : "unknown";

//       return {
//         cpuId: cpu.manufacturer + "-" + cpu.brand,
//         macAddress: macAddress,
//         motherboardSerial: system.serial || machineIdSync(),
//         diskSerial: system.uuid || "unknown",
//         hostname: os.hostname(),
//         platform: process.platform,
//         osVersion: osInfo.release,
//         appVersion: app.getVersion(),
//       };
//     } catch (error) {
//       console.error("Error collecting device info:", error);
//       return {
//         cpuId: "unknown",
//         macAddress: "unknown",
//         motherboardSerial: machineIdSync(),
//         diskSerial: "unknown",
//         hostname: os.hostname(),
//         platform: process.platform,
//         osVersion: os.release(),
//         appVersion: app.getVersion(),
//       };
//     }
//   }

//   // Helper method to check if license is permanent
//   isPermanentLicense(expiresAt) {
//     return expiresAt === null || expiresAt === undefined;
//   }

//   // Helper method to check if license is expired
//   isLicenseExpired(expiresAt) {
//     if (this.isPermanentLicense(expiresAt)) {
//       return false;
//     }
//     return new Date() > new Date(expiresAt);
//   }

//   // Helper method to calculate days remaining
//   calculateDaysRemaining(expiresAt) {
//     if (this.isPermanentLicense(expiresAt)) {
//       return null;
//     }
//     const daysRemaining = Math.floor(
//       (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
//     );
//     return Math.max(0, daysRemaining);
//   }

//   // Validate license with improved error handling
//   async validateLicense(licenseKey) {
//     await this.initializeStore();
//     try {
//       this.deviceInfo = await this.collectDeviceInfo();

//       const response = await axios.post(
//         `${this.serverUrl}/api/licenses/validate`,
//         {
//           licenseKey,
//           deviceInfo: this.deviceInfo,
//         },
//         {
//           timeout: 15000, // Increased timeout for validation
//           headers: {
//             "X-App-Version": app.getVersion(),
//             "X-App-Name": app.getName(),
//           },
//         }
//       );
//       console.log("response data ",response.data)

//       if (response.data.success) {
//         this.sessionToken = response.data.sessionToken;
//         this.isValidated = true;
//         this.expiresAt = response.data.license.expiresAt;

//         // Store encrypted license info
//         this.store.set("license", {
//           key: this._encrypt(licenseKey),
//           sessionToken: this._encrypt(this.sessionToken),
//           deviceId: response.data.deviceId,
//           expiresAt: this.expiresAt,
//           validatedAt: new Date().toISOString(),
//           isPermanent: this.isPermanentLicense(this.expiresAt),
//         });

//         // Reset failure counts on successful validation
//         this.heartbeatConfig.failureCount = 0;
//         this.heartbeatConfig.retryCount = 0;

//         // Start heartbeat
//         this.startHeartbeat();

//         // Periodic re-validation
//         this.startValidationCheck();

//         return {
//           success: true,
//           license: response.data.license,
//           isPermanent: this.isPermanentLicense(this.expiresAt),
//         };
//       } else {
//         if (response.data.action === "shutdown") {
//           this.forceShutdown(response.data.error);
//         }

//         return {
//           success: false,
//           error: response.data.error,
//           registeredDevices: response.data.registeredDevices,
//         };
//       }
//     } catch (error) {
//       console.error("License validation error:", error);

//       // Check offline grace period
//       if (await this.isWithinGracePeriod()) {
//         return {
//           success: true,
//           offline: true,
//           warning:
//             "Running in offline mode. Please connect to internet within 7 days.",
//         };
//       }

//       return {
//         success: false,
//         error:
//           "Unable to validate license. Please check your internet connection.",
//       };
//     }
//   }

//   // Heartbeat to maintain session
//   startHeartbeat() {
//     if (this.heartbeatInterval) {
//       clearInterval(this.heartbeatInterval);
//     }

//     // Send initial heartbeat after a short delay
//     setTimeout(() => this.sendHeartbeat(), 5000);

//     // Regular heartbeat interval
//     this.heartbeatInterval = setInterval(() => {
//       this.sendHeartbeat();
//     }, 5 * 60 * 1000); // 5 minutes
//   }

//   async sendHeartbeat(retryAttempt = 0) {
//     if (!this.sessionToken) return;

//     try {
//       const response = await axios.post(
//         `${this.serverUrl}/api/sessions/heartbeat`,
//         {
//           sessionToken: this.sessionToken,
//         },
//         {
//           timeout: this.heartbeatConfig.timeout,
//         }
//       );

//       if (response.data.success) {
//         // Reset failure count on successful heartbeat
//         this.heartbeatConfig.failureCount = 0;
//         this.heartbeatConfig.retryCount = 0;
//         console.log("Heartbeat successful");
//       } else {
//         if (response.data.action === "shutdown") {
//           this.forceShutdown(response.data.error);
//         }
//       }
//     } catch (error) {
//       console.error(`Heartbeat error (attempt ${retryAttempt + 1}):`, error.code || error.message);

//       // Handle timeout and connection errors gracefully
//       if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        
//         // Retry logic for transient errors
//         if (retryAttempt < this.heartbeatConfig.maxRetries) {
//           console.log(`Retrying heartbeat in ${this.heartbeatConfig.retryDelay}ms...`);
          
//           setTimeout(() => {
//             this.sendHeartbeat(retryAttempt + 1);
//           }, this.heartbeatConfig.retryDelay);
          
//           return;
//         }

//         // Increment failure count after all retries exhausted
//         this.heartbeatConfig.failureCount++;
        
//         console.warn(`Heartbeat failed after ${this.heartbeatConfig.maxRetries} retries. ` +
//                     `Total failures: ${this.heartbeatConfig.failureCount}/${this.heartbeatConfig.maxConsecutiveFailures}`);

//         // Only take action after multiple consecutive failures
//         if (this.heartbeatConfig.failureCount >= this.heartbeatConfig.maxConsecutiveFailures) {
//           console.error("Too many consecutive heartbeat failures");
          
//           // Check if we're within grace period before taking drastic action
//           if (await this.isWithinGracePeriod()) {
//             console.log("Operating within grace period despite heartbeat failures");
//             // Optionally show a warning to the user
//             if (this.heartbeatConfig.failureCount === this.heartbeatConfig.maxConsecutiveFailures) {
//               // Only show warning once
//               dialog.showMessageBox({
//                 type: 'warning',
//                 title: 'Connection Issue',
//                 message: 'Having trouble connecting to the license server. The application will continue to work offline for up to 7 days.',
//                 buttons: ['OK']
//               });
//             }
//           } else {
//             // Outside grace period with persistent failures
//             this.forceShutdown("Unable to maintain connection with license server");
//           }
//         }
//       } else {
//         // For non-network errors, log but don't retry
//         console.error("Unexpected heartbeat error:", error);
//       }
//     }
//   }

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
//     await this.initializeStore();
//     const storedLicense = this.store.get("license");

//     if (!storedLicense) {
//       this.forceShutdown("No license found");
//       return;
//     }

//     try {
//       const licenseKey = this._decrypt(storedLicense.key);
//       const result = await this.validateLicense(licenseKey);
      
//       if (!result.success && !result.offline) {
//         console.error("License revalidation failed:", result.error);
//       }
//     } catch (error) {
//       console.error("Revalidation error:", error);
      
//       // Don't force shutdown immediately on revalidation errors
//       // The grace period logic in validateLicense will handle this
//     }
//   }

//   // Check offline grace period (7 days)
//   async isWithinGracePeriod() {
//     await this.initializeStore();
//     const license = this.store.get("license");
//     console.log("license",license);
//     if (!license || !license.validatedAt) return false;

//     const lastValidated = new Date(license.validatedAt);
//     const now = new Date();
//     const daysSinceValidation = (now - lastValidated) / (1000 * 60 * 60 * 24);
//         const daysRemaining = Math.floor(
//       (new Date(license.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
//     );

//     return daysSinceValidation < daysRemaining;
//   }

//   // Force shutdown with anti-tampering
//   async forceShutdown(reason) {
//     await this.initializeStore();
//     const storedLicense = this.store.get("license");

//     if (storedLicense) {
//       const isExpired = this.isLicenseExpired(storedLicense.expiresAt);
//       if (isExpired) {
//         this.store.clear();
//         dialog.showErrorBox(
//           "License Error",
//           `${reason}\n\nThe application will now close.`
//         );
//         this.shutdownHandler();
//         return;
//       }
//     }

//     // Clear stored license
//     this.store.clear();

//     // Show error dialog
//     dialog.showErrorBox(
//       "License Error",
//       `${reason}\n\nThe application will now close.`
//     );

//     // Multiple shutdown methods to prevent bypass
//     this.shutdownHandler();
//   }

//   _createShutdownHandler() {
//     const methods = [
//       () => app.quit(),
//       () => app.exit(1),
//       () => process.exit(1),
//       () => {
//         throw new Error("License validation failed");
//       },
//     ];

//     return () => {
//       methods.forEach((method) => {
//         try {
//           method();
//         } catch (e) {}
//       });
//     };
//   }

//   // Encryption helpers
//   _encrypt(text) {
//     const cipher = crypto.createCipher("aes-256-cbc", "your-secret-key");
//     let encrypted = cipher.update(text, "utf8", "hex");
//     encrypted += cipher.final("hex");
//     return encrypted;
//   }

//   _decrypt(text) {
//     const decipher = crypto.createDecipher("aes-256-cbc", "your-secret-key");
//     let decrypted = decipher.update(text, "hex", "utf8");
//     decrypted += decipher.final("utf8");
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
//   async getStoredLicense() {
//     await this.initializeStore();
//     const license = this.store.get("license");
//     if (!license) return null;

//     return {
//       hasLicense: true,
//       expiresAt: license.expiresAt,
//       isPermanent: this.isPermanentLicense(license.expiresAt),
//       deviceId: license.deviceId,
//       validatedAt: license.validatedAt,
//       isWithinGracePeriod: await this.isWithinGracePeriod(),
//       daysRemaining: this.calculateDaysRemaining(license.expiresAt),
//     };
//   }

//   // Check if app should run
//   async checkLicense() {
//     await this.initializeStore();
//     const stored = await this.getStoredLicense();

//     if (!stored) {
//       return { valid: false, requiresActivation: true };
//     }
    
//     // Try to validate online
//     try {
//       const licenseKey = this._decrypt(this.store.get("license").key);
//       const result = await this.validateLicense(licenseKey);
      
//       const daysRemaining = this.calculateDaysRemaining(stored.expiresAt);
      
//       return {
//         valid: result.success,
//         daysRemaining,
//         isPermanent: stored.isPermanent,
//         ...result,
//       };
//     } catch (error) {
//       // Check grace period for offline mode
//       if (stored.isWithinGracePeriod) {
//         return {
//           valid: true,
//           offline: true,
//           isPermanent: stored.isPermanent,
//           daysRemaining: stored.isPermanent ? null : Math.floor(
//             7 -
//               (new Date() - new Date(stored.validatedAt)) /
//                 (1000 * 60 * 60 * 24)
//           ),
//         };
//       }

//       return { valid: false, error: "License validation failed" };
//     }
//   }

//   // Get heartbeat status (useful for debugging)
//   getHeartbeatStatus() {
//     return {
//       isRunning: !!this.heartbeatInterval,
//       failureCount: this.heartbeatConfig.failureCount,
//       maxFailures: this.heartbeatConfig.maxConsecutiveFailures,
//       retryCount: this.heartbeatConfig.retryCount,
//       maxRetries: this.heartbeatConfig.maxRetries,
//     };
//   }
// }

// module.exports = LicenseManager;


// src/main/licensing/licenseManager.js
const { app, dialog } = require("electron");
const { machineIdSync } = require("node-machine-id");
const os = require("os");
const si = require("systeminformation");
const axios = require("axios");
const crypto = require("crypto");

// Declare Store as a variable that will be assigned via dynamic import
let Store;

class LicenseManager {
  constructor(serverUrl) {
    this.serverUrl = serverUrl || "https://your-license-server.com";
    this.store = null;
    this.sessionToken = null;
    this.deviceInfo = null;
    this.heartbeatInterval = null;
    this.validationInterval = null;
    this.isValidated = false;
    this.expiresAt = null;
    
    // Heartbeat configuration
    this.heartbeatConfig = {
      retryCount: 0,
      maxRetries: 1,
      failureCount: 0,
      maxConsecutiveFailures: 2,
      timeout: 10000, // Increased from 5000ms to 10000ms
      retryDelay: 2000, // Wait 2 seconds between retries
    };

    // Obfuscate critical functions
    this.shutdownHandler = this._createShutdownHandler();
  }

  // --- IMPORTANT: Add an async initialization method for Store ---
  async initializeStore() {
    if (!Store) {
      // Dynamically import electron-store
      const StoreModule = await import("electron-store");
      Store = StoreModule.default;

      this.store = new Store({
        name: "license",
        encryptionKey: "your-encryption-key",
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
        si.networkInterfaces(),
      ]);

      // Get primary MAC address
      const primaryInterface = network.find(
        (iface) => !iface.internal && iface.mac !== "00:00:00:00:00:00"
      );
      const macAddress = primaryInterface ? primaryInterface.mac : "unknown";

      return {
        cpuId: cpu.manufacturer + "-" + cpu.brand,
        macAddress: macAddress,
        motherboardSerial: system.serial || machineIdSync(),
        diskSerial: system.uuid || "unknown",
        hostname: os.hostname(),
        platform: process.platform,
        osVersion: osInfo.release,
        appVersion: app.getVersion(),
      };
    } catch (error) {
      console.error("Error collecting device info:", error);
      return {
        cpuId: "unknown",
        macAddress: "unknown",
        motherboardSerial: machineIdSync(),
        diskSerial: "unknown",
        hostname: os.hostname(),
        platform: process.platform,
        osVersion: os.release(),
        appVersion: app.getVersion(),
      };
    }
  }

  // Helper method to check if license is permanent
  isPermanentLicense(expiresAt) {
    return expiresAt === null || expiresAt === undefined;
  }

  // Helper method to check if license is expired
  isLicenseExpired(expiresAt) {
    if (this.isPermanentLicense(expiresAt)) {
      return false;
    }
    return new Date() > new Date(expiresAt);
  }

  // Helper method to calculate days remaining
  calculateDaysRemaining(expiresAt) {
    if (this.isPermanentLicense(expiresAt)) {
      return null;
    }
    const daysRemaining = Math.floor(
      (new Date(expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return Math.max(0, daysRemaining);
  }

  // Validate license with improved error handling
  async validateLicense(licenseKey) {
    await this.initializeStore();
    try {
      this.deviceInfo = await this.collectDeviceInfo();

      const response = await axios.post(
        `${this.serverUrl}/api/licenses/validate`,
        {
          licenseKey,
          deviceInfo: this.deviceInfo,
        },
        {
          timeout: 15000, // Increased timeout for validation
          headers: {
            "X-App-Version": app.getVersion(),
            "X-App-Name": app.getName(),
          },
        }
      );

      if (response.data.success) {
        this.sessionToken = response.data.sessionToken;
        this.isValidated = true;
        this.expiresAt = response.data.license.expiresAt;

        // Store encrypted license info
        this.store.set("license", {
          key: this._encrypt(licenseKey),
          sessionToken: this._encrypt(this.sessionToken),
          deviceId: response.data.deviceId,
          expiresAt: this.expiresAt,
          validatedAt: new Date().toISOString(),
          isPermanent: this.isPermanentLicense(this.expiresAt),
        });

        // Reset failure counts on successful validation
        this.heartbeatConfig.failureCount = 0;
        this.heartbeatConfig.retryCount = 0;

        // Start heartbeat
        this.startHeartbeat();

        // Periodic re-validation
        this.startValidationCheck();

        return {
          success: true,
          license: response.data.license,
          isPermanent: this.isPermanentLicense(this.expiresAt),
        };
      } else {
        if (response.data.action === "shutdown") {
          this.forceShutdown(response.data.error);
        }

        return {
          success: false,
          error: response.data.error,
          registeredDevices: response.data.registeredDevices,
        };
      }
    } catch (error) {
      console.error("License validation error:", error);

      // Check offline grace period
      if (await this.isWithinGracePeriod()) {
        const storedLicense = this.store.get("license");
        const isPermanent = this.isPermanentLicense(storedLicense?.expiresAt);
        
        return {
          success: true,
          offline: true,
          warning: isPermanent
            ? "Running in offline mode. Please ensure periodic internet connectivity."
            : "Running in offline mode. Please connect to internet within 7 days.",
        };
      }

      return {
        success: false,
        error:
          "Unable to validate license. Please check your internet connection.",
      };
    }
  }

  // Heartbeat to maintain session
  startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Send initial heartbeat after a short delay
    setTimeout(() => this.sendHeartbeat(), 5000);

    // Regular heartbeat interval
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, 0.2 * 60 * 1000); // 5 minutes
  }

  async sendHeartbeat(retryAttempt = 0) {
    if (!this.sessionToken) return;

    try {
      const response = await axios.post(
        `${this.serverUrl}/api/sessions/heartbeat`,
        {
          sessionToken: this.sessionToken,
        },
        {
          timeout: this.heartbeatConfig.timeout,
        }
      );

      if (response.data.success) {
        // Reset failure count on successful heartbeat
        this.heartbeatConfig.failureCount = 0;
        this.heartbeatConfig.retryCount = 0;
        console.log("Heartbeat successful");
      } else {
        if (response.data.action === "shutdown") {
          this.forceShutdown(response.data.error);
        }
      }
    } catch (error) {
      console.error(`Heartbeat error (attempt ${retryAttempt + 1}):`, error.code || error.message);

      // Handle timeout and connection errors gracefully
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        
        // Retry logic for transient errors
        if (retryAttempt < this.heartbeatConfig.maxRetries) {
          console.log(`Retrying heartbeat in ${this.heartbeatConfig.retryDelay}ms...`);
          
          setTimeout(() => {
            this.sendHeartbeat(retryAttempt + 1);
          }, this.heartbeatConfig.retryDelay);
          
          return;
        }

        // Increment failure count after all retries exhausted
        this.heartbeatConfig.failureCount++;
        
        console.warn(`Heartbeat failed after ${this.heartbeatConfig.maxRetries} retries. ` +
                    `Total failures: ${this.heartbeatConfig.failureCount}/${this.heartbeatConfig.maxConsecutiveFailures}`);

        // Only take action after multiple consecutive failures
        if (this.heartbeatConfig.failureCount >= this.heartbeatConfig.maxConsecutiveFailures) {
          console.error("Too many consecutive heartbeat failures");
          
          // Check if we're within grace period before taking drastic action
          if (await this.isWithinGracePeriod()) {
            console.log("Operating within grace period despite heartbeat failures");
            // Optionally show a warning to the user
            if (this.heartbeatConfig.failureCount === this.heartbeatConfig.maxConsecutiveFailures) {
              // Only show warning once
              const storedLicense = this.store.get("license");
              const isPermanent = this.isPermanentLicense(storedLicense?.expiresAt);
              
              // dialog.showMessageBox({
              //   type: 'warning',
              //   title: 'Connection Issue',
              //   message: isPermanent 
              //     ? 'Having trouble connecting to the license server. The application will continue to work offline.'
              //     : 'Having trouble connecting to the license server. The application will continue to work offline for up to 7 days.',
              //   buttons: ['OK']
              // });
            }
          } else {
            // Outside grace period with persistent failures
            this.forceShutdown("Unable to maintain connection with license server");
          }
        }
      } else {
        // For non-network errors, log but don't retry
        console.error("Unexpected heartbeat error:", error);
      }
    }
  }

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
    await this.initializeStore();
    const storedLicense = this.store.get("license");

    if (!storedLicense) {
      this.forceShutdown("No license found");
      return;
    }

    try {
      const licenseKey = this._decrypt(storedLicense.key);
      const result = await this.validateLicense(licenseKey);
      
      if (!result.success && !result.offline) {
        console.error("License revalidation failed:", result.error);
      }
    } catch (error) {
      console.error("Revalidation error:", error);
      
      // Don't force shutdown immediately on revalidation errors
      // The grace period logic in validateLicense will handle this
    }
  }

  // Check offline grace period
  async isWithinGracePeriod() {
    await this.initializeStore();
    const license = this.store.get("license");
    console.log("license", license);
    if (!license || !license.validatedAt) return false;

    const lastValidated = new Date(license.validatedAt);
    const now = new Date();
    const daysSinceValidation = (now - lastValidated) / (1000 * 60 * 60 * 24);

    // For permanent licenses, always allow grace period (no expiration limit)
    if (this.isPermanentLicense(license.expiresAt)) {
      // Still use a reasonable limit (e.g., 30 days) to ensure some connectivity
      return true;
    }

    // For time-limited licenses, calculate days remaining
    const daysRemaining = Math.floor(
      (new Date(license.expiresAt) - now) / (1000 * 60 * 60 * 24)
    );

    // Grace period is the minimum of:
    // 1. Standard 7-day offline period
    // 2. Days remaining until license expires
    const maxGracePeriod = Math.min(7, Math.max(0, daysRemaining));
    
    return daysSinceValidation < maxGracePeriod;
  }

  // Force shutdown with anti-tampering
  async forceShutdown(reason) {
    await this.initializeStore();
    const storedLicense = await this.store.get("license");

    if (storedLicense) {
      const isExpired = this.isLicenseExpired(storedLicense.expiresAt);
      if (isExpired) {
        this.store.clear();
        dialog.showErrorBox(
          "License Error",
          `${reason}\n\nThe application will now close.`
        );
        this.shutdownHandler();
        return;
      }
    }

    // Clear stored license
    this.store.clear();

    // Show error dialog
    dialog.showErrorBox(
      "License Error",
      `${reason}\n\nThe application will now close.`
    );

    // Multiple shutdown methods to prevent bypass
    this.shutdownHandler();
  }

  _createShutdownHandler() {
    const methods = [
      () => app.quit(),
      () => app.exit(1),
      () => process.exit(1),
      () => {
        throw new Error("License validation failed");
      },
    ];

    return () => {
      methods.forEach((method) => {
        try {
          method();
        } catch (e) {}
      });
    };
  }

  // Encryption helpers
  _encrypt(text) {
    const cipher = crypto.createCipher("aes-256-cbc", "your-secret-key");
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
  }

  _decrypt(text) {
    const decipher = crypto.createDecipher("aes-256-cbc", "your-secret-key");
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
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
    await this.initializeStore();
    const license = this.store.get("license");
    if (!license) return null;

    return {
      hasLicense: true,
      expiresAt: license.expiresAt,
      isPermanent: this.isPermanentLicense(license.expiresAt),
      deviceId: license.deviceId,
      validatedAt: license.validatedAt,
      isWithinGracePeriod: await this.isWithinGracePeriod(),
      daysRemaining: this.calculateDaysRemaining(license.expiresAt),
    };
  }

  // Check if app should run
  async checkLicense() {
    await this.initializeStore();
    const stored = await this.getStoredLicense();

    if (!stored) {
      return { valid: false, requiresActivation: true };
    }
    
    // Try to validate online
    try {
      const licenseKey = this._decrypt(this.store.get("license").key);
      const result = await this.validateLicense(licenseKey);
      
      const daysRemaining = this.calculateDaysRemaining(stored.expiresAt);
      
      return {
        valid: result.success,
        daysRemaining,
        isPermanent: stored.isPermanent,
        ...result,
      };
    } catch (error) {
      // Check grace period for offline mode
      if (stored.isWithinGracePeriod) {
        return {
          valid: true,
          offline: true,
          isPermanent: stored.isPermanent,
          daysRemaining: stored.isPermanent ? null : Math.floor(
            7 -
              (new Date() - new Date(stored.validatedAt)) /
                (1000 * 60 * 60 * 24)
          ),
        };
      }

      return { valid: false, error: "License validation failed" };
    }
  }

  // Get heartbeat status (useful for debugging)
  getHeartbeatStatus() {
    return {
      isRunning: !!this.heartbeatInterval,
      failureCount: this.heartbeatConfig.failureCount,
      maxFailures: this.heartbeatConfig.maxConsecutiveFailures,
      retryCount: this.heartbeatConfig.retryCount,
      maxRetries: this.heartbeatConfig.maxRetries,
    };
  }
}

module.exports = LicenseManager;