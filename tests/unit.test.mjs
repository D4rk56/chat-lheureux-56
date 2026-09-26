import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { calculateAgeFromBirthDate, getCatAdoptionInfo, ADOPTED_EXPIRATION_DAYS } from '../src/utils/age.js';
import { isCatLockedByOther, LOCK_EXPIRATION_MS } from '../src/firebase/catsService.js';
import { getAuthErrorMessage } from '../src/firebase/authService.js';
import { cleanAdoptionFormData, validateAdoptionForm, INITIAL_ADOPTION_FORM } from '../src/utils/adoptionFormLogic.js';
import { generateRandomInviteCode, normalizeInviteCode, isValidCodeFormat } from '../src/utils/inviteCodes.js';
import { 
  USER_ROLES, 
  canEditCats, 
  canDeleteCats, 
  canManageStories, 
  canManageAdoptions, 
  canManageMembers, 
  getDefaultTabForRole,
  isSuperAdminEmail,
  isAssoPresidentEmail,
  SUPER_ADMIN_EMAILS,
  ASSO_PRESIDENT_EMAILS
} from '../src/utils/roles.js';
import { KNOWN_ACCOUNTS, isRegisteredMember } from '../src/firebase/memberService.js';
import { 
  getAdoptionDaysAge, 
  getAdoptionLifecycleInfo, 
  ADOPTION_ARCHIVE_DAYS, 
  ADOPTION_PURGE_DAYS, 
  ADOPTION_STATUS 
} from '../src/firebase/adoptionsService.js';
import { 
  sendAdoptionConfirmationEmail, 
  sendAdoptionNotificationToMembers,
  sendCustomInfoEmail 
} from '../src/services/emailService.js';
import sendEmailFunction from '../netlify/functions/send-email.js';
import { resolveAuthDomain } from '../src/firebase/config.js';
import { 
  cleanPhoneNumberForWhatsApp, 
  getWhatsAppShareUrl, 
  formatAdoptionWhatsAppMessage 
} from '../src/utils/whatsapp.js';
import { 
  isLogExpired, 
  MAX_LOG_RETENTION_DAYS, 
  LOG_CATEGORIES, 
  LOG_ACTIONS,
  ACTION_NATURE,
  ACTION_NATURE_LABELS,
  getActionNature,
  getLastLogActivityError,
  clearLastLogActivityError
} from '../src/firebase/activityLogService.js';
import { 
  sortCats, 
  CAT_SORT_MODES, 
  isCatIncomplete, 
  formatCatAdminDate 
} from '../src/utils/catSorting.js';
import { 
  parseLinksFromText, 
  normalizeUrl, 
  stripTrailingPunctuation 
} from '../src/utils/linkParser.js';

describe('Calcul de l\'âge des chats (calculateAgeFromBirthDate)', () => {
  test('Doit gérer les dates futures avec grâce', () => {
    const futureDate = new Date(Date.now() + 86400000 * 10).toISOString();
    const result = calculateAgeFromBirthDate(futureDate);
    assert.equal(result, 'Nouveau-né');
  });

  test('Doit gérer les dates invalides et nulles', () => {
    assert.equal(calculateAgeFromBirthDate(''), '');
    assert.equal(calculateAgeFromBirthDate('invalid-date'), '');
    assert.equal(calculateAgeFromBirthDate(null), '');
    assert.equal(calculateAgeFromBirthDate(undefined), '');
  });

  test('Doit calculer quelques jours ou semaines pour les très jeunes chatons', () => {
    const now = new Date();
    
    // Né aujourd'hui
    assert.equal(calculateAgeFromBirthDate(now.toISOString().slice(0, 10)), 'Quelques jours');

    // Né il y a 3 jours
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(threeDaysAgo), 'Quelques jours');

    // Né il y a 14 jours (2 semaines)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(twoWeeksAgo), '2 semaines');
  });

  test('Doit formater correctement les mois et les années', () => {
    const now = new Date();
    
    // 3 mois
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(threeMonthsAgo), '3 mois');

    // 1 an
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(oneYearAgo), '1 an');

    // 1 an et demi (18 mois)
    const eighteenMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth() - 6, now.getDate()).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(eighteenMonthsAgo), '1 an et demi');

    // 2 ans
    const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(twoYearsAgo), '2 ans');

    // 2 ans et demi
    const twoAndHalfAgo = new Date(now.getFullYear() - 2, now.getMonth() - 6, now.getDate()).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(twoAndHalfAgo), '2 ans et demi');

    // 4 ans
    const fourYearsAgo = new Date(now.getFullYear() - 4, now.getMonth(), now.getDate()).toISOString().slice(0, 10);
    assert.equal(calculateAgeFromBirthDate(fourYearsAgo), '4 ans');
  });

  test('Doit gérer les années bissextiles', () => {
    const leapDate = '2024-02-29';
    const age = calculateAgeFromBirthDate(leapDate);
    assert.ok(age.length > 0);
  });
});

describe('Gestion de l\'expiration des chats adoptés (getCatAdoptionInfo)', () => {
  test('Ne doit pas être considéré comme adopté si statut différent', () => {
    const cat = { status: 'Disponible' };
    const info = getCatAdoptionInfo(cat);
    assert.equal(info.isAdopted, false);
    assert.equal(info.isExpired, false);
  });

  test('Doit gérer les objets cat nuls ou incomplets', () => {
    assert.equal(getCatAdoptionInfo(null).isAdopted, false);
    assert.equal(getCatAdoptionInfo({}).isAdopted, false);
    
    // Chat adopté sans date
    const noDateInfo = getCatAdoptionInfo({ status: 'Adopté' });
    assert.equal(noDateInfo.isAdopted, true);
    assert.equal(noDateInfo.isExpired, false);
    assert.equal(noDateInfo.days, 0);
  });

  test('Doit calculer les jours écoulés pour un chat récemment adopté (< 60 jours)', () => {
    const now = Date.now();
    const cat = {
      status: 'Adopté',
      adoptedAt: new Date(now - 15 * 86400000).toISOString()
    };
    const info = getCatAdoptionInfo(cat);
    assert.equal(info.isAdopted, true);
    assert.equal(info.days, 15);
    assert.equal(info.isExpired, false);
    assert.equal(info.daysRemaining, 45);
  });

  test('Doit marquer comme expiré un chat adopté à la limite exacte et au-delà des 60 jours', () => {
    const now = Date.now();
    
    // Exactement 59 jours (non expiré, 1 jour restant)
    const cat59 = {
      status: 'Adopté',
      adoptedAt: new Date(now - 59 * 86400000).toISOString()
    };
    const info59 = getCatAdoptionInfo(cat59);
    assert.equal(info59.isExpired, false);
    assert.equal(info59.daysRemaining, 1);

    // Exactement 60 jours (expiré)
    const cat60 = {
      status: 'Adopté',
      adoptedAt: new Date(now - 60 * 86400000).toISOString()
    };
    const info60 = getCatAdoptionInfo(cat60);
    assert.equal(info60.isExpired, true);
    assert.equal(info60.daysRemaining, 0);

    // 65 jours (expiré)
    const cat65 = {
      status: 'Adopté',
      adoptedAt: new Date(now - 65 * 86400000).toISOString()
    };
    const info65 = getCatAdoptionInfo(cat65);
    assert.equal(info65.isAdopted, true);
    assert.equal(info65.days, 65);
    assert.equal(info65.isExpired, true);
    assert.equal(info65.daysRemaining, 0);
  });

  test('Doit utiliser updatedAt ou createdAt en fallback si adoptedAt est absent', () => {
    const now = Date.now();
    const cat = {
      status: 'Adopté',
      updatedAt: new Date(now - 10 * 86400000).toISOString()
    };
    const info = getCatAdoptionInfo(cat);
    assert.equal(info.isAdopted, true);
    assert.equal(info.days, 10);
  });
});

