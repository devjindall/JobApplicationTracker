const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Not authorized, no token provided'
    });
  }

  const token = authHeader.slice(7).trim();

  if (!token || !process.env.JWT_SECRET) {
    return res.status(401).json({
      message: 'Not authorized, token invalid or server authentication is not configured'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      message: 'Not authorized, token invalid or expired'
    });
  }
};

module.exports = { protect };
