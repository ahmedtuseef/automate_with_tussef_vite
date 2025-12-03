// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

/**
 * Replace values only if they are different in your Firebase console.
 * I used the config you shared earlier — leave as-is if identical.
 */
const firebaseConfig = {
  apiKey: "AIzaSyASMeQtIYv3gQmrq9RQrz5mkbLFm7FcZj0",
  authDomain: "learn-with-tuseef.firebaseapp.com",
  projectId: "learn-with-tuseef",
  storageBucket: "learn-with-tuseef.appspot.com",
  messagingSenderId: "402478684872",
  appId: "1:402478684872:web:0ce91735b15f0ac36863fd",
  measurementId: "G-4LYM97R88C"
};

// initialize once
const app = initializeApp(firebaseConfig);

// debug - open browser console to see this
console.log("[firebase] app initialized, projectId:", app.options?.projectId);

// exports
export const auth = getAuth(app);
export const db = getFirestore(app);
