import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import compression from 'compression';
import helmet from 'helmet';

// Load environment variables first
dotenv.config();

// Validate critical environment variables
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ CRITICAL: Missing required environment variables:', missingEnvVars);
  console.error('🔧 Please set these variables in Vercel dashboard:');
  missingEnvVars.forEach(varName => {
    console.error(`   - ${varName}`);
  });
}

// Import local development routes (only if they exist)
// Using consolidated API handler - no need for individual route files

// Initialize JWT service function
async function initializeJWT() {
  if (process.env.JWT_SECRET) {
    try {
      const { jwtService } = await import('./api/utils/jwt.js');
      jwtService.initialize();
      console.log('✅ JWT Service initialized');
      return true;
    } catch (error) {
      console.error('❌ JWT Service initialization failed:', error.message);
      return false;
    }
  } else {
    console.warn('⚠️ JWT_SECRET not found - authentication will not work');
    return false;
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Initialize JWT service
initializeJWT();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https:", "wss:"],
      mediaSrc: ["'self'", "https:", "blob:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware
app.use(compression());

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5000',
      'http://localhost:3000',
      process.env.FRONTEND_URL,
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean);

    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || origin.endsWith('.vercel.app')) {
      callback(null, true);
    } else {
      console.log('Blocked by CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes - Use consolidated handler for ALL requests
if (process.env.NODE_ENV !== 'production') {
  // Import and use the consolidated API handler for all /api/* routes
  app.all('/api/*', async (req, res) => {
    try {
      const { default: apiHandler } = await import('./api/index.js');
      await apiHandler(req, res);
    } catch (error) {
      console.error('[API] Error:', error);
      res.status(500).json({ 
        message: 'API handler error', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' 
      });
    }
  });
} else {
  // In production, Vercel handles API routes via serverless functions
  app.get('/api/*', (req, res) => {
    res.status(404).json({ 
      message: 'API routes are handled by Vercel serverless functions in production',
      path: req.path
    });
  });
}

// Simple test endpoint that doesn't require environment variables
app.get('/api/ping', (req, res) => {
  res.json({ 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version
  });
});

// Environment check endpoint
app.get('/api/env-check', (req, res) => {
  const envStatus = {
    message: 'Environment check',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    environment: process.env.NODE_ENV || 'not set',
    
    // Check critical environment variables (without exposing values)
    envVars: {
      MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET',
      JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'SET' : 'NOT SET',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT SET',
      PORT: process.env.PORT || 'not set',
      BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS || 'not set'
    },
    
    // Show any missing critical variables
    missingCritical: requiredEnvVars.filter(varName => !process.env[varName])
  };

  // Return 500 if critical variables are missing
  if (envStatus.missingCritical.length > 0) {
    return res.status(500).json({
      ...envStatus,
      error: 'Missing critical environment variables',
      action: 'Set these variables in Vercel dashboard'
    });
  }

  res.json(envStatus);
});

// Legacy health check endpoints (for backward compatibility)
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    environment: process.env.NODE_ENV,
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for Vercel deployment issues
app.get('/api/debug', (req, res) => {
  const envCheck = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    MONGODB_URI: process.env.MONGODB_URI ? 'set' : 'NOT SET',
    JWT_SECRET: process.env.JWT_SECRET ? 'set' : 'NOT SET',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ? 'set' : 'NOT SET',
    PORT: process.env.PORT || 'not set'
  };

  res.json({
    message: 'Debug information',
    environment: envCheck,
    mongodb: {
      status: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host || 'not connected'
    },
    server: {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform
    }
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing - return all requests to React app
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API endpoint not found' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// MongoDB Connection
let isConnected = false;

// Validate Environment Variables
if (!process.env.MONGODB_URI) {
  console.error('❌ FATAL ERROR: MONGODB_URI is undefined');
}
if (!process.env.JWT_SECRET) {
  console.warn('⚠️ WARNING: JWT_SECRET is undefined. Login will fail.');
}

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      bufferCommands: false,
      // Removed bufferMaxEntries as it's deprecated
    });

    isConnected = db.connections[0].readyState;
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    throw error;
  }
};

// Connect to DB immediately (but don't crash if it fails)
if (process.env.MONGODB_URI) {
  connectDB().catch(err => {
    console.error("❌ Initial DB connection failed:", err.message);
    console.warn("⚠️ Server will continue running but database features won't work");
  });
} else {
  console.warn("⚠️ MONGODB_URI not set - database features will not work");
}

// Ensure DB connection for every API request
app.use(async (req, res, next) => {
  // Only check DB connection for API routes (except health checks)
  if (req.path.startsWith('/api') && !req.path.startsWith('/api/health')) {
    if (!isConnected) {
      try {
        await connectDB();
      } catch (error) {
        console.error("Failed to connect to database during request");
        return res.status(500).json({ 
          message: 'Database connection failed', 
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' 
        });
      }
    }
  }
  next();
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 5000;

// For Vercel serverless functions
export default app;

// For local development
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📍 API URL: http://localhost:${PORT}/api`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📦 Node Version: ${process.version}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/api/health`);
  });
}
