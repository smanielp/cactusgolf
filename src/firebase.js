import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC7oAzGbLlze1ihxw_fjdml3KnHMiTVDvw",
  authDomain: "cactus-golf.firebaseapp.com",
  projectId: "cactus-golf",
  storageBucket: "cactus-golf.firebasestorage.app",
  messagingSenderId: "169166804336",
  appId: "1:169166804336:web:e0711949d28dd91ccf2bb5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const db = getFirestore(app);
export const auth = getAuth(app);
