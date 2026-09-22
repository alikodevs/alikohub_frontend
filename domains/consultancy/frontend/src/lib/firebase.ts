import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCuejsEMA2RcHUojy6VGGSfmTsLQkUdRAo",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "aliko-auth.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "aliko-auth",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "aliko-auth.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "345783285092",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:345783285092:web:f4380e977d6ecf743b3671",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-MEKHZLS9RP",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
