/**
 * Service d'envoi d'e-mails pour Chat L'Heureux 56
 * Communique avec la fonction serverless Netlify (/api/send-email)
 * Expéditeur officiel : noreply@chat-lheureux.fr
 */

const ASSO_EMAIL = "asso.chatslheureux@gmail.com";

/**
 * Envoie une requête vers la fonction serverless /api/send-email
 */
export async function sendEmail({ to, subject, type, data, html, text, replyTo }) {
  try {
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to,
        subject,
        type,
        data,
        html,
        text,
        replyTo: replyTo || ASSO_EMAIL
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.warn("Échec de l'envoi de l'e-mail via /api/send-email :", result);
      return { success: false, error: result.error || 'Erreur HTTP' };
    }

    return { success: true, ...result };
  } catch (err) {
    console.warn("Erreur réseau lors de l'appel au service e-mail :", err);
    return { success: false, error: err.message };
  }
}

/**
 * Envoie un accusé de réception officiel et bienveillant au candidat adoptant
 * @param {Object} adoptionData Données de la demande d'adoption
 */
export async function sendAdoptionConfirmationEmail(adoptionData) {
  if (!adoptionData || !adoptionData.email) {
    console.warn("sendAdoptionConfirmationEmail : adresse e-mail manquante.");
    return { success: false, error: "Adresse e-mail manquante" };
  }

  return await sendEmail({
    to: adoptionData.email,
    type: 'adoption_applicant',
    data: adoptionData,
    replyTo: ASSO_EMAIL
  });
}

/**
 * Envoie une notification instantanée à l'association lorsqu'un nouveau dossier arrive
 * @param {Object} adoptionData Données de la demande d'adoption
 */
export async function sendAdoptionNotificationToAsso(adoptionData) {
  return await sendEmail({
    to: ASSO_EMAIL,
    type: 'adoption_admin_notification',
    data: adoptionData,
    replyTo: adoptionData.email || ASSO_EMAIL
  });
}

/**
 * Envoie un e-mail informatif ou d'actualité personnalisé depuis noreply@chat-lheureux.fr
 */
export async function sendCustomInfoEmail({ to, subject, message, actionText, actionUrl }) {
  if (!to) return { success: false, error: "Destinataire manquant" };

  return await sendEmail({
    to,
    subject,
    type: 'custom_info',
    data: { message, actionText, actionUrl },
    replyTo: ASSO_EMAIL
  });
}
