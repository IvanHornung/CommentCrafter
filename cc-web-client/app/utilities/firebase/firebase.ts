// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import config from "@/app/config";

import {
    getAuth,
    signInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    User,
    UserCredential,
    signOut,
    Unsubscribe,
} from "firebase/auth";


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
    return signInWithPopup(auth, new GoogleAuthProvider());
}

/**
 * Sign the user out
 * @returns A Promise that resolves when the user has been signed out
 */
export function signUserOut(): Promise<void> {
    return auth.signOut();
}


/**
 * Triggers a callback when the user auth state changes. 
 * @returns A function to unsubscribe callback
 */
export function onAuthStateChangedHelper(callback: (user: User | null) => void): Unsubscribe {
    return onAuthStateChanged(auth, (user) => { 
        if (user) { // if user is signed in

            const userData = { // only fields we need from client side
                user_id: user.uid,
                username: user.email,
                pfp: user.photoURL || "",
            }
            
            // Call cc-api-service to handle account creation logic
            fetch(`${config.api_url}/auth/create_user`, {
                method: 'POST', // Note: account will not be created if already exists (per backend logic)
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData),
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
                // call the provided callback with user object
                callback(user);
            })
            .catch(error => {
                console.error('Error:', error);
                callback(user);
            });

        } else { // else user is signed out
            console.log("User is signed out.");
            callback(user);
        }
    });
}