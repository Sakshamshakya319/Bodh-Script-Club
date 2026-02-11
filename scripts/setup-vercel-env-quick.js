#!/usr/bin/env node

/**
 * Quick Vercel Environment Variables Setup
 * This script generates the commands to set environment variables in Vercel
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔧 Vercel Environment Variables Setup\n');
console.log('═══════════════════════════════════════════════════\n');

// Read .env file
const envPath = join(__dirname, '..', '.env');
let envContent;

try {
  envContent = readFileSync(envPath, 'utf-8');
} catch (error) {
  console.error('❌ Error reading .env file:', error.message);
  process.exit(1);
}

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Required variables for production
const requiredVars = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'NODE_ENV',
];

// Override NODE_ENV for production
envVars['NODE_ENV'] = 'production';

// Add VITE_API_URL for production
envVars['VITE_API_URL'] = '/api';

console.log('📋 Required Environment Variables:\n');

// Display variables
requiredVars.forEach(key => {
  if (envVars[key]) {
    const value = envVars[key];
    const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
    console.log(`✅ ${key}: ${displayValue}`);
  } else {
    console.log(`❌ ${key}: NOT FOUND`);
  }
});

console.log(`✅ VITE_API_URL: /api`);

console.log('\n═══════════════════════════════════════════════════\n');
console.log('🚀 Option 1: Set via Vercel CLI (Recommended)\n');
console.log('Run these commands:\n');

// Generate Vercel CLI commands
requiredVars.forEach(key => {
  if (envVars[key]) {
    console.log(`vercel env add ${key} production`);
    console.log(`# When prompted, paste: ${envVars[key]}\n`);
  }
});

console.log(`vercel env add VITE_API_URL production`);
console.log(`# When prompted, paste: /api\n`);

console.log('═══════════════════════════════════════════════════\n');
console.log('🌐 Option 2: Set via Vercel Dashboard\n');
console.log('1. Go to: https://vercel.com/dashboard');
console.log('2. Select your project');
console.log('3. Go to: Settings → Environment Variables');
console.log('4. Add each variable below:\n');

// Generate table for dashboard
console.log('┌─────────────────────┬────────────────────────────────────────┐');
console.log('│ Variable Name       │ Value                                  │');
console.log('├─────────────────────┼────────────────────────────────────────┤');

requiredVars.forEach(key => {
  if (envVars[key]) {
    const value = envVars[key];
    const displayValue = value.length > 38 ? value.substring(0, 35) + '...' : value;
    const paddedKey = key.padEnd(19);
    const paddedValue = displayValue.padEnd(38);
    console.log(`│ ${paddedKey} │ ${paddedValue} │`);
  }
});

const paddedKey = 'VITE_API_URL'.padEnd(19);
const paddedValue = '/api'.padEnd(38);
console.log(`│ ${paddedKey} │ ${paddedValue} │`);
console.log('└─────────────────────┴────────────────────────────────────────┘\n');

console.log('═══════════════════════════════════════════════════\n');
console.log('📝 Full Values (for copy-paste):\n');

requiredVars.forEach(key => {
  if (envVars[key]) {
    console.log(`${key}:`);
    console.log(`${envVars[key]}\n`);
  }
});

console.log(`VITE_API_URL:`);
console.log(`/api\n`);

console.log('═══════════════════════════════════════════════════\n');
console.log('⚠️  IMPORTANT NOTES:\n');
console.log('1. Set variables for ALL environments:');
console.log('   - Production ✅');
console.log('   - Preview ✅');
console.log('   - Development ✅\n');
console.log('2. After setting variables, redeploy:');
console.log('   vercel --prod\n');
console.log('3. Verify MongoDB Atlas allows 0.0.0.0/0 access\n');
console.log('═══════════════════════════════════════════════════\n');
