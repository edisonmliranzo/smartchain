// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDva9m8blQJv1U3QbmRvIrSROQlCQ4WcT8",
    authDomain: "smartchain-e6c0f.firebaseapp.com",
    databaseURL: "https://smartchain-e6c0f-default-rtdb.firebaseio.com",
    projectId: "smartchain-e6c0f",
    storageBucket: "smartchain-e6c0f.firebasestorage.app",
    messagingSenderId: "1078276898414",
    appId: "1:1078276898414:web:11fa7f77e9e9645ece307f",
    measurementId: "G-1RH2ZZ8148"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
const db = getDatabase(app);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, db, auth, firestore, storage };
export default app;
