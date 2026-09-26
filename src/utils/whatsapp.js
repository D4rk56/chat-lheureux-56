/**
 * Utilitaires pour le partage et la communication via WhatsApp
 * Chat L'Heureux 56
 */

/**
 * Nettoie et formate un numéro de téléphone pour WhatsApp (ex: 06 12 34 56 78 -> 33612345678)
 * @param {string} phone
 * @returns {string}
 */
export function cleanPhoneNumberForWhatsApp(phone) {
  if (!phone || typeof phone !== 'string') return '';
  let cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = '33' + cleaned.slice(1);
  }
  return cleaned;
}

/**
 * Génère une URL de partage WhatsApp universelle (api.whatsapp.com)
 * Évite les corruptions de caractères UTF-8 () causées par le redirecteur wa.me
 * @param {string} text - Message à pré-remplir
 * @param {string|null} phone - Numéro de téléphone optionnel pour contact direct
 * @returns {string}
 */
export function getWhatsAppShareUrl(text, phone = null) {
  const encodedText = encodeURIComponent(text || '');
  if (phone) {
    const cleanPhone = cleanPhoneNumberForWhatsApp(phone);
    if (cleanPhone) {
      return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
    }
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
}

/**
 * Formate une fiche de demande d'adoption pour un partage WhatsApp clair et professionnel
 * @param {Object} adoption - Données de la demande d'adoption
 * @returns {string}
 */
export function formatAdoptionWhatsAppMessage(adoption) {
  if (!adoption) return '';

  const catName = adoption.catName || 'Non précisé';
  const fullName = adoption.fullName || 'Anonyme';
  const phone = adoption.phone || 'Non renseigné';
  const email = adoption.email || 'Non renseigné';
  const city = adoption.postalCodeCity 
    ? `${adoption.address ? `${adoption.address}, ` : ''}${adoption.postalCodeCity}`
    : (adoption.address || 'Non renseignée');
  const profession = adoption.profession || 'Non renseignée';

  // Foyer
  const adults = adoption.adultsCount || 1;
  const children = adoption.childrenCount || 0;
  let childrenDetails = '';
  if (parseInt(children, 10) > 0) {
    childrenDetails = ` (âges : ${adoption.childrenAges || 'non précisé'})`;
  }

  // Logement
  let housing = adoption.housingType || 'Non précisé';
  if (adoption.housingType === 'Autre' && adoption.housingTypeOther) {
    housing = `Autre (${adoption.housingTypeOther})`;
  }
  if (adoption.floor) {
    housing += ` (${adoption.floor}e étage)`;
  }

  // Extérieur
  const garden = adoption.hasGarden === 'Oui' 
    ? `Oui (${adoption.gardenSurface || 'superficie non précisée'})` 
    : 'Non';
  const balcony = adoption.hasBalcony === 'Oui' 
    ? `Oui (sécurisé : ${adoption.isBalconySecured || 'non précisé'})` 
    : 'Non';

  // Animaux
  let animals = 'Non';
  if (adoption.hasAnimals === 'Oui') {
    const statusStr = Array.isArray(adoption.animalStatus) && adoption.animalStatus.length > 0 
      ? ` [${adoption.animalStatus.join(', ')}]` 
      : '';
    const dogStr = adoption.dogDetails ? ` • Chien : ${adoption.dogDetails}` : '';
    animals = `Oui (${adoption.animalDetails || 'détails non précisés'}${statusStr}${dogStr})`;
  }

  // Conditions d'accueil
  const isolatedRoom = adoption.hasIsolatedRoom || 'Oui';
  const hoursAbsent = adoption.hoursAbsent ? `${adoption.hoursAbsent}h/jour` : 'Non précisé';
  const sleepingPlace = adoption.sleepingPlace || 'Non précisé';

  // Remarques / motivations
  const motivations = (adoption.comments || adoption.adoptionReason || adoption.catExpectations || adoption.internalNotes || '').trim();

  // Fiche chat URL
  const catUrl = adoption.catId ? `https://chat-lheureux.fr/chat/${adoption.catId}` : null;

  // Date
  let dateStr = '';
  if (adoption.submittedAt) {
    try {
      dateStr = new Date(adoption.submittedAt).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      dateStr = adoption.submittedAt;
    }
  }

  const lines = [
    `🐾 *Chat L'Heureux 56 — Demande d'adoption*`,
    `🐱 *Chat :* ${catName}`,
    ...(catUrl ? [`🔗 *Fiche du chat :* ${catUrl}`] : []),
    ...(dateStr ? [`📅 *Reçue le :* ${dateStr}`] : []),
    ``,
    `👤 *CANDIDAT*`,
    `• *Nom :* ${fullName}`,
    `• *Tél :* ${phone}`,
    `• *E-mail :* ${email}`,
    `• *Adresse & Ville :* ${city}`,
    `• *Profession :* ${profession}`,
    ``,
    `🏠 *FOYER & LOGEMENT*`,
    `• *Composition :* ${adults} adulte(s), ${children} enfant(s)${childrenDetails}`,
    ...(adoption.childrenAnimalContact ? [`• *Contact enfants/animaux :* ${adoption.childrenAnimalContact}`] : []),
    `• *Type logement :* ${housing}`,
    `• *Pièce isolée (arrivée) :* ${isolatedRoom}`,
    `• *Jardin :* ${garden}`,
    `• *Balcon :* ${balcony}`,
    `• *Animaux actuels :* ${animals}`,
    ``,
    `⏰ *RYTHME DE VIE & ACCUEIL*`,
    `• *Absence quotidienne :* ${hoursAbsent}`,
    `• *Couchage prévu :* ${sleepingPlace}`,
    ``,
    `📝 *REMARQUES & MOTIVATIONS*`,
    motivations ? motivations : `Aucune remarque particulière renseignée.`,
    ``,
    `💬 *Traiter sur l'espace admin :*`,
    `https://chat-lheureux.fr/admin`
  ];

  return lines.join('\n');
}

/**
 * Ouvre un lien WhatsApp de manière sécurisée et compatible mobile/bureau
 * @param {string} url
 */
export function openWhatsAppUrl(url) {
  if (typeof window === 'undefined' || !url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
