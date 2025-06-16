const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close')
  },

  // Authentication
  auth: {
    login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    pinLogin: (data) => ipcRenderer.invoke('auth:pinLogin', data),
    logout: (data) => ipcRenderer.invoke('auth:logout', data),
    verifySession: (data) => ipcRenderer.invoke('auth:verifySession', data),
    changePassword: (data) => ipcRenderer.invoke('auth:changePassword', data),
    setPin: (data) => ipcRenderer.invoke('auth:setPin', data),
    getUsers: (data) => ipcRenderer.invoke('auth:getUsers', data),
    createUser: (data) => ipcRenderer.invoke('auth:createUser', data),
    updateUser: (data) => ipcRenderer.invoke('auth:updateUser', data),
    clockInOut: (data) => ipcRenderer.invoke('auth:clockInOut', data)
  },

  // Products
  products: {
    getAll: (filters) => ipcRenderer.invoke('products:getAll', filters),
    getById: (id) => ipcRenderer.invoke('products:getById', id),
    create: (product) => ipcRenderer.invoke('products:create', product),
    update: (id, updates) => ipcRenderer.invoke('products:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('products:delete', id),
    search: (query) => ipcRenderer.invoke('products:search', query),
    getByBarcode: (barcode) => ipcRenderer.invoke('products:getByBarcode', barcode),
    importBulk: (data) => ipcRenderer.invoke('products:importBulk', data),
    exportAll: () => ipcRenderer.invoke('products:exportAll')
  },

  // Categories
categories: {
    getAll: () => ipcRenderer.invoke('categories:getAll'),
    getById: (id) => ipcRenderer.invoke('categories:getById', id),
    create: (category) => ipcRenderer.invoke('categories:create', category),
    update: (id, updates) => ipcRenderer.invoke('categories:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('categories:delete', id),
    reorder: (categoryOrders) => ipcRenderer.invoke('categories:reorder', { categoryOrders }),
    getTree: () => ipcRenderer.invoke('categories:getTree'),
    moveProducts: (productIds, targetCategoryId) => ipcRenderer.invoke('categories:moveProducts', { productIds, targetCategoryId }),
    getStats: () => ipcRenderer.invoke('categories:getStats')
  },

// Sales
  sales: {
    create: (sale) => ipcRenderer.invoke('sales:create', sale),
    getById: (id) => ipcRenderer.invoke('sales:getById', id),
    getRecent: (limit) => ipcRenderer.invoke('sales:getRecent', limit),
    getByDateRange: (startDate, endDate) => ipcRenderer.invoke('sales:getByDateRange', { startDate, endDate }),
    void: (id, reason) => ipcRenderer.invoke('sales:void', { id, reason }),
    return: (saleId, items, reason) => ipcRenderer.invoke('sales:return', { saleId, items, reason }),
    getDailySummary: (date) => ipcRenderer.invoke('sales:getDailySummary', date),
    getAnalytics: (params) => ipcRenderer.invoke('sales:getAnalytics', params),
    getPaymentBreakdown: (params) => ipcRenderer.invoke('sales:getPaymentBreakdown', params),
    getHourlyPattern: (params) => ipcRenderer.invoke('sales:getHourlyPattern', params),
    getCashierPerformance: (params) => ipcRenderer.invoke('sales:getCashierPerformance', params),
    getTopCustomers: (params) => ipcRenderer.invoke('sales:getTopCustomers', params)
  },

  // Inventory
inventory: {
    getStock: (productId) => ipcRenderer.invoke('inventory:getStock', productId),
    updateStock: (productId, quantity, reason) => ipcRenderer.invoke('inventory:updateStock', { productId, quantity, reason }),
    getLowStock: () => ipcRenderer.invoke('inventory:getLowStock'),
    getStockMovements: (params) => ipcRenderer.invoke('inventory:getStockMovements', params),
    transferStock: (data) => ipcRenderer.invoke('inventory:transferStock', data),
    adjustStock: (adjustments) => ipcRenderer.invoke('inventory:adjustStock', adjustments)
  },

  // Customers
// In your preload.js file, update the customers section to include getAnalytics:

// Customers
customers: {
  getAll: (filters) => ipcRenderer.invoke('customers:getAll', filters),
  getById: (id) => ipcRenderer.invoke('customers:getById', id),
  create: (customer) => ipcRenderer.invoke('customers:create', customer),
  update: (id, updates) => ipcRenderer.invoke('customers:update', { id, updates }),
  delete: (id) => ipcRenderer.invoke('customers:delete', id),
  search: (query) => ipcRenderer.invoke('customers:search', query),
  getTransactions: (customerId, limit) => ipcRenderer.invoke('customers:getTransactions', { customerId, limit }),
  updateLoyaltyPoints: (customerId, points, reason) => ipcRenderer.invoke('customers:updateLoyaltyPoints', { customerId, points, reason }),
  getCreditBalance: (customerId) => ipcRenderer.invoke('customers:getCreditBalance', customerId),
  // Add this line:
  getAnalytics: (params) => ipcRenderer.invoke('reports:getCustomerAnalytics', params)
},

  // Reports
  reports: {
    getSalesReport: (params) => ipcRenderer.invoke('reports:getSalesReport', params),
    getInventoryReport: (params) => ipcRenderer.invoke('reports:getInventoryReport', params),
    getProductPerformance: (params) => ipcRenderer.invoke('reports:getProductPerformance', params),
    getStaffPerformance: (params) => ipcRenderer.invoke('reports:getStaffPerformance', params),
    getCustomerAnalytics: (params) => ipcRenderer.invoke('reports:getCustomerAnalytics', params),
    getProfitMargins: (params) => ipcRenderer.invoke('reports:getProfitMargins', params),
    exportReport: (type, params, format) => ipcRenderer.invoke('reports:exportReport', { type, params, format })
  },

  // Settings
  settings: {
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    get: (key) => ipcRenderer.invoke('settings:get', key),
    update: (key, value) => ipcRenderer.invoke('settings:update', { key, value }),
    bulkUpdate: (settings) => ipcRenderer.invoke('settings:bulkUpdate', settings),
    getBusinessInfo: () => ipcRenderer.invoke('settings:getBusinessInfo'),
    updateBusinessInfo: (info) => ipcRenderer.invoke('settings:updateBusinessInfo', info),
    backup: () => ipcRenderer.invoke('settings:backup'),
    restore: (backupPath) => ipcRenderer.invoke('settings:restore', backupPath)
  },

  // Suppliers
  suppliers: {
    getAll: () => ipcRenderer.invoke('suppliers:getAll'),
    getById: (id) => ipcRenderer.invoke('suppliers:getById', id),
    create: (supplier) => ipcRenderer.invoke('suppliers:create', supplier),
    update: (id, updates) => ipcRenderer.invoke('suppliers:update', { id, updates }),
    delete: (id) => ipcRenderer.invoke('suppliers:delete', id)
  },

  // Purchase Orders
  purchaseOrders: {
    create: (order) => ipcRenderer.invoke('purchaseOrders:create', order),
    getAll: (filters) => ipcRenderer.invoke('purchaseOrders:getAll', filters),
    getById: (id) => ipcRenderer.invoke('purchaseOrders:getById', id),
    update: (id, updates) => ipcRenderer.invoke('purchaseOrders:update', { id, updates }),
    receive: (id, items) => ipcRenderer.invoke('purchaseOrders:receive', { id, items }),
    cancel: (id, reason) => ipcRenderer.invoke('purchaseOrders:cancel', { id, reason })
  },

  // Printing
  print: {
    receipt: (data) => ipcRenderer.invoke('print:receipt', data),
    report: (data) => ipcRenderer.invoke('print:report', data),
    barcode: (data) => ipcRenderer.invoke('print:barcode', data),
    getPrinters: () => ipcRenderer.invoke('print:getPrinters'),
    testPrint: (printer) => ipcRenderer.invoke('print:testPrint', printer)
  },

  // Hardware
  hardware: {
    openCashDrawer: () => ipcRenderer.invoke('hardware:openCashDrawer'),
    getDevices: () => ipcRenderer.invoke('hardware:getDevices'),
    testDevice: (device) => ipcRenderer.invoke('hardware:testDevice', device)
  },

  // Activity Logs
  logs: {
    getRecent: (limit) => ipcRenderer.invoke('logs:getRecent', limit),
    getByUser: (userId, limit) => ipcRenderer.invoke('logs:getByUser', { userId, limit }),
    getByEntity: (entityType, entityId) => ipcRenderer.invoke('logs:getByEntity', { entityType, entityId }),
    search: (query) => ipcRenderer.invoke('logs:search', query)
  },
// license
    license: {
    activate: (licenseKey) => ipcRenderer.invoke('license:activate', licenseKey),
    info: () => ipcRenderer.invoke('license:info'),
    validate: () => ipcRenderer.invoke('license:validate'),
    deactivate: () => ipcRenderer.invoke('license:deactivate')
  },
// Add this inside the existing window.api object
invoices: {
  getAll: (filters) => ipcRenderer.invoke('invoices:getAll', filters),
  getById: (id) => ipcRenderer.invoke('invoices:getById', id),
  create: (invoice) => ipcRenderer.invoke('invoices:create', invoice),
  update: (id, updates) => ipcRenderer.invoke('invoices:update', { id, updates }),
  delete: (id) => ipcRenderer.invoke('invoices:delete', id),
  generateNumber: () => ipcRenderer.invoke('invoices:generateNumber'),
  generatePDF: (invoiceData) => ipcRenderer.invoke('invoices:generatePDF', invoiceData),
  sendEmail: (invoiceId) => ipcRenderer.invoke('invoices:sendEmail', invoiceId),
},

  // File operations
  file: {
    selectFile: (options) => ipcRenderer.invoke('file:selectFile', options),
    saveFile: (data, options) => ipcRenderer.invoke('file:saveFile', { data, options }),
    readFile: (path) => ipcRenderer.invoke('file:readFile', path)
  }
});