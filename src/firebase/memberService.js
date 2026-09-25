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
import { USER_ROLES, isSuperAdminEmail, isAssoPresidentEmail } from "../utils/roles.js";
import { generateRandomInviteCode, normalizeInviteCode } from "../utils/inviteCodes.js";

const USERS_COLLECTION = "users";
const CODES_COLLECTION = "invitationCodes";

/**
 * Comptes membres historiques de l'association (créés manuellement sur Firebase)
 * Auto-provisionnés dans Firestore afin d'apparaître immédiatement dans l'annuaire membres.
 */
export const KNOWN_ACCOUNTS = [
  {
    email: 'dark56100@gmail.com',
    fullName: 'Administrateur Principal',
    displayName: 'Dark56',
    role: USER_ROLES.ADMIN,
    phone: '',
    isSuperAdmin: true
  },
  {
    email: 'asso.chatslheureux@gmail.com',
    fullName: 'Association Chat L\'Heureux 56',
    displayName: 'Présidence / Association',
    role: USER_ROLES.ADMIN,
    phone: '06 61 50 88 28',
    isPresident: true
  },
  {
    email: 'galexandre@galexandre.com',
    fullName: 'Alexandre G.',
    displayName: 'Alexandre',
    role: USER_ROLES.GESTION,
    phone: ''
  }
];

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
 * Vérifie si un utilisateur Firebase Auth est déjà un membre enregistré / pré-autorisé de l'association.
 * Permet de déterminer si un utilisateur Google a besoin d'un code d'invitation lors de sa première connexion.
 * @param {Object} firebaseUser 
 * @returns {Promise<boolean>}
 */
export async function isRegisteredMember(firebaseUser) {
  if (!firebaseUser) return false;
  const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();
  if (isSuperAdminEmail(cleanEmail) || isAssoPresidentEmail(cleanEmail)) return true;
  if (KNOWN_ACCOUNTS.some(k => k.email.toLowerCase() === cleanEmail)) return true;

  try {
    const userRef = doc(db, USERS_COLLECTION, firebaseUser.uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) return true;

    if (cleanEmail) {
      const syntheticId = 'account_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const synthRef = doc(db, USERS_COLLECTION, syntheticId);
      const synthSnap = await getDoc(synthRef);
      if (synthSnap.exists()) return true;
    }
  } catch (err) {
    console.warn("Erreur vérification membre enregistré :", err);
  }
  return false;
}

/**
 * Assure la présence de l'utilisateur dans la collection `users`.
 * L'administrateur principal (dark56100@gmail.com) et le compte association sont garantis avec le rôle 'Administrateur'.
 * @param {Object} user Firebase Auth User
 * @param {string} [initialRole] Rôle explicite attribué (ex: lors d'une inscription par invitation)
 * @param {Object} [extraProfile] Données additionnelles (fullName, phone, pseudo)
 * @returns {Promise<Object>}
 */
