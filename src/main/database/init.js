const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const { app } = require('electron');

// Get the user data path for storing the database
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'pos_database.db');

// Ensure the directory exists
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

function initDatabase() {
  const db = new Database(dbPath);
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON');
  
  // Create tables
  db.exec(`
    -- Users table for authentication
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      pin TEXT,
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      role TEXT NOT NULL CHECK(role IN ('admin', 'manager', 'cashier')),
      is_active INTEGER DEFAULT 1,
      last_login DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Products table
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT UNIQUE NOT NULL,
      barcode TEXT UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      unit_price DECIMAL(10,2) NOT NULL,
      cost_price DECIMAL(10,2),
      tax_rate DECIMAL(5,2) DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      track_inventory INTEGER DEFAULT 1,
      low_stock_threshold INTEGER DEFAULT 10,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    -- Categories table
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      parent_id INTEGER,
      display_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    );

    -- Inventory table
    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      reserved_quantity INTEGER DEFAULT 0,
      reorder_point INTEGER,
      reorder_quantity INTEGER,
      last_restock_date DATETIME,
      expiry_date DATE,
      batch_number TEXT,
      location TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Customers table
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_code TEXT UNIQUE NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      address TEXT,
      city TEXT,
      postal_code TEXT,
      country TEXT DEFAULT 'Kenya',
      date_of_birth DATE,
      loyalty_points INTEGER DEFAULT 0,
      credit_limit DECIMAL(10,2) DEFAULT 0,
      outstanding_balance DECIMAL(10,2) DEFAULT 0,
      customer_group TEXT DEFAULT 'regular',
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Sales table
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      user_id INTEGER NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) NOT NULL,
      payment_status TEXT CHECK(payment_status IN ('paid', 'partial', 'pending', 'refunded')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Sale items table
    CREATE TABLE IF NOT EXISTS sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );

    -- Payments table
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id INTEGER NOT NULL,
      payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'mpesa', 'bank_transfer', 'credit')),
      amount DECIMAL(10,2) NOT NULL,
      reference_number TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE
    );

    -- Suppliers table
    CREATE TABLE IF NOT EXISTS suppliers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      country TEXT DEFAULT 'Kenya',
      payment_terms TEXT,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Purchase orders table
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      supplier_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      status TEXT CHECK(status IN ('draft', 'sent', 'partial', 'received', 'cancelled')),
      total_amount DECIMAL(10,2),
      notes TEXT,
      order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      expected_date DATE,
      received_date DATETIME,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Stock movements table
    CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      movement_type TEXT NOT NULL CHECK(movement_type IN ('in', 'out', 'adjustment', 'transfer')),
      quantity INTEGER NOT NULL,
      reference_type TEXT,
      reference_id INTEGER,
      reason TEXT,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT,
      description TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Session table for authentication
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Activity logs table
    CREATE TABLE IF NOT EXISTS activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
    CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    CREATE INDEX IF NOT EXISTS idx_sales_invoice ON sales(invoice_number);
    CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at);
    CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
    CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
    CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
  `);
// Add after existing tables
db.exec(`
  -- Time tracking table
  CREATE TABLE IF NOT EXISTS time_tracking (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME,
    break_minutes INTEGER DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Purchase order items table
  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    FOREIGN KEY (order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
  );

  -- Loyalty transactions table
  CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    points INTEGER NOT NULL,
    balance_after INTEGER NOT NULL,
    reason TEXT,
    user_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- Customer communications table
  CREATE TABLE IF NOT EXISTS customer_communications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    type TEXT CHECK(type IN ('email', 'sms')),
    subject TEXT,
    message TEXT NOT NULL,
    sent_by INTEGER NOT NULL,
    sent_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (sent_by) REFERENCES users(id)
  );
`);
db.exec(`
  -- Add this to your existing database init script (init.js)

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  invoice_date DATE NOT NULL,
  due_date DATE,
  payment_terms TEXT DEFAULT '30',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 16,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),
  notes TEXT,
  terms_conditions TEXT,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  product_id INTEGER,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Invoice payments table (for partial payments)
CREATE TABLE IF NOT EXISTS invoice_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'card', 'mpesa', 'bank_transfer', 'check', 'other')),
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  reference_number TEXT,
  notes TEXT,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Invoice email logs table
CREATE TABLE IF NOT EXISTS invoice_email_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_id INTEGER NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'sent' CHECK(status IN ('sent', 'failed', 'bounced')),
  error_message TEXT,
  user_id INTEGER NOT NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Invoice recurring templates table (for recurring invoices)
CREATE TABLE IF NOT EXISTS invoice_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name TEXT NOT NULL,
  customer_id INTEGER,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  payment_terms TEXT DEFAULT '30',
  tax_rate DECIMAL(5,2) DEFAULT 16,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  terms_conditions TEXT,
  recurrence_pattern TEXT CHECK(recurrence_pattern IN ('monthly', 'quarterly', 'semi-annually', 'annually')),
  next_invoice_date DATE,
  is_active INTEGER DEFAULT 1,
  user_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Invoice template items table
CREATE TABLE IF NOT EXISTS invoice_template_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_id INTEGER NOT NULL,
  product_id INTEGER,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  FOREIGN KEY (template_id) REFERENCES invoice_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_product ON invoice_items(product_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_invoice ON invoice_payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_payments_date ON invoice_payments(payment_date);

-- Triggers for automatic calculations and updates

-- Trigger to update invoice totals when items change
CREATE TRIGGER IF NOT EXISTS update_invoice_totals_on_item_change
AFTER INSERT ON invoice_items
BEGIN
  UPDATE invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0) 
      FROM invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    tax_amount = (
      SELECT COALESCE(SUM(total_price), 0) * tax_rate / 100
      FROM invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    total_amount = (
      SELECT 
        COALESCE(SUM(total_price), 0) + 
        (COALESCE(SUM(total_price), 0) * tax_rate / 100) - 
        discount_amount
      FROM invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.invoice_id;
END;

-- Trigger to update invoice totals when items are updated
CREATE TRIGGER IF NOT EXISTS update_invoice_totals_on_item_update
AFTER UPDATE ON invoice_items
BEGIN
  UPDATE invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0) 
      FROM invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    tax_amount = (
      SELECT COALESCE(SUM(total_price), 0) * tax_rate / 100
      FROM invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    total_amount = (
      SELECT 
        COALESCE(SUM(total_price), 0) + 
        (COALESCE(SUM(total_price), 0) * tax_rate / 100) - 
        discount_amount
      FROM invoice_items 
      WHERE invoice_id = NEW.invoice_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.invoice_id;
END;

-- Trigger to update invoice totals when items are deleted
CREATE TRIGGER IF NOT EXISTS update_invoice_totals_on_item_delete
AFTER DELETE ON invoice_items
BEGIN
  UPDATE invoices 
  SET 
    subtotal = (
      SELECT COALESCE(SUM(total_price), 0) 
      FROM invoice_items 
      WHERE invoice_id = OLD.invoice_id
    ),
    tax_amount = (
      SELECT COALESCE(SUM(total_price), 0) * tax_rate / 100
      FROM invoice_items 
      WHERE invoice_id = OLD.invoice_id
    ),
    total_amount = (
      SELECT 
        COALESCE(SUM(total_price), 0) + 
        (COALESCE(SUM(total_price), 0) * tax_rate / 100) - 
        discount_amount
      FROM invoice_items 
      WHERE invoice_id = OLD.invoice_id
    ),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.invoice_id;
END;

-- Trigger to automatically update invoice status based on due date
CREATE TRIGGER IF NOT EXISTS auto_update_overdue_status
AFTER UPDATE OF due_date ON invoices
WHEN NEW.due_date < date('now') AND NEW.status = 'pending'
BEGIN
  UPDATE invoices 
  SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

-- View for invoice summaries with calculated fields
CREATE VIEW IF NOT EXISTS invoice_summary AS
SELECT 
  i.*,
  c.first_name || ' ' || c.last_name as full_customer_name,
  c.email as customer_email_from_customer,
  c.phone as customer_phone_from_customer,
  (SELECT COUNT(*) FROM invoice_items WHERE invoice_id = i.id) as item_count,
  (SELECT COALESCE(SUM(payment_amount), 0) FROM invoice_payments WHERE invoice_id = i.id) as total_paid,
  (i.total_amount - COALESCE((SELECT SUM(payment_amount) FROM invoice_payments WHERE invoice_id = i.id), 0)) as balance_due,
  CASE 
    WHEN i.due_date IS NULL THEN 'No due date'
    WHEN i.due_date < date('now') AND i.status = 'pending' THEN 'Overdue'
    WHEN i.due_date = date('now') AND i.status = 'pending' THEN 'Due today'
    WHEN i.due_date > date('now') AND i.status = 'pending' THEN 'Upcoming'
    ELSE i.status
  END as payment_status_display,
  julianday(i.due_date) - julianday('now') as days_until_due
FROM invoices i
LEFT JOIN customers c ON i.customer_id = c.id;

  
  `)
  // Insert default settings
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO settings (key, value, description) 
    VALUES (?, ?, ?)
  `);

  const defaultSettings = [
    ['business_name', 'My POS Store', 'Business name displayed on receipts'],
    ['business_address', '123 Main Street, Nairobi', 'Business address for receipts'],
    ['business_phone', '+254 700 000000', 'Business contact number'],
    ['business_email', 'info@mystore.com', 'Business email address'],
    ['tax_number', 'P000000000X', 'Tax registration number'],
    ['currency', 'KES', 'Default currency'],
    ['tax_rate', '16', 'Default tax rate percentage'],
    ['receipt_footer', 'Thank you for your business!', 'Receipt footer message'],
    ['low_stock_alert', '10', 'Low stock threshold'],
    ['session_timeout', '30', 'Session timeout in minutes'],
    ['enable_loyalty', '1', 'Enable customer loyalty program'],
    ['loyalty_points_rate', '1', 'Points earned per 100 currency spent'],
    ['enable_sound', '1', 'Enable sound notifications'],
    ['receipt_printer', '', 'Default receipt printer name'],
    ['barcode_scanner', '', 'Barcode scanner device'],
    ['cash_drawer', '', 'Cash drawer device']
  ];

  defaultSettings.forEach(([key, value, description]) => {
    insertSetting.run(key, value, description);
  });

  // Create default admin user if none exists
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  
  if (userCount === 0) {
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    const hashedPin = bcrypt.hashSync('1234', 10);
    
    db.prepare(`
      INSERT INTO users (username, password, pin, full_name, email, role) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('admin', hashedPassword, hashedPin, 'System Administrator', 'admin@pos.com', 'admin');
    
   
  }

  // Create sample categories
  const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
  
  if (categoryCount === 0) {
    const insertCategory = db.prepare(`
      INSERT INTO categories (name, description, display_order) 
      VALUES (?, ?, ?)
    `);
    
    const categories = [
      ['Electronics', 'Electronic devices and accessories', 1],
      ['Groceries', 'Food and beverages', 2],
      ['Clothing', 'Apparel and accessories', 3],
      ['Home & Garden', 'Home improvement and garden supplies', 4],
      ['Health & Beauty', 'Personal care and health products', 5]
    ];
    
    categories.forEach(([name, description, order]) => {
      insertCategory.run(name, description, order);
    });
  }

  return db;
}

module.exports = { initDatabase };