describe('Verrouillage anti-conflit d\'édition (isCatLockedByOther)', () => {
  test('N\'est pas verrouillé si aucun verrou n\'est posé', () => {
    assert.equal(isCatLockedByOther(null, 'admin1@test.fr'), false);
    assert.equal(isCatLockedByOther({ id: 'cat1' }, 'admin1@test.fr'), false);
    assert.equal(isCatLockedByOther({ id: 'cat1', editingLock: null }, 'admin1@test.fr'), false);
    assert.equal(isCatLockedByOther({ id: 'cat1', editingLock: {} }, 'admin1@test.fr'), false);
  });

  test('N\'est pas verrouillé si le verrou appartient au même utilisateur', () => {
    const cat = {
      id: 'cat1',
      editingLock: {
        email: 'admin1@test.fr',
        lockedAt: Date.now() - 30000 // il y a 30s
      }
    };
    assert.equal(isCatLockedByOther(cat, 'admin1@test.fr'), false);
    // Insensible à la casse et aux espaces
    assert.equal(isCatLockedByOther(cat, '  ADMIN1@TEST.FR  '), false);
  });

  test('Est verrouillé si un autre utilisateur a posé un verrou récent (< 5 min)', () => {
    const cat = {
      id: 'cat1',
      editingLock: {
        email: 'autre.admin@test.fr',
        lockedAt: Date.now() - 60000 // il y a 1 min
      }
    };
    assert.equal(isCatLockedByOther(cat, 'admin1@test.fr'), true);
  });

  test('Le verrou expire automatiquement après 5 minutes', () => {
    const cat = {
      id: 'cat1',
      editingLock: {
        email: 'autre.admin@test.fr',
        lockedAt: Date.now() - (LOCK_EXPIRATION_MS + 1000) // 5 min et 1s
      }
    };
    assert.equal(isCatLockedByOther(cat, 'admin1@test.fr'), false);
  });
});

describe('Traduction des erreurs Firebase Auth (getAuthErrorMessage)', () => {
  test('Doit traduire les codes d\'erreur courants en français clair', () => {
    assert.equal(
      getAuthErrorMessage('auth/user-not-found'),
      "Identifiants incorrects ou compte non créé dans la console Firebase."
    );
    assert.equal(
      getAuthErrorMessage('auth/wrong-password'),
      "Identifiants incorrects ou compte non créé dans la console Firebase."
    );
    assert.equal(
      getAuthErrorMessage('auth/invalid-credential'),
      "Identifiants incorrects ou compte non créé dans la console Firebase."
    );
    assert.equal(
      getAuthErrorMessage('auth/invalid-email'),
      "Format d'adresse e-mail invalide."
    );
    assert.equal(
      getAuthErrorMessage('auth/user-disabled'),
      "Ce compte utilisateur a été désactivé."
    );
    assert.equal(
      getAuthErrorMessage('auth/too-many-requests'),
      "Accès temporairement bloqué en raison de tentatives répétées. Réessayez dans quelques instants."
    );
    assert.equal(
      getAuthErrorMessage('auth/network-request-failed'),
      "Erreur réseau. Vérifiez votre connexion Internet."
    );
    assert.equal(
      getAuthErrorMessage('auth/email-already-in-use'),
      "Cette adresse e-mail est déjà associée à un compte."
    );
    assert.equal(
      getAuthErrorMessage('auth/weak-password'),
      "Le mot de passe est trop court (au moins 6 caractères requis)."
    );
    assert.equal(
      getAuthErrorMessage('auth/operation-not-allowed'),
      "L'inscription par e-mail n'est pas activée sur la console Firebase."
    );
    assert.equal(
      getAuthErrorMessage('auth/popup-closed-by-user'),
      "La fenêtre de connexion Google a été fermée avant la finalisation."
    );
    assert.equal(
      getAuthErrorMessage('auth/popup-blocked'),
      "La fenêtre pop-up Google a été bloquée par votre navigateur. Veuillez autoriser les fenêtres pop-up."
    );
    assert.equal(
      getAuthErrorMessage('auth/unauthorized-domain'),
      "Domaine non autorisé dans Firebase pour Google Auth. Vérifiez les domaines autorisés dans la console Firebase."
    );
  });

  test('Doit renvoyer un message par défaut pour les codes inconnus', () => {
    const msg = getAuthErrorMessage('auth/unknown-error');
    assert.ok(msg.includes('inconnue') || msg.includes('auth/unknown-error'));
  });
});

