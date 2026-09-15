// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBoKcH0AAvvl3nasFG2-cvG7j1zCHq6aio",
  authDomain: "vaxsafe-87dc8.firebaseapp.com",
  projectId: "vaxsafe-87dc8",
  storageBucket: "vaxsafe-87dc8.firebasestorage.app",
  messagingSenderId: "629330209725",
  appId: "1:629330209725:web:ab49077025a251117080d4",
  measurementId: "G-KC4V9Y3Y1B"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
