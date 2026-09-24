import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "./config.js";
import { USER_ROLES, isSuperAdminEmail } from "../utils/roles.js";
import { generateRandomInviteCode, normalizeInviteCode } from "../utils/inviteCodes.js";

const USERS_COLLECTION = "users";
const CODES_COLLECTION = "invitationCodes";

/**
 * Récupère le profil utilisateur et son rôle depuis Firestore.
 * @param {string} uid 
 * @returns {Promise<Object|null>}
 */
export async function fetchUserProfile(uid) {
  if (!uid) return null;
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return { uid, ...snap.data() };
  }
  return null;
}

/**
 * Assure la présence de l'utilisateur dans la collection `users`.
 * L'administrateur principal (dark56100@gmail.com) est garanti avec le rôle 'Administrateur'.
 * @param {Object} user Firebase Auth User
 * @param {string} [initialRole] Rôle explicite attribué (ex: lors d'une inscription par invitation)
 * @returns {Promise<Object>}
 */
export async function ensureUserRecord(user, initialRole = null) {
  if (!user || !user.uid) return null;

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(userRef);
  const now = new Date().toISOString();
  const isSuperAdmin = isSuperAdminEmail(user.email);

  if (snap.exists()) {
    const existing = snap.data();

    // S'assurer que l'administrateur principal possède toujours le rôle Administrateur
    if (isSuperAdmin && existing.role !== USER_ROLES.ADMIN) {
      try {
        await updateDoc(userRef, { role: USER_ROLES.ADMIN, isSuperAdmin: true, updatedAt: now });
        existing.role = USER_ROLES.ADMIN;
        existing.isSuperAdmin = true;
      } catch (e) {
        console.warn("Échec promotion admin principal :", e);
      }
    }

    // Si un rôle explicite a été spécifié (ex: via un code d'invitation) et diffère de l'existant
    if (!isSuperAdmin && initialRole && existing.role !== initialRole) {
      try {
        await updateDoc(userRef, { role: initialRole, lastLoginAt: now, updatedAt: now });
        return { uid: user.uid, ...existing, role: initialRole, lastLoginAt: now };
      } catch (e) {
        console.warn("Échec mise à jour du rôle utilisateur :", e);
      }
    }
    // Mise à jour de la date de dernière connexion
    try {
      await updateDoc(userRef, { lastLoginAt: now });
    } catch (e) {
      console.warn("Échec mise à jour lastLoginAt :", e);
    }
    return { 
      uid: user.uid, 
      ...existing, 
      role: isSuperAdmin ? USER_ROLES.ADMIN : existing.role, 
      isSuperAdmin: isSuperAdmin || existing.isSuperAdmin,
      lastLoginAt: now 
    };
  }

  // L'utilisateur n'existe pas encore dans Firestore
  let assignedRole = isSuperAdmin ? USER_ROLES.ADMIN : initialRole;

  if (!assignedRole) {
    if (isSuperAdmin) {
      assignedRole = USER_ROLES.ADMIN;
    } else {
      try {
        const allUsersSnap = await getDocs(query(collection(db, USERS_COLLECTION), limit(1)));
        if (allUsersSnap.empty) {
          // Premier utilisateur du système : nommé Administrateur par défaut
          assignedRole = USER_ROLES.ADMIN;
        } else {
          // Par défaut pour un utilisateur existant sans profil : Bénévole
          assignedRole = USER_ROLES.BENEVOLE;
        }
      } catch (err) {
        console.warn("Erreur comptage utilisateurs, fallback Bénévole :", err);
        assignedRole = USER_ROLES.BENEVOLE;
      }
    }
  }

  const newProfile = {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || user.email?.split('@')[0] || 'Membre',
    role: assignedRole,
    createdAt: now,
    lastLoginAt: now
  };

  try {
    await setDoc(userRef, newProfile);
  } catch (err) {
    console.error("Erreur enregistrement profil utilisateur :", err);
  }

  return newProfile;
}

/**
 * Récupère tous les membres inscrits
 * @returns {Promise<Array>}
 */
export async function fetchAllUsers() {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  const list = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() });
  });
  // Tri par date de création décroissante
  return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

/**
 * Modifie le rôle d'un utilisateur
 * @param {string} uid 
 * @param {string} newRole 
 * @returns {Promise<void>}
 */
