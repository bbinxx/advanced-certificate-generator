require('dotenv').config(); // Load environment variables
// src/app.js
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

// Validate sensitive data
if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is not defined in environment variables');
}

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger); // Add request logging
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: process.env.NODE_ENV === 'production' }, // Secure cookies in production
  })
);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));

// Auth routes with session management
app.post('/signup', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError(
        'Email and password are required',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.WARNING,
        { email: !email, password: !password }
      );
    }

    const user = await signUp(email, password);
    req.session.user = user; // Save user in session
    res.status(200).json(user);
  } catch (error) {
    next(new AppError(
      error.message,
      ERROR_TYPES.AUTHENTICATION,
      ERROR_LEVELS.ERROR,
      { email: req.body.email }
    ));
  }
});

app.post('/signin', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError(
        'Email and password are required',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.WARNING,
        { email: !email, password: !password }
      );
    }

    const user = await signIn(email, password);
    req.session.user = user; // Save user in session
    res.status(200).json(user);
  } catch (error) {
    next(new AppError(
      error.message,
      ERROR_TYPES.AUTHENTICATION,
      ERROR_LEVELS.ERROR,
      { email: req.body.email }
    ));
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to log out' });
    }
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

app.get('/home', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/');
  }
  res.render('home', { title: 'Home', user: req.session.user });
});

// Routes
app.get('/', (req, res) => {
  if (req.session.user) {
    return res.redirect('/home');
  }
  res.render('index', { title: 'Sign In / Sign Up', body: '' }); // Pass body explicitly
});

app.get('/signin', (req, res) => {
  res.render('signin', { title: 'Sign In', body: '' }); // Pass body explicitly
});

app.get('/design', (req, res) => {
  res.render('design'); // Pass body explicitly
});

app.get('/signup', (req, res) => {
  res.render('signup', { title: 'Sign Up', body: '' }); // Pass body explicitly
});

// Add this to app.js
app.get('/api/certificate/status/:certificateId', async (req, res) => {
  const { certificateId } = req.params;
  console.log(`Checking certificate status for ID: ${certificateId}`);

  try {
    // Query Firestore to find certificate by certificateId field
    const certificatesRef = collection(db, 'certificates');
    const q = query(certificatesRef, where('certificateId', '==', certificateId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No certificate found with ID: ${certificateId}`);
      return res.status(404).json({ exists: false, message: 'Certificate not found' });
    }
    
    // Return the first matching certificate
    const certificateData = querySnapshot.docs[0].data();
    const docId = querySnapshot.docs[0].id;
    console.log('Certificate found:', certificateData, 'Document ID:', docId);
    
    res.status(200).json({
      exists: true,
      docId: docId, // Include the Firestore document ID
      certificateId: certificateData.certificateId,
      name: certificateData.name,
      date: certificateData.date,
      issuer: certificateData.issuer
    });
  } catch (error) {
    console.error('Error checking certificate status:', error);
    res.status(500).json({ error: error.message });
  }
});


// POST /addCertificate - Store certificate data and return verification link
// POST /api/certificate/add - Store certificate data and return verification link
app.post('/api/certificate/add', async (req, res) => {
  console.log('Received POST request to /api/certificate/add');
  console.log('Request Body:', JSON.stringify(req.body, null, 2));

  try {
    const { name, certificateId, date, issuer } = req.body;

    // Check for missing fields
    if (!name || !certificateId || !date || !issuer) {
      console.warn('Validation Failed: Missing fields', {
        name, certificateId, date, issuer
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Input Data Validated:', { name, certificateId, date, issuer });

    // Attempt to store certificate using addCertificate
    console.log('Calling addCertificate function...');
    const linkId = await addCertificate(name, certificateId, date, issuer);
    
    if (!linkId) {
      console.error('addCertificate returned no linkId');
      throw new Error('Failed to generate verification link');
    }

    // Generate full verification link
    const verificationLink = `http://localhost:3000/api/certificate/verify/${linkId}`;
    console.log('Certificate added successfully. Verification Link:', verificationLink);

    res.status(200).json({ verificationLink });

  } catch (error) {
    console.error('Add Certificate Error:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    res.status(500).json({ error: error.message });
  }
});




// Certificate verification route with enhanced error handling
app.get('/api/certificate/verify/:linkId', async (req, res, next) => {
  try {
    const { linkId } = req.params;

    if (!linkId) {
      throw new AppError(
        'Certificate ID is required',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.WARNING,
        { linkId }
      );
    }

    const certificateData = await getCertificate(linkId);

    if (!certificateData) {
      throw new AppError(
        'Certificate not found',
        ERROR_TYPES.VALIDATION,
        ERROR_LEVELS.WARNING,
        { linkId }
      );
    }

    res.render('certificateVerified', { certificateData });
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(
        'Error verifying certificate',
        ERROR_TYPES.SERVER,
        ERROR_LEVELS.ERROR,
        { linkId: req.params.linkId, originalError: error.message }
      ));
    }
  }
});

// Add error handling middleware last
app.use(errorMiddleware);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
