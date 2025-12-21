// Import the functions from the SDKs 
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDCHciIBndm_rCsKjyxodBvoC4zJ6mrAPA",
  authDomain: "fyp-gharkhoj.firebaseapp.com",
  projectId: "fyp-gharkhoj",
  storageBucket: "fyp-gharkhoj.firebasestorage.app",
  messagingSenderId: "963353808142",
  appId: "1:963353808142:web:bcc27bcf3c489894725b5f",
  measurementId: "G-LTJ0TLP1F6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication 
export const auth = getAuth(app);
export default app;