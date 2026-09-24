/**
 * Rôles et autorisations pour l'association Chat L'Heureux 56
 * Paliers : Administrateur, Gestion, Bénévoles
 */

export const USER_ROLES = {
  ADMIN: 'Administrateur',
  GESTION: 'Gestion',
  BENEVOLE: 'Benevole'
};

export const ROLE_LABELS = {
  [USER_ROLES.ADMIN]: 'Administrateur',
  [USER_ROLES.GESTION]: 'Gestion (Chats & Avis)',
  [USER_ROLES.BENEVOLE]: 'Bénévole (Adoptions)'
};

/**
 * Vérifie si le rôle a les permissions d'administration complète
 * @param {string} role 
 * @returns {boolean}
 */
export function isAdminRole(role) {
  return role === USER_ROLES.ADMIN;
}

/**
 * Vérifie si le rôle peut éditer les chats
 * @param {string} role 
 * @returns {boolean}
 */
export function canEditCats(role) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.GESTION;
}

/**
 * Vérifie si le rôle peut supprimer ou purger les chats
 * @param {string} role 
 * @returns {boolean}
 */
export function canDeleteCats(role) {
  return role === USER_ROLES.ADMIN;
}

/**
 * Vérifie si le rôle peut gérer les témoignages / avis
 * @param {string} role 
 * @returns {boolean}
 */
export function canManageStories(role) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.GESTION;
}

/**
 * Vérifie si le rôle peut consulter et traiter les demandes d'adoption
 * @param {string} role 
 * @returns {boolean}
 */
export function canManageAdoptions(role) {
  return role === USER_ROLES.ADMIN || role === USER_ROLES.GESTION || role === USER_ROLES.BENEVOLE;
}

/**
 * Vérifie si le rôle peut supprimer définitivement une demande d'adoption
 * @param {string} role 
 * @returns {boolean}
 */
export function canDeleteAdoptions(role) {
  return role === USER_ROLES.ADMIN;
}

/**
 * Vérifie si le rôle peut gérer les membres et créer des codes d'invitation
 * @param {string} role 
 * @returns {boolean}
 */
export function canManageMembers(role) {
  return role === USER_ROLES.ADMIN;
}

/**
 * Retourne l'onglet par défaut selon le rôle
 * @param {string} role 
 * @returns {string}
 */
export function getDefaultTabForRole(role) {
  if (role === USER_ROLES.BENEVOLE) {
    return 'adoptions';
  }
  return 'cats';
}
