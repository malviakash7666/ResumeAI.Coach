import admin from "firebase-admin";

// ESM compatibility wrapper for CommonJS default export
const firebaseAdmin = admin.credential ? admin : (admin.default || admin);

let firebaseAdminApp = null;

if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');
    
    // Support both older (credential.cert) and modern modular (cert) structures
    const certMethod = (firebaseAdmin.credential && firebaseAdmin.credential.cert) || firebaseAdmin.cert;
    if (!certMethod) {
      throw new Error("Could not find cert method on firebase-admin SDK.");
    }

    firebaseAdminApp = firebaseAdmin.initializeApp({
      credential: certMethod.call(firebaseAdmin.credential || firebaseAdmin, {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });
    console.log("🔥 Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.error("❌ Firebase Admin SDK initialization failed:", error.message);
  }
} else {
  console.warn("⚠️ Firebase Admin credentials missing. Google Login will fail verification.");
}

export default firebaseAdmin;
