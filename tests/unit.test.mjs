import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { calculateAgeFromBirthDate, getCatAdoptionInfo, ADOPTED_EXPIRATION_DAYS } from '../src/utils/age.js';
import { isCatLockedByOther, LOCK_EXPIRATION_MS } from '../src/firebase/catsService.js';
import { getAuthErrorMessage } from '../src/firebase/authService.js';

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
  });

  test('Doit renvoyer un message par défaut pour les codes inconnus', () => {
    const msg = getAuthErrorMessage('auth/unknown-error');
    assert.ok(msg.includes('inconnue') || msg.includes('auth/unknown-error'));
  });
});
