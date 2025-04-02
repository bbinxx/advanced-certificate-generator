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
    const errorLog = {
      timestamp: new Date(),
      type: error.type || 'UnknownError',
      level: error.level || ERROR_LEVELS.ERROR,
      message: error.message,
      stack: error.stack,
      details: error.details || {},
      request: req ? {
        method: req.method,
        path: req.path,
        params: req.params,
        query: req.query,
        body: req.body,
        headers: req.headers,
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
    console.log('Stack:', error.stack);

    // Here you could also implement logging to file or external service
    return errorLog;
  }
}

// Express error middleware
const errorMiddleware = (err, req, res, next) => {
  ErrorLogger.logError(err, req);

  // Send appropriate response based on error type
  switch (err.type) {
    case ERROR_TYPES.VALIDATION:
      res.status(400).json({
        status: 'error',
        type: err.type,
        message: err.message,
        details: err.details
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
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  console.log(`\x1b[32m[${new Date().toISOString()}] ${req.method} ${req.url}\x1b[0m`);
  console.log('Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Query:', JSON.stringify(req.query, null, 2));
  console.log('Body:', JSON.stringify(req.body, null, 2));

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`\x1b[32m[${new Date().toISOString()}] ${req.method} ${req.url} ${res.statusCode} ${duration}ms\x1b[0m`);
  });

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