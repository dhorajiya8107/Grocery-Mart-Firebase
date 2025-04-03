import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
export const firebaseConfig = {
    apiKey: "AIzaSyBd0EnSfM3u8N6LgCHvkBMNaDQEB6wqkZg",
    authDomain: "e-commerce-4562f.firebaseapp.com",
    projectId: "e-commerce-4562f",
    storageBucket: "e-commerce-4562f.firebasestorage.app",
    messagingSenderId: "29994927951",
    appId: "1:29994927951:web:46431a15a52f03fba5673a",
    measurementId: "G-L7G2M9DWW4"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
const storage = getStorage(app);


// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export { storage };