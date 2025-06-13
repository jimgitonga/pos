// license-manager.js
// All-in-one license management CLI
// Usage: node license-manager.js [command] [options]

const readline = require('readline');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.LICENSE_SERVER_URL || 'http://localhost:3001';

// Color helpers (without external dependencies)
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function color(text, colorName) {
  return `${colors[colorName]}${text}${colors.reset}`;
}

class LicenseManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async prompt(question) {
    return new Promise((resolve) => {
      this.rl.question(question, resolve);
    });
  }

  async showMenu() {
    console.clear();
    console.log(color('\n🔐 POS License Manager\n', 'blue'));
    console.log('1. Generate New License');
    console.log('2. List All Licenses');
    console.log('3. View License Details');
    console.log('4. Quick Generate (Batch)');
    console.log('5. Export to CSV');
    console.log('6. Test License');
    console.log('7. Exit\n');

    const choice = await this.prompt('Select option (1-7): ');

    switch (choice) {
      case '1':
        await this.generateLicense();
        break;
      case '2':
        await this.listLicenses();
        break;
      case '3':
        await this.viewLicenseDetails();
        break;
      case '4':
        await this.batchGenerate();
        break;
      case '5':
        await this.exportToCSV();
        break;
      case '6':
        await this.testLicense();
        break;
      case '7':
        this.rl.close();
        process.exit(0);
        break;
      default:
        console.log(color('Invalid option', 'red'));
        await this.prompt('Press Enter to continue...');
        await this.showMenu();
    }
  }

  async generateLicense() {
    console.clear();
    console.log(color('\n📝 Generate New License\n', 'green'));

    const customerName = await this.prompt('Customer Name: ');
    const customerEmail = await this.prompt('Customer Email: ');
    const customerCompany = await this.prompt('Company (optional): ');
    const maxDevices = await this.prompt('Max Devices (default 1): ') || '1';
    const validityDays = await this.prompt('Validity Days (0 for lifetime): ') || '365';

    let expiresAt = null;
    if (validityDays !== '0') {
      const expDate = new Date();
      expDate.setDate(expDate.getDate() + parseInt(validityDays));
      expiresAt = expDate.toISOString();
    }

    try {
      const response = await axios.post(`${SERVER_URL}/api/licenses/create`, {
        maxDevices: parseInt(maxDevices),
        expiresAt,
        customerInfo: {
          name: customerName,
          email: customerEmail,
          company: customerCompany
        }
      });

      if (response.data.success) {
        const license = response.data.license;
        console.log(color('\n✅ License Created Successfully!\n', 'green'));
        console.log(color('License Key: ', 'yellow') + color(license.key, 'cyan'));
        console.log(color('Customer: ', 'yellow') + customerName);
        console.log(color('Max Devices: ', 'yellow') + license.maxDevices);
        console.log(color('Expires: ', 'yellow') + (license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Never'));

        // Save to file
        const filename = `license_${customerName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
        const content = this.generateLicenseFile(license, { customerName, customerEmail, customerCompany });
        fs.writeFileSync(filename, content);
        console.log(color(`\n📄 Saved to: ${filename}`, 'green'));
      }
    } catch (error) {
      console.log(color('\n❌ Error: ' + error.message, 'red'));
    }

    await this.prompt('\nPress Enter to continue...');
    await this.showMenu();
  }

  async listLicenses() {
    console.clear();
    console.log(color('\n📋 All Licenses\n', 'blue'));

    try {
      const response = await axios.get(`${SERVER_URL}/api/admin/licenses`);
      const licenses = response.data.licenses;

      if (licenses.length === 0) {
        console.log(color('No licenses found.', 'yellow'));
      } else {
        console.log(`Found ${licenses.length} license(s):\n`);
        
        licenses.forEach((license, index) => {
          console.log(`${index + 1}. ${color(license.key, 'cyan')}`);
          console.log(`   Customer: ${license.customerInfo.name || 'N/A'}`);
          console.log(`   Email: ${license.customerInfo.email || 'N/A'}`);
          console.log(`   Devices: ${license.devices.length}/${license.max_devices}`);
          console.log(`   Status: ${license.is_active ? color('Active', 'green') : color('Inactive', 'red')}`);
          console.log(`   Created: ${new Date(license.created_at).toLocaleDateString()}`);
          console.log('');
        });
      }
    } catch (error) {
      console.log(color('Error: ' + error.message, 'red'));
    }

    await this.prompt('\nPress Enter to continue...');
    await this.showMenu();
  }

  async viewLicenseDetails() {
    console.clear();
    console.log(color('\n🔍 View License Details\n', 'blue'));

    const licenseKey = await this.prompt('Enter License Key: ');

    try {
      const response = await axios.get(`${SERVER_URL}/api/admin/licenses`);
      const license = response.data.licenses.find(l => l.key === licenseKey);

      if (!license) {
        console.log(color('\nLicense not found.', 'red'));
      } else {
        console.log(color('\n✅ License Details:\n', 'green'));
        console.log(color('Key: ', 'yellow') + license.key);
        console.log(color('Customer: ', 'yellow') + (license.customerInfo.name || 'N/A'));
        console.log(color('Email: ', 'yellow') + (license.customerInfo.email || 'N/A'));
        console.log(color('Company: ', 'yellow') + (license.customerInfo.company || 'N/A'));
        console.log(color('Status: ', 'yellow') + (license.is_active ? color('Active', 'green') : color('Inactive', 'red')));
        console.log(color('Max Devices: ', 'yellow') + license.max_devices);
        console.log(color('Created: ', 'yellow') + new Date(license.created_at).toLocaleString());
        
        if (license.expires_at) {
          console.log(color('Expires: ', 'yellow') + new Date(license.expires_at).toLocaleString());
        }

        if (license.devices.length > 0) {
          console.log(color('\n📱 Registered Devices:', 'cyan'));
          license.devices.forEach((device, index) => {
            console.log(`\n  ${index + 1}. ${device.hostname}`);
            console.log(`     Platform: ${device.platform} ${device.os_version}`);
            console.log(`     First seen: ${new Date(device.first_seen).toLocaleDateString()}`);
            console.log(`     Last seen: ${new Date(device.last_seen).toLocaleDateString()}`);
          });
        }
      }
    } catch (error) {
      console.log(color('Error: ' + error.message, 'red'));
    }

    await this.prompt('\nPress Enter to continue...');
    await this.showMenu();
  }

  async batchGenerate() {
    console.clear();
    console.log(color('\n📦 Batch Generate Licenses\n', 'green'));

    const count = await this.prompt('Number of licenses: ');
    const prefix = await this.prompt('Customer prefix (e.g., "Customer"): ');
    const maxDevices = await this.prompt('Max devices per license (default 1): ') || '1';

    const licenses = [];
    console.log(color('\nGenerating licenses...', 'yellow'));

    for (let i = 1; i <= parseInt(count); i++) {
      try {
        const response = await axios.post(`${SERVER_URL}/api/licenses/create`, {
          maxDevices: parseInt(maxDevices),
          customerInfo: {
            name: `${prefix} ${i}`,
            email: `${prefix.toLowerCase()}${i}@example.com`
          }
        });

        if (response.data.success) {
          licenses.push({
            ...response.data.license,
            customerName: `${prefix} ${i}`
          });
          process.stdout.write(color('.', 'green'));
        }
      } catch (error) {
        process.stdout.write(color('x', 'red'));
      }
    }

    console.log(color(`\n\n✅ Generated ${licenses.length} licenses!\n`, 'green'));

    // Save to CSV
    const filename = `batch_licenses_${Date.now()}.csv`;
    const csv = [
      'License Key,Customer Name,Max Devices,Created At',
      ...licenses.map(l => `${l.key},"${l.customerName}",${l.maxDevices},${l.createdAt}`)
    ].join('\n');

    fs.writeFileSync(filename, csv);
    console.log(color(`Saved to: ${filename}`, 'yellow'));

    await this.prompt('\nPress Enter to continue...');
    await this.showMenu();
  }

  async exportToCSV() {
    console.clear();
    console.log(color('\n📤 Export Licenses to CSV\n', 'blue'));

    try {
      const response = await axios.get(`${SERVER_URL}/api/admin/licenses`);
      const licenses = response.data.licenses;

      const filename = `licenses_export_${Date.now()}.csv`;
      const csv = [
        'License Key,Customer Name,Email,Company,Devices Used,Max Devices,Status,Created At,Expires At',
        ...licenses.map(l => 
          `${l.key},"${l.customerInfo.name || ''}","${l.customerInfo.email || ''}","${l.customerInfo.company || ''}",${l.devices.length},${l.max_devices},${l.is_active ? 'Active' : 'Inactive'},${l.created_at},${l.expires_at || 'Never'}`
        )
      ].join('\n');

      fs.writeFileSync(filename, csv);
      console.log(color(`✅ Exported ${licenses.length} licenses to: ${filename}`, 'green'));
    } catch (error) {
      console.log(color('Error: ' + error.message, 'red'));
    }

    await this.prompt('\nPress Enter to continue...');
    await this.showMenu();
  }

  async testLicense() {
    console.clear();
    console.log(color('\n🧪 Test License\n', 'blue'));

    const licenseKey = await this.prompt('Enter License Key to test: ');

    try {
      const response = await axios.post(`${SERVER_URL}/api/licenses/validate`, {
        licenseKey,
        deviceInfo: {
          cpuId: 'TEST-CPU-ID',
          macAddress: '00:11:22:33:44:55',
          motherboardSerial: 'TEST-MB-123',
          diskSerial: 'TEST-DISK-123',
          hostname: 'test-machine',
          platform: 'test',
          osVersion: '1.0.0',
          appVersion: '1.0.0'
        }
      });

      if (response.data.success) {
        console.log(color('\n✅ License is valid!', 'green'));
        console.log(`Devices used: ${response.data.license.devicesUsed}/${response.data.license.maxDevices}`);
        console.log(`Session token: ${response.data.sessionToken}`);
      } else {
        console.log(color('\n❌ License validation failed!', 'red'));
        console.log(`Error: ${response.data.error}`);
      }
    } catch (error) {
      console.log(color('\n❌ Error: ' + (error.response?.data?.error || error.message), 'red'));
    }

    await this.prompt('\nPress Enter to continue...');
    await this.showMenu();
  }

  generateLicenseFile(license, customerInfo) {
    return `
=====================================
POS SOFTWARE LICENSE
=====================================

Licensed To:
-----------
Name: ${customerInfo.customerName}
Email: ${customerInfo.customerEmail || 'N/A'}
Company: ${customerInfo.customerCompany || 'N/A'}

License Information:
-------------------
License Key: ${license.key}
Maximum Devices: ${license.maxDevices}
Valid Until: ${license.expiresAt ? new Date(license.expiresAt).toLocaleDateString() : 'Lifetime'}
Generated: ${new Date().toLocaleDateString()}

Installation Instructions:
-------------------------
1. Download and install the POS software
2. Launch the application
3. Enter this license key when prompted:
   
   ${license.key}
   
4. The software will activate automatically

Important Notes:
---------------
- This license allows installation on up to ${license.maxDevices} device(s)
- Keep this license key secure and confidential
- For support: support@yourcompany.com

=====================================
Thank you for your purchase!
=====================================
`;
  }

  close() {
    this.rl.close();
  }
}

// Command line interface
const args = process.argv.slice(2);

if (args[0] === 'quick') {
  // Quick generate: node license-manager.js quick "Customer Name" "email@example.com"
  const manager = new LicenseManager();
  
  axios.post(`${SERVER_URL}/api/licenses/create`, {
    maxDevices: 1,
    customerInfo: {
      name: args[1] || 'Quick Customer',
      email: args[2] || 'customer@example.com'
    }
  }).then(response => {
    if (response.data.success) {
      console.log(color('\n✅ License Created!', 'green'));
      console.log(color('Key: ', 'yellow') + color(response.data.license.key, 'cyan'));
    }
    manager.close();
  }).catch(error => {
    console.log(color('Error: ' + error.message, 'red'));
    manager.close();
  });
} else {
  // Interactive mode
  const manager = new LicenseManager();
  manager.showMenu().catch(error => {
    console.error(color('Fatal error: ' + error.message, 'red'));
    manager.close();
  });
}