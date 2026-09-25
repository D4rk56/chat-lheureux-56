/**
 * Utilitaires pour le tri, le filtrage et l'affichage des fiches chats
 * Association Chat L'Heureux 56
 */

export const CAT_SORT_MODES = {
  ALPHA: 'alpha',             // Alphabétique A -> Z (par défaut)
  DATE_ADDED: 'date_added',   // Date d'ajout (plus récents en premier)
  DATE_UPDATED: 'date_updated' // Récemment modifiés (dernière mise à jour en premier)
};

/**
 * Détermine si une fiche de chat est incomplète (manque de description ou de photo réelle)
 * @param {Object} cat
 * @returns {{ incomplete: boolean, missingDescription: boolean, missingPhoto: boolean }}
 */
export function isCatIncomplete(cat) {
  if (!cat) {
    return { incomplete: true, missingDescription: true, missingPhoto: true };
  }

  // Vérification de la description
  const desc = (cat.description || '').trim();
  const missingDescription = desc.length === 0 || desc.toLowerCase() === 'pas de description.';

  // Vérification de la photo
  const photos = Array.isArray(cat.photos) ? cat.photos.filter(p => typeof p === 'string' && p.trim().length > 0) : [];
  const primaryImage = cat.image || (photos.length > 0 ? photos[0] : '');
  const isPlaceholder = !primaryImage || 
    primaryImage.includes('placehold.co') || 
    primaryImage.includes('placeholder') || 
    primaryImage.includes('text=Pas+de+photo');

  const missingPhoto = photos.length === 0 && isPlaceholder;

  return {
    incomplete: missingDescription || missingPhoto,
    missingDescription,
    missingPhoto
  };
}

/**
 * Trie une liste de fiches chats de manière pure et immuable
 * @param {Array<Object>} cats - Liste brute des fiches
 * @param {string} sortMode - Mode de tri (ALPHA, DATE_ADDED, DATE_UPDATED)
 * @returns {Array<Object>} - Nouvelle liste triée
 */
export function sortCats(cats, sortMode = CAT_SORT_MODES.ALPHA) {
  if (!Array.isArray(cats)) return [];
  const list = [...cats];

  switch (sortMode) {
    case CAT_SORT_MODES.DATE_ADDED:
      return list.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.updatedAt || 0).getTime() || 0;
        const timeB = new Date(b.createdAt || b.updatedAt || 0).getTime() || 0;
        // Décroissant (les plus récents en premier)
        if (timeB !== timeA) return timeB - timeA;
        return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
      });

    case CAT_SORT_MODES.DATE_UPDATED:
      return list.sort((a, b) => {
        const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime() || 0;
        const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime() || 0;
        // Décroissant (dernière mise à jour en premier)
        if (timeB !== timeA) return timeB - timeA;
        return (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' });
      });

    case CAT_SORT_MODES.ALPHA:
    default:
      return list.sort((a, b) => {
        const nameA = (a.name || '').trim();
        const nameB = (b.name || '').trim();
        return nameA.localeCompare(nameB, 'fr', { sensitivity: 'base' });
      });
  }
}

/**
 * Formate de manière lisible la date d'enregistrement ou de modification d'une fiche chat
 * @param {Object} cat
 * @param {string} mode - 'added' ou 'updated'
 * @returns {string} Ex: "Ajouté le 15/09/2026" ou "Modifié le 20/09/2026"
 */
export function formatCatAdminDate(cat, mode = 'added') {
  if (!cat) return '';

  let targetDateStr = null;
  let prefix = 'Ajouté le';

  if (mode === 'updated' && cat.updatedAt) {
    targetDateStr = cat.updatedAt;
    prefix = 'Modifié le';
  } else if (cat.createdAt) {
    targetDateStr = cat.createdAt;
    prefix = 'Ajouté le';
  } else if (cat.updatedAt) {
    targetDateStr = cat.updatedAt;
    prefix = 'Enregistré le';
  }

  if (!targetDateStr) return '';

  try {
    const d = new Date(targetDateStr);
    if (isNaN(d.getTime())) return '';
    const dateFormatted = d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    return `${prefix} ${dateFormatted}`;
  } catch {
    return '';
  }
}
