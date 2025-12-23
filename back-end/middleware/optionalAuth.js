const jwt = require('jsonwebtoken');
require('dotenv').config();

// Optional authentication - doesn't fail if no token provided
const optionalAuth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      // No token provided - continue without user
      req.user = null;
      return next();
    }
    
    // Check if token is in Bearer format
    const tokenParts = authHeader.split(' ');
    
    if (tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
      // Invalid format - continue without user
      req.user = null;
      return next();
    }
    
    const token = tokenParts[1];
    
    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Check if user is active
      if (!decoded.is_active) {
        req.user = null;
        return next();
      }
      
      // Attach user information from token to request object
      req.user = {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name,
        role: decoded.role,
        image: decoded.image,
        is_active: decoded.is_active
      };
    } catch (tokenError) {
      // Token verification failed - continue without user
      req.user = null;
    }
    
    next();
  } catch (error) {
    console.error('Optional authentication error:', error);
    req.user = null;
    next();
  }
};

module.exports = optionalAuth;
