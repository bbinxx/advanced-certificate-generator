// src/firebase.js
const { initializeApp } = require('firebase/app');
const { getAuth, setPersistence, browserSessionPersistence } = require('firebase/auth');
const { getFirestore } = require('firebase/firestore');
const firebaseConfig = require('./firebaseConfig'); // Config loaded via app.js dotenv

let app, auth, db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  // Attempt to set session persistence. This is more relevant for client-side
  // code but doesn't hurt here. Might show an error if run in an environment
  // without browser storage capabilities, hence the try...catch.
  try {
    setPersistence(auth, browserSessionPersistence);
  } catch (error) {
    // Log benignly, as server-side sessions handle state anyway.
    console.info('Info: Could not set Firebase browserSessionPersistence (expected in non-browser env):', error.code);
  }

} catch (initError) {
  console.error("FATAL: Firebase initialization failed.", initError);
  // If Firebase fails to initialize, the application cannot run correctly.
  process.exit(1); // Exit the process with an error code
}

// Check if initialization was successful before exporting
if (!app || !auth || !db) {
  console.error("FATAL: Firebase app, auth, or db service not initialized.");
  process.exit(1);
}

module.exports = { app, auth, db };