describe('Nettoyage et validation conditionnelle du formulaire d\'adoption (cleanAdoptionFormData)', () => {
  test('Doit retirer les questions spécifiques aux animaux quand hasAnimals === "Non"', () => {
    const raw = {
      ...INITIAL_ADOPTION_FORM,
      hasAnimals: 'Non',
      animalDetails: '2 chats',
      dogDetails: 'Berger 3 ans',
      animalStatus: ['Vaccinés', 'Identifiés'],
      isSociable: 'Oui'
    };
    const cleaned = cleanAdoptionFormData(raw);
    assert.equal(cleaned.hasAnimals, 'Non');
    assert.equal('animalDetails' in cleaned, false);
    assert.equal('dogDetails' in cleaned, false);
    assert.equal('animalStatus' in cleaned, false);
    assert.equal('isSociable' in cleaned, false);
  });

  test('Doit conserver les questions spécifiques aux animaux quand hasAnimals === "Oui"', () => {
    const raw = {
      ...INITIAL_ADOPTION_FORM,
      hasAnimals: 'Oui',
      animalDetails: '1 chat de 2 ans',
      dogDetails: 'Labrador 4 ans',
      animalStatus: ['Vaccinés', 'Stérilisés'],
      isSociable: 'Oui'
    };
    const cleaned = cleanAdoptionFormData(raw);
    assert.equal(cleaned.hasAnimals, 'Oui');
    assert.equal(cleaned.animalDetails, '1 chat de 2 ans');
    assert.equal(cleaned.dogDetails, 'Labrador 4 ans');
    assert.deepEqual(cleaned.animalStatus, ['Vaccinés', 'Stérilisés']);
    assert.equal(cleaned.isSociable, 'Oui');
  });

  test('Doit masquer les détails enfants si nombre d\'enfants <= 0', () => {
    const raw = {
      ...INITIAL_ADOPTION_FORM,
      childrenCount: '0',
      childrenAges: '10 ans',
      childrenAnimalContact: 'Oui'
    };
    const cleaned = cleanAdoptionFormData(raw);
    assert.equal('childrenAges' in cleaned, false);
    assert.equal('childrenAnimalContact' in cleaned, false);
  });

  test('Doit conserver les détails enfants si nombre d\'enfants > 0', () => {
    const raw = {
      ...INITIAL_ADOPTION_FORM,
      childrenCount: '2',
      childrenAges: '6 et 9 ans',
      childrenAnimalContact: 'Oui'
    };
    const cleaned = cleanAdoptionFormData(raw);
    assert.equal(cleaned.childrenAges, '6 et 9 ans');
    assert.equal(cleaned.childrenAnimalContact, 'Oui');
  });

  test('Doit retirer superficie jardin si pas de jardin', () => {
    const raw = {
      ...INITIAL_ADOPTION_FORM,
      hasGarden: 'Non',
      gardenSurface: '500m2'
    };
    const cleaned = cleanAdoptionFormData(raw);
    assert.equal('gardenSurface' in cleaned, false);
  });

  test('Doit retirer sécurisation balcon si pas de balcon', () => {
    const raw = {
      ...INITIAL_ADOPTION_FORM,
      hasBalcony: 'Non',
      isBalconySecured: 'Oui'
    };
    const cleaned = cleanAdoptionFormData(raw);
    assert.equal('isBalconySecured' in cleaned, false);
  });

  test('Doit retirer étage et type autre selon le housingType', () => {
    const rawMaison = {
      ...INITIAL_ADOPTION_FORM,
      housingType: 'Maison',
      floor: '2',
      housingTypeOther: 'Ferme'
    };
    const cleanedMaison = cleanAdoptionFormData(rawMaison);
    assert.equal('floor' in cleanedMaison, false);
    assert.equal('housingTypeOther' in cleanedMaison, false);

    const rawAutre = {
      ...INITIAL_ADOPTION_FORM,
      housingType: 'Autre',
      housingTypeOther: 'Péniche fluviale',
      floor: '1'
    };
    const cleanedAutre = cleanAdoptionFormData(rawAutre);
    assert.equal('floor' in cleanedAutre, false);
    assert.equal(cleanedAutre.housingTypeOther, 'Péniche fluviale');
  });

  test('Doit nettoyer dogDetails si vide ou absent', () => {
    const raw = {
      ...INITIAL_ADOPTION_FORM,
      hasAnimals: 'Oui',
      animalDetails: '1 chat',
      dogDetails: '   '
    };
    const cleaned = cleanAdoptionFormData(raw);
    assert.equal('dogDetails' in cleaned, false);
  });

  test('validateAdoptionForm doit détecter les champs obligatoires manquants de base', () => {
    const invalid = validateAdoptionForm({});
    assert.equal(invalid.isValid, false);
    assert.ok(invalid.errors.catName);
    assert.ok(invalid.errors.fullName);
    assert.ok(invalid.errors.email);
    assert.ok(invalid.errors.phone);
    assert.ok(invalid.errors.address);
    assert.ok(invalid.errors.postalCodeCity);
    assert.ok(invalid.errors.profession);
  });

  test('validateAdoptionForm doit valider conditionnellement les animaux', () => {
    const formWithAnimals = {
      catName: 'Mimi',
      fullName: 'Jean Martin',
      email: 'jean@test.fr',
      phone: '0612345678',
      address: '1 rue des Fleurs',
      postalCodeCity: '56000 Vannes',
      profession: 'Ingénieur',
      adultsCount: '2',
      housingType: 'Maison',
      hasAnimals: 'Oui',
      animalDetails: '', // Manquant !
      sleepingPlace: 'Salon',
      hoursAbsent: '6h',
      absenceLocation: 'Maison'
    };
    const res = validateAdoptionForm(formWithAnimals);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.animalDetails);
  });

  test('validateAdoptionForm doit valider conditionnellement les enfants', () => {
    const formWithKids = {
      catName: 'Mimi',
      fullName: 'Jean Martin',
      email: 'jean@test.fr',
      phone: '0612345678',
      address: '1 rue des Fleurs',
      postalCodeCity: '56000 Vannes',
      profession: 'Ingénieur',
      adultsCount: '2',
      childrenCount: '2',
      childrenAges: '', // Manquant !
      housingType: 'Maison',
      sleepingPlace: 'Salon',
      hoursAbsent: '6h',
      absenceLocation: 'Maison'
    };
    const res = validateAdoptionForm(formWithKids);
    assert.equal(res.isValid, false);
    assert.ok(res.errors.childrenAges);
  });

  test('validateAdoptionForm doit valider conditionnellement le logement (Appartement, Autre, Jardin)', () => {
    // Appartement sans étage
    const formAppart = {
      catName: 'Mimi',
      fullName: 'Jean Martin',
      email: 'jean@test.fr',
      phone: '0612345678',
      address: '1 rue des Fleurs',
      postalCodeCity: '56000 Vannes',
      profession: 'Ingénieur',
      adultsCount: '1',
      housingType: 'Appartement',
      floor: '', // Manquant !
      sleepingPlace: 'Salon',
      hoursAbsent: '6h',
      absenceLocation: 'Maison'
    };
    assert.ok(validateAdoptionForm(formAppart).errors.floor);

    // Autre sans précision
    const formAutre = {
      ...formAppart,
      housingType: 'Autre',
      housingTypeOther: '' // Manquant !
    };
    assert.ok(validateAdoptionForm(formAutre).errors.housingTypeOther);

    // Jardin sans superficie
    const formJardin = {
      ...formAppart,
      housingType: 'Maison',
      hasGarden: 'Oui',
      gardenSurface: '' // Manquant !
    };
    assert.ok(validateAdoptionForm(formJardin).errors.gardenSurface);
  });

  test('validateAdoptionForm doit valider un formulaire complet et cohérent', () => {
    const valid = validateAdoptionForm({
      catName: 'Mimi',
      fullName: 'Jean Martin',
      email: 'jean.martin@example.fr',
      phone: '0612345678',
      address: '1 rue des Fleurs',
      postalCodeCity: '56000 Vannes',
      profession: 'Ingénieur',
      adultsCount: '2',
      childrenCount: '1',
      childrenAges: '7 ans',
      housingType: 'Appartement',
      floor: '2',
      hasAnimals: 'Oui',
      animalDetails: '1 chat sociable',
      sleepingPlace: 'Salon',
      hoursAbsent: '7h',
      absenceLocation: 'Maison entière'
    });
    assert.equal(valid.isValid, true);
    assert.equal(Object.keys(valid.errors).length, 0);
  });
});

