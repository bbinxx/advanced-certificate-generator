# Certificate Generation & Verification System

A web application for creating, managing, and verifying digital certificates with QR code integration and bulk generation capabilities.

## Features

- 🔐 User Authentication (Firebase)
- 📝 Certificate Design Interface
  - Drag & Drop Elements
  - Text Customization
  - Shape Addition
  - Image Upload
  - Background Customization
- 📑 Certificate Management
  - Single Certificate Generation
  - Bulk Generation via CSV
  - PDF Export
  - Template Import/Export
- ✅ Certificate Verification
  - Unique Verification Links
  - QR Code Integration
  - Public Verification Portal

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript, EJS
- **Backend**: Node.js, Express.js
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **Storage**: Firebase Storage
- **Libraries**: 
  - Fabric.js (Canvas Manipulation)
  - Papa Parse (CSV Handling)
  - QR Code Generation

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd certificate-generation
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with your Firebase configuration:
```env
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_auth_domain
FIREBASE_DATABASE_URL=your_database_url
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
FIREBASE_APP_ID=your_app_id
FIREBASE_MEASUREMENT_ID=your_measurement_id
SESSION_SECRET=your_session_secret
```

4. Start the development server:
```bash
npm start
```

## Usage

1. **Authentication**
   - Sign up with email and password
   - Sign in to access the dashboard

2. **Certificate Design**
   - Access the design interface
   - Add/customize text elements
   - Insert shapes and images
   - Set background color/image
   - Save/load templates

3. **Certificate Generation**
   - Single mode: Generate one certificate
   - Bulk mode: Upload CSV for multiple certificates
   - Export as PDF or image

4. **Verification**
   - Each certificate gets a unique verification link
   - QR codes can be added for easy verification
   - Public verification portal for certificate authenticity

## API Endpoints

- `POST /api/certificate/add` - Create new certificate
- `GET /api/certificate/verify/:linkId` - Verify certificate
- `GET /api/certificate/status/:certificateId` - Check certificate status

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Fabric.js for canvas manipulation
- Firebase for authentication and database
- Express.js community