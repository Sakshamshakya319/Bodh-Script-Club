// Simple health check endpoint for Vercel (helps debug login/env issues)
export default function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      message: 'Method not allowed',
      error: 'INVALID_METHOD'
    });
  }

  const hasMongo = !!(process.env.MONGODB_URI && process.env.MONGODB_URI.trim());
  const hasJwt = !!(process.env.JWT_SECRET && process.env.JWT_SECRET.trim());
  const ready = hasMongo && hasJwt;

  const healthCheck = {
    status: ready ? 'OK' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    nodeVersion: process.version,
    vercel: true,
    message: ready ? 'Vercel serverless function is working' : 'Server running but login may fail until env vars are set',
    config: {
      MONGODB_URI: hasMongo ? 'set' : 'missing',
      JWT_SECRET: hasJwt ? 'set' : 'missing',
    },
  };

  res.status(200).json(healthCheck);
}