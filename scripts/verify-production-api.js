#!/usr/bin/env node

/**
 * Production API Verification Script
 * Tests all critical API endpoints after deployment
 */

import fetch from 'node-fetch';

// Get the production URL from command line or use default
const PRODUCTION_URL = process.argv[2] || 'https://your-app.vercel.app';
const API_BASE = `${PRODUCTION_URL}/api`;

console.log('🔍 Testing Production API...');
console.log(`📍 Base URL: ${API_BASE}\n`);

// Test endpoints
const tests = [
  {
    name: 'Health Check',
    url: '/health',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Get Events',
    url: '/events',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Get Members',
    url: '/members',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Get Testimonials',
    url: '/testimonials',
    method: 'GET',
    expectedStatus: 200,
  },
  {
    name: 'Get Gallery',
    url: '/gallery',
    method: 'GET',
    expectedStatus: 200,
  },
];

async function testEndpoint(test) {
  try {
    const url = `${API_BASE}${test.url}`;
    console.log(`Testing: ${test.name}`);
    console.log(`  URL: ${url}`);
    
    const response = await fetch(url, {
      method: test.method,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const status = response.status;
    const isSuccess = status === test.expectedStatus;
    
    console.log(`  Status: ${status} ${isSuccess ? '✅' : '❌'}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log(`  Response: ${JSON.stringify(data).substring(0, 100)}...`);
      
      // Check if it's dummy data
      if (test.url === '/events' && Array.isArray(data)) {
        if (data.length === 0) {
          console.log(`  ⚠️  No events found - database might be empty`);
        } else {
          console.log(`  ✅ Found ${data.length} events`);
        }
      }
    } else {
      const text = await response.text();
      console.log(`  Error: ${text.substring(0, 200)}`);
    }
    
    console.log('');
    return isSuccess;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    console.log('');
    return false;
  }
}

async function runTests() {
  console.log('═══════════════════════════════════════════════════\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await testEndpoint(test);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('═══════════════════════════════════════════════════');
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);
  
  if (failed === 0) {
    console.log('✅ All tests passed! Your API is working correctly.\n');
  } else {
    console.log('❌ Some tests failed. Check the errors above.\n');
    console.log('Common issues:');
    console.log('  1. Environment variables not set in Vercel dashboard');
    console.log('  2. MongoDB Atlas network access not configured (add 0.0.0.0/0)');
    console.log('  3. Deployment still in progress');
    console.log('  4. Database is empty (run seed scripts)\n');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