export async function ensureUserRecord(user, initialRole = null, extraProfile = {}) {
  if (!user || !user.uid) return null;

  const userRef = doc(db, USERS_COLLECTION, user.uid);
  const snap = await getDoc(userRef);
  const now = new Date().toISOString();
  const isSuperAdmin = isSuperAdminEmail(user.email);
  const isPresident = isAssoPresidentEmail(user.email);
  const cleanEmail = user.email?.trim().toLowerCase();

  // Si l'utilisateur n'existe pas encore sous son UID Auth, vérifier s'il a un profil pré-provisionné
  if (!snap.exists() && cleanEmail) {
    const syntheticId = 'account_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const synthRef = doc(db, USERS_COLLECTION, syntheticId);
    try {
      const synthSnap = await getDoc(synthRef);
      if (synthSnap.exists()) {
        const synthData = synthSnap.data();
        const merged = {
          ...synthData,
          uid: user.uid,
          id: user.uid,
          lastLoginAt: now,
          updatedAt: now
        };
        await setDoc(userRef, merged);
        try { await deleteDoc(synthRef); } catch (_) {}
        return merged;
      }
    } catch (_) {}
  }

  if (snap.exists()) {
    const existing = snap.data();

    // S'assurer que le super admin et la présidence conservent toujours le rôle Administrateur
    const mustBeAdmin = isSuperAdmin || isPresident;
    if (mustBeAdmin && existing.role !== USER_ROLES.ADMIN) {
      try {
        await updateDoc(userRef, { 
          role: USER_ROLES.ADMIN, 
          isSuperAdmin: isSuperAdmin || existing.isSuperAdmin,
          isPresident: isPresident || existing.isPresident,
          updatedAt: now 
        });
        existing.role = USER_ROLES.ADMIN;
      } catch (e) {
        console.warn("Échec promotion admin :", e);
      }
    }

    // Mise à jour éventuelle des infos profil complémentaires (ex: nom, téléphone, pseudo)
    const updates = { lastLoginAt: now };
    if (extraProfile.fullName && !existing.fullName) updates.fullName = extraProfile.fullName;
    if (extraProfile.phone && !existing.phone) updates.phone = extraProfile.phone;
    if (extraProfile.pseudo && !existing.pseudo) updates.pseudo = extraProfile.pseudo;
    if (extraProfile.displayName && (!existing.displayName || existing.displayName === 'Membre')) {
      updates.displayName = extraProfile.displayName;
    }
    if ((user.photoURL || extraProfile.photoURL) && !existing.photoURL) {
      updates.photoURL = extraProfile.photoURL || user.photoURL;
    }

    // Si un rôle explicite a été spécifié (ex: via un code d'invitation) et diffère de l'existant
    if (!mustBeAdmin && initialRole && existing.role !== initialRole) {
      updates.role = initialRole;
      updates.updatedAt = now;
    }

    try {
      await updateDoc(userRef, updates);
    } catch (e) {
      console.warn("Échec mise à jour profil :", e);
    }

    return { 
      uid: user.uid, 
      ...existing, 
      ...updates,
      role: mustBeAdmin ? USER_ROLES.ADMIN : (updates.role || existing.role), 
      isSuperAdmin: isSuperAdmin || existing.isSuperAdmin,
      isPresident: isPresident || existing.isPresident,
      lastLoginAt: now 
    };
  }

  // L'utilisateur n'existe pas encore dans Firestore
  let assignedRole = (isSuperAdmin || isPresident) ? USER_ROLES.ADMIN : initialRole;

  if (!assignedRole) {
    if (isSuperAdmin || isPresident) {
      assignedRole = USER_ROLES.ADMIN;
    } else {
      assignedRole = USER_ROLES.BENEVOLE;
    }
  }

  const known = KNOWN_ACCOUNTS.find(k => k.email?.toLowerCase() === cleanEmail);

  const newProfile = {
    uid: user.uid,
    id: user.uid,
    email: user.email || '',
    fullName: extraProfile.fullName || known?.fullName || user.displayName || '',
    pseudo: extraProfile.pseudo || known?.pseudo || '',
    phone: extraProfile.phone || known?.phone || '',
    displayName: extraProfile.displayName || extraProfile.pseudo || extraProfile.fullName || known?.displayName || user.displayName || user.email?.split('@')[0] || 'Membre',
    photoURL: extraProfile.photoURL || user.photoURL || '',
    role: assignedRole,
    isSuperAdmin: isSuperAdmin || !!known?.isSuperAdmin,
    isPresident: isPresident || !!known?.isPresident,
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
 * Récupère tous les membres inscrits avec auto-provisioning des comptes existants
 * @returns {Promise<Array>}
 */
export async function fetchAllUsers() {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  const list = [];
  snap.forEach((d) => {
    list.push({ id: d.id, uid: d.id, ...d.data() });
  });

  // Provisioning automatique des comptes manuels Firebase pré-existants s'ils ne sont pas encore dans Firestore
  const existingEmails = new Set(list.map(u => u.email?.toLowerCase().trim()).filter(Boolean));
  for (const account of KNOWN_ACCOUNTS) {
    if (!existingEmails.has(account.email.toLowerCase())) {
      const now = new Date().toISOString();
      const syntheticId = 'account_' + account.email.replace(/[^a-zA-Z0-9]/g, '_');
      const docRef = doc(db, USERS_COLLECTION, syntheticId);
      const newDoc = {
        uid: syntheticId,
        id: syntheticId,
        email: account.email,
        fullName: account.fullName,
        displayName: account.displayName || account.fullName,
        phone: account.phone || '',
        pseudo: account.pseudo || '',
        role: account.role,
        isSuperAdmin: !!account.isSuperAdmin,
        isPresident: !!account.isPresident,
        createdAt: now,
        lastLoginAt: null
      };
      try {
        await setDoc(docRef, newDoc);
        list.push(newDoc);
        existingEmails.add(account.email.toLowerCase());
      } catch (err) {
        console.warn("Échec auto-provisioning compte :", account.email, err);
        list.push(newDoc);
      }
    } else {
      const existingUser = list.find(u => u.email?.toLowerCase().trim() === account.email.toLowerCase());
      if (existingUser) {
        let changed = false;
        const updates = {};
        if (account.isSuperAdmin && existingUser.role !== USER_ROLES.ADMIN) {
          existingUser.role = USER_ROLES.ADMIN;
          existingUser.isSuperAdmin = true;
          updates.role = USER_ROLES.ADMIN;
          updates.isSuperAdmin = true;
          changed = true;
        }
        if (account.isPresident && (!existingUser.isPresident || existingUser.role !== USER_ROLES.ADMIN)) {
          existingUser.role = USER_ROLES.ADMIN;
          existingUser.isPresident = true;
          updates.role = USER_ROLES.ADMIN;
          updates.isPresident = true;
          changed = true;
        }
        if (!existingUser.fullName || existingUser.fullName === 'Membre') {
          existingUser.fullName = account.fullName;
          updates.fullName = account.fullName;
          changed = true;
        }
        if (!existingUser.phone && account.phone) {
          existingUser.phone = account.phone;
          updates.phone = account.phone;
          changed = true;
        }
        if (changed) {
          try {
            await updateDoc(doc(db, USERS_COLLECTION, existingUser.id || existingUser.uid), updates);
          } catch (_) {}
        }
      }
    }
  }

  // Tri : Super Admin et Présidence en tête, puis par date
  return list.sort((a, b) => {
    if (isSuperAdminEmail(a.email)) return -1;
    if (isSuperAdminEmail(b.email)) return 1;
    if (isAssoPresidentEmail(a.email)) return -1;
    if (isAssoPresidentEmail(b.email)) return 1;
    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });
}

/**
 * Enregistre manuellement un membre préexistant dans Firestore
 * @param {Object} data 
 * @returns {Promise<Object>}
 */
export async function addManualMember({ email, fullName, phone, pseudo = '', role = USER_ROLES.BENEVOLE }) {
  if (!email || !email.includes('@')) throw new Error("Une adresse e-mail valide est requise.");
  if (!fullName || !fullName.trim()) throw new Error("Le vrai nom et prénom sont obligatoires.");
  if (!phone || !phone.trim()) throw new Error("Le numéro de téléphone est obligatoire.");

  const cleanEmail = email.trim().toLowerCase();
  const id = 'manual_' + cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const userRef = doc(db, USERS_COLLECTION, id);
  const now = new Date().toISOString();

  const isSuperAdmin = isSuperAdminEmail(cleanEmail);
  const isPresident = isAssoPresidentEmail(cleanEmail);

  const payload = {
    uid: id,
    id: id,
    email: cleanEmail,
    fullName: fullName.trim(),
    displayName: (pseudo && pseudo.trim()) || fullName.trim(),
    pseudo: (pseudo && pseudo.trim()) || '',
    phone: phone.trim(),
    role: (isSuperAdmin || isPresident) ? USER_ROLES.ADMIN : (role || USER_ROLES.BENEVOLE),
    isSuperAdmin,
    isPresident,
    createdAt: now,
    lastLoginAt: null
  };

  await setDoc(userRef, payload, { merge: true });
  return payload;
}

/**
 * Met à jour les coordonnées et le profil d'un membre (nom, téléphone, pseudo, rôle)
 * Utilisé par les administrateurs pour corriger une faute de frappe ou un changement de numéro.
 * @param {string} uid 
 * @param {Object} profileUpdates 
 * @returns {Promise<Object>}
 */
export async function updateMemberProfile(uid, { fullName, phone, pseudo = '', role = null }) {
  if (!uid) throw new Error("Identifiant du membre requis.");
  if (!fullName || !fullName.trim()) throw new Error("Le vrai nom et prénom sont obligatoires.");
  if (!phone || !phone.trim()) throw new Error("Le numéro de téléphone est obligatoire.");

  const userRef = doc(db, USERS_COLLECTION, uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) throw new Error("Membre introuvable.");

  const existing = snap.data();
  const email = existing.email;
  const isProtected = isSuperAdminEmail(email) || isAssoPresidentEmail(email);

  const cleanName = fullName.trim();
  const cleanPhone = phone.trim();
  const cleanPseudo = pseudo ? pseudo.trim() : '';
  const cleanDisplayName = cleanPseudo || cleanName;
  const now = new Date().toISOString();

  const updates = {
    fullName: cleanName,
    phone: cleanPhone,
    pseudo: cleanPseudo,
    displayName: cleanDisplayName,
    updatedAt: now
  };

  if (role && !isProtected) {
    updates.role = role;
  }

  await updateDoc(userRef, updates);
  return { uid, id: uid, ...existing, ...updates };
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
  if (snap.exists()) {
    const email = snap.data()?.email;
    if (isSuperAdminEmail(email) || isAssoPresidentEmail(email)) {
      throw new Error("Impossible de modifier le rôle des comptes principaux de l'association.");
    }
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
  if (snap.exists()) {
    const email = snap.data()?.email;
    if (isSuperAdminEmail(email) || isAssoPresidentEmail(email)) {
      throw new Error("Impossible de supprimer un compte principal de l'association.");
    }
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
