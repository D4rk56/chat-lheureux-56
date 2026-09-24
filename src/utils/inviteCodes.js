/**
 * Génération et formatage des codes d'invitation sécurisés pour les bénévoles.
 */

// Alphabet sans caractères ambigus (0, O, 1, I, L exclus)
const SAFE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/**
 * Génère un code aléatoire sécurisé au format CLH-XXXX-XXXX
 * @returns {string}
 */
export function generateRandomInviteCode() {
  const getRandomChunk = (len) => {
    let res = '';
    for (let i = 0; i < len; i++) {
      const idx = Math.floor(Math.random() * SAFE_CHARS.length);
      res += SAFE_CHARS[idx];
    }
    return res;
  };

  return `CLH-${getRandomChunk(4)}-${getRandomChunk(4)}`;
}

/**
 * Nettoie et normalise la saisie d'un code d'invitation
 * @param {string} code 
 * @returns {string}
 */
export function normalizeInviteCode(code) {
  if (!code) return '';
  return code.trim().toUpperCase().replace(/\s+/g, '');
}

/**
 * Vérifie le format de base d'un code d'invitation
 * @param {string} code 
 * @returns {boolean}
 */
export function isValidCodeFormat(code) {
  const normalized = normalizeInviteCode(code);
  return /^CLH-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(normalized);
}
