import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Heart, 
  Sparkles, 
  Send, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  X, 
  MapPin, 
  Quote, 
  Copy, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Camera, 
  Home, 
  ShieldCheck 
} from 'lucide-react';
import { fetchStories, getCachedStories } from '../firebase/storiesService';
import { useToast } from '../context/ToastContext';

export default function TestimonialsPage() {
  const [stories, setStories] = useState(() => getCachedStories());
  const [loading, setLoading] = useState(stories.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedMap, setExpandedMap] = useState({});
  const [activePhotoIndexMap, setActivePhotoIndexMap] = useState({});
  const [lightbox, setLightbox] = useState(null); // { photos: [], currentIndex: 0, catName: '' }
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    let isMounted = true;
    fetchStories()
      .then((freshStories) => {
        if (isMounted) {
          setStories(freshStories);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Erreur chargement témoignages :", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Gestion du clavier pour la visionneuse (Escape, Gauche, Droite)
  useEffect(() => {
    if (!lightbox) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightbox(null);
      } else if (e.key === 'ArrowLeft' && lightbox.photos.length > 1) {
        setLightbox((prev) => ({
          ...prev,
          currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length
        }));
      } else if (e.key === 'ArrowRight' && lightbox.photos.length > 1) {
        setLightbox((prev) => ({
          ...prev,
          currentIndex: (prev.currentIndex + 1) % prev.photos.length
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  const toggleExpand = (id) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectThumbnail = (storyId, photoIdx, e) => {
    e.stopPropagation();
    setActivePhotoIndexMap((prev) => ({
      ...prev,
      [storyId]: photoIdx
    }));
  };

  const openLightbox = (photos, initialIndex, catName) => {
    if (!photos || photos.length === 0) return;
    setLightbox({
      photos,
      currentIndex: initialIndex || 0,
      catName
    });
  };

  const handleCopyEmail = () => {
    const email = 'asso.chatslheureux@gmail.com';
    navigator.clipboard.writeText(email)
      .then(() => {
        setCopiedEmail(true);
        if (showToast) {
          showToast('Adresse copiée !', 'asso.chatslheureux@gmail.com a été copié dans le presse-papier.', 'heart');
        }
        setTimeout(() => setCopiedEmail(false), 2500);
      })
      .catch(() => {
        if (showToast) {
          showToast('Erreur', "Impossible de copier l'adresse e-mail.", 'error');
        }
      });
  };

  // Filtrage des témoignages par recherche
  const filteredStories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stories;

    return stories.filter((story) => {
      const cat = (story.catName || '').toLowerCase();
      const adoptant = (story.adoptant || '').toLowerCase();
      const loc = (story.location || '').toLowerCase();
      const content = (story.content || '').toLowerCase();
      return cat.includes(q) || adoptant.includes(q) || loc.includes(q) || content.includes(q);
    });
  }, [stories, searchQuery]);

  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* --- EN-TÊTE HERO --- */}
      <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Histoires Vraies • Familles Heureuses</span>
        </div>
        <h1 className="font-title text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Ils ont trouvé leur <span className="text-brand-gradient">foyer pour la vie</span>
        </h1>
        <p className="text-xs sm:text-base text-gray-600 font-medium leading-relaxed max-w-2xl mx-auto">
          Découvrez les nouvelles et photos émouvantes partagées par les adoptants de nos petits protégés. Chaque adoption est une victoire et le début d'une merveilleuse complicité.
        </p>
      </div>

      {/* --- BANDEAU D'IMPACT ÉMOTIONNEL (BENTO STATS) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 sm:mb-14 max-w-4xl mx-auto">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-pink-100/80 text-center flex flex-col items-center justify-center hover-lift">
          <div className="w-10 h-10 rounded-xl bg-pink-100 text-[#d24de3] flex items-center justify-center mb-2.5">
            <Heart className="w-5 h-5 fill-pink-400 text-pink-500" />
          </div>
          <span className="font-title text-lg sm:text-xl font-black text-gray-900">100% d'amour</span>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">Des chats épanouis et comblés dans leurs nouveaux foyers</p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-purple-100/80 text-center flex flex-col items-center justify-center hover-lift">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <span className="font-title text-lg sm:text-xl font-black text-gray-900">Suivi bienveillant</span>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">Conseils et accompagnement attentif post-adoption</p>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-blue-100/80 text-center flex flex-col items-center justify-center hover-lift">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2.5">
            <Home className="w-5 h-5" />
          </div>
          <span className="font-title text-lg sm:text-xl font-black text-gray-900">Partout dans le 56</span>
          <p className="text-[11px] sm:text-xs text-gray-500 font-medium mt-1">Des adoptions à Vannes, Lorient, Auray et alentours</p>
        </div>
      </div>

      {/* --- BARRE D'INTERACTION & RECHERCHE --- */}
      <div className="glass-card rounded-2xl sm:rounded-3xl p-3 sm:p-4 mb-8 sm:mb-10 border border-pink-100 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, adoptant, commune..."
            className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:border-pink-500 focus:bg-white text-gray-800 placeholder-gray-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300 flex items-center justify-center text-xs"
              title="Effacer la recherche"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto text-xs text-gray-500 font-bold px-1">
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-pink-100 text-[#d24de3]">
            {filteredStories.length}
          </span>
          <span>{filteredStories.length > 1 ? 'témoignages' : 'témoignage'}</span>
        </div>
      </div>

      {/* --- CONTENU PRINCIPAL : ÉTAT CHARGEMENT / VIDE / GRILLE --- */}
      {loading && stories.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {[1, 2, 3, 4, 5, 6].map((idx) => (
            <div key={idx} className="glass-card rounded-3xl p-6 border border-pink-100/60 bg-white animate-pulse flex flex-col">
              <div className="h-56 bg-slate-200 rounded-2xl mb-4 w-full" />
              <div className="h-4 bg-slate-200 rounded w-1/3 mb-3" />
              <div className="h-6 bg-slate-200 rounded w-2/3 mb-4" />
              <div className="space-y-2 mb-6">
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-5/6" />
                <div className="h-3 bg-slate-200 rounded w-4/6" />
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center gap-3 mt-auto">
                <div className="w-9 h-9 rounded-full bg-slate-200 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                  <div className="h-2 bg-slate-200 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredStories.length === 0 ? (
        <div className="glass-card rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto bg-white border border-pink-100">
          <Heart className="w-12 h-12 text-[#d24de3] mx-auto mb-4" />
          <h3 className="font-title text-xl font-bold text-gray-900 mb-2">
            {searchQuery ? "Aucun témoignage trouvé" : "Bientôt de nouveaux témoignages"}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-6">
            {searchQuery 
              ? `Aucun retour ne correspond à « ${searchQuery} ». Essayez un autre mot-clé ou effacez la recherche.`
              : "Les retours de nos familles adoptantes sont en cours de mise en ligne."}
          </p>
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="inline-flex items-center gap-2 bg-pink-100 text-[#d24de3] hover:bg-pink-200 text-xs sm:text-sm px-5 py-2.5 rounded-xl font-bold transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Réinitialiser la recherche</span>
            </button>
          ) : (
            <a
              href="mailto:asso.chatslheureux@gmail.com?subject=T%C3%A9moignage%20d'adoption"
              className="inline-flex items-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm px-6 py-3 rounded-xl font-bold shadow-md hover:opacity-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Partager mon témoignage</span>
            </a>
          )}
        </div>
      ) : (
        /* GRILLE MODERNE RESPONSIVE */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredStories.map((story) => {
            const photos = (story.photos && Array.isArray(story.photos) && story.photos.length > 0)
              ? story.photos
              : ['https://placehold.co/800x600?text=Adopt%C3%A9'];
            
            const activePhotoIndex = activePhotoIndexMap[story.id] || 0;
            const currentPhoto = photos[activePhotoIndex] || photos[0];
            const catName = story.catName || 'Protégé';
            const adoptant = story.adoptant || 'Famille adoptante';
            const rawLoc = story.location || 'Morbihan';
            const location = rawLoc.includes('(56') ? rawLoc : `${rawLoc} (56)`;
            const content = story.content || '';
            const isLong = content.length > 220;
            const isExpanded = !!expandedMap[story.id];
            const initial = (adoptant.charAt(0) || catName.charAt(0) || 'A').toUpperCase();

            return (
              <article
                key={story.id}
                className="glass-card rounded-3xl p-5 sm:p-6 flex flex-col justify-between hover-lift border border-pink-100/70 bg-white group shadow-xs transition-all"
              >
                <div>
                  {/* Photo principale & miniatures */}
                  <div className="relative mb-4">
                    <div 
                      onClick={() => openLightbox(photos, activePhotoIndex, catName)}
                      className="relative h-56 sm:h-64 w-full rounded-2xl overflow-hidden bg-slate-100 shadow-xs cursor-pointer group/img"
                    >
                      <img
                        src={currentPhoto}
                        alt={catName}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://placehold.co/800x600?text=Adopt%C3%A9';
                        }}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-105"
                      />

                      {/* Dégradé léger en bas d'image */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

                      {/* Badge Statut */}
                      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-3 py-1 rounded-full text-[11px] font-black text-gray-800 shadow-sm flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                        <span>Adopté 🎉</span>
                      </div>

                      {/* Badge Multi-Photos si > 1 */}
                      {photos.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-full text-[11px] font-bold shadow flex items-center gap-1">
                          <Camera className="w-3 h-3 text-pink-300" />
                          <span>{photos.length} photos</span>
                        </div>
                      )}

                      {/* Nom du chat et commune en incrustation */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                        <span className="font-title text-lg font-black drop-shadow-sm truncate">{catName}</span>
                        <div className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-lg shrink-0">
                          <MapPin className="w-3 h-3 text-pink-300" />
                          <span>{location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Miniatures cliquables sous la photo principale si plusieurs photos */}
                    {photos.length > 1 && (
                      <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto pb-1 scrollbar-none">
                        {photos.map((p, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={(e) => handleSelectThumbnail(story.id, pIdx, e)}
                            className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                              activePhotoIndex === pIdx
                                ? 'border-[#d24de3] scale-105 shadow-sm'
                                : 'border-transparent opacity-70 hover:opacity-100'
                            }`}
                          >
                            <img src={p} alt="" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Note étoiles & filigrane citation */}
                  <div className="flex items-center justify-between gap-3 mb-2.5">
                    <div className="flex text-amber-400 text-xs">
                      {[...Array(5)].map((_, idx) => (
                        <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />
                      ))}
                    </div>
                    <Quote className="w-6 h-6 text-pink-200 shrink-0" />
                  </div>

                  {/* Titre & extrait de témoignage */}
                  <h2 className="font-title text-base sm:text-lg font-black text-gray-900 tracking-tight mb-2">
                    Des nouvelles de <span className="text-brand-gradient">{catName}</span>
                  </h2>

                  <p
                    className={`text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words font-medium italic mb-2 ${
                      isLong && !isExpanded ? 'line-clamp-4' : ''
                    }`}
                  >
                    « {content} »
                  </p>

                  {isLong && (
                    <button
                      type="button"
                      onClick={() => toggleExpand(story.id)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#d24de3] hover:text-pink-600 mb-3 transition-colors"
                    >
                      <span>{isExpanded ? 'Réduire' : 'Lire la suite'}</span>
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  )}
                </div>

                {/* Pied de carte : adoptant & badge */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 text-[#d24de3] font-black text-xs flex items-center justify-center shrink-0 border border-pink-200/60 shadow-2xs">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">{adoptant}</p>
                      <span className="text-[10px] text-gray-500 font-semibold block truncate">
                        Famille pour la vie
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] sm:text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1">
                    <span>✓</span> Au foyer
                  </span>
                </div>

              </article>
            );
          })}
        </div>
      )}

      {/* --- MODALE VISIONNEUSE (LIGHTBOX) --- */}
      {lightbox && (
        <div 
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col items-center justify-center"
          >
            {/* Bouton Fermer */}
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute -top-12 right-0 sm:right-2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors"
              title="Fermer (Échap)"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Conteneur Image principale */}
            <div className="relative w-full max-h-[75vh] flex items-center justify-center overflow-hidden rounded-2xl">
              <img
                src={lightbox.photos[lightbox.currentIndex]}
                alt={lightbox.catName}
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl select-none"
              />

              {/* Navigation Précédent */}
              {lightbox.photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightbox((prev) => ({
                    ...prev,
                    currentIndex: (prev.currentIndex - 1 + prev.photos.length) % prev.photos.length
                  }))}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                  title="Photo précédente"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Navigation Suivant */}
              {lightbox.photos.length > 1 && (
                <button
                  type="button"
                  onClick={() => setLightbox((prev) => ({
                    ...prev,
                    currentIndex: (prev.currentIndex + 1) % prev.photos.length
                  }))}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/50 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                  title="Photo suivante"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Légende & Compteur */}
            <div className="mt-4 flex items-center justify-between w-full px-2 text-white text-xs sm:text-sm">
              <span className="font-title font-bold text-pink-300 text-sm sm:text-base">
                {lightbox.catName}
              </span>
              {lightbox.photos.length > 1 && (
                <span className="font-medium bg-white/10 px-3 py-1 rounded-full text-xs">
                  {lightbox.currentIndex + 1} / {lightbox.photos.length}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- BANNIÈRE D'APPEL AUX ADOPTANTS (CTA) --- */}
      <section className="mt-16 sm:mt-20 text-center glass-card rounded-3xl p-6 sm:p-10 bg-gradient-to-br from-pink-50/70 via-white to-purple-50/70 border border-pink-200/70 shadow-sm max-w-3xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#d24de3] flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h3 className="font-title text-xl sm:text-2xl font-black text-gray-900 mb-2">
          Vous avez adopté l'un de nos petits protégés ?
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 font-medium mb-6 max-w-lg mx-auto leading-relaxed">
          Envoyez-nous quelques photos et des nouvelles de votre boule de poils ! Nous serons ravis de partager son bonheur sur cette page.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <a
            href="mailto:asso.chatslheureux@gmail.com?subject=Nouvelles%20d'un%20chat%20adopt%C3%A9&body=Bonjour%20l'%C3%A9quipe%20des%20Chats%20L'Heureux,%0D%0A%0D%0AVoici%20quelques%20nouvelles%20de%20notre%20chat%20adopt%C3%A9%20:%0D%0A-%20Nom%20du%20chat%20:%0D%0A-%20Adoptant(s)%20:%0D%0A-%20Commune%20:%0D%0A%0D%0ANotre%20t%C3%A9moignage%20:%0D%0A(Partagez%20votre%20message%20ici%20et%20n'h%C3%A9sitez%20pas%20%C3%A0%20joindre%201%20%C3%A0%203%20photos%20!)"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm font-bold px-6 py-3.5 rounded-xl shadow-md hover:opacity-95 transition-all hover:scale-[1.02]"
          >
            <Send className="w-4 h-4" />
            <span>Envoyer nos nouvelles par e-mail</span>
          </a>

          <button
            type="button"
            onClick={handleCopyEmail}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-700 hover:text-gray-900 border border-slate-200 text-xs sm:text-sm font-bold px-5 py-3.5 rounded-xl shadow-2xs hover:bg-slate-50 transition-all"
            title="Copier l'adresse asso.chatslheureux@gmail.com"
          >
            {copiedEmail ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Adresse copiée !</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-gray-500" />
                <span>Copier notre e-mail</span>
              </>
            )}
          </button>
        </div>
      </section>

    </main>
  );
}
