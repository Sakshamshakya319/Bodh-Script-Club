#!/usr/bin/env node

/**
 * Custom build script for Vercel deployment
 * This bypasses the Vite binary permission issues
 */

import { build } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🔨 Starting Vite build...');

try {
  await build({
    root: __dirname,
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: false,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      },
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            gsap: ['gsap'],
            ui: ['lucide-react']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  });
  
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}