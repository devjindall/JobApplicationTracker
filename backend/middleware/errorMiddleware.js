// Handle 404 for undefined routes
const notFound = (req, res) => {
  res.status(404).json({
    message: `Route not found - ${req.originalUrl}`
  });
};

// Centralized error handling middleware
const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = statusCode >= 500 ? 'Internal Server Error' : (err.message || 'Request failed');

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found or invalid identifier format';
  }

  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join(', ');
  }

  if (statusCode >= 500) {
    console.error('Unhandled server error:', err.message);
  }

  res.status(statusCode).json({ message });
};

module.exports = { notFound, errorHandler };
