import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD0-KrEtI3mK0nbYn-SIlXQf-uJfaPRYbE",
  authDomain: "tsn-e551b.firebaseapp.com",
  projectId: "tsn-e551b",
  storageBucket: "tsn-e551b.firebasestorage.app",
  messagingSenderId: "717953145367",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:717953145367:web:a4d84e3feef94882a99a52",
  measurementId: "G-6F4MTEBJCH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
