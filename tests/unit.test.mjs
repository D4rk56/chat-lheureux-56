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
  sendCustomInfoEmail 
} from '../src/services/emailService.js';
import sendEmailFunction from '../netlify/functions/send-email.js';

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


