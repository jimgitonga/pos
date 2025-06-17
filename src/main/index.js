
// // src/main/index.js - Fixed version
// const { app, BrowserWindow, ipcMain, dialog } = require('electron');
// const path = require('path');
// const isDev = require('electron-is-dev');
// const { autoUpdater } = require('electron-updater');
// const LicenseManager = require('./licensing/licenseManager');

// // Import database and IPC handlers
// const { initDatabase } = require('./database/init');
// const { setupAuthHandlers } = require('./ipc/auth');
// const { setupProductHandlers } = require('./ipc/products');
// const { setupSalesHandlers } = require('./ipc/sales');
// const { setupInventoryHandlers } = require('./ipc/inventory');
// const { setupCustomerHandlers } = require('./ipc/customers');
// const { setupReportsHandlers } = require('./ipc/reports');
// const { setupSettingsHandlers } = require('./ipc/settings');
// const { setupCategoryHandlers } = require('./ipc/categories');
// const { setupInvoiceHandlers } = require('./ipc/invoices');

// let mainWindow;
// let db;
// let licenseManager;

// // Initialize license manager with your actual server
// const LICENSE_SERVER_URL = 'https://licensemanager-mdkj.onrender.com';
// licenseManager = new LicenseManager(LICENSE_SERVER_URL);

// // Enable live reload for Electron in development
// if (isDev) {
//   require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
//     hardResetMethod: 'exit'
//   });
// }

// // Create the browser window
// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     minWidth: 1200,
//     minHeight: 700,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: path.join(__dirname, 'preload.js')
//     },
//     icon: path.join(__dirname, '../assets/icon.png'),
//     frame: false,
//     backgroundColor: '#1a1a1a',
//     show: false
//   });

//   // Load the app
//   mainWindow.loadURL(
//     isDev
//       ? 'http://localhost:3000'
//       : `file://${path.join(__dirname, '../build/index.html')}`
//   );

//   // Show window when ready
//   mainWindow.once('ready-to-show', () => {
//     mainWindow.show();
    
//     // MAKE MAINWINDOW GLOBAL FOR IPC HANDLERS
//     global.mainWindow = mainWindow;
    
//     if (isDev) {
//       mainWindow.webContents.openDevTools();
//     }
//   });

//   mainWindow.on('closed', () => {
//     global.mainWindow = null;
//     mainWindow = null;
//   });
// }

// // Initialize the main application
// async function initializeApp() {
//   try {
//     // Initialize database
//     db = await initDatabase();
    
//     // Setup IPC handlers with database instance
//     setupAuthHandlers(ipcMain, db);
//     setupProductHandlers(ipcMain, db);
//     setupSalesHandlers(ipcMain, db);
//     setupInventoryHandlers(ipcMain, db);
//     setupCustomerHandlers(ipcMain, db);
//     setupReportsHandlers(ipcMain, db);
//     setupSettingsHandlers(ipcMain, db);
//     setupCategoryHandlers(ipcMain, db);
//     setupInvoiceHandlers(ipcMain, db);

    
//     // License IPC handlers
//     ipcMain.handle('license:info', async () => {
//       return licenseManager.getStoredLicense();
//     });
    
//     ipcMain.handle('license:activate', async (event, licenseKey) => {
//       return await licenseManager.validateLicense(licenseKey);
//     });
    
//     ipcMain.handle('license:validate', async () => {
//       return await licenseManager.checkLicense();
//     });
    
//     ipcMain.handle('license:deactivate', async () => {
//       licenseManager.store.clear();
//       return { success: true };
//     });
    
//     // Window controls
//     ipcMain.handle('window:minimize', () => {
//       mainWindow.minimize();
//     });
    
//     ipcMain.handle('window:maximize', () => {
//       if (mainWindow.isMaximized()) {
//         mainWindow.unmaximize();
//       } else {
//         mainWindow.maximize();
//       }
//     });
    
//     ipcMain.handle('window:close', () => {
//       mainWindow.close();
//     });
    
//     // Auto-updater
//     if (!isDev) {
//       autoUpdater.checkForUpdatesAndNotify();
//     }
    
//     createWindow();
//   } catch (error) {
//     console.error('Failed to initialize app:', error);
//     dialog.showErrorBox('Initialization Error', 'Failed to start the application. Please try again.');
//     app.quit();
//   }
// }

// // App event handlers
// app.whenReady().then(() => {
//   // Just initialize the app - App.jsx will handle license checking
//   initializeApp();
// });

