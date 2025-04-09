// src/auth.js
const { initializeApp } = require('firebase/app');
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserSessionPersistence 
} = require('firebase/auth');
const firebaseConfig = require('./firebaseConfig');

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Set session persistence (only while browser is open)
try {
  setPersistence(auth, browserSessionPersistence);
} catch (error) {
  console.error('Failed to set auth persistence:', error);
}

const signUp = async (email, password) => {
  try {
    // Basic validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email and password must be strings');
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
    
    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log('User created successfully');
    return userCredential.user;
  } catch (error) {
    console.error('Sign up error:', error.code);
    
    // Provide user-friendly error messages
    switch(error.code) {
      case 'auth/email-already-in-use':
        throw new Error('Email is already in use. Please try signing in instead.');
      case 'auth/invalid-email':
        throw new Error('Invalid email format.');
      case 'auth/weak-password':
        throw new Error('Password is too weak. Please use a stronger password.');
      default:
        throw new Error('Failed to sign up. Please try again later.');
    }
  }
};

const signIn = async (email, password) => {
  try {
    // Basic validation
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new Error('Email and password must be strings');
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log('User signed in successfully');
    return userCredential.user;
  } catch (error) {
    console.error('Sign in error:', error.code);
    
    // Provide user-friendly error messages
    switch(error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        throw new Error('Invalid email or password.');
      case 'auth/invalid-email':
        throw new Error('Invalid email format.');
      case 'auth/user-disabled':
        throw new Error('This account has been disabled.');
      case 'auth/too-many-requests':
        throw new Error('Too many failed login attempts. Please try again later.');
      default:
        throw new Error('Failed to sign in. Please try again later.');
    }
  }
};

const logOut = async () => {
  try {
    await signOut(auth);
    console.log('User signed out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    throw new Error('Failed to log out. Please try again.');
  }
};

module.exports = { signUp, signIn, logOut };