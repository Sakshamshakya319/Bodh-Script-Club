import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { jwtService } from '../utils/jwt.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);
    
    if (!token) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'No token provided'
      });
    }

    // Verify token using the JWT service
    const result = jwtService.verifyToken(token);
    
    if (!result.valid) {
      console.log('Token verification failed:', result.error);
      
      if (result.expired) {
        return res.status(401).json({ 
          message: 'Token expired',
          error: 'TOKEN_EXPIRED'
        });
      }
      
      return res.status(401).json({ 
        message: 'Invalid token',
        error: result.error
      });
    }

    // Find user by ID from token
    const user = await User.findById(result.decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({ 
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Attach user to request
    req.user = user;
    req.token = token;
    req.tokenPayload = result.decoded;
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'AUTHENTICATION_ERROR'
    });
  }
};

export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      message: 'Authentication required',
      error: 'NO_USER'
    });
  }

  if (req.user.role !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({ 
      message: 'Admin access required',
      error: 'INSUFFICIENT_PERMISSIONS',
      userRole: req.user.role
    });
  }
  
  next();
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtService.extractTokenFromHeader(authHeader);
    
    if (token) {
      const result = jwtService.verifyToken(token);
      
      if (result.valid) {
        const user = await User.findById(result.decoded.userId).select('-password');
        if (user) {
          req.user = user;
          req.token = token;
          req.tokenPayload = result.decoded;
        }
      }
    }
    
    next();
  } catch (error) {
    // Don't fail on optional auth errors
    console.warn('Optional auth error:', error.message);
    next();
  }
};

// Rate limiting middleware (can be used with auth)
export const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old entries
    for (const [key, timestamps] of requests.entries()) {
      requests.set(key, timestamps.filter(time => time > windowStart));
      if (requests.get(key).length === 0) {
        requests.delete(key);
      }
    }
    
    // Check current user's requests
    const userRequests = requests.get(userId) || [];
    
    if (userRequests.length >= maxRequests) {
      return res.status(429).json({
        message: 'Too many requests',
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // Add current request
    userRequests.push(now);
    requests.set(userId, userRequests);
    
    next();
  };
};
