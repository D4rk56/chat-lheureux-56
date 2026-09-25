/**
 * Utilitaire d'analyse et de découpage de texte contenant des liens web
 * Association Chat L'Heureux 56
 */

/**
 * Nettoie la ponctuation finale accidentellement capturée à la fin d'une URL
 * Ex: "https://chat-lheureux.fr." -> { cleanUrl: "https://chat-lheureux.fr", trailing: "." }
 * @param {string} rawUrl
 * @returns {{ cleanUrl: string, trailing: string }}
 */
export function stripTrailingPunctuation(rawUrl) {
  if (!rawUrl) return { cleanUrl: '', trailing: '' };
  
  const match = rawUrl.match(/([.,;:?!)\],'">]+)$/);
  if (match) {
    const trailing = match[1];
    const cleanUrl = rawUrl.slice(0, rawUrl.length - trailing.length);
    return { cleanUrl, trailing };
  }
  return { cleanUrl: rawUrl, trailing: '' };
}

/**
 * Normalise une URL pour s'assurer qu'elle commence par un protocole web valide
 * Ex: "www.facebook.com" -> "https://www.facebook.com"
 * @param {string} url
 * @returns {string}
 */
export function normalizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Découpe un texte en segments de texte brut et de liens cliquables
 * Supporte :
 * 1. Liens Markdown nommés : [Titre du lien](https://url.com)
 * 2. URLs brutes : https://..., http://..., www....
 * 
 * @param {string} text - Texte à analyser
 * @returns {Array<{ type: 'text' | 'link', text: string, url?: string }>}
 */
export function parseLinksFromText(text) {
  if (!text || typeof text !== 'string') return [];

  const segments = [];
  
  // Expression régulière combinée :
  // Groupe 1 & 2 : Liens Markdown nommés [Label](URL)
  // Groupe 3 : URLs brutes (https://, http://, www.)
  const combinedRegex = /\[([^\]]+)\]\(((?:https?:\/\/|www\.)[^\s)]+)\)|((?:https?:\/\/|www\.)[^\s<>"']+)/gi;

  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(text)) !== null) {
    const matchIndex = match.index;
    
    // Texte brut précédant le lien
    if (matchIndex > lastIndex) {
      segments.push({
        type: 'text',
        text: text.slice(lastIndex, matchIndex)
      });
    }

    if (match[1] && match[2]) {
      // Cas 1 : Lien Markdown nommé [Label](URL)
      const label = match[1];
      const rawUrl = match[2];
      const { cleanUrl, trailing } = stripTrailingPunctuation(rawUrl);
      
      segments.push({
        type: 'link',
        text: label,
        url: normalizeUrl(cleanUrl)
      });

      if (trailing) {
        segments.push({
          type: 'text',
          text: trailing
        });
      }
    } else if (match[3]) {
      // Cas 2 : URL brute
      const rawUrl = match[3];
      const { cleanUrl, trailing } = stripTrailingPunctuation(rawUrl);

      if (cleanUrl) {
        segments.push({
          type: 'link',
          text: cleanUrl,
          url: normalizeUrl(cleanUrl)
        });
      }

      if (trailing) {
        segments.push({
          type: 'text',
          text: trailing
        });
      }
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // Reste du texte après le dernier lien
  if (lastIndex < text.length) {
    segments.push({
      type: 'text',
      text: text.slice(lastIndex)
    });
  }

  return segments;
}
