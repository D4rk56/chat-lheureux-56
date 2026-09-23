import React, { useState, useEffect } from 'react';
import { Heart, Sparkles, Send, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { fetchStories, getCachedStories } from '../firebase/storiesService';

export default function TestimonialsPage() {
  const [stories, setStories] = useState(() => getCachedStories());
  const [loading, setLoading] = useState(stories.length === 0);
  const [expandedMap, setExpandedMap] = useState({});

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

  const toggleExpand = (id) => {
    setExpandedMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
      
      {/* En-tête */}
      <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Histoires Vraies • Familles Heureuses</span>
        </div>
        <h1 className="font-title text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-4">
          Ils ont trouvé leur foyer pour la vie
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
          Découvrez les nouvelles et photos émouvantes partagées par les adoptants de nos petits protégés. Chaque adoption est une victoire et le début d'une belle aventure.
        </p>
      </div>

      {/* Liste des témoignages */}
      {loading && stories.length === 0 ? (
        <div className="py-24 text-center text-gray-400 font-bold text-sm">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Chargement des témoignages...
        </div>
      ) : stories.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 text-center max-w-xl mx-auto bg-white border border-pink-100">
          <Heart className="w-12 h-12 text-[#d24de3] mx-auto mb-4" />
          <h3 className="font-title text-xl font-bold text-gray-900 mb-2">
            Bientôt de nouveaux témoignages
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-6">
            Les retours de nos familles adoptantes sont en cours de mise en ligne.
          </p>
          <a
            href="mailto:asso.chatslheureux@gmail.com?subject=T%C3%A9moignage%20d'adoption"
            className="inline-flex items-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm px-6 py-3 rounded-xl font-bold shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>Partager mon témoignage</span>
          </a>
        </div>
      ) : (
        <div className="space-y-8 sm:space-y-12">
          {stories.map((story, i) => {
            const isEven = i % 2 === 0;
            const photo = (story.photos && story.photos.length > 0)
              ? story.photos[0]
              : 'https://placehold.co/800x600?text=Adopt%C3%A9';
            const catName = story.catName || 'Protégé';
            const adoptant = story.adoptant || 'Famille adoptante';
            const rawLoc = story.location || 'Morbihan (56)';
            const location = rawLoc.includes('(') ? rawLoc : `${rawLoc} (56)`;
            const content = story.content || '';
            const isLong = content.length > 300;
            const isExpanded = !!expandedMap[story.id];
            const initial = (adoptant.charAt(0) || catName.charAt(0) || 'A').toUpperCase();

            return (
              <article
                key={story.id}
                className={`glass-card rounded-[2.5rem] p-5 sm:p-8 flex flex-col ${
                  isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'
                } gap-6 sm:gap-8 items-start hover-lift border border-pink-100/60 bg-white`}
              >
                {/* Photo */}
                <div className="w-full lg:w-5/12 shrink-0 lg:self-start lg:sticky lg:top-24">
                  <div className="relative h-60 sm:h-72 w-full rounded-2xl sm:rounded-3xl overflow-hidden bg-slate-100 shadow-sm">
                    <img
                      src={photo}
                      alt={catName}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://placehold.co/800x600?text=Adopt%C3%A9';
                      }}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 px-3 py-1 rounded-full text-[11px] font-black text-gray-800 shadow flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" />
                      <span>Adopté 🎉</span>
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-bold bg-black/40 backdrop-blur-sm px-3.5 py-2 rounded-xl">
                      <span className="font-title text-base font-black truncate">{catName}</span>
                      <span className="text-[11px] opacity-90 shrink-0">{location}</span>
                    </div>
                  </div>
                </div>

                {/* Contenu */}
                <div className="w-full lg:w-7/12 flex flex-col justify-between min-w-0">
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <span className="text-xs font-bold text-[#d24de3] uppercase tracking-wider">
                        Témoignage
                      </span>
                      <div className="flex text-amber-400 text-xs">
                        {[...Array(5)].map((_, idx) => (
                          <Star key={idx} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                    </div>

                    <h2 className="font-title text-xl sm:text-2xl font-black text-gray-900 tracking-tight mb-3">
                      Des nouvelles de <span className="text-brand-gradient">{catName}</span>
                    </h2>

                    <p
                      className={`text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words font-medium mb-3 ${
                        isLong && !isExpanded ? 'line-clamp-5' : ''
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

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3 mt-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-pink-100 text-[#d24de3] font-black text-xs flex items-center justify-center shrink-0">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{adoptant}</p>
                        <span className="text-[10px] text-gray-500 font-semibold block truncate">
                          Famille pour la vie
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full shrink-0">
                      ✓ Au foyer
                    </span>
                  </div>
                </div>

              </article>
            );
          })}
        </div>
      )}

      {/* CTA Adopter chez nous */}
      <div className="mt-16 text-center glass-card rounded-3xl p-8 bg-pink-50/60 border border-pink-100">
        <h3 className="font-title text-xl font-bold text-gray-900 mb-2">
          Vous avez adopté l'un de nos petits protégés ?
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 font-medium mb-4 max-w-lg mx-auto">
          Envoyez-nous un petit mot et quelques photos de votre moustachu ! Nous serons ravis de le publier sur cette page.
        </p>
        <a
          href="mailto:asso.chatslheureux@gmail.com?subject=Nouvelles%20d'un%20chat%20adopt%C3%A9"
          className="inline-flex items-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm font-bold px-6 py-3 rounded-xl shadow-md hover:opacity-95 transition-all"
        >
          <Send className="w-4 h-4" />
          <span>Envoyer nos nouvelles</span>
        </a>
      </div>

    </main>
  );
}
