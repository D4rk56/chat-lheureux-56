import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { db } from "./config.js";

export const ACTIVITY_LOGS_COLLECTION = "activityLogs";
export const MAX_LOG_RETENTION_DAYS = 7;
export const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const LOG_CATEGORIES = {
  CHATS: 'chats',
  ADOPTIONS: 'adoptions',
  MEMBERS: 'members',
  STORIES: 'stories',
  SYSTEM: 'system'
};

export const LOG_ACTIONS = {
  // Chats
  CAT_CREATE: 'CAT_CREATE',
  CAT_UPDATE: 'CAT_UPDATE',
  CAT_STATUS_CHANGE: 'CAT_STATUS_CHANGE',
  CAT_DELETE: 'CAT_DELETE',
  CAT_PURGE_EXPIRED: 'CAT_PURGE_EXPIRED',

  // Adoptions
  ADOPTION_SUBMITTED: 'ADOPTION_SUBMITTED',
  ADOPTION_STATUS_CHANGE: 'ADOPTION_STATUS_CHANGE',
  ADOPTION_NOTES_UPDATE: 'ADOPTION_NOTES_UPDATE',
  ADOPTION_ARCHIVE: 'ADOPTION_ARCHIVE',
  ADOPTION_PURGE: 'ADOPTION_PURGE',

  // Membres & Invitations
  MEMBER_CREATE: 'MEMBER_CREATE',
  MEMBER_ROLE_CHANGE: 'MEMBER_ROLE_CHANGE',
  MEMBER_PROFILE_UPDATE: 'MEMBER_PROFILE_UPDATE',
  MEMBER_DELETE: 'MEMBER_DELETE',
  INVITE_CODE_CREATE: 'INVITE_CODE_CREATE',
  INVITE_CODE_DELETE: 'INVITE_CODE_DELETE',
  INVITE_CODE_REDEEM: 'INVITE_CODE_REDEEM',

  // Avis & Témoignages
  STORY_CREATE: 'STORY_CREATE',
  STORY_UPDATE: 'STORY_UPDATE',
  STORY_DELETE: 'STORY_DELETE',

  // Système
  ACTIVITY_PURGE: 'ACTIVITY_PURGE'
};

export const ACTION_NATURE = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  PURGE: 'PURGE',
  OTHER: 'OTHER'
};

export const ACTION_NATURE_LABELS = {
  [ACTION_NATURE.CREATE]: 'Créations',
  [ACTION_NATURE.UPDATE]: 'Modifications',
  [ACTION_NATURE.DELETE]: 'Suppressions',
  [ACTION_NATURE.PURGE]: 'Purges & Archives',
  [ACTION_NATURE.OTHER]: 'Autres'
};

/**
 * Détermine la nature générique d'une action pour l'affichage visuel (badge) et les filtres.
 * @param {string} actionType 
 * @returns {string} ACTION_NATURE value
 */
export function getActionNature(actionType) {
  if (!actionType) return ACTION_NATURE.OTHER;
  const upper = String(actionType).toUpperCase();
  if (
    upper.includes('CREATE') || 
    upper.includes('SUBMITTED') || 
    upper.includes('ADD') || 
    upper.includes('REDEEM')
  ) {
    return ACTION_NATURE.CREATE;
  }
  if (
    upper.includes('UPDATE') || 
    upper.includes('CHANGE') || 
    upper.includes('STATUS') ||
    upper.includes('NOTES')
  ) {
    return ACTION_NATURE.UPDATE;
  }
  if (
    upper.includes('DELETE') || 
    upper.includes('REVOKE')
  ) {
    return ACTION_NATURE.DELETE;
  }
  if (
    upper.includes('PURGE') || 
    upper.includes('ARCHIVE')
  ) {
    return ACTION_NATURE.PURGE;
  }
  return ACTION_NATURE.OTHER;
}

// Suivi d'état pour le diagnostic des erreurs de permission Firestore
let lastLogActivityError = null;

export function getLastLogActivityError() {
  return lastLogActivityError;
}

export function clearLastLogActivityError() {
  lastLogActivityError = null;
}

/**
 * Calcule si une entrée d'historique dépasse la durée maximale de rétention (7 jours)
 * @param {number|string|Date} timestamp 
 * @param {number} maxDays 
 * @returns {boolean}
 */
export function isLogExpired(timestamp, maxDays = MAX_LOG_RETENTION_DAYS) {
  if (!timestamp) return false;
  const timeMs = typeof timestamp === 'number' 
    ? timestamp 
    : new Date(timestamp).getTime();
  if (isNaN(timeMs)) return false;
  const ageMs = Date.now() - timeMs;
  return ageMs > (maxDays * MS_PER_DAY);
}

/**
 * Enregistre un nouvel événement dans le journal d'activité du site.
 * L'enregistrement ne doit jamais bloquer l'action métier en cas d'erreur.
 * 
 * @param {Object} params
 * @param {string} params.actionType - Code de l'action (ex: LOG_ACTIONS.CAT_UPDATE)
 * @param {string} params.category - Catégorie (chats, adoptions, members, stories)
 * @param {string} params.description - Descriptif en français (ex: "Mise à jour de la fiche de Dan")
 * @param {string} [params.details] - Précisions (ex: "Statut changé en 'Adopté'")
 * @param {string} [params.targetId] - Identifiant de l'entité concernée
 * @param {string} [params.targetName] - Nom de l'entité concernée
 * @param {Object} [params.user] - Utilisateur Firebase Auth ayant réalisé l'action
 * @param {Object} [params.userProfile] - Profil Firestore de l'utilisateur
 * @returns {Promise<string|null>} ID du log créé
 */
