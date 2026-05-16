const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Unhandled error:', { message: err.message, url: req.originalUrl, method: req.method });

  let statusCode = err.statusCode || 500;
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'Internal server error';

  if (err.name === 'SequelizeValidationError') {
    statusCode = 422; errorCode = 'VALIDATION_ERROR'; message = 'Validation failed';
  }
  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409; errorCode = 'DUPLICATE_ENTRY'; message = 'Record already exists';
  }

  res.status(statusCode).json({
    success: false,
    error: { code: errorCode, message: process.env.NODE_ENV === 'production' ? 'An error occurred' : message },
  });
};

module.exports = errorHandler;
