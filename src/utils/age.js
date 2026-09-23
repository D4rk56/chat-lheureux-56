export const ADOPTED_EXPIRATION_DAYS = 60;

/**
 * Calcule l'âge d'un chat de manière naturelle en français à partir de sa date de naissance.
 * @param {string|Date} birthDateInput
 * @returns {string} Exemple: "3 mois", "1 an et demi", "4 ans"
 */
export function calculateAgeFromBirthDate(birthDateInput) {
  if (!birthDateInput) return '';
  const birth = new Date(birthDateInput);
  if (isNaN(birth.getTime())) return '';

  const now = new Date();
  if (birth > now) return "Nouveau-né";

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months--;
  }
  if (months < 0) {
    years--;
    months += 12;
  }

  const totalMonths = years * 12 + months;

  if (totalMonths < 1) {
    const diffMs = now.getTime() - birth.getTime();
    const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    if (diffDays <= 7) return "Quelques jours";
    const weeks = Math.max(1, Math.floor(diffDays / 7));
    return `${weeks} semaine${weeks > 1 ? 's' : ''}`;
  }

  if (totalMonths < 12) {
    return `${totalMonths} mois`;
  }

  if (years === 1) {
    if (months >= 5 && months <= 7) return "1 an et demi";
    return "1 an";
  }

  if (months >= 5 && months <= 7) {
    return `${years} ans et demi`;
  }

  return `${years} ans`;
}

/**
 * Analyse les informations d'adoption d'un chat (statut, ancienneté, expiration).
 * @param {object} cat
 * @param {number} expirationDays
 * @returns {{ isAdopted: boolean, days: number, isExpired: boolean, dateStr: string, rawDate: string, daysRemaining: number }}
 */
export function getCatAdoptionInfo(cat, expirationDays = ADOPTED_EXPIRATION_DAYS) {
  if (!cat || cat.status !== 'Adopté') {
    return { isAdopted: false, days: 0, isExpired: false, dateStr: '', rawDate: '', daysRemaining: 0 };
  }

  const dateStr = cat.adoptedAt || cat.updatedAt || cat.createdAt;
  if (!dateStr) {
    return { isAdopted: true, days: 0, isExpired: false, dateStr: '', rawDate: '', daysRemaining: expirationDays };
  }

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return { isAdopted: true, days: 0, isExpired: false, dateStr: '', rawDate: '', daysRemaining: expirationDays };
  }

  const diffMs = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const isExpired = days >= expirationDays;
  const daysRemaining = Math.max(0, expirationDays - days);

  let formattedDate = '';
  try {
    formattedDate = date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch (e) {
    formattedDate = String(dateStr).slice(0, 10);
  }

  return {
    isAdopted: true,
    days,
    isExpired,
    dateStr: formattedDate,
    rawDate: String(dateStr).slice(0, 10),
    daysRemaining
  };
}