describe('Codes d\'invitation aléatoires sécurisés (inviteCodes)', () => {
  test('generateRandomInviteCode doit générer un code au format CLH-XXXX-XXXX', () => {
    const code = generateRandomInviteCode();
    assert.ok(/^CLH-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$/.test(code));
  });

  test('generateRandomInviteCode ne doit pas contenir de caractères ambigus (0, O, 1, I, L) dans la partie aléatoire', () => {
    for (let i = 0; i < 20; i++) {
      const code = generateRandomInviteCode();
      const randomPart = code.slice(4); // Exclut le préfixe CLH-
      assert.equal(/[01OIL]/.test(randomPart), false);
    }
  });

  test('generateRandomInviteCode doit produire des codes uniques', () => {
    const set = new Set();
    for (let i = 0; i < 50; i++) {
      set.add(generateRandomInviteCode());
    }
    assert.equal(set.size, 50);
  });

  test('normalizeInviteCode doit nettoyer les espaces et passer en majuscules', () => {
    assert.equal(normalizeInviteCode(' clh-abcd-1234 '), 'CLH-ABCD-1234');
    assert.equal(normalizeInviteCode(''), '');
    assert.equal(normalizeInviteCode(null), '');
  });

  test('isValidCodeFormat doit valider les formats de codes acceptés', () => {
    assert.equal(isValidCodeFormat('CLH-4A8K-9Z2M'), true);
    assert.equal(isValidCodeFormat('clh-4a8k-9z2m'), true);
    assert.equal(isValidCodeFormat('INVALID'), false);
    assert.equal(isValidCodeFormat('CLH-123'), false);
  });
});

describe('Rôles et autorisations (roles)', () => {
  test('Administrateur a tous les droits', () => {
    assert.equal(canEditCats(USER_ROLES.ADMIN), true);
    assert.equal(canDeleteCats(USER_ROLES.ADMIN), true);
    assert.equal(canManageStories(USER_ROLES.ADMIN), true);
    assert.equal(canManageAdoptions(USER_ROLES.ADMIN), true);
    assert.equal(canManageMembers(USER_ROLES.ADMIN), true);
    assert.equal(getDefaultTabForRole(USER_ROLES.ADMIN), 'cats');
  });

  test('Gestionnaire a les droits sur les chats et les avis, mais pas sur les membres', () => {
    assert.equal(canEditCats(USER_ROLES.GESTION), true);
    assert.equal(canDeleteCats(USER_ROLES.GESTION), false);
    assert.equal(canManageStories(USER_ROLES.GESTION), true);
    assert.equal(canManageAdoptions(USER_ROLES.GESTION), true);
    assert.equal(canManageMembers(USER_ROLES.GESTION), false);
    assert.equal(getDefaultTabForRole(USER_ROLES.GESTION), 'cats');
  });

  test('Bénévole a l\'accès privilégié aux demandes d\'adoption et onglet par défaut adoptions', () => {
    assert.equal(canEditCats(USER_ROLES.BENEVOLE), false);
    assert.equal(canDeleteCats(USER_ROLES.BENEVOLE), false);
    assert.equal(canManageStories(USER_ROLES.BENEVOLE), false);
    assert.equal(canManageAdoptions(USER_ROLES.BENEVOLE), true);
    assert.equal(canManageMembers(USER_ROLES.BENEVOLE), false);
    assert.equal(getDefaultTabForRole(USER_ROLES.BENEVOLE), 'adoptions');
  });

  test('dark56100@gmail.com est reconnu comme administrateur principal permanent', () => {
    assert.equal(SUPER_ADMIN_EMAILS.includes('dark56100@gmail.com'), true);
    assert.equal(isSuperAdminEmail('dark56100@gmail.com'), true);
    assert.equal(isSuperAdminEmail('DARK56100@GMAIL.COM'), true);
    assert.equal(isSuperAdminEmail(' dark56100@gmail.com '), true);
    assert.equal(isSuperAdminEmail('autre.benevole@test.fr'), false);
    assert.equal(isSuperAdminEmail(''), false);
    assert.equal(isSuperAdminEmail(null), false);
  });

  test('asso.chatslheureux@gmail.com est reconnu comme Présidence / Association', () => {
    assert.equal(ASSO_PRESIDENT_EMAILS.includes('asso.chatslheureux@gmail.com'), true);
    assert.equal(isAssoPresidentEmail('asso.chatslheureux@gmail.com'), true);
    assert.equal(isAssoPresidentEmail('ASSO.CHATSLHEUREUX@GMAIL.COM'), true);
    assert.equal(isAssoPresidentEmail(' asso.chatslheureux@gmail.com '), true);
    assert.equal(isAssoPresidentEmail('autre@test.fr'), false);
    assert.equal(isAssoPresidentEmail(''), false);
    assert.equal(isAssoPresidentEmail(null), false);
  });

  test('KNOWN_ACCOUNTS contient les comptes officiels et historiques avec leurs rôles', () => {
    assert.ok(Array.isArray(KNOWN_ACCOUNTS));
    assert.ok(KNOWN_ACCOUNTS.length >= 3);

    const dark = KNOWN_ACCOUNTS.find(a => a.email === 'dark56100@gmail.com');
    assert.ok(dark);
    assert.equal(dark.role, USER_ROLES.ADMIN);
    assert.equal(dark.isSuperAdmin, true);

    const asso = KNOWN_ACCOUNTS.find(a => a.email === 'asso.chatslheureux@gmail.com');
    assert.ok(asso);
    assert.equal(asso.role, USER_ROLES.ADMIN);
    assert.equal(asso.isPresident, true);
    assert.equal(asso.phone, '06 61 50 88 28');

    const alex = KNOWN_ACCOUNTS.find(a => a.email === 'galexandre@galexandre.com');
    assert.ok(alex);
    assert.equal(alex.role, USER_ROLES.GESTION);
  });
});
describe('Cycle de vie des demandes d\'adoption (archivage 30j & purge 60j)', () => {
  test('Calcule correctement l\'âge en jours', () => {
    const now = Date.now();
    const date10DaysAgo = new Date(now - 10 * 86400000).toISOString();
    assert.equal(getAdoptionDaysAge(date10DaysAgo), 10);
  });

  test('Gère les dates invalides ou nulles', () => {
    assert.equal(getAdoptionDaysAge(null), 0);
    assert.equal(getAdoptionDaysAge(''), 0);
    assert.equal(getAdoptionDaysAge('invalid-date'), 0);
  });

  test('Demande récente (< 30 jours) n\'est ni archivable ni purgeable', () => {
    const info = getAdoptionLifecycleInfo({ submittedAt: new Date().toISOString(), status: ADOPTION_STATUS.NOUVEAU });
    assert.equal(info.isArchived, false);
    assert.equal(info.isArchivable, false);
    assert.equal(info.isPurgable, false);
  });

  test('Demande de 35 jours est archivable mais pas purgeable', () => {
    const d35 = new Date(Date.now() - 35 * 86400000).toISOString();
    const info = getAdoptionLifecycleInfo({ submittedAt: d35, status: ADOPTION_STATUS.NOUVEAU });
    assert.equal(info.isArchived, false);
    assert.equal(info.isArchivable, true);
    assert.equal(info.isPurgable, false);
  });

  test('Demande déjà archivée n\'est plus marquée archivable', () => {
    const d40 = new Date(Date.now() - 40 * 86400000).toISOString();
    const info = getAdoptionLifecycleInfo({ submittedAt: d40, status: ADOPTION_STATUS.ARCHIVEE });
    assert.equal(info.isArchived, true);
    assert.equal(info.isArchivable, false);
  });

  test('Demande de plus de 60 jours est purgeable', () => {
    const d65 = new Date(Date.now() - 65 * 86400000).toISOString();
    const info = getAdoptionLifecycleInfo({ submittedAt: d65, status: ADOPTION_STATUS.ARCHIVEE });
    assert.equal(info.isPurgable, true);
  });
});

