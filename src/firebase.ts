import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getAuth, 
  initializeAuth,
  inMemoryPersistence,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification
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
try {
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
} catch (e) {
  console.error("[Firebase] initializeApp failed:", e);
}

// Critical: export initialized firestore DB instance
export let db: any;
try {
  db = getFirestore(app, config.firestoreDatabaseId || "default");
} catch (e) {
  console.error("[Firebase] getFirestore failed, falling back to dummy Firestore db object:", e);
  db = {
    _dummy: true,
  } as any;
}

// Critical: export initialized Firebase Auth client
export let auth: any;
try {
  auth = initializeAuth(app, {
    persistence: inMemoryPersistence
  });
} catch (authError: any) {
  if (authError && authError.code === "auth/already-initialized") {
    try {
      auth = getAuth(app);
    } catch (getAuthErr) {
      console.error("[Firebase] getAuth failed after already-initialized error:", getAuthErr);
    }
  } else {
    console.warn("[Firebase] initializeAuth with inMemoryPersistence failed, falling back to default or mock:", authError);
    try {
      auth = getAuth(app);
    } catch (fallbackError) {
      console.error("[Firebase] getAuth fallback failed, setting up mock auth:", fallbackError);
      auth = {
        currentUser: null,
        onAuthStateChanged: (callback: any) => {
          setTimeout(() => callback(null), 0);
          return () => {};
        },
        signOut: async () => {},
        signInWithEmailAndPassword: async () => { throw new Error("Firebase Auth is unavailable in this sandbox."); },
        createUserWithEmailAndPassword: async () => { throw new Error("Firebase Auth is unavailable in this sandbox."); },
      } as any;
    }
  }
}

// Critical: export initialized Firebase Storage instance
export let storage: any;
try {
  storage = getStorage(app);
} catch (e) {
  console.error("[Firebase] getStorage failed, falling back to dummy storage object:", e);
  storage = {
    _dummy: true,
  } as any;
}

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
  sendPasswordResetEmail,
  sendEmailVerification
};
