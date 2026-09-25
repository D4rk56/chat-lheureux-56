import React from 'react';
import { ExternalLink } from 'lucide-react';
import { parseLinksFromText } from '../../utils/linkParser';

/**
 * Composant React qui affiche du texte en transformant automatiquement les URLs
 * et les liens Markdown [Titre](URL) en hyperliens cliquables sécurisés.
 * 
 * @param {Object} props
 * @param {string} props.text - Le texte à afficher
 * @param {string} [props.className] - Classe CSS pour le conteneur
 * @param {string} [props.linkClassName] - Classe CSS spécifique pour les liens
 * @param {boolean} [props.showExternalIcon=true] - Affiche une petite icône ↗
 * @param {string} [props.as='span'] - Balise conteneur ('span', 'p', 'div')
 */
export default function ClickableText({
  text,
  className = '',
  linkClassName = '',
  showExternalIcon = true,
  as = 'span'
}) {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const segments = parseLinksFromText(text);

  const defaultLinkClass = "text-pink-500 hover:text-pink-400 underline font-semibold transition-colors inline-flex items-baseline gap-0.5 break-all align-baseline";
  const effectiveLinkClass = linkClassName || defaultLinkClass;

  const content = segments.map((seg, idx) => {
    if (seg.type === 'link') {
      return (
        <a
          key={idx}
          href={seg.url}
          target="_blank"
          rel="noopener noreferrer"
          className={effectiveLinkClass}
          onClick={(e) => e.stopPropagation()}
          title={`Ouvrir ${seg.url} (nouvel onglet)`}
        >
          <span>{seg.text}</span>
          {showExternalIcon && (
            <ExternalLink className="w-2.5 h-2.5 inline-block shrink-0 opacity-80 ml-0.5" aria-hidden="true" />
          )}
        </a>
      );
    }
    return <React.Fragment key={idx}>{seg.text}</React.Fragment>;
  });

  const Component = as;
  return <Component className={className}>{content}</Component>;
}
