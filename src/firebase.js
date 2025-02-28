import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN || "cactus-golf.firebaseapp.com",
  projectId: process.env.REACT_APP_PROJECT_ID || "cactus-golf",
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET || "cactus-golf.firebasestorage.app",
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID || "169166804336",
  appId: process.env.REACT_APP_APP_ID || "1:169166804336:web:e0711949d28dd91ccf2bb5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
