// quick-start.js
// One-click setup script for the license server
// Run: node quick-start.js

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 POS License Server Quick Setup\n');

// Check if package.json exists
if (!fs.existsSync('package.json')) {
  console.log('Creating package.json...');
  fs.writeFileSync('package.json', JSON.stringify({
    "name": "pos-license-server-sqlite",
    "version": "1.0.0",
    "description": "Simple SQLite-based license server for POS system",
    "main": "license-server-sqlite.js",
    "scripts": {
      "start": "node license-server-sqlite.js",
      "dev": "nodemon license-server-sqlite.js",
      "cli": "node license-manager.js",
      "quick": "node license-manager.js quick",
      "test": "node test-server.js"
    },
    "dependencies": {
      "express": "^4.18.2",
      "sqlite3": "^5.1.6",
      "cors": "^2.8.5",
      "uuid": "^9.0.0",
      "express-rate-limit": "^6.7.0",
      "axios": "^1.4.0"
    },
    "devDependencies": {
      "nodemon": "^2.0.22"
    }
  }, null, 2));
}

// Install dependencies
console.log('Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to install dependencies. Please run: npm install');
  process.exit(1);
}

// Create .env file
console.log('\nCreating .env file...');
const envContent = `# License Server Configuration
PORT=3001
NODE_ENV=development

# Optional: Change these for production
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
`;

fs.writeFileSync('.env', envContent);

// Create .gitignore
console.log('Creating .gitignore...');
const gitignoreContent = `node_modules/
data/
*.db
*.log
.env
licenses_export_*.csv
batch_licenses_*.csv
license_*.txt
.DS_Store
`;

fs.writeFileSync('.gitignore', gitignoreContent);

// Create README
console.log('Creating README.md...');
const readmeContent = `# POS License Server

A simple SQLite-based license management server for your POS application.

## Quick Start

\`\`\`bash
# Start the server
npm start

# Run the CLI tool
npm run cli

# Quick generate a license
npm run quick "Customer Name" "email@example.com"
\`\`\`

## Features

- SQLite database (no setup required)
- Device fingerprinting
- License validation
- Session management
- Admin API
- CLI management tool
- Export to CSV
- Batch generation

## API Endpoints

- POST /api/licenses/create - Create new license
- POST /api/licenses/validate - Validate license
- POST /api/sessions/heartbeat - Session heartbeat
- GET /api/admin/licenses - Get all licenses
- GET /api/admin/sessions - Get active sessions
- POST /api/admin/licenses/:key/deactivate - Deactivate license

## CLI Commands

1. Generate New License
2. List All Licenses
3. View License Details
4. Batch Generate
5. Export to CSV
6. Test License

## Database Location

The SQLite database is stored at: \`data/licenses.db\`
`;

fs.writeFileSync('README.md', readmeContent);

console.log('\n✅ Setup complete!\n');
console.log('Next steps:');
console.log('1. Start the server: npm start');
console.log('2. In another terminal, run CLI: npm run cli');
console.log('3. Generate your first license!\n');
console.log('Server will run at: http://localhost:3001');
console.log('Database will be created at: data/licenses.db\n');