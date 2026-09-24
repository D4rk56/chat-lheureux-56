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
  REFUSEE: 'Refusée'
};

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
  return list.sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
}

/**
 * Met à jour le statut ou les notes internes de suivi d'une demande d'adoption
 * @param {string} id 
 * @param {Object} updates
 * @param {string} [updates.status]
 * @param {string} [updates.internalNotes]
 * @param {string} [updates.reviewedBy]
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
 * Supprime une demande d'adoption (réservé administrateur)
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteAdoptionRequest(id) {
  if (!id) return;
  const docRef = doc(db, ADOPTIONS_COLLECTION, id);
  await deleteDoc(docRef);
}