export async function logActivity({
  actionType,
  category = LOG_CATEGORIES.SYSTEM,
  description,
  details = '',
  targetId = null,
  targetName = null,
  user = null,
  userProfile = null
}) {
  try {
    const now = Date.now();
    const payload = {
      actionType,
      category,
      description: description || 'Action non spécifiée',
      details: details || '',
      targetId: targetId || null,
      targetName: targetName || null,
      userId: user?.uid || userProfile?.id || 'system',
      userName: userProfile?.name || userProfile?.pseudo || user?.displayName || user?.email?.split('@')[0] || 'Utilisateur',
      userEmail: user?.email || userProfile?.email || null,
      userRole: userProfile?.role || 'Bénévole',
      createdAt: new Date(now).toISOString(),
      timestamp: now
    };

    const docRef = await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), payload);
    lastLogActivityError = null;
    return docRef.id;
  } catch (err) {
    lastLogActivityError = err;
    console.warn("Échec d'enregistrement du log d'activité (non-bloquant) :", err);
    return null;
  }
}

/**
 * Récupère les logs d'activité récents (des 7 derniers jours par défaut).
 * Utilise un simple orderBy('timestamp', 'desc') sans index composite requis.
 * 
 * @param {number} maxDays - Rétention maximale en jours (défaut: 7)
 * @returns {Promise<Array>}
 */
export async function fetchRecentActivityLogs(maxDays = MAX_LOG_RETENTION_DAYS) {
  try {
    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(200)
    );

    const snapshot = await getDocs(q);
    const minTimestamp = Date.now() - (maxDays * MS_PER_DAY);
    const list = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const t = data.timestamp || new Date(data.createdAt || 0).getTime();
      if (!minTimestamp || t >= minTimestamp) {
        list.push({ id: d.id, ...data });
      }
    });
    return list;
  } catch (err) {
    console.warn("Échec requête ordonnée activityLogs, fallback mémoire :", err?.message);
    try {
      const fallbackSnapshot = await getDocs(collection(db, ACTIVITY_LOGS_COLLECTION));
      const minTimestamp = Date.now() - (maxDays * MS_PER_DAY);
      const list = [];
      fallbackSnapshot.forEach((d) => {
        const data = d.data();
        const t = data.timestamp || new Date(data.createdAt || 0).getTime();
        if (!minTimestamp || t >= minTimestamp) {
          list.push({ id: d.id, ...data });
        }
      });
      return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    } catch (fallbackErr) {
      console.error("Erreur lors de la récupération des logs d'activité :", fallbackErr);
      throw fallbackErr;
    }
  }
}

/**
 * Écoute en temps réel les nouveaux logs d'activité (7 derniers jours).
 * Ne nécessite aucun index composite Firestore.
 * 
 * @param {Function} callback - Appelé avec la liste des logs mise à jour
 * @param {Function} [onError] - Callback optionnel en cas d'erreur (ex: permission-denied)
 * @param {number} [maxDays] - Rétention en jours (défaut: 7)
 * @returns {Function} unsubscribe function
 */
export function subscribeActivityLogs(callback, onError = null, maxDays = MAX_LOG_RETENTION_DAYS) {
  try {
    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const minTimestamp = Date.now() - (maxDays * MS_PER_DAY);

    return onSnapshot(q, (snapshot) => {
      const list = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const t = data.timestamp || new Date(data.createdAt || 0).getTime();
        if (!minTimestamp || t >= minTimestamp) {
          list.push({ id: d.id, ...data });
        }
      });
      callback(list);
    }, (error) => {
      console.warn("Erreur subscription logs :", error?.message);
      if (typeof onError === 'function') {
        onError(error);
      }
    });
  } catch (err) {
    console.error("Impossible d'initialiser onSnapshot activityLogs :", err);
    if (typeof onError === 'function') {
      onError(err);
    }
    return () => {};
  }
}

/**
 * Purge définitivement tous les logs d'activité de plus de 7 jours.
 * @param {number} maxDays - Rétention maximale en jours (défaut: 7)
 * @returns {Promise<{ deletedCount: number }>}
 */
export async function purgeOldActivityLogs(maxDays = MAX_LOG_RETENTION_DAYS) {
  try {
    const expirationLimit = Date.now() - (maxDays * MS_PER_DAY);
    const snapshot = await getDocs(collection(db, ACTIVITY_LOGS_COLLECTION));
    
    const toDelete = [];
    snapshot.forEach((d) => {
      const data = d.data();
      const t = data.timestamp || new Date(data.createdAt || 0).getTime();
      if (t && t < expirationLimit) {
        toDelete.push(d.id);
      }
    });

    if (toDelete.length === 0) {
      return { deletedCount: 0 };
    }

    // Suppression par lots (batch) de 400 documents max par lot
    let deletedCount = 0;
    while (toDelete.length > 0) {
      const chunk = toDelete.splice(0, 400);
      const batch = writeBatch(db);
      chunk.forEach((id) => {
        batch.delete(doc(db, ACTIVITY_LOGS_COLLECTION, id));
      });
      await batch.commit();
      deletedCount += chunk.length;
    }

    return { deletedCount };
  } catch (err) {
    console.error("Erreur lors de la purge des logs d'activité expirés :", err);
    return { deletedCount: 0, error: err };
  }
}
