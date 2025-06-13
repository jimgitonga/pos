# POS License Server

A simple SQLite-based license management server for your POS application.

## Quick Start

```bash
# Start the server
npm start

# Run the CLI tool
npm run cli

# Quick generate a license
npm run quick "Customer Name" "email@example.com"
```

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

The SQLite database is stored at: `data/licenses.db`
