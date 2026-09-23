import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCrmwfjhttviYl1bHXOS67oJY41kM2QVXE",
  authDomain: "chat-lheureux-56.firebaseapp.com",
  projectId: "chat-lheureux-56",
  storageBucket: "chat-lheureux-56.firebasestorage.app",
  messagingSenderId: "238050920889",
  appId: "1:238050920889:web:08f43e255fd1cb2f9c4e68"
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