describe('Service et fonction d\'envoi d\'e-mails (noreply@chat-lheureux.fr)', () => {
  test('sendAdoptionConfirmationEmail doit rejeter proprement si e-mail manquant', async () => {
    const res = await sendAdoptionConfirmationEmail({ fullName: 'Jean Dupont' });
    assert.equal(res.success, false);
    assert.equal(res.error, 'Adresse e-mail manquante');
  });

  test('sendCustomInfoEmail doit rejeter proprement si destinataire manquant', async () => {
    const res = await sendCustomInfoEmail({ subject: 'Test' });
    assert.equal(res.success, false);
    assert.equal(res.error, 'Destinataire manquant');
  });

  test('Netlify Function send-email doit refuser les requêtes GET avec code 405', async () => {
    const req = new Request('https://chat-lheureux.fr/api/send-email', { method: 'GET' });
    const res = await sendEmailFunction(req, {});
    assert.equal(res.status, 405);
  });

  test('Netlify Function send-email doit exiger le champ to avec code 400', async () => {
    const req = new Request('https://chat-lheureux.fr/api/send-email', { 
      method: 'POST',
      body: JSON.stringify({ subject: 'Sans destinataire' })
    });
    const res = await sendEmailFunction(req, {});
    assert.equal(res.status, 400);
  });

  test('Netlify Function send-email doit fonctionner en mode simulation sans clé API', async () => {
    const req = new Request('https://chat-lheureux.fr/api/send-email', { 
      method: 'POST',
      body: JSON.stringify({ 
        to: 'adoptant@example.com',
        type: 'adoption_applicant',
        data: {
          catName: 'Mimi',
          fullName: 'Marie Curie',
          phone: '06 00 00 00 00',
          city: 'Vannes'
        }
      })
    });
    const res = await sendEmailFunction(req, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.simulated, true);
  });

  test('Netlify Function send-email doit gérer la notification pour l\'association', async () => {
    const req = new Request('https://chat-lheureux.fr/api/send-email', { 
      method: 'POST',
      body: JSON.stringify({ 
        to: 'asso.chatslheureux@gmail.com',
        type: 'adoption_admin_notification',
        data: {
          catName: 'Felix',
          fullName: 'Pierre Paul',
          phone: '06 11 22 33 44',
          city: 'Lorient'
        }
      })
    });
    const res = await sendEmailFunction(req, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });

  test('Netlify Function send-email doit supporter les destinataires en BCC pour préserver la confidentialité des bénévoles', async () => {
    const req = new Request('https://chat-lheureux.fr/api/send-email', { 
      method: 'POST',
      body: JSON.stringify({ 
        to: 'asso.chatslheureux@gmail.com',
        bcc: ['benevole1@test.fr', 'benevole2@test.fr'],
        type: 'adoption_admin_notification',
        data: {
          catName: 'Minouche',
          fullName: 'Claire Martin',
          phone: '06 12 34 56 78',
          city: 'Vannes'
        }
      })
    });
    const res = await sendEmailFunction(req, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.simulated, true);
  });

  test('Netlify Function send-email génère les boutons WhatsApp et l\'URL de la fiche chat', async () => {
    const req = new Request('https://chat-lheureux.fr/api/send-email', { 
      method: 'POST',
      body: JSON.stringify({ 
        to: 'asso.chatslheureux@gmail.com',
        type: 'adoption_admin_notification',
        data: {
          catId: 'cat-456',
          catName: 'Chaussette',
          fullName: 'Julien Lefebvre',
          phone: '06 99 88 77 66',
          email: 'julien@example.com',
          city: 'Auray',
          housingType: 'Maison',
          hasGarden: 'Oui'
        }
      })
    });
    const res = await sendEmailFunction(req, {});
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
  });
});

describe('Connexion Google et sécurisation par code d\'invitation', () => {
  test('isRegisteredMember doit reconnaître immédiatement l\'administrateur principal', async () => {
    const isMember = await isRegisteredMember({ email: 'dark56100@gmail.com', uid: 'superadmin123' });
    assert.equal(isMember, true);
  });

  test('isRegisteredMember doit reconnaître le compte association', async () => {
    const isMember = await isRegisteredMember({ email: 'asso.chatslheureux@gmail.com', uid: 'asso123' });
    assert.equal(isMember, true);
  });

  test('isRegisteredMember doit reconnaître les comptes connus historiques', async () => {
    const isMember = await isRegisteredMember({ email: 'galexandre@galexandre.com', uid: 'galex123' });
    assert.equal(isMember, true);
  });

  test('isRegisteredMember doit rejeter un utilisateur Google inconnu sans compte préalable', async () => {
    const isMember = await isRegisteredMember({ email: 'nouveau.benevole.inconnu@gmail.com', uid: 'unk999' });
    assert.equal(isMember, false);
  });

  test('Le rôle par défaut lors d\'une inscription par invitation Google est "Bénévole"', () => {
    const codeDocWithoutRole = { id: 'CLH-TEST-0001', role: null };
    const defaultRole = codeDocWithoutRole.role || USER_ROLES.BENEVOLE;
    assert.equal(defaultRole, USER_ROLES.BENEVOLE);
  });

  test('Un code d\'invitation avec rôle personnalisé est respecté', () => {
    const codeDocWithRole = { id: 'CLH-TEST-0002', role: USER_ROLES.GESTION };
    const assignedRole = codeDocWithRole.role || USER_ROLES.BENEVOLE;
    assert.equal(assignedRole, USER_ROLES.GESTION);
  });
});

describe('Réorganisation des photos des chats et rétrocompatibilité (OBJECTIF 1)', () => {
  const movePhoto = (arr, idx, dir) => {
    const next = [...arr];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= next.length) return next;
    const tmp = next[idx];
    next[idx] = next[newIdx];
    next[newIdx] = tmp;
    return next;
  };

  const setPrimaryPhoto = (arr, idx) => {
    const next = [...arr];
    const item = next.splice(idx, 1)[0];
    return [item, ...next];
  };

  const reorderPhotosDrop = (arr, fromIdx, toIdx) => {
    if (fromIdx === toIdx) return arr;
    const next = [...arr];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    return next;
  };

  const getPrimaryCover = (photos, fallbackImage) => {
    const valid = Array.isArray(photos) ? photos.filter(p => typeof p === 'string' && p.trim().length > 0) : [];
    if (valid.length > 0) return valid[0];
    return fallbackImage || 'https://placehold.co/600x400?text=Pas+de+photo';
  };

  const normalizeCatPhotosForEdit = (cat) => {
    if (Array.isArray(cat?.photos) && cat.photos.length > 0) {
      return [...cat.photos];
    }
    return cat?.image ? [cat.image] : [];
  };

  test('movePhoto déplace correctement vers la gauche et vers la droite', () => {
    const initial = ['photoA.jpg', 'photoB.jpg', 'photoC.jpg'];
    const movedLeft = movePhoto(initial, 1, -1);
    assert.deepEqual(movedLeft, ['photoB.jpg', 'photoA.jpg', 'photoC.jpg']);

    const movedRight = movePhoto(movedLeft, 1, 1);
    assert.deepEqual(movedRight, ['photoB.jpg', 'photoC.jpg', 'photoA.jpg']);

    const outOfBoundsLeft = movePhoto(initial, 0, -1);
    assert.deepEqual(outOfBoundsLeft, initial);
    const outOfBoundsRight = movePhoto(initial, 2, 1);
    assert.deepEqual(outOfBoundsRight, initial);
  });

  test('setPrimaryPhoto place la photo sélectionnée en première position (couverture)', () => {
    const list = ['photo1.jpg', 'photo2.jpg', 'photo3.jpg'];
    const updated = setPrimaryPhoto(list, 2);
    assert.deepEqual(updated, ['photo3.jpg', 'photo1.jpg', 'photo2.jpg']);
    assert.equal(updated[0], 'photo3.jpg');
  });

  test('reorderPhotosDrop réorganise fidèlement par glisser-déposer', () => {
    const list = ['A', 'B', 'C', 'D'];
    const dropped = reorderPhotosDrop(list, 3, 0);
    assert.deepEqual(dropped, ['D', 'A', 'B', 'C']);

    const droppedMid = reorderPhotosDrop(list, 0, 2);
    assert.deepEqual(droppedMid, ['B', 'C', 'A', 'D']);
  });

  test('getPrimaryCover sélectionne toujours la première photo valide comme couverture', () => {
    assert.equal(getPrimaryCover(['cover.jpg', 'side.jpg']), 'cover.jpg');
    assert.equal(getPrimaryCover([], 'legacy.jpg'), 'legacy.jpg');
    assert.equal(getPrimaryCover([], ''), 'https://placehold.co/600x400?text=Pas+de+photo');
  });

  test('normalizeCatPhotosForEdit assure la rétrocompatibilité des fiches chats sans photos array', () => {
    const oldCat = { id: 'cat1', name: 'Felix', image: 'https://images.fr/felix.jpg' };
    const normalizedOld = normalizeCatPhotosForEdit(oldCat);
    assert.deepEqual(normalizedOld, ['https://images.fr/felix.jpg']);

    const newCat = { id: 'cat2', name: 'Mimi', photos: ['p1.jpg', 'p2.jpg'], image: 'p1.jpg' };
    const normalizedNew = normalizeCatPhotosForEdit(newCat);
    assert.deepEqual(normalizedNew, ['p1.jpg', 'p2.jpg']);

    const emptyArrayCat = { id: 'cat3', name: 'Caramel', photos: [], image: 'caramel.jpg' };
    const normalizedEmpty = normalizeCatPhotosForEdit(emptyArrayCat);
    assert.deepEqual(normalizedEmpty, ['caramel.jpg']);
  });
});

