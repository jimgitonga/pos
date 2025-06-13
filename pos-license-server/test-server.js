// test-server.js
// Test script to verify the license server is working
// Run: node test-server.js

const axios = require('axios');

const SERVER_URL = 'http://localhost:3001';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testServer() {
  console.log('🧪 Testing License Server...\n');

  try {
    // Test 1: Health check
    console.log('1. Checking server health...');
    try {
      const health = await axios.get(`${SERVER_URL}/health`);
      console.log('✅ Server is running:', health.data.status);
    } catch (error) {
      console.log('❌ Server is not running. Please start it with: npm start');
      return;
    }

    // Test 2: Create a license
    console.log('\n2. Creating test license...');
    const createResponse = await axios.post(`${SERVER_URL}/api/licenses/create`, {
      maxDevices: 2,
      customerInfo: {
        name: 'Test Customer',
        email: 'test@example.com',
        company: 'Test Company'
      }
    });

    if (createResponse.data.success) {
      const licenseKey = createResponse.data.license.key;
      console.log('✅ License created:', licenseKey);

      // Test 3: Validate license
      console.log('\n3. Validating license...');
      const validateResponse = await axios.post(`${SERVER_URL}/api/licenses/validate`, {
        licenseKey,
        deviceInfo: {
          cpuId: 'TEST-CPU',
          macAddress: '00:11:22:33:44:55',
          motherboardSerial: 'TEST-MB',
          diskSerial: 'TEST-DISK',
          hostname: 'test-machine',
          platform: 'test',
          osVersion: '1.0',
          appVersion: '1.0.0'
        }
      });

      if (validateResponse.data.success) {
        console.log('✅ License validated successfully');
        console.log('   Session token:', validateResponse.data.sessionToken);
        console.log('   Devices:', `${validateResponse.data.license.devicesUsed}/${validateResponse.data.license.maxDevices}`);

        // Test 4: Heartbeat
        console.log('\n4. Testing heartbeat...');
        const heartbeatResponse = await axios.post(`${SERVER_URL}/api/sessions/heartbeat`, {
          sessionToken: validateResponse.data.sessionToken
        });

        if (heartbeatResponse.data.success) {
          console.log('✅ Heartbeat successful');
        }
      }

      // Test 5: List licenses
      console.log('\n5. Fetching all licenses...');
      const listResponse = await axios.get(`${SERVER_URL}/api/admin/licenses`);
      console.log('✅ Found', listResponse.data.licenses.length, 'license(s)');

      // Test 6: Deactivate license
      console.log('\n6. Deactivating test license...');
      await axios.post(`${SERVER_URL}/api/admin/licenses/${licenseKey}/deactivate`);
      console.log('✅ License deactivated');

      console.log('\n✅ All tests passed! Your license server is working correctly.\n');
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testServer();