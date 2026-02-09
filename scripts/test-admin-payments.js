/**
 * Test script for admin payment API endpoint
 * Tests both localhost and production
 */

import fetch from 'node-fetch';

// Configuration
const LOCALHOST_URL = 'http://localhost:5000/api/payment/admin/all';
const PRODUCTION_URL = 'https://bodh-script-club-sca.vercel.app/api/payment/admin/all';

// Admin credentials
const ADMIN_EMAIL = 'admin@bodhscriptclub.com';
const ADMIN_PASSWORD = 'Admin@123!';

async function getAdminToken(baseUrl) {
  console.log(`\n🔑 Logging in as admin at ${baseUrl}...`);
  
  const loginUrl = baseUrl.includes('localhost') 
    ? 'http://localhost:5000/api/auth/login'
    : 'https://bodh-script-club-sca.vercel.app/api/auth/login';
  
  try {
    const response = await fetch(loginUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error('❌ Login failed:', data);
      return null;
    }

    console.log('✅ Login successful');
    console.log('   User:', data.user?.name, `(${data.user?.email})`);
    console.log('   Role:', data.user?.role);
    console.log('   Is Admin:', data.user?.isAdmin);
    
    return data.token;
  } catch (error) {
    console.error('❌ Login error:', error.message);
    return null;
  }
}

async function testPaymentEndpoint(url, token) {
  console.log(`\n🧪 Testing payment endpoint: ${url}`);
  console.log('   Token:', token ? '✅ SET' : '❌ NOT SET');
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`   Status: ${response.status} ${response.statusText}`);
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Request successful');
      console.log('   Success:', data.success);
      console.log('   Payment count:', data.count);
      console.log('   Payments:', data.payments?.length || 0);
      
      if (data.payments && data.payments.length > 0) {
        console.log('\n📋 Sample payment:');
        const sample = data.payments[0];
        console.log(JSON.stringify(sample, null, 2));
      }
    } else {
      console.error('❌ Request failed');
      console.error('   Response:', JSON.stringify(data, null, 2));
    }
    
    return { success: response.ok, data };
  } catch (error) {
    console.error('❌ Request error:', error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 ========================================');
  console.log('🚀 Admin Payment API Test');
  console.log('🚀 ========================================');

  // Test localhost
  console.log('\n\n📍 TESTING LOCALHOST');
  console.log('=====================================');
  const localToken = await getAdminToken(LOCALHOST_URL);
  if (localToken) {
    await testPaymentEndpoint(LOCALHOST_URL, localToken);
  } else {
    console.log('⚠️  Skipping localhost test (login failed)');
  }

  // Test production
  console.log('\n\n📍 TESTING PRODUCTION (VERCEL)');
  console.log('=====================================');
  const prodToken = await getAdminToken(PRODUCTION_URL);
  if (prodToken) {
    await testPaymentEndpoint(PRODUCTION_URL, prodToken);
  } else {
    console.log('⚠️  Skipping production test (login failed)');
  }

  console.log('\n\n🏁 Test completed');
}

main().catch(console.error);
