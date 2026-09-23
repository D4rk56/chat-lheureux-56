import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "./config.js";
import { getCatAdoptionInfo } from "../utils/age.js";

const CHATS_COLLECTION = "chats";
export const LOCK_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Détermine si la fiche est actuellement verrouillée par un autre administrateur.
 */
export function isCatLockedByOther(cat, currentUserEmail) {
  if (!cat || !cat.editingLock) return false;
  const myEmail = (currentUserEmail || '').trim().toLowerCase();
  const lock = cat.editingLock;
  const lockEmail = (lock.email || '').trim().toLowerCase();
  if (!lockEmail || lockEmail === myEmail) return false;
  const lockAge = Date.now() - (lock.lockedAt || 0);
  return lockAge < LOCK_EXPIRATION_MS;
}

/**
 * Récupère le cache local des chats (hydratation 0ms).
 */
export function getCachedCats(filterExpired = true) {
  try {
    const raw = localStorage.getItem('cached_cats_catalog');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    if (!filterExpired) return parsed;
    return parsed.filter(cat => !getCatAdoptionInfo(cat).isExpired);
  } catch (e) {
    console.warn("Erreur lecture cache local des chats :", e);
    return [];
  }
}

/**
 * Récupère tous les chats depuis Firestore et met à jour le cache local.
 */
export async function fetchCats(filterExpired = true) {
  const snapshot = await getDocs(collection(db, CHATS_COLLECTION));
  const list = [];
  snapshot.forEach(docSnap => {
    const cat = { id: docSnap.id, ...docSnap.data() };
    list.push(cat);
  });

  try {
    localStorage.setItem('cached_cats_catalog', JSON.stringify(list));
  } catch (e) {
    console.warn("Impossible d'écrire dans localStorage :", e);
  }

  if (filterExpired) {
    return list.filter(cat => !getCatAdoptionInfo(cat).isExpired);
  }
  return list;
}

/**
 * Récupère un chat par son identifiant unique.
 */
export async function fetchCatById(catId) {
  if (!catId) throw new Error("Identifiant de chat manquant.");
  const docRef = doc(db, CHATS_COLLECTION, catId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * S'abonne aux modifications en direct d'une fiche de chat.
 */
export function subscribeCat(catId, onData, onError) {
  if (!catId) return () => {};
  const docRef = doc(db, CHATS_COLLECTION, catId);
  return onSnapshot(docRef, (snap) => {
    if (snap.exists()) {
      onData({ id: snap.id, ...snap.data() });
    } else {
      onData(null);
    }
  }, (err) => {
    if (onError) onError(err);
  });
}

/**
 * Verrouille une fiche pour signifier qu'un administrateur est en train de l'éditer.
 */
export async function acquireCatLock(catId, userEmail) {
  if (!catId || !userEmail) return;
  try {
    await updateDoc(doc(db, CHATS_COLLECTION, catId), {
      editingLock: {
        email: userEmail.trim().toLowerCase(),
        lockedAt: Date.now()
      }
    });
  } catch (e) {
    console.warn("Impossible d'acquérir le verrou d'édition :", e);
  }
}

/**
 * Libère le verrou d'édition d'une fiche.
 */
export async function releaseCatLock(catId) {
  if (!catId) return;
  try {
    await updateDoc(doc(db, CHATS_COLLECTION, catId), {
      editingLock: null
    });
  } catch (e) {
    console.warn("Impossible de libérer le verrou d'édition :", e);
  }
}

/**
 * Sauvegarde (création ou mise à jour) d'une fiche de chat dans Firestore.
 */
export async function saveCat(catData, id = null, userEmail = 'Admin') {
  const nowIso = new Date().toISOString();
  const payload = {
    ...catData,
    updatedAt: nowIso,
    updatedBy: userEmail,
    editingLock: null
  };

  if (id) {
    await updateDoc(doc(db, CHATS_COLLECTION, id), payload);
    return id;
  } else {
    payload.createdAt = nowIso;
    const docRef = await addDoc(collection(db, CHATS_COLLECTION), payload);
    return docRef.id;
  }
}

/**
 * Supprime définitivement un chat.
 */
export async function deleteCat(catId) {
  if (!catId) return;
  await deleteDoc(doc(db, CHATS_COLLECTION, catId));
}

/**
 * Supprime par lot tous les chats adoptés depuis plus de 60 jours.
 */
export async function purgeExpiredAdoptedCats(cats) {
  const expired = cats.filter(c => getCatAdoptionInfo(c).isExpired);
  for (const cat of expired) {
    await deleteDoc(doc(db, CHATS_COLLECTION, cat.id));
  }
  return expired.length;
}