describe('Résolution de l\'authDomain Firebase pour Netlify (OBJECTIF 2)', () => {
  test('resolveAuthDomain renvoie le domaine par défaut en environnement Node/SSR', () => {
    assert.equal(resolveAuthDomain(), 'chat-lheureux-56.firebaseapp.com');
  });
});

describe('Utilitaires WhatsApp et Partage de Dossier d\'Adoption (PLAN 1 & 2)', () => {
  test('cleanPhoneNumberForWhatsApp formate correctement les numéros français et internationaux', () => {
    assert.equal(cleanPhoneNumberForWhatsApp('06 12 34 56 78'), '33612345678');
    assert.equal(cleanPhoneNumberForWhatsApp('06.12.34.56.78'), '33612345678');
    assert.equal(cleanPhoneNumberForWhatsApp('+33 6 12 34 56 78'), '33612345678');
    assert.equal(cleanPhoneNumberForWhatsApp('0033 6 12 34 56 78'), '33612345678');
    assert.equal(cleanPhoneNumberForWhatsApp('07-11-22-33-44'), '33711223344');
    assert.equal(cleanPhoneNumberForWhatsApp(''), '');
    assert.equal(cleanPhoneNumberForWhatsApp(null), '');
    assert.equal(cleanPhoneNumberForWhatsApp(undefined), '');
  });

  test('getWhatsAppShareUrl produit des URLs directes api.whatsapp.com conformes', () => {
    const generalUrl = getWhatsAppShareUrl('Bonjour tout le monde !');
    assert.equal(generalUrl, 'https://api.whatsapp.com/send?text=Bonjour%20tout%20le%20monde%20!');

    const directPhoneUrl = getWhatsAppShareUrl('Bonjour candidat', '06 12 34 56 78');
    assert.equal(directPhoneUrl, 'https://api.whatsapp.com/send?phone=33612345678&text=Bonjour%20candidat');

    const emptyUrl = getWhatsAppShareUrl('');
    assert.equal(emptyUrl, 'https://api.whatsapp.com/send?text=');
  });

  test('formatAdoptionWhatsAppMessage synthétise fidèlement les données d\'une demande', () => {
    const adoption = {
      catName: 'Mimi',
      fullName: 'Marie Dupont',
      phone: '06 99 88 77 66',
      email: 'marie.dupont@example.com',
      postalCodeCity: '56000 Vannes',
      address: '12 rue des Fleurs',
      profession: 'Enseignante',
      adultsCount: 2,
      childrenCount: 1,
      childrenAges: '7 ans',
      housingType: 'Maison',
      hasGarden: 'Oui',
      gardenSurface: '400m²',
      hasBalcony: 'Non',
      hasAnimals: 'Oui',
      animalDetails: '1 chat sociable',
      adoptionReason: 'Coup de cœur pour Mimi.',
      submittedAt: '2026-09-20T10:00:00.000Z'
    };

    const message = formatAdoptionWhatsAppMessage(adoption);
    assert.ok(message.includes('*Chat :* Mimi'));
    assert.ok(message.includes('*Nom :* Marie Dupont'));
    assert.ok(message.includes('*Tél :* 06 99 88 77 66'));
    assert.ok(message.includes('*E-mail :* marie.dupont@example.com'));
    assert.ok(message.includes('12 rue des Fleurs, 56000 Vannes'));
    assert.ok(message.includes('2 adulte(s), 1 enfant(s) (âges : 7 ans)'));
    assert.ok(message.includes('Maison'));
    assert.ok(message.includes('Oui (400m²)'));
    assert.ok(message.includes('1 chat sociable'));
    assert.ok(message.includes('Coup de cœur pour Mimi.'));
    assert.ok(message.includes('https://chat-lheureux.fr/admin'));
  });

  test('formatAdoptionWhatsAppMessage gère les cas d\'adoption vide ou partielle', () => {
    assert.equal(formatAdoptionWhatsAppMessage(null), '');
    const partial = { fullName: 'Jean Inconnu' };
    const result = formatAdoptionWhatsAppMessage(partial);
    assert.ok(result.includes('*Chat :* Non précisé'));
    assert.ok(result.includes('*Nom :* Jean Inconnu'));
  });

  test('formatAdoptionWhatsAppMessage inclut le lien direct vers la fiche chat si catId est renseigné', () => {
    const adoptionWithCatId = {
      catId: 'nougat-56',
      catName: 'Nougat',
      fullName: 'Sophie Bernard'
    };
    const msg = formatAdoptionWhatsAppMessage(adoptionWithCatId);
    assert.ok(msg.includes('https://chat-lheureux.fr/chat/nougat-56'));
    assert.ok(msg.includes('*Chat :* Nougat'));
  });
});