// app.on('window-all-closed', () => {
//   // Clean up license manager
//   if (licenseManager) {
//     licenseManager.destroy();
//   }
  
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (mainWindow === null) {
//     createWindow();
//   }
// });

// // Handle app updates
// autoUpdater.on('update-available', () => {
//   dialog.showMessageBox(mainWindow, {
//     type: 'info',
//     title: 'Update Available',
//     message: 'A new version is available. It will be downloaded in the background.',
//     buttons: ['OK']
//   });
// });

// autoUpdater.on('update-downloaded', () => {
//   dialog.showMessageBox(mainWindow, {
//     type: 'info',
//     title: 'Update Ready',
//     message: 'Update downloaded. The application will restart to apply the update.',
//     buttons: ['Restart Now', 'Later']
//   }).then((result) => {
//     if (result.response === 0) {
//       autoUpdater.quitAndInstall();
//     }
//   });
// });

// // Prevent multiple instances
// const gotTheLock = app.requestSingleInstanceLock();

// if (!gotTheLock) {
//   app.quit();
// } else {
//   app.on('second-instance', () => {
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore();
//       mainWindow.focus();
//     }
//   });
// }

// // Anti-debugging protection (production only)
// if (!isDev) {
//   // Disable DevTools
//   app.on('web-contents-created', (event, contents) => {
//     contents.on('devtools-opened', () => {
//       contents.closeDevTools();
//       dialog.showErrorBox(
//         'Security Warning',
//         'Developer tools are disabled in production mode.'
//       );
//     });
//   });
  
//   // Prevent debugging
//   setInterval(() => {
//     if (global.v8debug || global.debug) {
//       licenseManager.forceShutdown('Debugging detected');
//     }
//   }, 1000);
// }











// // src/main/index.js - Fixed version with focus and performance improvements
// const { app, BrowserWindow, ipcMain, dialog } = require('electron');
// const path = require('path');
// const isDev = require('electron-is-dev');
// const { autoUpdater } = require('electron-updater');
// const LicenseManager = require('./licensing/licenseManager');

// // Import database and IPC handlers
// const { initDatabase } = require('./database/init');
// const { setupAuthHandlers } = require('./ipc/auth');
// const { setupProductHandlers } = require('./ipc/products');
// const { setupSalesHandlers } = require('./ipc/sales');
// const { setupInventoryHandlers } = require('./ipc/inventory');
// const { setupCustomerHandlers } = require('./ipc/customers');
// const { setupReportsHandlers } = require('./ipc/reports');
// const { setupSettingsHandlers } = require('./ipc/settings');
// const { setupCategoryHandlers } = require('./ipc/categories');
// const { setupInvoiceHandlers } = require('./ipc/invoices');

// let mainWindow;
// let db;
// let licenseManager;

// // Initialize license manager with your actual server
// const LICENSE_SERVER_URL = 'https://licensemanager-mdkj.onrender.com';
// licenseManager = new LicenseManager(LICENSE_SERVER_URL);

// // Enable live reload for Electron in development
// if (isDev) {
//   require('electron-reload')(__dirname, {
//     electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
//     hardResetMethod: 'exit'
//   });
// }

// // Create the browser window
// function createWindow() {
//   mainWindow = new BrowserWindow({
//     width: 1400,
//     height: 900,
//     minWidth: 1200,
//     minHeight: 700,
//     webPreferences: {
//       nodeIntegration: false,
//       contextIsolation: true,
//       preload: path.join(__dirname, 'preload.js'),
//       backgroundThrottling: false, // Prevent throttling
//       webSecurity: true
//     },
//     icon: path.join(__dirname, '../assets/icon.png'),
//     frame: false,
//     backgroundColor: '#1a1a1a',
//     show: false,
//     // Add these for better window behavior
//     hasShadow: true,
//     transparent: false,
//     resizable: true,
//     movable: true,
//     minimizable: true,
//     maximizable: true,
//     closable: true,
//     focusable: true,
//     fullscreenable: true
//   });

//   // Load the app
//   mainWindow.loadURL(
//     isDev
//       ? 'http://localhost:3000'
//       : `file://${path.join(__dirname, '../build/index.html')}`
//   );

//   // Show window when ready with proper focus handling
//   mainWindow.once('ready-to-show', () => {
//     mainWindow.show();
    
//     // Force focus and make window interactive
//     mainWindow.focus();
//     mainWindow.moveTop();
    
//     // Temporary visibility toggle to ensure proper focus
//     mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
//     mainWindow.setVisibleOnAllWorkspaces(false, { visibleOnFullScreen: true });
    
//     // MAKE MAINWINDOW GLOBAL FOR IPC HANDLERS
//     global.mainWindow = mainWindow;
    
//     if (isDev) {
//       mainWindow.webContents.openDevTools();
//     }
//   });

//   // Handle window focus events to prevent freezing
//   mainWindow.on('blur', () => {
//     // If license is being activated, maintain focus
//     if (global.isLicenseActivating) {
//       setTimeout(() => {
//         if (mainWindow && !mainWindow.isDestroyed()) {
//           mainWindow.focus();
//         }
//       }, 100);
//     }
//   });

//   mainWindow.on('focus', () => {
//     // Ensure web contents are focused
//     if (mainWindow && !mainWindow.isDestroyed()) {
//       mainWindow.webContents.focus();
//     }
//   });

//   mainWindow.on('show', () => {
//     mainWindow.focus();
//   });

//   mainWindow.on('closed', () => {
//     global.mainWindow = null;
//     mainWindow = null;
//   });

//   // Handle unresponsive events
//   mainWindow.on('unresponsive', () => {
//     console.log('Window became unresponsive');
//     const choice = dialog.showMessageBoxSync(mainWindow, {
//       type: 'warning',
//       buttons: ['Reload', 'Keep Waiting'],
//       defaultId: 0,
//       message: 'The application is not responding',
//       detail: 'Would you like to reload the application?'
//     });
    
//     if (choice === 0) {
//       mainWindow.reload();
//     }
//   });

//   mainWindow.on('responsive', () => {
//     console.log('Window became responsive again');
//   });
// }

// // Initialize the main application
// async function initializeApp() {
//   try {
//     // Initialize database
//     db = await initDatabase();
    
//     // Setup IPC handlers with database instance
//     setupAuthHandlers(ipcMain, db);
//     setupProductHandlers(ipcMain, db);
//     setupSalesHandlers(ipcMain, db);
//     setupInventoryHandlers(ipcMain, db);
//     setupCustomerHandlers(ipcMain, db);
//     setupReportsHandlers(ipcMain, db);
//     setupSettingsHandlers(ipcMain, db);
//     setupCategoryHandlers(ipcMain, db);
//     setupInvoiceHandlers(ipcMain, db);

    
//     // License IPC handlers with timeout protection
//     ipcMain.handle('license:info', async () => {
//       try {
//         return await licenseManager.getStoredLicense();
//       } catch (error) {
//         console.error('Error getting license info:', error);
//         return null;
//       }
//     });
    
//     ipcMain.handle('license:activate', async (event, licenseKey) => {
//       global.isLicenseActivating = true;
      
//       try {
//         // Add a timeout to prevent indefinite blocking
//         const result = await Promise.race([
//           licenseManager.validateLicense(licenseKey),
//           new Promise((_, reject) => 
//             setTimeout(() => reject(new Error('License validation timeout')), 15000)
//           )
//         ]);
        
//         return result;
//       } catch (error) {
//         console.error('License activation error:', error);
//         if (error.message === 'License validation timeout') {
//           return { 
//             success: false, 
//             error: 'License activation is taking too long. Please check your internet connection and try again.' 
//           };
//         }
//         return { success: false, error: error.message };
//       } finally {
//         global.isLicenseActivating = false;
//       }
//     });
    
//     ipcMain.handle('license:validate', async () => {
//       try {
//         const result = await Promise.race([
//           licenseManager.checkLicense(),
//           new Promise((_, reject) => 
//             setTimeout(() => reject(new Error('License check timeout')), 10000)
//           )
//         ]);
//         return result;
//       } catch (error) {
//         console.error('License validation error:', error);
//         return { valid: false, error: error.message };
//       }
//     });
    
//     ipcMain.handle('license:deactivate', async () => {
//       try {
//         licenseManager.store.clear();
//         return { success: true };
//       } catch (error) {
//         console.error('License deactivation error:', error);
//         return { success: false, error: error.message };
//       }
//     });
    
//     // Window controls with focus handling
//     ipcMain.handle('window:minimize', () => {
//       if (mainWindow && !mainWindow.isDestroyed()) {
//         mainWindow.minimize();
//       }
//     });
    
//     ipcMain.handle('window:maximize', () => {
//       if (mainWindow && !mainWindow.isDestroyed()) {
//         if (mainWindow.isMaximized()) {
//           mainWindow.unmaximize();
//         } else {
//           mainWindow.maximize();
//         }
//       }
//     });
    
//     ipcMain.handle('window:close', () => {
//       if (mainWindow && !mainWindow.isDestroyed()) {
//         mainWindow.close();
//       }
//     });
    
//     // Auto-updater
//     if (!isDev) {
//       autoUpdater.checkForUpdatesAndNotify();
//     }
    
//     createWindow();
//   } catch (error) {
//     console.error('Failed to initialize app:', error);
//     dialog.showErrorBox('Initialization Error', 'Failed to start the application. Please try again.');
//     app.quit();
//   }
// }

// // App event handlers
// app.whenReady().then(() => {
//   // Set app user model id for Windows
//   if (process.platform === 'win32') {
//     app.setAppUserModelId('com.yourcompany.modernpos');
//   }
  
//   // Initialize the app
//   initializeApp();
// });

// app.on('window-all-closed', () => {
//   // Clean up license manager
//   if (licenseManager) {
//     licenseManager.destroy();
//   }
  
//   if (process.platform !== 'darwin') {
//     app.quit();
//   }
// });

// app.on('activate', () => {
//   if (mainWindow === null) {
//     createWindow();
//   }
// });

// // Handle app focus events
// app.on('browser-window-focus', () => {
//   if (mainWindow && !mainWindow.isDestroyed()) {
//     mainWindow.webContents.focus();
//   }
// });

// // Handle GPU process crashes
// app.on('gpu-process-crashed', (event, killed) => {
//   console.log('GPU process crashed, killed:', killed);
//   if (mainWindow && !mainWindow.isDestroyed()) {
//     mainWindow.reload();
//   }
// });

// // Handle renderer process crashes
// app.on('renderer-process-crashed', (event, webContents, killed) => {
//   console.log('Renderer process crashed, killed:', killed);
//   dialog.showErrorBox('Renderer Process Crashed', 'The application has crashed. It will restart now.');
//   app.relaunch();
//   app.quit();
// });

// // Handle app updates
// autoUpdater.on('update-available', () => {
//   if (mainWindow && !mainWindow.isDestroyed()) {
//     dialog.showMessageBox(mainWindow, {
//       type: 'info',
//       title: 'Update Available',
//       message: 'A new version is available. It will be downloaded in the background.',
//       buttons: ['OK']
//     });
//   }
// });

// autoUpdater.on('update-downloaded', () => {
//   if (mainWindow && !mainWindow.isDestroyed()) {
//     dialog.showMessageBox(mainWindow, {
//       type: 'info',
//       title: 'Update Ready',
//       message: 'Update downloaded. The application will restart to apply the update.',
//       buttons: ['Restart Now', 'Later']
//     }).then((result) => {
//       if (result.response === 0) {
//         autoUpdater.quitAndInstall();
//       }
//     });
//   }
// });

// // Prevent multiple instances
// const gotTheLock = app.requestSingleInstanceLock();

// if (!gotTheLock) {
//   app.quit();
// } else {
//   app.on('second-instance', () => {
//     if (mainWindow) {
//       if (mainWindow.isMinimized()) mainWindow.restore();
//       mainWindow.focus();
//       mainWindow.moveTop();
//     }
//   });
// }

// // Anti-debugging protection (production only with reduced frequency)
// if (!isDev && process.env.ENABLE_ANTI_DEBUG === 'true') {
//   // Only enable if explicitly set
//   setInterval(() => {
//     if (global.v8debug || global.debug) {
//       licenseManager.forceShutdown('Debugging detected');
//     }
//   }, 5000); // Increased interval to reduce CPU usage
// }

// // Disable DevTools in production
// if (!isDev) {
//   app.on('web-contents-created', (event, contents) => {
//     contents.on('devtools-opened', () => {
//       contents.closeDevTools();
//       dialog.showErrorBox(
//         'Security Warning',
//         'Developer tools are disabled in production mode.'
//       );
//     });
//   });
// }

// src/main/index.js - Complete Fixed Version
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');
const LicenseManager = require('./licensing/licenseManager');

// Import database and IPC handlers
const { initDatabase } = require('./database/init');
const { setupAuthHandlers } = require('./ipc/auth');
const { setupProductHandlers } = require('./ipc/products');
const { setupSalesHandlers } = require('./ipc/sales');
const { setupInventoryHandlers } = require('./ipc/inventory');
const { setupCustomerHandlers } = require('./ipc/customers');
const { setupReportsHandlers } = require('./ipc/reports');
const { setupSettingsHandlers } = require('./ipc/settings');
const { setupCategoryHandlers } = require('./ipc/categories');
const { setupInvoiceHandlers } = require('./ipc/invoices');

let mainWindow;
let db;
let licenseManager;

// Initialize license manager with your actual server
const LICENSE_SERVER_URL = 'https://licensemanager-mdkj.onrender.com';
licenseManager = new LicenseManager(LICENSE_SERVER_URL);

// Enable live reload for Electron in development
if (isDev) {
  require('electron-reload')(__dirname, {
    electron: path.join(__dirname, '..', '..', 'node_modules', '.bin', 'electron'),
    hardResetMethod: 'exit'
  });
}

// Create the browser window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false, // IMPORTANT: Prevent throttling
      webSecurity: true
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    frame: false,
    backgroundColor: '#1a1a1a',
    show: false,
    // Add these for better window behavior
    hasShadow: true,
    transparent: false,
    resizable: true,
    movable: true,
    minimizable: true,
    maximizable: true,
    closable: true,
    focusable: true,
    fullscreenable: true,
    alwaysOnTop: false, // Important: set to false
    skipTaskbar: false  // Important: show in taskbar
  });

  // CRITICAL FIX: Handle window message on Windows for frameless windows
  if (process.platform === 'win32') {
    mainWindow.hookWindowMessage(278, () => {
      mainWindow.setEnabled(false);
      mainWindow.setEnabled(true);
      return 0;
    });
  }

  // Load the app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Show window when ready with proper focus handling
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Force focus and make window interactive
    mainWindow.focus();
    mainWindow.moveTop();
    
    // CRITICAL: Force input focus for frameless windows
    mainWindow.webContents.focus();
    
    // Ensure window stays interactive
    mainWindow.setEnabled(true);
    
    // MAKE MAINWINDOW GLOBAL FOR IPC HANDLERS
    global.mainWindow = mainWindow;
    
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  // CRITICAL: Maintain focus during input
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if ((input.type === 'keyDown' || input.type === 'keyUp') && !mainWindow.isFocused()) {
      mainWindow.focus();
    }
  });

  // Handle blur events
  mainWindow.on('blur', () => {
    // If license is being activated, maintain focus
    if (global.isLicenseActivating) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.focus();
          mainWindow.webContents.focus();
        }
      }, 10);
    }
  });

  mainWindow.on('focus', () => {
    // Ensure web contents are focused
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.focus();
    }
  });

  mainWindow.on('closed', () => {
    global.mainWindow = null;
    mainWindow = null;
  });

  // Handle unresponsive events
  mainWindow.on('unresponsive', () => {
    console.log('Window became unresponsive');
    // Try to recover
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.reload();
    }
  });

  mainWindow.on('responsive', () => {
    console.log('Window became responsive again');
  });
}

