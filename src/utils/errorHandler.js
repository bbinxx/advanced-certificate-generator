// src/utils/errorHandler.js
const ERROR_TYPES = {
  VALIDATION: 'ValidationError',
  AUTHENTICATION: 'AuthenticationError',
  DATABASE: 'DatabaseError',
  NETWORK: 'NetworkError',
  SERVER: 'ServerError'
};

const ERROR_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  FATAL: 'fatal'
};

class AppError extends Error {
  constructor(message, type, level, details = {}) {
    super(message);
    this.type = type;
    this.level = level;
    this.details = details;
    this.timestamp = new Date();
  }
}

class ErrorLogger {
  static logError(error, req = null) {
    // Sanitize any sensitive information from error details
    const sanitizedDetails = { ...error.details };
    
    // List of keys that might contain sensitive information
    const sensitiveKeys = ['email', 'password', 'token', 'auth', 'key', 'secret', 'credential'];
    
    // Recursively sanitize the details object
    const sanitizeObject = (obj) => {
      if (!obj || typeof obj !== 'object') return obj;
      
      Object.keys(obj).forEach(key => {
        const lowerKey = key.toLowerCase();
        
        // Check if this key might contain sensitive data
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
      
      return obj;
    };
    
    sanitizeObject(sanitizedDetails);
    
    const errorLog = {
      timestamp: new Date(),
      type: error.type || 'UnknownError',
      level: error.level || ERROR_LEVELS.ERROR,
      message: error.message,
      stack: error.stack,
      details: sanitizedDetails,
      request: req ? {
        method: req.method,
        path: req.path,
        params: req.params,
        // Omit query and body for security
        ip: req.ip
      } : null
    };

    // Log to console with color coding
    const colors = {
      info: '\x1b[36m', // cyan
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[41m', // red background
      reset: '\x1b[0m'
    };

    console.log(`${colors[error.level || 'error']}[${errorLog.timestamp.toISOString()}] ${error.type}: ${error.message}${colors.reset}`);
    console.log('Details:', JSON.stringify(errorLog.details, null, 2));
    
    if (errorLog.request) {
      console.log('Request Context:', JSON.stringify(errorLog.request, null, 2));
    }
    
    // Log stack trace only for server errors or in development
    if (error.level === ERROR_LEVELS.ERROR || error.level === ERROR_LEVELS.FATAL || process.env.NODE_ENV !== 'production') {
      console.log('Stack:', error.stack);
    }

    return errorLog;
  }
}

// Express error middleware
const errorMiddleware = (err, req, res, next) => {
  ErrorLogger.logError(err, req);

  // Check if the response has already been sent
  if (res.headersSent) {
    return next(err);
  }

  // Check if HTML is expected
  const expectsHtml = req.accepts(['html', 'json']) === 'html';

  if (expectsHtml) {
    // Respond with HTML page
    let statusCode;
    let errorTitle;

    switch (err.type) {
      case ERROR_TYPES.VALIDATION:
        statusCode = 400;
        errorTitle = 'Validation Error';
        break;
      case ERROR_TYPES.AUTHENTICATION:
        statusCode = 401;
        errorTitle = 'Authentication Error';
        break;
      case ERROR_TYPES.DATABASE:
        statusCode = 503;
        errorTitle = 'Database Error';
        break;
      default:
        statusCode = 500;
        errorTitle = 'Server Error';
    }

    return res.status(statusCode).render('error', {
      title: errorTitle,
      message: err.message,
      error: {
        status: statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : ''
      }
    });
  } else {
    // JSON response
    switch (err.type) {
      case ERROR_TYPES.VALIDATION:
        res.status(400).json({
          status: 'error',
          type: err.type,
          message: err.message
        });
        break;

      case ERROR_TYPES.AUTHENTICATION:
        res.status(401).json({
          status: 'error',
          type: err.type,
          message: err.message
        });
        break;

      case ERROR_TYPES.DATABASE:
        res.status(503).json({
          status: 'error',
          type: err.type,
          message: 'Database operation failed'
        });
        break;

      default:
        res.status(500).json({
          status: 'error',
          type: ERROR_TYPES.SERVER,
          message: 'Internal server error'
        });
    }
  }
};

// Request logging middleware - placeholder, actual implementation in app.js
const requestLogger = (req, res, next) => {
  next();
};

module.exports = {
  AppError,
  ErrorLogger,
  ERROR_TYPES,
  ERROR_LEVELS,
  errorMiddleware,
  requestLogger
};