/**
 * Diagnostic endpoint to check Vercel environment
 * GET /api/diagnostic
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      platform: 'Vercel',
      nodeVersion: process.version,
      
      // Check environment variables (without exposing values)
      envVariables: {
        JWT_SECRET: process.env.JWT_SECRET ? '✅ SET' : '❌ NOT SET',
        MONGODB_URI: process.env.MONGODB_URI ? '✅ SET' : '❌ NOT SET',
      },
      
      // MongoDB connection string info (without credentials)
      mongodb: {
        configured: !!process.env.MONGODB_URI,
        isAtlas: process.env.MONGODB_URI?.includes('mongodb.net') || false,
        isLocalhost: process.env.MONGODB_URI?.includes('localhost') || false,
      },
      
      // Request info
      request: {
        url: req.url,
        method: req.method,
        host: req.headers.host,
        userAgent: req.headers['user-agent'],
      },
      
      // Check if all required vars are set
      allRequiredVarsSet: !!(
        process.env.JWT_SECRET &&
        process.env.MONGODB_URI
      ),
    };

    // Warning messages
    const warnings = [];
    if (!process.env.JWT_SECRET) {
      warnings.push('JWT_SECRET is not set - authentication will fail');
    }
    if (!process.env.MONGODB_URI) {
      warnings.push('MONGODB_URI is not set - database operations will fail');
    }

    res.status(200).json({
      status: diagnostics.allRequiredVarsSet ? 'OK' : 'WARNING',
      message: diagnostics.allRequiredVarsSet 
        ? 'All required environment variables are set' 
        : 'Some environment variables are missing',
      diagnostics,
      warnings: warnings.length > 0 ? warnings : undefined,
    });

  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Failed to run diagnostics',
      error: error.message,
    });
  }
}
