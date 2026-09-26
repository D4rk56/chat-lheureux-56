/**
 * Netlify Serverless Function : /api/send-email
 * Envoi d'e-mails transactionnels officiels pour Chat L'Heureux 56
 * 
 * Supporte :
 * 1. Brevo (ex-Sendinblue) via BREVO_API_KEY
 * 2. Prise en charge de BREVO_SENDER_EMAIL (ex: asso.chatslheureux@gmail.com) en attendant validation DNS
 * 3. Envoi multi-destinataires avec copie cachée (BCC) et replyTo vers le candidat
 * 4. Boutons de partage WhatsApp avec lien exact de la fiche chat
 * 5. Mode simulation automatique en environnement local
 */

const DEFAULT_SENDER_NAME = "Chat L'Heureux 56";
const DEFAULT_SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL || process.env.SENDER_EMAIL || "noreply@chat-lheureux.fr";
const DEFAULT_REPLY_TO = "asso.chatslheureux@gmail.com";
const ASSOCIATION_PHONE = "06 61 50 88 28";
const SITE_URL = "https://chat-lheureux.fr";

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function cleanPhoneForWhatsApp(phone) {
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
 * Construit le texte brut formaté pour le partage WhatsApp de la demande d'adoption
 */
function buildWhatsAppShareText(data) {
  const catName = data.catName || 'Non précisé';
  const fullName = data.fullName || 'Anonyme';
  const phone = data.phone || 'Non renseigné';
  const email = data.email || 'Non renseigné';
  const city = data.postalCodeCity 
    ? `${data.address ? `${data.address}, ` : ''}${data.postalCodeCity}`
    : (data.city || data.address || 'Non renseignée');
  const profession = data.profession || 'Non renseignée';

  const adults = data.adultsCount || 1;
  const children = data.childrenCount || 0;
  let childrenDetails = '';
  if (parseInt(children, 10) > 0) {
    childrenDetails = ` (âges : ${data.childrenAges || 'non précisé'})`;
  }

  let housing = data.housingType || 'Non précisé';
  if (data.housingType === 'Autre' && data.housingTypeOther) {
    housing = `Autre (${data.housingTypeOther})`;
  }
  if (data.floor) {
    housing += ` (${data.floor}e étage)`;
  }

  const garden = data.hasGarden === 'Oui' 
    ? `Oui (${data.gardenSurface || 'superficie non précisée'})` 
    : 'Non';
  const balcony = data.hasBalcony === 'Oui' 
    ? `Oui (sécurisé : ${data.isBalconySecured || 'non précisé'})` 
    : 'Non';

  let animals = 'Non';
  if (data.hasAnimals === 'Oui') {
    const statusStr = Array.isArray(data.animalStatus) && data.animalStatus.length > 0 
      ? ` [${data.animalStatus.join(', ')}]` 
      : '';
    const dogStr = data.dogDetails ? ` • Chien : ${data.dogDetails}` : '';
    animals = `Oui (${data.animalDetails || 'détails non précisés'}${statusStr}${dogStr})`;
  }

  const motivations = (data.comments || data.adoptionReason || data.catExpectations || '').trim();
  const catUrl = data.catId ? `${SITE_URL}/chat/${data.catId}` : null;

  const lines = [
    `🐾 *Chat L'Heureux 56 — Demande d'adoption*`,
    `🐱 *Chat demandé :* ${catName}`,
    ...(catUrl ? [`🔗 *Fiche du chat :* ${catUrl}`] : []),
    ``,
    `👤 *CANDIDAT*`,
    `• *Nom :* ${fullName}`,
    `• *Tél :* ${phone}`,
    `• *E-mail :* ${email}`,
    `• *Ville :* ${city}`,
    `• *Profession :* ${profession}`,
    ``,
    `🏠 *FOYER & LOGEMENT*`,
    `• *Composition :* ${adults} adulte(s), ${children} enfant(s)${childrenDetails}`,
    ...(data.childrenAnimalContact ? [`• *Contact enfants/animaux :* ${data.childrenAnimalContact}`] : []),
    `• *Type logement :* ${housing}`,
    `• *Pièce isolée (arrivée) :* ${data.hasIsolatedRoom || 'Oui'}`,
    `• *Jardin :* ${garden}`,
    `• *Balcon :* ${balcony}`,
    `• *Animaux actuels :* ${animals}`,
    ``,
    `⏰ *RYTHME DE VIE & ACCUEIL*`,
    `• *Absence quotidienne :* ${data.hoursAbsent ? `${data.hoursAbsent}h/jour` : 'Non précisé'}`,
    `• *Couchage prévu :* ${data.sleepingPlace || 'Non précisé'}`,
    ``,
    `📝 *REMARQUES & MOTIVATIONS*`,
    motivations ? motivations : `Aucune remarque particulière renseignée.`,
    ``,
    `💬 *Traiter sur l'espace admin :*`,
    `${SITE_URL}/admin`
  ];

  return lines.join('\n');
}

/**
 * Modèle HTML complet de l'accusé de réception envoyé au candidat adoptant
 */
function renderAdoptionApplicantTemplate(data) {
  const catName = data.catName || "votre futur compagnon";
  const fullName = data.fullName || "Cher futur adoptant";
  const phone = data.phone || "Non renseigné";
  const email = data.email || "Non renseigné";
  const city = data.postalCodeCity || (data.city || data.postalCode ? `${data.postalCode || ''} ${data.city || ''}`.trim() : "Non renseigné");
  const address = data.address || '';
  const profession = data.profession || "Non renseigné";
  const housingType = data.housingType || "Non renseigné";
  const catUrl = data.catId ? `${SITE_URL}/chat/${data.catId}` : SITE_URL;

  // Animaux
  let animalsDisplay = "Aucun autre animal";
  if (data.hasAnimals === 'Oui') {
    animalsDisplay = `Oui (${data.animalDetails || 'détails non précisés'})`;
  }

  // Foyer
  const adults = data.adultsCount || 1;
  const children = data.childrenCount || 0;
  const householdDisplay = `${adults} adulte(s)${parseInt(children, 10) > 0 ? `, ${children} enfant(s)` : ''}`;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Accusé de réception - Chat L'Heureux 56</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;">
          
          <!-- En-tête Signature : Dégradé Rose / Violet -->
          <tr>
            <td style="background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%); padding: 36px 30px; text-align: center;">
              <div style="font-size: 36px; margin-bottom: 8px;">🐾</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">Chat L'Heureux 56</h1>
              <p style="color: rgba(255,255,255,0.95); font-size: 13px; font-weight: 700; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">
                Association de protection animale • Morbihan (56)
              </p>
            </td>
          </tr>

          <!-- Contenu du message -->
          <tr>
            <td style="padding: 35px 30px;">
              <!-- Badge Succès -->
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 700;">
                  ✓ Votre demande d'adoption a bien été enregistrée
                </p>
              </div>

              <h2 style="font-size: 18px; font-weight: 800; color: #0f172a; margin-top: 0; margin-bottom: 12px;">
                Bonjour ${escapeHtml(fullName)},
              </h2>

              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 16px;">
                Nous vous remercions chaleureusement pour votre démarche d'adoption responsable concernant <strong>${escapeHtml(catName)}</strong>.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                Notre équipe de bénévoles a bien reçu votre questionnaire. Chez <strong>Chat L'Heureux 56</strong>, tous nos protégés vivent en familles d'accueil pour grandir dans l'amour et sans cage. Nous étudions chaque candidature avec soin pour nous assurer de la compatibilité mutuelle.
              </p>

              <!-- Carte récapitulative des réponses -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; margin-bottom: 26px;">
                <tr>
                  <td colspan="2" style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;">
                    📋 Récapitulatif de votre demande
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0; width: 140px;"><strong>Chat souhaité :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; font-weight: 700; padding: 8px 0;">${escapeHtml(catName)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0;"><strong>Demandeur :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; padding: 8px 0;">${escapeHtml(fullName)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0;"><strong>Téléphone :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; padding: 8px 0;">${escapeHtml(phone)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0;"><strong>E-mail :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; padding: 8px 0;">${escapeHtml(email)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0;"><strong>Commune :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; padding: 8px 0;">${escapeHtml(city)}${address ? ` (${escapeHtml(address)})` : ''}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0;"><strong>Logement :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; padding: 8px 0;">${escapeHtml(housingType)}${data.hasGarden === 'Oui' ? ' • Avec jardin' : ''}${data.hasBalcony === 'Oui' ? ' • Avec balcon' : ''}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0;"><strong>Foyer :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; padding: 8px 0;">${escapeHtml(householdDisplay)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0;"><strong>Animaux :</strong></td>
                  <td style="font-size: 13px; color: #0f172a; padding: 8px 0;">${escapeHtml(animalsDisplay)}</td>
                </tr>
                ${data.comments ? `
                <tr>
                  <td style="font-size: 13px; color: #64748b; padding: 8px 0; vertical-align: top;"><strong>Remarques :</strong></td>
                  <td style="font-size: 13px; color: #334155; padding: 8px 0; line-height: 1.5;">${escapeHtml(data.comments)}</td>
                </tr>
                ` : ''}
              </table>

              <!-- Les Prochaines Étapes -->
              <div style="background-color: #fdf4ff; border-left: 4px solid #d24de3; padding: 18px 20px; border-radius: 0 14px 14px 0; margin-bottom: 26px;">
                <h3 style="color: #86198f; font-size: 14px; font-weight: 800; margin: 0 0 10px 0;">Les prochaines étapes :</h3>
                <ol style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #581c87;">
                  <li style="margin-bottom: 6px;">Étude de votre dossier par un bénévole de l'association.</li>
                  <li style="margin-bottom: 6px;">Prise de contact téléphonique sous <strong>48 à 72 heures</strong> pour échanger sur vos motivations et répondre à vos questions.</li>
                  <li>Organisation d'une visite pour faire connaissance avec ${escapeHtml(catName)} au sein de sa famille d'accueil dans le Morbihan (56).</li>
                </ol>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 26px;">
                Une question ou une précision ? Répondez directement à cet e-mail (<a href="mailto:${DEFAULT_REPLY_TO}" style="color: #d24de3; text-decoration: none; font-weight: 600;">${DEFAULT_REPLY_TO}</a>) ou contactez notre présidence au <strong>${ASSOCIATION_PHONE}</strong>.
              </p>

              <!-- Bouton d'action -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%);">
                    <a href="${escapeHtml(catUrl)}" target="_blank" style="display: inline-block; padding: 13px 26px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px;">
                      Revoir la fiche de ${escapeHtml(catName)}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 30px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; font-weight: 800; color: #ffffff;">Association Chat L'Heureux 56</p>
              <p style="margin: 0 0 6px 0;">Colpo (56) • Morbihan • Tél : ${ASSOCIATION_PHONE}</p>
              <p style="margin: 0 0 10px 0;">SIREN : 930 923 800 • Association Loi 1901 à but non lucratif</p>
              <div>
                <a href="https://www.facebook.com/profile.php?id=61593487828842" target="_blank" style="color: #7db1f9; text-decoration: none; margin: 0 8px; font-weight: 600;">Facebook</a> • 
                <a href="https://www.instagram.com/association.chatslheureux" target="_blank" style="color: #d24de3; text-decoration: none; margin: 0 8px; font-weight: 600;">Instagram</a> • 
                <a href="${SITE_URL}" target="_blank" style="color: #cbd5e1; text-decoration: none; margin: 0 8px; font-weight: 600;">chat-lheureux.fr</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Modèle HTML complet de notification interne pour l'équipe (Bénévoles, Gestion, Admins)
 * Contient 100% des réponses du questionnaire d'adoption et boutons d'action rapide WhatsApp / Admin
 */
function renderAdoptionAdminNotificationTemplate(data) {
  const catName = data.catName || "Chat non précisé";
  const fullName = data.fullName || "Candidat";
  const phone = data.phone || "Non renseigné";
  const email = data.email || "Non renseigné";
  const address = data.address || '';
  const city = data.postalCodeCity || (data.city || data.postalCode ? `${data.postalCode || ''} ${data.city || ''}`.trim() : "Non renseignée");
  const profession = data.profession || "Non renseignée";

  // Foyer
  const adults = data.adultsCount || 1;
  const children = data.childrenCount || 0;
  const childrenAges = data.childrenAges ? ` (âges : ${data.childrenAges})` : '';
  const childrenContact = data.childrenAnimalContact || 'Non précisé';

  // Logement
  let housing = data.housingType || 'Non précisé';
  if (data.housingType === 'Autre' && data.housingTypeOther) {
    housing = `Autre (${data.housingTypeOther})`;
  }
  if (data.floor) {
    housing += ` (${data.floor}e étage)`;
  }
  const isolatedRoom = data.hasIsolatedRoom || 'Non précisé';
  const garden = data.hasGarden === 'Oui' ? `Oui (${data.gardenSurface || 'superficie non précisée'})` : 'Non';
  const balcony = data.hasBalcony === 'Oui' ? `Oui (sécurisé : ${data.isBalconySecured || 'non précisé'})` : 'Non';

  // Animaux
  let animalsDisplay = 'Non';
  if (data.hasAnimals === 'Oui') {
    const statusStr = Array.isArray(data.animalStatus) && data.animalStatus.length > 0 
      ? ` • Statut : ${data.animalStatus.join(', ')}` 
      : '';
    const dogStr = data.dogDetails ? ` • Chien : ${data.dogDetails}` : '';
    const sociableStr = data.isSociable ? ` • Sociable chats : ${data.isSociable}` : '';
    animalsDisplay = `Oui (${data.animalDetails || 'détails non précisés'}${statusStr}${dogStr}${sociableStr})`;
  }

  // Rythme de vie
  const fullAccess = data.fullAccess || 'Oui';
  const sleepingPlace = data.sleepingPlace || 'Non précisé';
  const hoursAbsent = data.hoursAbsent ? `${data.hoursAbsent}h / jour` : 'Non précisé';
  const absenceLocation = data.absenceLocation || 'Non précisé';
  const lunchReturn = data.lunchReturn || 'Non précisé';
  const staysAlone = data.staysAlone || 'Non précisé';

  // Remarques & motivations
  const motivations = (data.comments || data.adoptionReason || data.catExpectations || '').trim();

  // URLs WhatsApp directes (sans redirecteur wa.me pour préserver le décodage UTF-8)
  const whatsAppShareText = buildWhatsAppShareText(data);
  const whatsAppShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(whatsAppShareText)}`;
  const cleanCandidatePhone = cleanPhoneForWhatsApp(phone);
  const whatsAppCandidateUrl = cleanCandidatePhone 
    ? `https://api.whatsapp.com/send?phone=${cleanCandidatePhone}&text=${encodeURIComponent(`Bonjour ${fullName}, je vous contacte suite à votre demande d'adoption pour ${catName} auprès de l'association Chat L'Heureux 56.`)}`
    : null;
  const adminUrl = `${SITE_URL}/admin`;
  const catUrl = data.catId ? `${SITE_URL}/chat/${data.catId}` : null;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Demande d'adoption : ${escapeHtml(catName)} par ${escapeHtml(fullName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0b0f19; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f1f5f9;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0b0f19; padding: 25px 12px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #111827; border-radius: 20px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 12px 30px rgba(0,0,0,0.5);">
          
          <!-- En-tête avec dégradé rose / violet -->
          <tr>
            <td style="background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%); padding: 28px 24px; text-align: left; color: #ffffff;">
              <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                <span style="font-size: 26px;">🐾</span>
                <span style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: rgba(0,0,0,0.2); padding: 4px 10px; border-radius: 9999px;">
                  Nouvelle demande d'adoption
                </span>
              </div>
              <h1 style="margin: 8px 0 0 0; font-size: 22px; font-weight: 900; letter-spacing: -0.5px;">
                ${escapeHtml(catName)}
              </h1>
              <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.95;">
                Dossier déposé par <strong>${escapeHtml(fullName)}</strong>
              </p>
            </td>
          </tr>

          <!-- Barre d'actions rapides (WhatsApp / Admin) -->
          <tr>
            <td style="background-color: #1a2234; padding: 16px 24px; border-bottom: 1px solid #2d3748;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
                      ⚡ Actions Rapides :
                    </div>
                    <div style="margin-bottom: 6px;">
                      <!-- Bouton Partager Dossier WhatsApp -->
                      <a href="${escapeHtml(whatsAppShareUrl)}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 800; text-decoration: none; margin-right: 8px; margin-bottom: 6px;">
                        💬 Partager le dossier complet sur WhatsApp →
                      </a>
                      
                      <!-- Bouton Contacter Candidat WhatsApp -->
                      ${whatsAppCandidateUrl ? `
                      <a href="${escapeHtml(whatsAppCandidateUrl)}" target="_blank" style="display: inline-block; background-color: #065f46; border: 1px solid #10b981; color: #6ee7b7; padding: 10px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; margin-right: 8px; margin-bottom: 6px;">
                        📱 Écrire au candidat (${escapeHtml(phone)})
                      </a>
                      ` : ''}

                      <!-- Bouton Espace Admin -->
                      <a href="${escapeHtml(adminUrl)}" target="_blank" style="display: inline-block; background-color: #374151; color: #f9fafb; padding: 10px 16px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; margin-bottom: 6px;">
                        ⚙️ Ouvrir l'Admin
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Contenu complet du formulaire structuré -->
          <tr>
            <td style="padding: 24px; font-size: 13px; line-height: 1.6;">
              
              <!-- Section 1 : Candidat & Coordonnées -->
              <div style="background-color: #1a2234; border: 1px solid #2d3748; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #ec4899; text-transform: uppercase; letter-spacing: 0.5px;">
                  👤 1. Candidat & Coordonnées
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; width: 140px; padding: 4px 0;"><strong>Nom complet :</strong></td>
                    <td style="color: #ffffff; font-weight: 700;">${escapeHtml(fullName)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Téléphone :</strong></td>
                    <td>
                      <a href="tel:${escapeHtml(phone.replace(/\s+/g, ''))}" style="color: #34d399; font-weight: 800; text-decoration: none;">
                        ${escapeHtml(phone)}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>E-mail :</strong></td>
                    <td>
                      <a href="mailto:${escapeHtml(email)}" style="color: #60a5fa; text-decoration: none;">
                        ${escapeHtml(email)}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Commune :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(city)}</td>
                  </tr>
                  ${address ? `
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Adresse :</strong></td>
                    <td style="color: #cbd5e1;">${escapeHtml(address)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Profession :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(profession)}</td>
                  </tr>
                </table>
              </div>

              <!-- Section 2 : Foyer & Logement -->
              <div style="background-color: #1a2234; border: 1px solid #2d3748; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #a855f7; text-transform: uppercase; letter-spacing: 0.5px;">
                  🏠 2. Foyer & Habitation
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; width: 140px; padding: 4px 0;"><strong>Composition :</strong></td>
                    <td style="color: #ffffff;">${adults} adulte(s), ${children} enfant(s)${escapeHtml(childrenAges)}</td>
                  </tr>
                  ${parseInt(children, 10) > 0 ? `
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Contact enfants :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(childrenContact)}</td>
                  </tr>
                  ` : ''}
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Type logement :</strong></td>
                    <td style="color: #ffffff; font-weight: 600;">${escapeHtml(housing)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Pièce isolée :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(isolatedRoom)} (avec fenêtre)</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Jardin :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(garden)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Balcon :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(balcony)}</td>
                  </tr>
                </table>
              </div>

              <!-- Section 3 : Animaux Actuels -->
              <div style="background-color: #1a2234; border: 1px solid #2d3748; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #38bdf8; text-transform: uppercase; letter-spacing: 0.5px;">
                  🐱 3. Animaux Actuels au Foyer
                </h3>
                <p style="margin: 0; color: #e2e8f0;">
                  ${escapeHtml(animalsDisplay)}
                </p>
              </div>

              <!-- Section 4 : Rythme de vie & Conditions d'accueil -->
              <div style="background-color: #1a2234; border: 1px solid #2d3748; border-radius: 14px; padding: 16px; margin-bottom: 16px;">
                <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px;">
                  ⏰ 4. Rythme de Vie & Conditions d'Accueil
                </h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="color: #94a3b8; width: 140px; padding: 4px 0;"><strong>Accès pièces :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(fullAccess)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Lieu de couchage :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(sleepingPlace)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Absence par jour :</strong></td>
                    <td style="color: #ffffff; font-weight: 600;">${escapeHtml(hoursAbsent)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Lieu durant absence :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(absenceLocation)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Retour le midi :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(lunchReturn)}</td>
                  </tr>
                  <tr>
                    <td style="color: #94a3b8; padding: 4px 0;"><strong>Restera seul :</strong></td>
                    <td style="color: #e2e8f0;">${escapeHtml(staysAlone)}</td>
                  </tr>
                </table>
              </div>

              <!-- Section 5 : Remarques & Motivations -->
              <div style="background-color: #1a2234; border: 1px solid #2d3748; border-radius: 14px; padding: 16px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; font-size: 13px; font-weight: 800; color: #10b981; text-transform: uppercase; letter-spacing: 0.5px;">
                  📝 5. Remarques & Motivations
                </h3>
                <div style="color: #e2e8f0; line-height: 1.6; white-space: pre-line; background-color: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b;">
                  ${escapeHtml(motivations) || "Aucune remarque spécifique renseignée."}
                </div>
              </div>

              <!-- Boutons de bas d'e-mail -->
              <div style="text-align: center; padding-top: 10px;">
                ${catUrl ? `
                <a href="${escapeHtml(catUrl)}" target="_blank" style="display: inline-block; background-color: #1e293b; color: #f1f5f9; padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 700; text-decoration: none; border: 1px solid #334155; margin-right: 8px; margin-bottom: 6px;">
                  🔗 Voir la fiche de ${escapeHtml(catName)}
                </a>
                ` : ''}

                <a href="${escapeHtml(whatsAppShareUrl)}" target="_blank" style="display: inline-block; background-color: #25D366; color: #ffffff; padding: 10px 18px; border-radius: 10px; font-size: 12px; font-weight: 800; text-decoration: none; margin-bottom: 6px;">
                  💬 Partager sur WhatsApp
                </a>
              </div>

            </td>
          </tr>

          <!-- Pied de page avec mention membres -->
          <tr>
            <td style="background-color: #0b0f19; padding: 20px 24px; text-align: center; color: #64748b; font-size: 11px; line-height: 1.5; border-top: 1px solid #1f2937;">
              <p style="margin: 0 0 6px 0; color: #94a3b8; font-weight: 600;">
                Association Chat L'Heureux 56 • Notification interne automatique
              </p>
              <p style="margin: 0 0 6px 0;">
                Vous recevez cet e-mail car vous êtes membre de l'association. Pour modifier vos préférences d'alerte ou vous désinscrire, connectez-vous à l'espace membres de l'administration.
              </p>
              <p style="margin: 0;">
                Pour répondre au candidat, cliquez directement sur "Répondre" dans votre messagerie ou écrivez à <a href="mailto:${escapeHtml(email)}" style="color: #60a5fa;">${escapeHtml(email)}</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Modèle générique pour e-mails d'information personnalisés
 */
function renderGenericInfoTemplate({ title, message, actionText, actionUrl }) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${escapeHtml(title || "Information Chat L'Heureux 56")}</title></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="padding: 30px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%); padding: 25px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 20px; font-weight: 800;">Chat L'Heureux 56 🐾</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 30px;">
              ${title ? `<h2 style="font-size: 18px; margin-top: 0; margin-bottom: 16px; color: #0f172a;">${escapeHtml(title)}</h2>` : ''}
              <div style="font-size: 14px; line-height: 1.7; color: #334155; margin-bottom: 24px; white-space: pre-line;">${escapeHtml(message || '')}</div>
              ${actionText && actionUrl ? `
                <div style="text-align: center; margin: 24px 0;">
                  <a href="${escapeHtml(actionUrl)}" style="background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%); color: white; padding: 12px 24px; border-radius: 10px; font-size: 14px; font-weight: 700; text-decoration: none;">${escapeHtml(actionText)}</a>
                </div>
              ` : ''}
              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
                E-mail envoyé par l'association Chat L'Heureux 56. Pour nous répondre, écrivez à <a href="mailto:${DEFAULT_REPLY_TO}" style="color: #d24de3;">${DEFAULT_REPLY_TO}</a>.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export default async (req, context) => {
  // Gestion CORS & pré-vol OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Méthode non autorisée. Utilisez POST." }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }

  try {
    const payload = await req.json();
    const { 
      to, 
      bcc = [], 
      subject, 
      type, 
      data = {}, 
      html, 
      text, 
      replyTo: customReplyTo 
    } = payload;

    if (!to && (!Array.isArray(bcc) || bcc.length === 0)) {
      return new Response(JSON.stringify({ error: "Au moins un destinataire ('to' ou 'bcc') est obligatoire." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Déterminer replyTo par défaut (vers le candidat si alerte adoption)
    let finalReplyTo = customReplyTo || DEFAULT_REPLY_TO;
    if (type === 'adoption_admin_notification' && data.email) {
      finalReplyTo = data.email.trim();
    }

    // Déterminer le sujet et le HTML selon le type demandé
    let finalSubject = subject;
    let finalHtml = html;
    let finalText = text;

    if (type === 'adoption_applicant') {
      finalSubject = finalSubject || `🐾 Accusé de réception de votre demande d'adoption pour ${data.catName || 'un chat'} - Chat L'Heureux 56`;
      finalHtml = renderAdoptionApplicantTemplate(data);
      finalText = `Bonjour ${data.fullName || ''},\n\nNous vous confirmons la bonne réception de votre demande d'adoption pour ${data.catName || 'notre protégé'}.\nNotre équipe vous recontactera sous 48 à 72h.\n\nAssociation Chat L'Heureux 56 - ${ASSOCIATION_PHONE}`;
    } else if (type === 'adoption_admin_notification') {
      finalSubject = finalSubject || `🔔 Nouvelle demande d'adoption : ${data.catName || 'Chat'} par ${data.fullName || 'Candidat'}`;
      finalHtml = renderAdoptionAdminNotificationTemplate(data);
      finalText = buildWhatsAppShareText(data);
    } else if (!finalHtml && (data.message || data.body)) {
      finalHtml = renderGenericInfoTemplate({
        title: finalSubject,
        message: data.message || data.body,
        actionText: data.actionText,
        actionUrl: data.actionUrl
      });
    }

    if (!finalSubject) {
      finalSubject = "Message de l'association Chat L'Heureux 56";
    }

    // Récupérer les clés d'API (Brevo ou Resend)
    const brevoApiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
    const resendApiKey = process.env.RESEND_API_KEY;

    // Normalisation des destinataires
    const primaryRecipients = Array.isArray(to) ? to : (to ? [to] : [DEFAULT_REPLY_TO]);

    // Prise en charge sécurisée des membres abonnés en BCC depuis l'environnement serveur
    const envBcc = (type === 'adoption_admin_notification' && process.env.ADOPTION_NOTIFICATION_BCC)
      ? process.env.ADOPTION_NOTIFICATION_BCC.split(',').map(s => s.trim()).filter(s => s.includes('@'))
      : [];

    const rawBccList = [...(Array.isArray(bcc) ? bcc : []), ...envBcc];
    const bccRecipients = Array.from(new Set(rawBccList))
      .filter(b => typeof b === 'string' && b.includes('@') && !primaryRecipients.includes(b));

    // 1. Envoi via Brevo (Recommandé)
    if (brevoApiKey) {
      const brevoPayload = {
        sender: {
          name: DEFAULT_SENDER_NAME,
          email: DEFAULT_SENDER_EMAIL
        },
        to: primaryRecipients.map(r => typeof r === 'string' ? { email: r.trim() } : r),
        replyTo: {
          name: (type === 'adoption_admin_notification' && data.fullName) ? data.fullName : DEFAULT_SENDER_NAME,
          email: finalReplyTo
        },
        subject: finalSubject,
        htmlContent: finalHtml || `<p>${escapeHtml(finalText || '')}</p>`,
        ...(finalText ? { textContent: finalText } : {})
      };

      if (bccRecipients.length > 0) {
        brevoPayload.bcc = bccRecipients.map(r => ({ email: r.trim() }));
      }

      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": brevoApiKey,
          "Accept": "application/json"
        },
        body: JSON.stringify(brevoPayload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur API Brevo:", res.status, errorText);
        return new Response(JSON.stringify({ 
          error: "Erreur lors de l'envoi de l'e-mail via Brevo", 
          details: errorText 
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const resData = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({
        success: true,
        provider: "brevo",
        messageId: resData.messageId || null,
        bccCount: bccRecipients.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. Envoi via Resend (Alternative)
    if (resendApiKey) {
      const resendPayload = {
        from: `${DEFAULT_SENDER_NAME} <${DEFAULT_SENDER_EMAIL}>`,
        to: primaryRecipients.map(r => typeof r === 'string' ? r.trim() : r.email),
        reply_to: finalReplyTo,
        subject: finalSubject,
        html: finalHtml || `<p>${escapeHtml(finalText || '')}</p>`,
        ...(bccRecipients.length > 0 ? { bcc: bccRecipients } : {}),
        ...(finalText ? { text: finalText } : {})
      };

      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${resendApiKey}`
        },
        body: JSON.stringify(resendPayload)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Erreur API Resend:", res.status, errorText);
        return new Response(JSON.stringify({ 
          error: "Erreur lors de l'envoi de l'e-mail via Resend", 
          details: errorText 
        }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }

      const resData = await res.json().catch(() => ({}));
      return new Response(JSON.stringify({
        success: true,
        provider: "resend",
        id: resData.id || null,
        bccCount: bccRecipients.length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 3. Mode Simulation (Développement ou clé non encore saisie dans Netlify)
    console.info(`[SIMULATION E-MAIL] Expéditeur: ${DEFAULT_SENDER_EMAIL}`);
    console.info(`[SIMULATION E-MAIL] Vers (TO): ${JSON.stringify(primaryRecipients)}`);
    if (bccRecipients.length > 0) {
      console.info(`[SIMULATION E-MAIL] Copie cachée (BCC): ${JSON.stringify(bccRecipients)}`);
    }
    console.info(`[SIMULATION E-MAIL] Répondre à (Reply-To): ${finalReplyTo}`);
    console.info(`[SIMULATION E-MAIL] Sujet: "${finalSubject}"`);

    return new Response(JSON.stringify({
      success: true,
      simulated: true,
      message: "E-mail simulé (aucune clé BREVO_API_KEY configurée dans Netlify).",
      recipient: primaryRecipients,
      bcc: bccRecipients,
      replyTo: finalReplyTo,
      subject: finalSubject
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    console.error("Erreur d'exécution de la fonction send-email:", err);
    return new Response(JSON.stringify({ 
      error: "Erreur interne du serveur lors de la préparation de l'e-mail.",
      message: err.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });
  }
};
