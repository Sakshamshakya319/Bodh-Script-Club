import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// JWT Configuration
const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '15m',      // Short-lived access token
  REFRESH_TOKEN_EXPIRY: '7d',      // Long-lived refresh token
  ALGORITHM: 'HS256',
  ISSUER: 'bodh-script-club',
  AUDIENCE: 'bodh-script-club-users'
};

/**
 * JWT Utility Class for handling all JWT operations
 */
export class JWTService {
  constructor() {
    // Don't initialize secrets in constructor - do it lazily
    this._accessTokenSecret = null;
    this._refreshTokenSecret = null;
    this._initialized = false;
  }

  /**
   * Initialize the JWT service with environment variables
   */
  initialize() {
    if (this._initialized) return;

    this._accessTokenSecret = process.env.JWT_SECRET;
    this._refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
    
    if (!this._accessTokenSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    this._initialized = true;

    // Log JWT configuration (without secrets)
    console.log('🔐 JWT Service initialized');
    console.log('📅 Access Token Expiry:', JWT_CONFIG.ACCESS_TOKEN_EXPIRY);
    console.log('📅 Refresh Token Expiry:', JWT_CONFIG.REFRESH_TOKEN_EXPIRY);
  }

  /**
   * Get access token secret (lazy initialization)
   */
  get accessTokenSecret() {
    if (!this._initialized) this.initialize();
    return this._accessTokenSecret;
  }

  /**
   * Get refresh token secret (lazy initialization)
   */
  get refreshTokenSecret() {
    if (!this._initialized) this.initialize();
    return this._refreshTokenSecret;
  }

  /**
   * Generate a cryptographically secure secret
   */
  generateSecret(length = 64) {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate access token (short-lived)
   */
  generateAccessToken(payload) {
    const tokenPayload = {
      ...payload,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
      iss: JWT_CONFIG.ISSUER,
      aud: JWT_CONFIG.AUDIENCE
    };

    return jwt.sign(tokenPayload, this.accessTokenSecret, {
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      algorithm: JWT_CONFIG.ALGORITHM
    });
  }

  /**
   * Generate refresh token (long-lived)
   */
  generateRefreshToken(payload) {
    const tokenPayload = {
      userId: payload.userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      iss: JWT_CONFIG.ISSUER,
      aud: JWT_CONFIG.AUDIENCE
    };

    return jwt.sign(tokenPayload, this.refreshTokenSecret, {
      expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRY,
      algorithm: JWT_CONFIG.ALGORITHM
    });
  }

  /**
   * Generate both access and refresh tokens
   */
  generateTokenPair(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
      expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRY,
      tokenType: 'Bearer'
    };
  }

  /**
   * Generate legacy token (for backward compatibility)
   */
  generateLegacyToken(payload) {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: '7d', // Keep 7 days for backward compatibility
      algorithm: JWT_CONFIG.ALGORITHM
    });
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        algorithms: [JWT_CONFIG.ALGORITHM],
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE
      });

      if (decoded.type && decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return { valid: true, decoded };
    } catch (error) {
      return { 
        valid: false, 
        error: error.message,
        expired: error.name === 'TokenExpiredError'
      };
    }
  }

  /**
   * Verify legacy token (for backward compatibility)
   */
  verifyLegacyToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        algorithms: [JWT_CONFIG.ALGORITHM]
      });

      return { valid: true, decoded };
    } catch (error) {
      return { 
        valid: false, 
        error: error.message,
        expired: error.name === 'TokenExpiredError'
      };
    }
  }

  /**
   * Verify any token (tries both new and legacy formats)
   */
  verifyToken(token) {
    // First try new format
    const newResult = this.verifyAccessToken(token);
    if (newResult.valid) {
      return newResult;
    }

    // Fallback to legacy format
    return this.verifyLegacyToken(token);
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        algorithms: [JWT_CONFIG.ALGORITHM],
        issuer: JWT_CONFIG.ISSUER,
        audience: JWT_CONFIG.AUDIENCE
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return { valid: true, decoded };
    } catch (error) {
      return { 
        valid: false, 
        error: error.message,
        expired: error.name === 'TokenExpiredError'
      };
    }
  }

  /**
   * Decode token without verification (for debugging)
   */
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }

  /**
   * Get token expiration time
   */
  getTokenExpiration(token) {
    const decoded = this.decodeToken(token);
    if (decoded && decoded.payload.exp) {
      return new Date(decoded.payload.exp * 1000);
    }
    return null;
  }

  /**
   * Check if token is expired
   */
  isTokenExpired(token) {
    const expiration = this.getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
  }

  /**
   * Extract token from Authorization header
   */
  extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }
    
    return parts[1];
  }

  /**
   * Create token payload from user object
   */
  createPayload(user) {
    return {
      userId: user._id || user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.role === 'admin' || user.isAdmin
    };
  }

  /**
   * Refresh access token using refresh token
   */
  refreshAccessToken(refreshToken) {
    const result = this.verifyRefreshToken(refreshToken);
    if (!result.valid) {
      throw new Error('Invalid refresh token');
    }

    const payload = {
      userId: result.decoded.userId
    };

    return this.generateAccessToken(payload);
  }
}

// Create singleton instance
export const jwtService = new JWTService();

// Export utility functions for backward compatibility
export const generateToken = (payload) => {
  return jwtService.generateLegacyToken(payload);
};

export const verifyToken = (token) => {
  return jwtService.verifyToken(token);
};

export const generateTokenPair = (payload) => {
  return jwtService.generateTokenPair(payload);
};

// Export configuration
export { JWT_CONFIG };