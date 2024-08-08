// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import axios from 'axios';

import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User,
    UserCredential,
    signOut,
} from "firebase/auth";


const api_url = "http://127.0.0.1:5000";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDIp5eQ2vVE5V0eoNituY7g5ugrO9iypBY",
  authDomain: "comment-crafter.firebaseapp.com",
  projectId: "comment-crafter",
  storageBucket: "comment-crafter.appspot.com",
  messagingSenderId: "737754814579",
  appId: "1:737754814579:web:cea1429efcd825e5fbf206",
  measurementId: "G-878N1FLEH9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const auth = getAuth(app);



// The below wrapper functions allow us to not expose the auth variable to our components

/**
 * Sign the uer in through Google with popup
 * @returns A Promise that resolves with the user's credentials
 */
export async function signUserInWithGoogle(): Promise<UserCredential> {
    const userCredential = await signInWithPopup(auth, new GoogleAuthProvider());

    // Get the ID token of the signed-in user
    const token = await userCredential.user.getIdToken();
    console.log(token);

    // send the token to backend API to create the user in Firestore
    const response = await axios.post(`${api_url}/auth/create_user`, { token });

    console.log('Response from backend:', response.data);

    return userCredential;
}

/**
 * Sign the user out
 * @returns A Promise that resolves when the user has been signed out
 */
export function signUserOut(): Promise<void> {
    return auth.signOut();
}


/**
 * Triggers a callback when the user auth state changes
 * @returns A function to unsubscribe callback
 */
export function onAuthStateChangedHelper(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
}