// Initialize the main application
async function initializeApp() {
  try {
    // Initialize database
    db = await initDatabase();
    
    // Setup IPC handlers with database instance
    setupAuthHandlers(ipcMain, db);
    setupProductHandlers(ipcMain, db);
    setupSalesHandlers(ipcMain, db);
    setupInventoryHandlers(ipcMain, db);
    setupCustomerHandlers(ipcMain, db);
    setupReportsHandlers(ipcMain, db);
    setupSettingsHandlers(ipcMain, db);
    setupCategoryHandlers(ipcMain, db);
    setupInvoiceHandlers(ipcMain, db);

    
    // License IPC handlers with non-blocking execution
    ipcMain.handle('license:info', async () => {
      try {
        // Process in next tick to prevent blocking
        return await new Promise((resolve) => {
          process.nextTick(async () => {
            try {
              const result = await licenseManager.getStoredLicense();
              resolve(result);
            } catch (error) {
              console.error('Error getting license info:', error);
              resolve(null);
            }
          });
        });
      } catch (error) {
        console.error('Error getting license info:', error);
        return null;
      }
    });
    
    ipcMain.handle('license:activate', async (event, licenseKey) => {
      global.isLicenseActivating = true;
      
      // Force window focus during activation
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.focus();
        mainWindow.webContents.focus();
        mainWindow.setEnabled(true); // Ensure window is enabled
      }
      
      try {
        // Process in next tick to prevent blocking
        const result = await new Promise((resolve) => {
          process.nextTick(async () => {
            try {
              // Add timeout to prevent hanging
              const activationResult = await Promise.race([
                licenseManager.validateLicense(licenseKey),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('License validation timeout')), 20000)
                )
              ]);
              resolve(activationResult);
            } catch (error) {
              console.error('License activation error:', error);
              if (error.message === 'License validation timeout') {
                resolve({ 
                  success: false, 
                  error: 'License activation is taking too long. Please check your internet connection and try again.' 
                });
              } else {
                resolve({ success: false, error: error.message });
              }
            }
          });
        });
        
        return result;
      } catch (error) {
        console.error('License activation error:', error);
        return { success: false, error: error.message };
      } finally {
        global.isLicenseActivating = false;
        // Ensure window remains interactive
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.setEnabled(true);
          mainWindow.focus();
        }
      }
    });
    
    ipcMain.handle('license:validate', async () => {
      try {
        // Process in next tick to prevent blocking
        return await new Promise((resolve) => {
          process.nextTick(async () => {
            try {
              const result = await Promise.race([
                licenseManager.checkLicense(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('License check timeout')), 10000)
                )
              ]);
              resolve(result);
            } catch (error) {
              console.error('License validation error:', error);
              resolve({ valid: false, error: error.message });
            }
          });
        });
      } catch (error) {
        console.error('License validation error:', error);
        return { valid: false, error: error.message };
      }
    });
    
    ipcMain.handle('license:deactivate', async () => {
      try {
        return await new Promise((resolve) => {
          process.nextTick(() => {
            try {
              licenseManager.store.clear();
              resolve({ success: true });
            } catch (error) {
              console.error('License deactivation error:', error);
              resolve({ success: false, error: error.message });
            }
          });
        });
      } catch (error) {
        console.error('License deactivation error:', error);
        return { success: false, error: error.message };
      }
    });
    
    // Window controls
    ipcMain.handle('window:minimize', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.minimize();
      }
    });
    
    ipcMain.handle('window:maximize', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMaximized()) {
          mainWindow.unmaximize();
        } else {
          mainWindow.maximize();
        }
      }
    });
    
    ipcMain.handle('window:close', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.close();
      }
    });
    
    // Auto-updater
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
    
    createWindow();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    dialog.showErrorBox('Initialization Error', 'Failed to start the application. Please try again.');
    app.quit();
  }
}

