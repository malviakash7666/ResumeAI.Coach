import admin from "firebase-admin";
const firebaseAdmin = admin.default || admin;

try {
  const app = firebaseAdmin.initializeApp({
    credential: firebaseAdmin.cert({
      projectId: "dummy-id",
      clientEmail: "dummy-email",
      privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC7\n-----END PRIVATE KEY-----",
    }),
  });
  console.log("App initialized successfully with admin.cert!");
} catch (err) {
  console.error("Initialization failed:", err.message);
}
