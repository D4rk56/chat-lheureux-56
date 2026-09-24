import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Clé API Firebase (priorité aux variables d'environnement Netlify / Vite)
const apiKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY)
  || (typeof process !== "undefined" && process.env?.FIREBASE_API_KEY)
  || (typeof process !== "undefined" && process.env?.VITE_FIREBASE_API_KEY)
  || "AIzaSyCrmwfjhttviYl1bHXOS67oJY41kM2QVXE";

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: "chat-lheureux-56.firebaseapp.com",
  projectId: "chat-lheureux-56",
  storageBucket: "chat-lheureux-56.firebasestorage.app",
  messagingSenderId: "238050920889",
  appId: "1:238050920889:web:08f43e255fd1cb2f9c4e68",
  measurementId: "G-WTTZKK7WE3"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialisation de Firestore avec persistance multi-onglets (IndexedDB dans le navigateur)
let firestoreDb;
if (typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined') {
  try {
    firestoreDb = initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
  } catch (e) {
    console.warn("Initialisation cache persistant Firestore (fallback standard) :", e);
    firestoreDb = getFirestore(app);
  }
} else {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

// Initialisation de Google Analytics (uniquement côté navigateur compatible)
let analyticsInstance = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analyticsInstance = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Google Analytics (Firebase) non disponible :", err);
  });
}

export const analytics = analyticsInstance;

