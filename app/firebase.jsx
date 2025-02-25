// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC4zI1ng_l2W6Ax3WvrsZdYPR97duT3dJQ",
  authDomain: "lacoste-3573e.firebaseapp.com",
  projectId: "lacoste-3573e",
  storageBucket: "lacoste-3573e.firebasestorage.app",
  messagingSenderId: "828814361280",
  appId: "1:828814361280:web:15a784f6d9c8bc7df16325"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app)