describe('Historique d\'audit des actions et Rétention 7 jours (PLAN 3)', () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  test('isLogExpired identifie correctement les logs récents vs expirés (> 7 jours)', () => {
    const now = Date.now();
    
    // Log d'aujourd'hui
    assert.equal(isLogExpired(now, 7), false);

    // Log d'il y a 3 jours
    assert.equal(isLogExpired(now - (3 * ONE_DAY_MS), 7), false);

    // Log d'il y a 6 jours et 23h
    assert.equal(isLogExpired(now - (6.9 * ONE_DAY_MS), 7), false);

    // Log d'il y a 7 jours et 1 heure (expiré)
    assert.equal(isLogExpired(now - (7 * ONE_DAY_MS + 3600000), 7), true);

    // Log d'il y a 14 jours (expiré)
    assert.equal(isLogExpired(now - (14 * ONE_DAY_MS), 7), true);
  });

  test('isLogExpired supporte les chaînes de dates ISO', () => {
    const freshIso = new Date(Date.now() - ONE_DAY_MS).toISOString();
    assert.equal(isLogExpired(freshIso, 7), false);

    const expiredIso = new Date(Date.now() - 10 * ONE_DAY_MS).toISOString();
    assert.equal(isLogExpired(expiredIso, 7), true);
  });

  test('isLogExpired gère les dates nulles ou invalides avec grâce', () => {
    assert.equal(isLogExpired(null), false);
    assert.equal(isLogExpired(''), false);
    assert.equal(isLogExpired('invalid'), false);
  });

  test('Constantes de rétention et catégories correctement définies', () => {
    assert.equal(MAX_LOG_RETENTION_DAYS, 7);
    assert.equal(LOG_CATEGORIES.CHATS, 'chats');
    assert.equal(LOG_CATEGORIES.ADOPTIONS, 'adoptions');
    assert.equal(LOG_CATEGORIES.MEMBERS, 'members');
    assert.equal(LOG_CATEGORIES.STORIES, 'stories');
    assert.ok(LOG_ACTIONS.CAT_CREATE);
    assert.ok(LOG_ACTIONS.ADOPTION_STATUS_CHANGE);
    assert.ok(LOG_ACTIONS.MEMBER_ROLE_CHANGE);
    assert.ok(LOG_ACTIONS.INVITE_CODE_DELETE);
    assert.ok(LOG_ACTIONS.MEMBER_CREATE);
    assert.ok(LOG_ACTIONS.ACTIVITY_PURGE);
    assert.ok(LOG_ACTIONS.CAT_PURGE_EXPIRED);
  });

  test('getActionNature classifie fidèlement chaque type d\'action en catégorie visuelle', () => {
    // Créations
    assert.equal(getActionNature(LOG_ACTIONS.CAT_CREATE), ACTION_NATURE.CREATE);
    assert.equal(getActionNature(LOG_ACTIONS.STORY_CREATE), ACTION_NATURE.CREATE);
    assert.equal(getActionNature(LOG_ACTIONS.ADOPTION_SUBMITTED), ACTION_NATURE.CREATE);
    assert.equal(getActionNature(LOG_ACTIONS.MEMBER_CREATE), ACTION_NATURE.CREATE);
    assert.equal(getActionNature(LOG_ACTIONS.INVITE_CODE_CREATE), ACTION_NATURE.CREATE);
    assert.equal(getActionNature(LOG_ACTIONS.INVITE_CODE_REDEEM), ACTION_NATURE.CREATE);

    // Modifications
    assert.equal(getActionNature(LOG_ACTIONS.CAT_UPDATE), ACTION_NATURE.UPDATE);
    assert.equal(getActionNature(LOG_ACTIONS.CAT_STATUS_CHANGE), ACTION_NATURE.UPDATE);
    assert.equal(getActionNature(LOG_ACTIONS.ADOPTION_STATUS_CHANGE), ACTION_NATURE.UPDATE);
    assert.equal(getActionNature(LOG_ACTIONS.ADOPTION_NOTES_UPDATE), ACTION_NATURE.UPDATE);
    assert.equal(getActionNature(LOG_ACTIONS.MEMBER_ROLE_CHANGE), ACTION_NATURE.UPDATE);
    assert.equal(getActionNature(LOG_ACTIONS.MEMBER_PROFILE_UPDATE), ACTION_NATURE.UPDATE);
    assert.equal(getActionNature(LOG_ACTIONS.STORY_UPDATE), ACTION_NATURE.UPDATE);

    // Suppressions
    assert.equal(getActionNature(LOG_ACTIONS.CAT_DELETE), ACTION_NATURE.DELETE);
    assert.equal(getActionNature(LOG_ACTIONS.STORY_DELETE), ACTION_NATURE.DELETE);
    assert.equal(getActionNature(LOG_ACTIONS.MEMBER_DELETE), ACTION_NATURE.DELETE);
    assert.equal(getActionNature(LOG_ACTIONS.INVITE_CODE_DELETE), ACTION_NATURE.DELETE);

    // Purges & Archives
    assert.equal(getActionNature(LOG_ACTIONS.ADOPTION_ARCHIVE), ACTION_NATURE.PURGE);
    assert.equal(getActionNature(LOG_ACTIONS.ADOPTION_PURGE), ACTION_NATURE.PURGE);
    assert.equal(getActionNature(LOG_ACTIONS.CAT_PURGE_EXPIRED), ACTION_NATURE.PURGE);
    assert.equal(getActionNature(LOG_ACTIONS.ACTIVITY_PURGE), ACTION_NATURE.PURGE);

    // Cas limites / Inconnus
    assert.equal(getActionNature('UNKNOWN_ACTION'), ACTION_NATURE.OTHER);
    assert.equal(getActionNature(null), ACTION_NATURE.OTHER);
    assert.equal(getActionNature(''), ACTION_NATURE.OTHER);
  });

  test('ACTION_NATURE_LABELS propose des libellés conviviaux en français', () => {
    assert.equal(ACTION_NATURE_LABELS[ACTION_NATURE.CREATE], 'Créations');
    assert.equal(ACTION_NATURE_LABELS[ACTION_NATURE.UPDATE], 'Modifications');
    assert.equal(ACTION_NATURE_LABELS[ACTION_NATURE.DELETE], 'Suppressions');
    assert.equal(ACTION_NATURE_LABELS[ACTION_NATURE.PURGE], 'Purges & Archives');
  });

  test('Diagnostic et gestion des erreurs de permission Firestore', () => {
    clearLastLogActivityError();
    assert.equal(getLastLogActivityError(), null);
  });
});

