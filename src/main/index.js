const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { autoUpdater } = require('electron-updater');

// Import database and IPC handlers
const { initDatabase } = require('./database/init');
const { setupAuthHandlers } = require('./ipc/auth');
const { setupProductHandlers } = require('./ipc/products');
const { setupSalesHandlers } = require('./ipc/sales');
const { setupInventoryHandlers } = require('./ipc/inventory');
const { setupCustomerHandlers } = require('./ipc/customers');
const { setupReportsHandlers } = require('./ipc/reports');
const { setupSettingsHandlers } = require('./ipc/settings');
const {setupCategoryHandlers}=require('./ipc/categories');
let mainWindow;
let db;

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
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    frame: false, // Custom title bar
    backgroundColor: '#1a1a1a',
    show: false
  });

  // Load the app
  mainWindow.loadURL(
    isDev
      ? 'http://localhost:3000'
      : `file://${path.join(__dirname, '../build/index.html')}`
  );

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    if (isDev) {
      mainWindow.webContents.openDevTools();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App event handlers
app.whenReady().then(async () => {
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
    setupCategoryHandlers(ipcMain,db);
    
    // Window controls
    ipcMain.handle('window:minimize', () => {
      mainWindow.minimize();
    });
    
    ipcMain.handle('window:maximize', () => {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    });
    
    ipcMain.handle('window:close', () => {
      mainWindow.close();
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
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle app updates
autoUpdater.on('update-available', () => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: 'A new version is available. It will be downloaded in the background.',
    buttons: ['OK']
  });
});

autoUpdater.on('update-downloaded', () => {
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
    }
  });
}