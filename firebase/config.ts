// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCn_gn6-vzenjZoDlx09l6xtbT8simIa5c",
  authDomain: "whisper-e1b8b.firebaseapp.com",
  projectId: "whisper-e1b8b",
  storageBucket: "whisper-e1b8b.firebasestorage.app",
  messagingSenderId: "503737583189",
  appId: "1:503737583189:web:4c280e29d9ed1a2d81f6dc"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;