describe('Tri alphabétique, dates et complétude des fiches chats (catSorting)', () => {
  const sampleCats = [
    { id: '1', name: 'Zorro', createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z', description: 'Super chat.', photos: ['https://img.com/zorro.jpg'] },
    { id: '2', name: 'Ébène', createdAt: '2026-09-15T10:00:00.000Z', updatedAt: '2026-09-15T10:00:00.000Z', description: 'Chaton joueur.', photos: ['https://img.com/ebene.jpg'] },
    { id: '3', name: 'Caramel', createdAt: '2026-08-20T10:00:00.000Z', updatedAt: '2026-09-22T10:00:00.000Z', description: '', photos: [] },
    { id: '4', name: 'billy', createdAt: '2026-09-21T10:00:00.000Z', updatedAt: '2026-09-21T10:00:00.000Z', description: 'Pas de description.', image: 'https://placehold.co/600x400?text=Pas+de+photo' },
  ];

  test('sortCats trie par défaut par ordre alphabétique insensible à la casse et gérant les accents', () => {
    const sorted = sortCats(sampleCats, CAT_SORT_MODES.ALPHA);
    const names = sorted.map(c => c.name);
    assert.equal(names[0].toLowerCase(), 'billy');
    assert.equal(names[1], 'Caramel');
    assert.equal(names[2], 'Ébène');
    assert.equal(names[3], 'Zorro');
  });

  test('sortCats trie par date d\'ajout décroissante (DATE_ADDED)', () => {
    const sorted = sortCats(sampleCats, CAT_SORT_MODES.DATE_ADDED);
    assert.equal(sorted[0].name, 'billy');
    assert.equal(sorted[1].name, 'Ébène');
    assert.equal(sorted[2].name, 'Zorro');
    assert.equal(sorted[3].name, 'Caramel');
  });

  test('sortCats trie par date de dernière modification (DATE_UPDATED)', () => {
    const sorted = sortCats(sampleCats, CAT_SORT_MODES.DATE_UPDATED);
    assert.equal(sorted[0].name, 'Caramel');
    assert.equal(sorted[1].name, 'billy');
    assert.equal(sorted[2].name, 'Ébène');
    assert.equal(sorted[3].name, 'Zorro');
  });

  test('sortCats gère les tableaux vides et valeurs nulles sans lever d\'erreur', () => {
    assert.deepEqual(sortCats([]), []);
    assert.deepEqual(sortCats(null), []);
    const withNulls = [{ name: '' }, { name: 'Mimi' }, { name: null }];
    const sorted = sortCats(withNulls);
    assert.equal(sorted.length, 3);
  });

  test('isCatIncomplete détecte correctement les fiches incomplètes', () => {
    // 1: Zorro complet
    const zorroCheck = isCatIncomplete(sampleCats[0]);
    assert.equal(zorroCheck.incomplete, false);
    assert.equal(zorroCheck.missingDescription, false);
    assert.equal(zorroCheck.missingPhoto, false);

    // 3: Caramel (sans description et sans photo)
    const caramelCheck = isCatIncomplete(sampleCats[2]);
    assert.equal(caramelCheck.incomplete, true);
    assert.equal(caramelCheck.missingDescription, true);
    assert.equal(caramelCheck.missingPhoto, true);

    // 4: billy (description placeholder 'Pas de description.' et photo placeholder)
    const billyCheck = isCatIncomplete(sampleCats[3]);
    assert.equal(billyCheck.incomplete, true);
    assert.equal(billyCheck.missingDescription, true);
    assert.equal(billyCheck.missingPhoto, true);

    // Objet nul ou vide
    assert.equal(isCatIncomplete(null).incomplete, true);
  });

  test('formatCatAdminDate formate proprement les dates en français', () => {
    const cat = {
      createdAt: '2026-09-18T14:30:00.000Z',
      updatedAt: '2026-09-22T09:15:00.000Z'
    };
    const addedStr = formatCatAdminDate(cat, 'added');
    assert.ok(addedStr.includes('18/09/2026'));
    assert.ok(addedStr.includes('Ajouté le'));

    const updatedStr = formatCatAdminDate(cat, 'updated');
    assert.ok(updatedStr.includes('22/09/2026'));
    assert.ok(updatedStr.includes('Modifié le'));

    assert.equal(formatCatAdminDate(null), '');
    assert.equal(formatCatAdminDate({}), '');
  });
});

describe('Détection et rendu des liens cliquables (linkParser)', () => {
  test('normalizeUrl ajoute https:// si manquant pour les préfixes www.', () => {
    assert.equal(normalizeUrl('https://chat-lheureux.fr'), 'https://chat-lheureux.fr');
    assert.equal(normalizeUrl('http://test.com'), 'http://test.com');
    assert.equal(normalizeUrl('www.facebook.com/page'), 'https://www.facebook.com/page');
    assert.equal(normalizeUrl(''), '');
    assert.equal(normalizeUrl(null), '');
  });

  test('stripTrailingPunctuation détache les signes de ponctuation en fin d\'URL', () => {
    assert.deepEqual(stripTrailingPunctuation('https://chat-lheureux.fr.'), { cleanUrl: 'https://chat-lheureux.fr', trailing: '.' });
    assert.deepEqual(stripTrailingPunctuation('https://chat-lheureux.fr!'), { cleanUrl: 'https://chat-lheureux.fr', trailing: '!' });
    assert.deepEqual(stripTrailingPunctuation('https://chat-lheureux.fr)'), { cleanUrl: 'https://chat-lheureux.fr', trailing: ')' });
    assert.deepEqual(stripTrailingPunctuation('https://chat-lheureux.fr'), { cleanUrl: 'https://chat-lheureux.fr', trailing: '' });
  });

  test('parseLinksFromText gère les textes sans liens', () => {
    const segments = parseLinksFromText('Bonjour, ce chat est très affectueux et propre.');
    assert.equal(segments.length, 1);
    assert.equal(segments[0].type, 'text');
    assert.equal(segments[0].text, 'Bonjour, ce chat est très affectueux et propre.');
  });

  test('parseLinksFromText détecte les URLs brutes https:// et www.', () => {
    const text = 'Visitez notre site https://chat-lheureux.fr ou notre page www.facebook.com/profile.php pour plus d\'infos.';
    const segments = parseLinksFromText(text);

    const links = segments.filter(s => s.type === 'link');
    assert.equal(links.length, 2);
    assert.equal(links[0].url, 'https://chat-lheureux.fr');
    assert.equal(links[1].url, 'https://www.facebook.com/profile.php');
  });

  test('parseLinksFromText ne capture pas le point de fin de phrase dans l\'URL', () => {
    const text = 'Consultez la fiche sur https://chat-lheureux.fr.';
    const segments = parseLinksFromText(text);
    const link = segments.find(s => s.type === 'link');
    assert.ok(link);
    assert.equal(link.url, 'https://chat-lheureux.fr');
    assert.equal(segments[segments.length - 1].text, '.');
  });

  test('parseLinksFromText interprète fidèlement les liens Markdown nommés [Titre](URL)', () => {
    const text = 'Regardez [sa vidéo TikTok](https://tiktok.com/@chatlheureux) et [ses photos](www.instagram.com/p/123) ici !';
    const segments = parseLinksFromText(text);

    const links = segments.filter(s => s.type === 'link');
    assert.equal(links.length, 2);
    assert.equal(links[0].text, 'sa vidéo TikTok');
    assert.equal(links[0].url, 'https://tiktok.com/@chatlheureux');
    assert.equal(links[1].text, 'ses photos');
    assert.equal(links[1].url, 'https://www.instagram.com/p/123');
  });

  test('parseLinksFromText gère les chaînes vides, nulles ou invalides avec grâce', () => {
    assert.deepEqual(parseLinksFromText(''), []);
    assert.deepEqual(parseLinksFromText(null), []);
    assert.deepEqual(parseLinksFromText(undefined), []);
  });
});
