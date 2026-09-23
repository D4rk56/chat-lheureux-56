import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail 
} from "firebase/auth";
import { auth } from "./config.js";

/**
 * Traduit les codes d'erreur Firebase Auth en messages explicites en français.
 * @param {string} code 
 * @returns {string}
 */
export function getAuthErrorMessage(code) {
  switch (code) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return "Identifiants incorrects ou compte non créé dans la console Firebase.";
    case 'auth/invalid-email':
      return "Format d'adresse e-mail invalide.";
    case 'auth/user-disabled':
      return "Ce compte utilisateur a été désactivé.";
    case 'auth/too-many-requests':
      return "Accès temporairement bloqué en raison de tentatives répétées. Réessayez dans quelques instants.";
    case 'auth/network-request-failed':
      return "Erreur réseau. Vérifiez votre connexion Internet.";
    default:
      return `Erreur d'authentification (${code || 'inconnue'}).`;
  }
}

export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logoutUser() {
  return await signOut(auth);
}

export async function resetPassword(email) {
  return await sendPasswordResetEmail(auth, email.trim());
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
