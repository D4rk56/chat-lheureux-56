import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Clé API Firebase (chargée de manière sécurisée via variables d'environnement Netlify / Vite)
const apiKey = (typeof import.meta !== "undefined" && import.meta.env?.VITE_FIREBASE_API_KEY)
  || (typeof process !== "undefined" && process.env?.FIREBASE_API_KEY)
  || (typeof process !== "undefined" && process.env?.VITE_FIREBASE_API_KEY)
  || "FIREBASE_API_KEY_PLACEHOLDER";

// Détermination dynamique de l'authDomain :
// Si l'utilisateur est sur chat-lheureux.netlify.app ou chat-lheureux.fr,
// utiliser le même domaine d'origine pour éviter le blocage des cookies tiers
// (partitioned cookies) grâce au proxy Netlify /__/auth/*
export function resolveAuthDomain() {
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;
    if (
      hostname === "chat-lheureux.netlify.app" ||
      hostname === "chat-lheureux.fr" ||
      hostname.endsWith(".netlify.app") ||
      hostname.endsWith("chat-lheureux.fr")
    ) {
      return hostname;
    }
  }
  return "chat-lheureux-56.firebaseapp.com";
}

const firebaseConfig = {
  apiKey: apiKey,
  authDomain: resolveAuthDomain(),
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

