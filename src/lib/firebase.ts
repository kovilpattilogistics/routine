import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;

export { app, auth, db };

export function getAuthErrorMessage(err: any, defaultMessage: string = "An error occurred."): string {
  if (!err || typeof err.code !== 'string') return defaultMessage;
  
  switch (err.code) {
    case 'auth/email-already-in-use':
      return "This email is already registered. Please sign in instead.";
    case 'auth/invalid-email':
      return "Please enter a valid email address.";
    case 'auth/weak-password':
      return "Your password is too weak. Please use a stronger password.";
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "Incorrect email or password. Please try again.";
    case 'auth/too-many-requests':
      return "Too many failed attempts. Please try again later.";
    case 'auth/configuration-not-found':
      return "Setup Incomplete: Please enable 'Email/Password' authentication in your Firebase Console.";
    case 'auth/invalid-api-key':
      return "Invalid configuration: Please check your Firebase API key.";
    case 'auth/network-request-failed':
      return "Network error: Please check your internet connection.";
    default:
      return defaultMessage;
  }
}
