// src/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyASMeQtIYv3gQmrq9RQrz5mkbLFm7FcZj0",
  authDomain: "learn-with-tuseef.firebaseapp.com",
  projectId: "learn-with-tuseef",
  storageBucket: "learn-with-tuseef.appspot.com",
  messagingSenderId: "402478684872",
  appId: "1:402478684872:web:0ce91735b15f0ac36863fd",
  measurementId: "G-4LYM97R88C",
};

// Prevent re-initialization during hot reload (Vite + React)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
