import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider
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
    case 'auth/email-already-in-use':
      return "Cette adresse e-mail est déjà associée à un compte.";
    case 'auth/weak-password':
      return "Le mot de passe est trop court (au moins 6 caractères requis).";
    case 'auth/operation-not-allowed':
      return "L'inscription par e-mail n'est pas activée sur la console Firebase.";
    case 'auth/popup-closed-by-user':
      return "La fenêtre de connexion Google a été fermée avant la finalisation.";
    case 'auth/cancelled-popup-request':
      return "Opération annulée (une seule tentative de connexion peut être traitée à la fois).";
    case 'auth/popup-blocked':
      return "La fenêtre pop-up Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up.";
    case 'auth/account-exists-with-different-credential':
      return "Un compte existe déjà avec cette adresse e-mail mais avec un mode de connexion différent.";
    case 'auth/unauthorized-domain':
      return "Domaine non autorisé dans Firebase pour Google Auth. Vérifiez les domaines autorisés dans la console Firebase.";
    default:
      return `Erreur d'authentification (${code || 'inconnue'}).`;
  }
}

export async function loginWithGoogle() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return await signInWithPopup(auth, provider);
}

export async function loginUser(email, password) {
  return await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function logoutUser() {
  return await signOut(auth);
}

export async function resetPassword(email) {
  const origin = (typeof window !== 'undefined' && window.location?.origin)
    ? window.location.origin
    : 'https://chat-lheureux.fr';
  const actionCodeSettings = {
    url: `${origin}/admin`,
    handleCodeInApp: false
  };
  return await sendPasswordResetEmail(auth, email.trim(), actionCodeSettings);
}

export async function registerUser(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName) {
    try {
      await updateProfile(userCredential.user, { displayName: displayName.trim() });
    } catch (e) {
      console.warn("Échec mise à jour du nom d'affichage :", e);
    }
  }
  return userCredential.user;
}

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}
