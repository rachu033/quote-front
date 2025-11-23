import { initializeApp } from "firebase/app";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
} from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyBpgvYY27c7D3D4RQLzewUPDcRQOT6VT9I",
    authDomain: "quote-website-firebase.firebaseapp.com",
    projectId: "quote-website-firebase",
    storageBucket: "quote-website-firebase.firebasestorage.app",
    messagingSenderId: "549386272178",
    appId: "1:549386272178:web:814f21b01912b44fa3f8ab"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {
    auth,
    googleProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    sendEmailVerification,
};