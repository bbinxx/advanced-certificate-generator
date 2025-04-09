// src/firestore.js
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  addDoc, 
  getDocs, 
  query, 
  where 
} = require('firebase/firestore');

const firebaseConfig = require('./firebaseConfig');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const addCertificate = async (name, certificateId, date, issuer) => {
  try {
    if (!name || !certificateId || !date || !issuer) {
      throw new Error('All fields (name, certificateId, date, issuer) are required');
    }

    // Sanitize and validate inputs
    const sanitizedName = String(name).trim();
    const sanitizedCertificateId = String(certificateId).trim();
    const sanitizedIssuer = String(issuer).trim();
    
    // Validate date format (assuming ISO string format)
    let sanitizedDate;
    try {
      sanitizedDate = new Date(date).toISOString();
    } catch (e) {
      throw new Error('Invalid date format');
    }

    // Check if a certificate with this ID already exists
    const certificatesRef = collection(db, 'certificates');
    const q = query(certificatesRef, where('certificateId', '==', sanitizedCertificateId));
    const querySnapshot = await getDocs(q);
    
    // If certificate already exists, return its ID
    if (!querySnapshot.empty) {
      console.log('Certificate with this ID already exists, returning existing ID');
      return querySnapshot.docs[0].id;
    }

    // Otherwise create a new certificate
    const docRef = await addDoc(collection(db, 'certificates'), {
      name: sanitizedName,
      certificateId: sanitizedCertificateId,
      date: sanitizedDate,
      issuer: sanitizedIssuer,
      createdAt: new Date().toISOString()
    });

    console.log('Certificate added with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding certificate:', error.message);
    throw error;
  }
};

const getCertificate = async (linkId) => {
  try {
    console.log(`Verifying Certificate with ID: ${linkId}`);
    const docRef = doc(db, 'certificates', linkId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      console.warn(`Certificate with ID ${linkId} not found.`);
      return null;
    }

    console.log('Certificate found:', docSnap.data());
    return docSnap.data();
  } catch (error) {
    console.error('Error fetching certificate:', error);
    throw error;
  }
};

const getCertificateByIdField = async (certificateId) => {
  try {
    console.log(`Checking for certificate with ID: ${certificateId}`);
    const certificatesRef = collection(db, 'certificates');
    const q = query(certificatesRef, where('certificateId', '==', certificateId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`No certificate found with ID: ${certificateId}`);
      return null;
    }
    
    console.log('Certificate found');
    // Return the data and the document ID
    const data = querySnapshot.docs[0].data();
    data.docId = querySnapshot.docs[0].id; // Add document ID to the data
    return data;
  } catch (error) {
    console.error('Error fetching certificate by ID field:', error);
    throw error;
  }
};

module.exports = { addCertificate, getCertificate, getCertificateByIdField };