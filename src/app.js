// src/app.js
require('dotenv').config(); // Load environment variables
const express = require('express');
const path = require('path');
const cors = require('cors');
const session = require('express-session');
const { signUp, signIn, logOut } = require('./auth');
const { addCertificate, getCertificate, getCertificateByIdField } = require('./firestore');
const { 
  AppError, 
  ERROR_TYPES, 
  ERROR_LEVELS,
  errorMiddleware,
  requestLogger 
} = require('./utils/errorHandler');
const fs = require('fs');

// Validate sensitive data
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not defined in environment variables');
}

const app = express();
const port = process.env.PORT || 3000;

// Define log levels
const LOG_LEVEL = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// Set current log level (can be configured via environment variable)
const CURRENT_LOG_LEVEL = process.env.LOG_LEVEL ? 
  parseInt(process.env.LOG_LEVEL) : 
  (process.env.NODE_ENV === 'production' ? LOG_LEVEL.WARN : LOG_LEVEL.DEBUG);

// Custom logger function
const logger = {
  debug: function(message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      // console.debug(`\x1b[36m[DEBUG][${new Date().toISOString()}] ${message}\x1b[0m`);
      if (data) console.debug(data);
    }
  },
  info: function(message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.INFO) {
      // console.info(`\x1b[32m[INFO][${new Date().toISOString()}] ${message}\x1b[0m`);
      if (data) console.info(data);
    }
  },
  warn: function(message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.WARN) {
      // console.warn(`\x1b[33m[WARN][${new Date().toISOString()}] ${message}\x1b[0m`);
      if (data) console.warn(data);
    }
  },
  error: function(message, data = null) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.ERROR) {
      // console.error(`\x1b[31m[ERROR][${new Date().toISOString()}] ${message}\x1b[0m`);
      if (data) console.error(data);
    }
  }
};

// Verify that the views directory exists
const viewsDir = path.join(__dirname, '../views');
if (!fs.existsSync(viewsDir)) {
  logger.error(`Views directory not found: ${viewsDir}`);
  throw new Error('Views directory not found');
}

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Prevent browsers from inferring the MIME type
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Enable XSS protection in older browsers
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Set strict HSTS in production
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
};

// CORS with more secure options
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || [] 
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  optionsSuccessStatus: 204
};

// Apply middlewares
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Customized request logger that doesn't log credentials and respects log level
const sanitizedRequestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Only log requests at DEBUG level
  logger.debug(`${req.method} ${req.path}`);
  
  // Log headers and params only at DEBUG level
  if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
    // Don't log authorization headers
    const sanitizedHeaders = { ...req.headers };
    delete sanitizedHeaders.authorization;
    delete sanitizedHeaders.cookie;
    
    // Sanitize query parameters
    const sanitizedQuery = { ...req.query };
    if (sanitizedQuery.email) sanitizedQuery.email = '[REDACTED]';
    if (sanitizedQuery.password) sanitizedQuery.password = '[REDACTED]';
    
    // Don't log sensitive body information
    let sanitizedBody = { ...req.body };
    if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
    if (sanitizedBody.email) sanitizedBody.email = '[REDACTED]';
    
    // logger.debug('Request Headers:', sanitizedHeaders);
    // logger.debug('Request Query:', sanitizedQuery);
    // logger.debug('Request Body:', sanitizedBody);
  }

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log success responses at higher level than DEBUG
    if (res.statusCode >= 400) {
      // Log client and server errors
      logger.error(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    } else if (res.statusCode >= 300) {
      // Log redirects as warnings
      logger.warn(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    } else {
      // Log successful responses at INFO level
      logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
    }
  });

  next();
};

app.use(sanitizedRequestLogger);

// Session management with security options
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false, // Don't create session until something stored
    cookie: { 
      secure: process.env.NODE_ENV === 'production', // Secure cookies in production
      httpOnly: true, // Prevents client-side JS from reading the cookie
      sameSite: 'strict', // CSRF protection
      maxAge: 3600000 // Session timeout: 1 hour
    }
  })
);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', viewsDir);
app.use(express.static(path.join(__dirname, '../public')));

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    logger.warn(`Unauthorized access attempt to ${req.path}`);
    return res.redirect('/signin');
  }
  next();
};

// Redirect middleware to clear sensitive query params
const clearSensitiveParams = (req, res, next) => {
  if (req.query.email || req.query.password) {
    logger.warn('Sensitive data found in query parameters - redirecting');
    const redirectUrl = req.path;
    return res.redirect(redirectUrl);
  }
  next();
};

// Apply clearSensitiveParams to all routes
app.use(clearSensitiveParams);

// Auth routes with session management
app.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('Signup attempt with missing fields');
      return res.status(400).render('signup', {
        title: 'Sign Up',
        error: 'Email and password are required.',
        body: { email }
      });
    }

    const user = await signUp(email, password);
    req.session.user = { uid: user.uid, email: user.email };

    logger.info(`User signed up: ${user.email}`);
    res.redirect('/design');
  } catch (error) {
    logger.error('Signup failed', { message: error.message });
    res.status(400).render('signup', {
      title: 'Sign Up',
      error: error.message || 'Failed to sign up. Please try again.',
      body: { email: req.body.email }
    });
  }
});


app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('Signin attempt with missing fields');
      return res.status(400).render('signin', {
        title: 'Sign In',
        error: 'Email and password are required.',
        body: { email }
      });
    }

    const user = await signIn(email, password);
    req.session.user = { uid: user.uid, email: user.email };

    logger.info(`User signed in: ${user.email}`);
    res.redirect('/design');
  } catch (error) {
    logger.error('Signin failed', { message: error.message });
    res.status(401).render('signin', {
      title: 'Sign In',
      error: error.message || 'Invalid email or password.',
      body: { email: req.body.email }
    });
  }
});