// App event handlers
app.whenReady().then(() => {
  // Set app user model id for Windows
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.yourcompany.modernpos');
  }
  
  // Initialize the app
  initializeApp();
});

app.on('window-all-closed', () => {
  // Clean up license manager
  if (licenseManager) {
    licenseManager.destroy();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app focus events
app.on('browser-window-focus', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.focus();
  }
});

// Handle GPU process crashes
app.on('gpu-process-crashed', (event, killed) => {
  console.log('GPU process crashed, killed:', killed);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.reload();
  }
});

// Handle renderer process crashes
app.on('renderer-process-crashed', (event, webContents, killed) => {
  console.log('Renderer process crashed, killed:', killed);
  dialog.showErrorBox('Renderer Process Crashed', 'The application has crashed. It will restart now.');
  app.relaunch();
  app.quit();
});

// Handle app updates
autoUpdater.on('update-available', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Available',
      message: 'A new version is available. It will be downloaded in the background.',
      buttons: ['OK']
    });
  }
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'Update Ready',
      message: 'Update downloaded. The application will restart to apply the update.',
      buttons: ['Restart Now', 'Later']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall();
      }
    });
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.moveTop();
    }
  });
}

// Anti-debugging protection (production only) - REDUCED FREQUENCY
if (!isDev && process.env.ENABLE_ANTI_DEBUG === 'true') {
  setInterval(() => {
    if (global.v8debug || global.debug) {
      licenseManager.forceShutdown('Debugging detected');
    }
  }, 5000); // Increased to 5 seconds to reduce CPU usage
}

// Disable DevTools in production
if (!isDev) {
  app.on('web-contents-created', (event, contents) => {
    contents.on('devtools-opened', () => {
      contents.closeDevTools();
      dialog.showErrorBox(
        'Security Warning',
        'Developer tools are disabled in production mode.'
      );
    });
  });
}