import admin from "firebase-admin";

const serviceAccount = JSON.parse(process.env.FIREBASE_KEY);

serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;
