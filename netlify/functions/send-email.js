/**
 * Netlify Serverless Function : /api/send-email
 * Envoi d'e-mails transactionnels officiels pour Chat L'Heureux 56 depuis noreply@chat-lheureux.fr
 * 
 * Supporte :
 * 1. Brevo (ex-Sendinblue) via BREVO_API_KEY (300 mails/jour gratuits à vie, recommandé)
 * 2. Resend via RESEND_API_KEY (3 000 mails/mois gratuits)
 * 3. Mode simulation automatique si aucune clé d'API n'est encore configurée dans Netlify
 */

const DEFAULT_SENDER_NAME = "Chat L'Heureux 56";
const DEFAULT_SENDER_EMAIL = "noreply@chat-lheureux.fr";
const DEFAULT_REPLY_TO = "asso.chatslheureux@gmail.com";
const ASSOCIATION_PHONE = "06 61 50 88 28";
const SITE_URL = "https://chat-lheureux.fr";

/**
 * Génère le modèle HTML complet pour l'accusé de réception d'une demande d'adoption
 */
function renderAdoptionApplicantTemplate(data) {
  const catName = data.catName || "votre futur compagnon";
  const fullName = data.fullName || "Cher futur adoptant";
  const phone = data.phone || "Non renseigné";
  const city = data.city || data.postalCode ? `${data.postalCode || ''} ${data.city || ''}`.trim() : "Non renseigné";
  const housingType = data.housingType || "Non renseigné";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Votre demande d'adoption pour ${escapeHtml(catName)} - Chat L'Heureux 56</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Container Principal -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #f1f5f9;">
          
          <!-- En-tête avec dégradé rose / bleu violet -->
          <tr>
            <td style="background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%); padding: 35px 30px; text-align: center;">
              <div style="font-size: 32px; margin-bottom: 8px;">🐾</div>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">Chat L'Heureux 56</h1>
              <p style="color: rgba(255,255,255,0.92); font-size: 13px; font-weight: 600; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 1px;">Association de protection animale • Morbihan (56)</p>
            </td>
          </tr>

          <!-- Contenu du message -->
          <tr>
            <td style="padding: 35px 30px;">
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 14px 18px; margin-bottom: 24px;">
                <p style="margin: 0; color: #065f46; font-size: 14px; font-weight: 700;">
                  ✓ Demande d'adoption bien enregistrée
                </p>
              </div>

              <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 14px;">
                Bonjour ${escapeHtml(fullName)},
              </h2>

              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 18px;">
                Nous vous remercions chaleureusement pour votre démarche d'adoption responsable auprès de notre association concernant <strong>${escapeHtml(catName)}</strong>.
              </p>

              <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 24px;">
                Notre équipe de bénévoles a bien reçu votre questionnaire. Chez <strong>Chat L'Heureux 56</strong>, tous nos protégés vivent en familles d'accueil pour grandir dans l'amour et sans cage. Nous étudions chaque profil avec attention afin de nous assurer du bonheur mutuel du chat et de son futur foyer.
              </p>

              <!-- Récapitulatif -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
                <tr>
                  <td style="font-size: 13px; color: #475569; padding-bottom: 8px;"><strong>Chat souhaité :</strong> ${escapeHtml(catName)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #475569; padding-bottom: 8px;"><strong>Nom du demandeur :</strong> ${escapeHtml(fullName)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #475569; padding-bottom: 8px;"><strong>Téléphone :</strong> ${escapeHtml(phone)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #475569; padding-bottom: 8px;"><strong>Commune :</strong> ${escapeHtml(city)}</td>
                </tr>
                <tr>
                  <td style="font-size: 13px; color: #475569;"><strong>Type de logement :</strong> ${escapeHtml(housingType)}</td>
                </tr>
              </table>

              <!-- Prochaines étapes -->
              <div style="background-color: #fdf4ff; border-left: 4px solid #d24de3; padding: 16px 20px; border-radius: 0 12px 12px 0; margin-bottom: 26px;">
                <h3 style="color: #86198f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">Les prochaines étapes :</h3>
                <ol style="margin: 0; padding-left: 18px; font-size: 13px; line-height: 1.6; color: #581c87;">
                  <li>Étude de votre dossier par un bénévole de l'association.</li>
                  <li>Prise de contact téléphonique avec vous sous <strong>48 à 72 heures</strong> pour faire connaissance.</li>
                  <li>Organisation d'une visite pour rencontrer ${escapeHtml(catName)} au sein de sa famille d'accueil dans le Morbihan (56).</li>
                </ol>
              </div>

              <p style="font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 26px;">
                Une question urgente ou un renseignement ? Vous pouvez nous répondre directement à cet e-mail (<a href="mailto:${DEFAULT_REPLY_TO}" style="color: #d24de3; text-decoration: none; font-weight: 600;">${DEFAULT_REPLY_TO}</a>) ou nous joindre au <strong>${ASSOCIATION_PHONE}</strong>.
              </p>

              <!-- Bouton d'action -->
              <table role="presentation" border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 10px auto;">
                <tr>
                  <td align="center" style="border-radius: 12px; background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%);">
                    <a href="${SITE_URL}" target="_blank" style="display: inline-block; padding: 13px 26px; font-size: 14px; font-weight: 700; color: #ffffff; text-decoration: none; border-radius: 12px;">Visiter le site de l'association</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="background-color: #0f172a; padding: 24px 30px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
              <p style="margin: 0 0 8px 0; font-weight: 700; color: #ffffff;">Association Chat L'Heureux 56</p>
              <p style="margin: 0 0 8px 0;">Colpo (56) • Morbihan • Tél : ${ASSOCIATION_PHONE}</p>
              <p style="margin: 0 0 12px 0;">SIREN : 930 923 800 • Association Loi 1901 à but non lucratif</p>
              <div style="margin-top: 10px;">
                <a href="https://www.instagram.com/association.chatslheureux" target="_blank" style="color: #d24de3; text-decoration: none; margin: 0 8px; font-weight: 600;">Instagram</a> • 
                <a href="https://www.facebook.com/profile.php?id=61593487828842" target="_blank" style="color: #7db1f9; text-decoration: none; margin: 0 8px; font-weight: 600;">Facebook</a> • 
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
 * Modèle de notification interne pour l'équipe de l'association
 */
function renderAdoptionAdminNotificationTemplate(data) {
  const catName = data.catName || "Chat non spécifié";
  const fullName = data.fullName || "Candidat";
  const phone = data.phone || "Non renseigné";
  const email = data.email || "Non renseigné";
  const city = data.city || data.postalCode ? `${data.postalCode || ''} ${data.city || ''}`.trim() : "Non renseigné";
  const housingType = data.housingType || "Non renseigné";
  const exterior = data.exteriorAccess || "Non renseigné";
  const household = data.householdMembers || "Non renseigné";
  const otherAnimals = data.otherAnimals || "Non renseigné";
  const motivation = data.adoptionReason || data.catKnowledge || "Non renseigné";

  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Nouvelle demande d'adoption</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 25px; color: #1e293b;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 6px 18px rgba(0,0,0,0.05);">
    <div style="background: linear-gradient(135deg, #d24de3 0%, #7db1f9 100%); padding: 20px 24px; color: white;">
      <h2 style="margin: 0; font-size: 18px;">🐾 Nouvelle demande d'adoption reçue</h2>
      <p style="margin: 4px 0 0 0; font-size: 13px; opacity: 0.9;">Pour le chat : <strong>${escapeHtml(catName)}</strong></p>
    </div>
    <div style="padding: 24px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b; width: 140px;"><strong>Candidat :</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a; font-weight: 600;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Téléphone :</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><a href="tel:${escapeHtml(phone)}" style="color: #d24de3; font-weight: 700; text-decoration: none;">${escapeHtml(phone)}</a></td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>E-mail :</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9;"><a href="mailto:${escapeHtml(email)}" style="color: #0284c7; text-decoration: none;">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Commune :</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${escapeHtml(city)}</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Logement :</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${escapeHtml(housingType)} (Accès ext : ${escapeHtml(exterior)})</td></tr>
        <tr><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #64748b;"><strong>Foyer & Animaux :</strong></td><td style="padding: 8px 0; border-bottom: 1px solid #f1f5f9; color: #0f172a;">${escapeHtml(household)} • Autres animaux : ${escapeHtml(otherAnimals)}</td></tr>
        <tr><td style="padding: 8px 0; color: #64748b; vertical-align: top;"><strong>Motivations :</strong></td><td style="padding: 8px 0; color: #334155; line-height: 1.5;">${escapeHtml(motivation)}</td></tr>
      </table>

      <div style="margin-top: 24px; text-align: center;">
        <a href="${SITE_URL}/admin" target="_blank" style="display: inline-block; background-color: #0f172a; color: white; padding: 12px 24px; border-radius: 10px; font-size: 13px; font-weight: 700; text-decoration: none;">Ouvrir l'Espace Admin pour traiter la demande →</a>
      </div>
    </div>
  </div>
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

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
    const { to, subject, type, data = {}, html, text, replyTo = DEFAULT_REPLY_TO } = payload;

    if (!to) {
      return new Response(JSON.stringify({ error: "Le champ 'to' (destinataire) est obligatoire." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const recipients = Array.isArray(to) ? to : [to];

    // Déterminer le sujet et le HTML selon le type demandé
    let finalSubject = subject;
    let finalHtml = html;
    let finalText = text;

    if (type === 'adoption_applicant') {
      finalSubject = finalSubject || `🐾 Accusé de réception de votre demande d'adoption pour ${data.catName || 'un chat'} - Chat L'Heureux 56`;
      finalHtml = renderAdoptionApplicantTemplate(data);
      finalText = `Bonjour ${data.fullName || ''},\n\nNous vous confirmons la bonne réception de votre demande d'adoption pour ${data.catName || 'notre protégé'}.\nNotre équipe vous recontactera sous 48 à 72h.\n\nAssociation Chat L'Heureux 56 - 06 61 50 88 28`;
    } else if (type === 'adoption_admin_notification') {
      finalSubject = finalSubject || `🔔 Nouvelle demande d'adoption : ${data.catName || 'Chat'} par ${data.fullName || 'Candidat'}`;
      finalHtml = renderAdoptionAdminNotificationTemplate(data);
      finalText = `Nouvelle demande d'adoption pour ${data.catName} par ${data.fullName} (${data.phone}, ${data.city}). Consultez l'espace admin sur ${SITE_URL}/admin`;
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

    // 1. Envoi via Brevo (Recommandé)
    if (brevoApiKey) {
      const brevoPayload = {
        sender: {
          name: DEFAULT_SENDER_NAME,
          email: DEFAULT_SENDER_EMAIL
        },
        to: recipients.map(r => typeof r === 'string' ? { email: r.trim() } : r),
        replyTo: {
          name: DEFAULT_SENDER_NAME,
          email: replyTo
        },
        subject: finalSubject,
        htmlContent: finalHtml || `<p>${escapeHtml(finalText || '')}</p>`,
        ...(finalText ? { textContent: finalText } : {})
      };

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
        messageId: resData.messageId || null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 2. Envoi via Resend (Alternative)
    if (resendApiKey) {
      const resendPayload = {
        from: `${DEFAULT_SENDER_NAME} <${DEFAULT_SENDER_EMAIL}>`,
        to: recipients.map(r => typeof r === 'string' ? r.trim() : r.email),
        reply_to: replyTo,
        subject: finalSubject,
        html: finalHtml || `<p>${escapeHtml(finalText || '')}</p>`,
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
        id: resData.id || null
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // 3. Mode Simulation (Développement ou clé non encore saisie dans Netlify)
    console.info(`[SIMULATION E-MAIL] Envoi simulé depuis ${DEFAULT_SENDER_EMAIL} vers ${JSON.stringify(recipients)}`);
    console.info(`[SIMULATION E-MAIL] Sujet: "${finalSubject}"`);
    console.info(`[SIMULATION E-MAIL] Note: Pour activer l'envoi réel, ajoutez BREVO_API_KEY dans les variables d'environnement Netlify.`);

    return new Response(JSON.stringify({
      success: true,
      simulated: true,
      message: "E-mail simulé (aucune clé BREVO_API_KEY ou RESEND_API_KEY configurée dans Netlify).",
      recipient: recipients,
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