// Handle GET requests to signin with credentials in query params
app.get('/signin', (req, res) => {
  if (req.session.user) return res.redirect('/design');
  res.render('signin', { title: 'Sign In', error: null, body: {} });
});

app.get('/signup', (req, res) => {
  if (req.session.user) return res.redirect('/design');
  res.render('signup', { title: 'Sign Up', error: null, body: {} });
});


// Protected routes
app.get('/design', requireAuth, (req, res) => {
  try {
    res.render('design', { 
      user: { email: req.session.user.email },
      title: 'Design Page'
    });
  } catch (error) {
    logger.error('Error rendering design page:', { message: error.message, stack: error.stack });
    res.status(500).send('Error loading design page. Please try again later.');
  }
});

// Routes
app.get('/', (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect('/design');
    }
    res.render('index', { title: 'Sign In / Sign Up', error: null, body: '' });
  } catch (error) {
    logger.error('Error rendering index page:', { message: error.message, stack: error.stack });
    res.status(500).send('Error loading the page. Please try again later.');
  }
});



// Certificate status API endpoint
app.get('/api/certificate/status/:certificateId', async (req, res) => {
  const { certificateId } = req.params;
  logger.info(`Checking certificate status for ID: ${certificateId}`);

  try {
    const certificate = await getCertificateByIdField(certificateId);
    
    if (!certificate) {
      logger.warn(`Certificate not found: ${certificateId}`);
      return res.status(404).json({ exists: false, message: 'Certificate not found' });
    }
    
    // Return the certificate data but omit any sensitive information
    res.status(200).json({
      exists: true,
      certificateId: certificate.certificateId,
      name: certificate.name,
      date: certificate.date,
      issuer: certificate.issuer
    });
  } catch (error) {
    logger.error('Error checking certificate status:', { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'An error occurred while checking certificate status' });
  }
});

// POST /api/certificate/add - Store certificate data and return verification link
app.post('/api/certificate/add', requireAuth, async (req, res) => {
  try {
    const { name, certificateId, date, issuer } = req.body;

    // Check for missing fields
    if (!name || !certificateId || !date || !issuer) {
      logger.warn('Missing required fields in certificate add request');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Attempt to store certificate using addCertificate
    const linkId = await addCertificate(name, certificateId, date, issuer);
    
    if (!linkId) {
      throw new Error('Failed to generate verification link');
    }

    // Generate full verification link with protocol-relative URL
    const host = req.get('host');
    const protocol = req.protocol;
    const verificationLink = `${protocol}://${host}/api/certificate/verify/${linkId}`;

    logger.info(`Certificate added with ID: ${certificateId}`);
    res.status(200).json({ verificationLink });

  } catch (error) {
    logger.error('Add Certificate Error:', {
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ error: 'Failed to add certificate' });
  }
});

// Certificate verification route with enhanced error handling
app.get('/api/certificate/verify/:linkId', async (req, res) => {
  try {
    const { linkId } = req.params;

    if (!linkId) {
      logger.warn('Certificate verification attempted without linkId');
      return res.status(400).render('error', { 
        title: 'Invalid Request', 
        message: 'Certificate ID is required',
        error: { status: 400 }
      });
    }

    const certificateData = await getCertificate(linkId);

    if (!certificateData) {
      logger.warn(`Certificate not found with linkId: ${linkId}`);
      return res.status(404).render('error', { 
        title: 'Certificate Not Found', 
        message: 'The certificate you are looking for could not be found',
        error: { status: 404 }
      });
    }

    // Check if certificateVerified view exists
    const certificateVerifiedPath = path.join(viewsDir, 'certificateVerified.ejs');
    if (fs.existsSync(certificateVerifiedPath)) {
      res.render('certificateVerified', { certificateData, title: 'Certificate Verified' });
    } else {
      // Fallback to simple response if template doesn't exist
      res.send(`
        <h1>Certificate Verified</h1>
        <p>Name: ${certificateData.name}</p>
        <p>Certificate ID: ${certificateData.certificateId}</p>
        <p>Date: ${certificateData.date}</p>
        <p>Issuer: ${certificateData.issuer}</p>
      `);
    }
  } catch (error) {
    logger.error('Error verifying certificate:', { message: error.message, stack: error.stack });
    res.status(500).render('error', { 
      title: 'Verification Error', 
      message: 'Error verifying certificate. Please try again later.',
      error: { status: 500 }
    });
  }
});

// Custom 404 handler
app.use((req, res) => {
  logger.warn(`404 Not Found: ${req.method} ${req.path}`);
  try {
    res.status(404).render('error', { 
      title: 'Page Not Found', 
      message: 'The page you are looking for does not exist.',
      error: { status: 404 }
    });
  } catch (error) {
    logger.error('Error rendering 404 page:', { message: error.message });
    res.status(404).send('Page not found');
  }
});

// Custom error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', { message: err.message, stack: err.stack });
  
  try {
    // Determine status code based on error type
    let statusCode = 500;
    let errorTitle = 'Server Error';
    
    if (err instanceof AppError) {
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
      }
    }
    
    res.status(statusCode).render('error', { 
      title: errorTitle, 
      message: err.message || 'Something went wrong',
      error: { 
        status: statusCode,
        stack: process.env.NODE_ENV === 'development' ? err.stack : null
      }
    });
  } catch (renderError) {
    logger.error('Error rendering error page:', { message: renderError.message });
    res.status(500).send('An error occurred.');
  }
});

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});