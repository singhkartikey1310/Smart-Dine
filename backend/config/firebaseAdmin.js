const admin = require('firebase-admin');

let initialized = false;

const initFirebaseAdmin = () => {
  if (initialized || admin.apps.length > 0) return admin;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || projectId === 'your_project_id' || !clientEmail || !rawKey) {
    console.log('⚠️  Firebase Admin not configured — phone OTP login disabled');
    return null;
  }

  // Fix private key formatting — .env files escape \n as \\n
  // Handle all possible formats:
  // 1. "-----BEGIN...\\n...-----END" (escaped newlines)
  // 2. "-----BEGIN...\n...-----END" (literal newlines already)
  // 3. Key wrapped in quotes with escaped newlines
  let privateKey = rawKey
    .replace(/\\n/g, '\n')   // replace escaped \n with real newlines
    .replace(/^"|"$/g, '');  // remove surrounding quotes if any

  // Validate it looks like a PEM key
  if (!privateKey.includes('-----BEGIN')) {
    console.error('❌ Firebase private key format invalid — check FIREBASE_PRIVATE_KEY in .env');
    return null;
  }

  try {
    const serviceAccount = {
      type: 'service_account',
      project_id: projectId,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey,
      client_email: clientEmail,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    initialized = true;
    console.log('✅ Firebase Admin initialized — project:', projectId);
  } catch (err) {
    console.error('❌ Firebase Admin init failed:', err.message);
    return null;
  }

  return admin;
};

// Initialize on module load
initFirebaseAdmin();

module.exports = admin;
