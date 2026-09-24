/**
 * Logique de nettoyage et de validation du questionnaire d'adoption
 * Implémente le masquage et l'exclusion conditionnelle des questions
 * (ex: exclusion de l'état vaccinal ou des détails si pas d'animaux au foyer).
 */

export const INITIAL_ADOPTION_FORM = {
  // Page 1 : Choix de l'animal & Identité
  catId: '',
  catName: '',
  fullName: '',
  email: '',
  phone: '',
  address: '',
  postalCodeCity: '',
  profession: '',

  // Page 2 : Composition du ménage
  adultsCount: '1',
  childrenCount: '0',
  childrenAges: '',
  childrenAnimalContact: 'Non',

  // Page 3 : Habitation
  housingType: 'Appartement', // 'Appartement', 'Maison', 'Autre'
  housingTypeOther: '',
  hasIsolatedRoom: 'Oui', // Pièce isolée avec fenêtre
  hasGarden: 'Non',
  gardenSurface: '',
  hasBalcony: 'Non',
  isBalconySecured: 'Non',
  floor: '', // Si appartement

  // Page 4 : Animaux actuels
  hasAnimals: 'Non', // 'Oui' ou 'Non'
  animalDetails: '',
  dogDetails: '',
  animalStatus: [], // ['Identifiés', 'Vaccinés', 'Stérilisés']
  isSociable: 'Oui',

  // Page 5 : Conditions d'accueil & Rythme de vie
  fullAccess: 'Oui', // Accès à toutes les pièces
  sleepingPlace: '', // Où dormira-t-il ?
  hoursAbsent: '', // En moyenne, combien d'heures par jour absent ?
  absenceLocation: '', // Durant ces absences, où restera-t-il ?
  lunchReturn: 'Non', // Rentrerez-vous le midi ?
  staysAlone: 'Non', // Restera-t-il seul ?

  // Informations complémentaires
  comments: ''
};

/**
 * Nettoie les réponses du formulaire en retirant les champs conditionnels non applicables.
 * Exemple : Si hasAnimals === 'Non', supprime animalDetails, dogDetails, animalStatus, isSociable.
 * @param {Object} rawData 
 * @returns {Object} cleanedData
 */
export function cleanAdoptionFormData(rawData) {
  const data = { ...rawData };

  // 1. Ménage : pas d'enfants -> supprimer âge et contact
  const numChildren = parseInt(data.childrenCount, 10) || 0;
  if (numChildren <= 0) {
    delete data.childrenAges;
    delete data.childrenAnimalContact;
  }

  // 2. Habitation : Jardin
  if (data.hasGarden !== 'Oui') {
    delete data.gardenSurface;
  }

  // 3. Habitation : Balcon
  if (data.hasBalcony !== 'Oui') {
    delete data.isBalconySecured;
  }

  // 4. Habitation : Étage si ce n'est pas un appartement
  if (data.housingType !== 'Appartement') {
    delete data.floor;
  }
  if (data.housingType !== 'Autre') {
    delete data.housingTypeOther;
  }

  // 5. Animaux actuels : Si 'Non', supprimer toutes les questions secondaires
  if (data.hasAnimals !== 'Oui') {
    delete data.animalDetails;
    delete data.dogDetails;
    delete data.animalStatus;
    delete data.isSociable;
  } else {
    if (!data.dogDetails || !data.dogDetails.trim()) {
      delete data.dogDetails;
    }
  }

  return data;
}

/**
 * Valide les champs obligatoires du formulaire d'adoption
 * @param {Object} data 
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateAdoptionForm(data) {
  const errors = {};

  if (!data.catName || !data.catName.trim()) {
    errors.catName = "Le nom du chat souhaité est requis.";
  }

  if (!data.fullName || !data.fullName.trim()) {
    errors.fullName = "Votre nom et prénom sont requis.";
  }

  if (!data.email || !data.email.trim()) {
    errors.email = "Votre adresse e-mail est requise.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = "L'adresse e-mail n'est pas valide.";
  }

  if (!data.phone || !data.phone.trim()) {
    errors.phone = "Un numéro de téléphone de contact est requis.";
  }

  if (!data.address || !data.address.trim()) {
    errors.address = "Votre adresse est requise.";
  }

  if (!data.postalCodeCity || !data.postalCodeCity.trim()) {
    errors.postalCodeCity = "Le code postal et la ville sont requis.";
  }

  if (!data.profession || !data.profession.trim()) {
    errors.profession = "Votre profession est requise.";
  }

  // Validation conditionnelle : Composition du foyer
  if (!data.adultsCount || parseInt(data.adultsCount, 10) < 1) {
    errors.adultsCount = "Précisez le nombre d'adultes au foyer.";
  }

  const numChildren = parseInt(data.childrenCount, 10) || 0;
  if (numChildren > 0 && (!data.childrenAges || !data.childrenAges.trim())) {
    errors.childrenAges = "Précisez l'âge des enfants.";
  }

  // Validation conditionnelle : Habitation
  if (data.housingType === 'Appartement' && (!data.floor || !data.floor.trim())) {
    errors.floor = "Précisez l'étage pour un appartement.";
  }

  if (data.housingType === 'Autre' && (!data.housingTypeOther || !data.housingTypeOther.trim())) {
    errors.housingTypeOther = "Précisez votre type d'habitation.";
  }

  if (data.hasGarden === 'Oui' && (!data.gardenSurface || !data.gardenSurface.trim())) {
    errors.gardenSurface = "Précisez la superficie approximative du jardin.";
  }

  // Validation conditionnelle : Animaux
  if (data.hasAnimals === 'Oui' && (!data.animalDetails || !data.animalDetails.trim())) {
    errors.animalDetails = "Veuillez préciser quels animaux vous possédez.";
  }

  // Validation mode de vie
  if (!data.sleepingPlace || !data.sleepingPlace.trim()) {
    errors.sleepingPlace = "Veuillez préciser où dormira l'animal.";
  }

  if (!data.hoursAbsent || !data.hoursAbsent.trim()) {
    errors.hoursAbsent = "Veuillez indiquer vos heures d'absence moyennes.";
  }

  if (!data.absenceLocation || !data.absenceLocation.trim()) {
    errors.absenceLocation = "Veuillez préciser où restera l'animal durant vos absences.";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
