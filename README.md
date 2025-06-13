# Modern POS System

A comprehensive, production-ready Point of Sale system built with Electron, React, and SQLite. This system provides all essential features for retail and restaurant businesses with a modern, intuitive interface.

## Features

### Core Functionality

* **Secure Authentication** : Multi-user support with role-based access (Admin, Manager, Cashier)
* **Quick PIN Access** : Fast user switching for busy retail environments
* **Product Management** : Complete inventory tracking with barcode support
* **Sales Processing** : Fast checkout with multiple payment methods
* **Customer Management** : Loyalty programs and credit accounts
* **Comprehensive Reporting** : Real-time analytics and insights
* **Offline Support** : Works without internet, syncs when connected
* **Multi-store Ready** : Manage multiple locations

### Technical Features

* **Secure Architecture** : Main/Renderer process separation
* **SQLite Database** : Fast, reliable local storage
* **Auto-updates** : Built-in update mechanism
* **Hardware Integration** : Receipt printers, cash drawers, barcode scanners
* **Data Export** : Excel/CSV export for all reports
* **Backup & Restore** : Automated backup system

## Prerequisites

* Node.js 16+ and npm
* Python (for node-gyp to build native modules)
* Build tools for your platform:
  * **Windows** : Windows Build Tools or Visual Studio
  * **macOS** : Xcode Command Line Tools
  * **Linux** : build-essential package

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourcompany/pos-system.git
cd pos-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**
   Create a `.env` file in the root directory:

```env
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

4. **Initialize the database**
   The database will be automatically created on first run with:

* Default admin user (username: admin, password: admin123)
* Sample categories
* Default settings

## Development

### Running in Development Mode

```bash
npm start
```

This will:

* Start the React development server on port 3000
* Launch Electron in development mode
* Enable hot reloading for both React and Electron

### Project Structure

```
pos-system/
├── src/
│   ├── main/                 # Electron main process
│   │   ├── database/         # SQLite database layer
│   │   ├── ipc/            # IPC handlers for all modules
│   │   └── utils/          # Utility functions
│   ├── renderer/           # React frontend
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── store/         # State management (Zustand)
│   │   └── services/      # API service layer
│   └── shared/            # Shared types and constants
├── assets/                # Icons and images
├── build/                # React build output
└── dist/                 # Electron build output
```

### Key Technologies

* **Frontend** : React 18, Tailwind CSS, Zustand
* **Backend** : Electron main process with IPC communication
* **Database** : SQLite with better-sqlite3
* **Authentication** : JWT with bcrypt
* **Forms** : React Hook Form with Zod validation
* **Tables** : TanStack Table
* **Charts** : Recharts
* **Icons** : Lucide React

## Building for Production

### Build for all platforms

```bash
npm run dist
```

### Platform-specific builds

```bash
npm run dist:win    # Windows
npm run dist:mac    # macOS
npm run dist:linux  # Linux
```

### Build Configuration

The build configuration is in `package.json` under the `build` section. Key settings:

* **App ID** : `com.yourcompany.pos`
* **Product Name** : Modern POS
* **Auto-updater** : Configured for all platforms
* **Code Signing** : Add certificates for production builds

## Database Schema

### Main Tables

* `users` - System users and authentication
* `products` - Product catalog
* `categories` - Product categories
* `inventory` - Stock levels and tracking
* `customers` - Customer information
* `sales` - Transaction records
* `sale_items` - Transaction line items
* `payments` - Payment records
* `suppliers` - Vendor management
* `settings` - System configuration

## Hardware Setup

### Receipt Printer

1. Install printer drivers
2. Configure in Settings > Hardware
3. Set as default receipt printer

### Barcode Scanner

Most USB barcode scanners work as keyboard input. No special configuration needed.

### Cash Drawer

Connect via receipt printer or USB. Configure trigger in Settings > Hardware.

## Security Considerations

1. **Change default credentials** immediately after installation
2. **Set strong JWT secret** in production
3. **Enable auto-logout** for inactive sessions
4. **Regular backups** to secure location
5. **Encrypt sensitive data** in database

## API Documentation

### Authentication

```javascript
// Login
const result = await window.api.auth.login({ 
  username: 'admin', 
  password: 'password' 
});

// PIN Login
const result = await window.api.auth.pinLogin({ 
  userId: 1, 
  pin: '1234' 
});
```

### Products

```javascript
// Get all products
const { products } = await window.api.products.getAll({ 
  category_id: 1,
  search: 'laptop',
  limit: 20,
  offset: 0 
});

// Create product
const result = await window.api.products.create({
  sku: 'PROD001',
  name: 'Product Name',
  unit_price: 1000,
  category_id: 1
});
```

### Sales

```javascript
// Create sale
const result = await window.api.sales.create({
  customer_id: 1,
  items: [
    { product_id: 1, quantity: 2, unit_price: 1000 }
  ],
  payment_method: 'cash',
  amount_paid: 2000
});
```

## Troubleshooting

### Common Issues

1. **Native module errors**
   ```bash
   npm rebuild better-sqlite3 --build-from-source
   ```
2. **Electron version mismatch**
   ```bash
   npx electron-rebuild
   ```
3. **Permission errors on Linux**
   ```bash
   sudo chmod 755 /path/to/app
   ```

### Debug Mode

Set environment variable for verbose logging:

```bash
DEBUG=electron:* npm start
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License. See LICENSE file for details.

## Support

* Documentation: [docs.yourcompany.com](https://docs.yourcompany.com/)
* Issues: [GitHub Issues](https://github.com/yourcompany/pos-system/issues)
* Email: support@yourcompany.com

## Changelog

### Version 1.0.0

* Initial release
* Core POS functionality
* Multi-user support
* Inventory management
* Sales processing
* Basic reporting

---

Built with ❤️ by Your Company