export async function updateUserRole(uid, newRole) {
  if (!uid || !newRole) return;
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (snap.exists() && isSuperAdminEmail(snap.data()?.email)) {
    throw new Error("Impossible de modifier le rôle de l'administrateur principal.");
  }
  await updateDoc(userRef, {
    role: newRole,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Supprime le profil d'un membre de la base
 * @param {string} uid 
 * @returns {Promise<void>}
 */
export async function deleteUserRecord(uid) {
  if (!uid) return;
  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (snap.exists() && isSuperAdminEmail(snap.data()?.email)) {
    throw new Error("Impossible de supprimer le compte de l'administrateur principal.");
  }
  await deleteDoc(userRef);
}

// ==========================================
// GESTION DES CODES D'INVITATION BÉNÉVOLES
// ==========================================

/**
 * Crée un nouveau code d'invitation à usage unique
 * @param {Object} params
 * @param {string} params.role 'Benevole' | 'Gestion' | 'Administrateur'
 * @param {string} params.note Note interne (ex: nom du bénévole invité)
 * @param {string} params.createdBy Email de l'administrateur
 * @returns {Promise<Object>}
 */
export async function createInviteCode({ role = USER_ROLES.BENEVOLE, note = '', createdBy = '' }) {
  const code = generateRandomInviteCode();
  const now = new Date().toISOString();
  
  const payload = {
    code,
    role,
    note: (note || '').trim(),
    createdBy: createdBy || 'admin',
    createdAt: now,
    used: false,
    usedBy: null,
    usedByEmail: null,
    usedAt: null
  };

  const codeRef = doc(db, CODES_COLLECTION, code);
  await setDoc(codeRef, payload);
  return { id: code, ...payload };
}

/**
 * Liste tous les codes d'invitation
 * @returns {Promise<Array>}
 */
export async function fetchInviteCodes() {
  const snap = await getDocs(collection(db, CODES_COLLECTION));
  const list = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() });
  });
  return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

/**
 * Vérifie la validité d'un code d'invitation saisi par un utilisateur
 * Accès unitaire direct par ID pour empêcher le listing public non authentifié
 * @param {string} rawCode 
 * @returns {Promise<{ valid: boolean, error?: string, codeDoc?: Object }>}
 */
export async function validateInviteCode(rawCode) {
  const normalized = normalizeInviteCode(rawCode);
  if (!normalized) {
    return { valid: false, error: "Veuillez renseigner un code d'invitation." };
  }

  // 1. Accès direct par ID de document (O(1) sécurisé)
  const directRef = doc(db, CODES_COLLECTION, normalized);
  let snap = null;
  try {
    snap = await getDoc(directRef);
  } catch (err) {
    console.warn("Erreur lecture directe code :", err);
  }

  let docItem = null;
  let data = null;

  if (snap && snap.exists()) {
    docItem = snap;
    data = snap.data();
  } else {
    // 2. Rétro-compatibilité pour éventuels codes stockés avec ID auto-généré
    try {
      const q = query(
        collection(db, CODES_COLLECTION),
        where("code", "==", normalized),
        limit(1)
      );
      const querySnap = await getDocs(q);
      if (!querySnap.empty) {
        docItem = querySnap.docs[0];
        data = docItem.data();
      }
    } catch {
      // Ignorer si la règle de sécurité désactive le listing aux anonymes
    }
  }

  if (!docItem || !data) {
    return { valid: false, error: "Code d'invitation invalide ou inconnu." };
  }

  if (data.used) {
    return { 
      valid: false, 
      error: "Ce code d'invitation a déjà été utilisé pour créer un compte." 
    };
  }

  return {
    valid: true,
    codeDoc: { id: docItem.id, ...data }
  };
}

/**
 * Marque un code d'invitation comme utilisé
 * @param {string} codeId 
 * @param {string} uid 
 * @param {string} email 
 * @returns {Promise<void>}
 */
export async function redeemInviteCode(codeId, uid, email) {
  if (!codeId) return;
  const codeRef = doc(db, CODES_COLLECTION, codeId);
  await updateDoc(codeRef, {
    used: true,
    usedBy: uid,
    usedByEmail: email,
    usedAt: new Date().toISOString()
  });
}

/**
 * Supprime un code d'invitation
 * @param {string} codeId 
 * @returns {Promise<void>}
 */
export async function deleteInviteCode(codeId) {
  if (!codeId) return;
  const codeRef = doc(db, CODES_COLLECTION, codeId);
  await deleteDoc(codeRef);
}
