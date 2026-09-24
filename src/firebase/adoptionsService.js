import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import { db } from "./config.js";
import { cleanAdoptionFormData } from "../utils/adoptionFormLogic.js";

const ADOPTIONS_COLLECTION = "adoptionRequests";

/**
 * Statuts possibles pour une demande d'adoption
 */
export const ADOPTION_STATUS = {
  NOUVEAU: 'Nouveau',
  EN_COURS: 'En cours',
  VALIDEE: 'Validée',
  REFUSEE: 'Refusée',
  ARCHIVEE: 'Archivée'
};

/**
 * Délais de cycle de vie en jours :
 * - Archivage recommandé / automatique à 30 jours
 * - Suppression définitive complète à 60 jours
 */
export const ADOPTION_ARCHIVE_DAYS = 30;
export const ADOPTION_PURGE_DAYS = 60;

/**
 * Calcule l'âge d'une demande d'adoption en jours
 * @param {string} dateString 
 * @returns {number}
 */
export function getAdoptionDaysAge(dateString) {
  if (!dateString) return 0;
  try {
    const time = new Date(dateString).getTime();
    if (isNaN(time)) return 0;
    const diffMs = Date.now() - time;
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  } catch {
    return 0;
  }
}

/**
 * Analyse le cycle de vie d'une demande d'adoption
 * @param {Object} adoption 
 * @returns {{ days: number, isArchived: boolean, isArchivable: boolean, isPurgable: boolean, daysUntilArchive: number, daysUntilPurge: number }}
 */
export function getAdoptionLifecycleInfo(adoption) {
  if (!adoption) {
    return { 
      days: 0, 
      isArchived: false, 
      isArchivable: false, 
      isPurgable: false, 
      daysUntilArchive: ADOPTION_ARCHIVE_DAYS, 
      daysUntilPurge: ADOPTION_PURGE_DAYS 
    };
  }

  const dateToUse = adoption.submittedAt || adoption.createdAt;
  const days = getAdoptionDaysAge(dateToUse);
  const isArchived = (adoption.status === ADOPTION_STATUS.ARCHIVEE);
  const isArchivable = days >= ADOPTION_ARCHIVE_DAYS && !isArchived;
  const isPurgable = days >= ADOPTION_PURGE_DAYS;

  return {
    days,
    isArchived,
    isArchivable,
    isPurgable,
    daysUntilArchive: Math.max(0, ADOPTION_ARCHIVE_DAYS - days),
    daysUntilPurge: Math.max(0, ADOPTION_PURGE_DAYS - days)
  };
}

/**
 * Enregistre une nouvelle demande d'adoption depuis le formulaire public
 * @param {Object} rawFormData 
 * @returns {Promise<{ id: string, data: Object }>}
 */
export async function submitAdoptionRequest(rawFormData) {
  const cleaned = cleanAdoptionFormData(rawFormData);
  const now = new Date().toISOString();

  const payload = {
    ...cleaned,
    catId: rawFormData.catId || '',
    status: ADOPTION_STATUS.NOUVEAU,
    submittedAt: now,
    updatedAt: now,
    internalNotes: '',
    reviewedBy: null
  };

  const newDocRef = doc(collection(db, ADOPTIONS_COLLECTION));
  await setDoc(newDocRef, payload);

  return {
    id: newDocRef.id,
    data: payload
  };
}

/**
 * Récupère toutes les demandes d'adoption pour le tableau de bord bénévole/admin
 * @returns {Promise<Array>}
 */
export async function fetchAdoptionRequests() {
  const snap = await getDocs(collection(db, ADOPTIONS_COLLECTION));
  const list = [];
  snap.forEach((d) => {
    list.push({ id: d.id, ...d.data() });
  });
  return list.sort((a, b) => new Date(b.submittedAt || b.createdAt || 0) - new Date(a.submittedAt || a.createdAt || 0));
}

/**
 * Met à jour le statut ou les notes internes de suivi d'une demande d'adoption
 * @param {string} id 
 * @param {Object} updates
 * @returns {Promise<void>}
 */
export async function updateAdoptionRequest(id, updates) {
  if (!id) return;
  const docRef = doc(db, ADOPTIONS_COLLECTION, id);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Archive une demande d'adoption spécifique
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function archiveAdoptionRequest(id) {
  if (!id) return;
  const docRef = doc(db, ADOPTIONS_COLLECTION, id);
  await updateDoc(docRef, {
    status: ADOPTION_STATUS.ARCHIVEE,
    archivedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
}

/**
 * Désarchive une demande d'adoption pour la remettre en cours
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function unarchiveAdoptionRequest(id) {
  if (!id) return;
  const docRef = doc(db, ADOPTIONS_COLLECTION, id);
  await updateDoc(docRef, {
    status: ADOPTION_STATUS.EN_COURS,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Archive toutes les demandes ayant atteint le seuil (30 jours par défaut)
 * @param {number} [thresholdDays=ADOPTION_ARCHIVE_DAYS]
 * @returns {Promise<number>} Nombre de demandes archivées
 */
export async function archiveOldAdoptions(thresholdDays = ADOPTION_ARCHIVE_DAYS) {
  const allRequests = await fetchAdoptionRequests();
  let count = 0;
  const now = new Date().toISOString();

  for (const item of allRequests) {
    const age = getAdoptionDaysAge(item.submittedAt || item.createdAt);
    if (age >= thresholdDays && item.status !== ADOPTION_STATUS.ARCHIVEE) {
      await updateDoc(doc(db, ADOPTIONS_COLLECTION, item.id), {
        status: ADOPTION_STATUS.ARCHIVEE,
        archivedAt: now,
        updatedAt: now
      });
      count++;
    }
  }
  return count;
}

/**
 * Supprime une demande d'adoption (réservé administrateur)
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteAdoptionRequest(id) {
  if (!id) return;
  const docRef = doc(db, ADOPTIONS_COLLECTION, id);
  await deleteDoc(docRef);
}

/**
 * Supprime définitivement toutes les demandes de plus de 60 jours
 * @param {number} [thresholdDays=ADOPTION_PURGE_DAYS]
 * @returns {Promise<number>} Nombre de demandes supprimées
 */
export async function purgeExpiredAdoptions(thresholdDays = ADOPTION_PURGE_DAYS) {
  const allRequests = await fetchAdoptionRequests();
  let count = 0;

  for (const item of allRequests) {
    const age = getAdoptionDaysAge(item.submittedAt || item.createdAt);
    if (age >= thresholdDays) {
      await deleteDoc(doc(db, ADOPTIONS_COLLECTION, item.id));
      count++;
    }
  }
  return count;
}
