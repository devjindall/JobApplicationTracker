const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    try {
      // Extract token from header (Format: "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      // Verify token signature and expiration
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach authenticated user identity to request object
      req.user = {
        userId: decoded.userId
      };

      return next();
    } catch (error) {
      return res.status(401).json({
        message: 'Not authorized, token invalid or expired'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      message: 'Not authorized, no token provided'
    });
  }
};

module.exports = { protect };
