import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "./firebase-applet-config.json";

// Extract configuration from JSON or from environment variables (client-side VITE_ prefix fallback)
const env = (import.meta as any).env || {};
const config = {
  apiKey: firebaseConfig.apiKey || (env.VITE_FIREBASE_API_KEY as string) || "",
  authDomain: firebaseConfig.authDomain || (env.VITE_FIREBASE_AUTH_DOMAIN as string) || "",
  projectId: firebaseConfig.projectId || (env.VITE_FIREBASE_PROJECT_ID as string) || "",
  storageBucket: firebaseConfig.storageBucket || (env.VITE_FIREBASE_STORAGE_BUCKET as string) || "",
  messagingSenderId: firebaseConfig.messagingSenderId || (env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || "",
  appId: firebaseConfig.appId || (env.VITE_FIREBASE_APP_ID as string) || "",
  measurementId: firebaseConfig.measurementId || (env.VITE_FIREBASE_MEASUREMENT_ID as string) || "",
  firestoreDatabaseId: firebaseConfig.firestoreDatabaseId || (env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || "default"
};

export const isConfigured = !!(config.apiKey && config.projectId && !config.apiKey.startsWith("placeholder") && config.apiKey !== "");

let app;
if (getApps().length === 0) {
  if (isConfigured) {
    app = initializeApp(config);
  } else {
    // Safe initialization block to prevent the Node/Vite app from crashing on start 
    // due to missing keys (e.g. during pre-configuration phases), while displaying a warning
    console.warn(
      "Warning: Firebase credentials are unconfigured or incomplete. Please verify settings in firebase-applet-config.json."
    );
    app = initializeApp({
      apiKey: "placeholder-api-key-to-prevent-startup-crash-errors",
      authDomain: "placeholder-auth-domain.firebaseapp.com",
      projectId: "placeholder-project-id",
      storageBucket: "placeholder-storage-bucket.appspot.com",
      messagingSenderId: "00000000000",
      appId: "1:00000000000:web:00000000000"
    });
  }
} else {
  app = getApp();
}

// Critical: export initialized firestore DB instance
export const db = getFirestore(app, config.firestoreDatabaseId || "default");

// Critical: export initialized Firebase Auth client
export const auth = getAuth(app);

// Critical: export initialized Firebase Storage instance
export const storage = getStorage(app);

// Facilitate Google Sign-In helper if requested
export const googleProvider = new GoogleAuthProvider();
const googleClientId = (firebaseConfig as any).googleClientId || (env.VITE_FIREBASE_GOOGLE_CLIENT_ID as string) || "";
if (googleClientId) {
  googleProvider.setCustomParameters({
    client_id: googleClientId
  });
}

// Common auth utility integrations
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail
};
