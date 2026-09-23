import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Heart, 
  Sparkles, 
  ArrowRight, 
  CheckCircle, 
  ShieldCheck, 
  Home, 
  Stethoscope, 
  RefreshCw, 
  Star, 
  HelpCircle,
  ChevronDown
} from 'lucide-react';
import CatCard from '../components/CatCard';
import { fetchCats, getCachedCats } from '../firebase/catsService';
import { fetchStories, getCachedStories } from '../firebase/storiesService';
import { useToast } from '../context/ToastContext';

export default function HomePage() {
  const [cats, setCats] = useState(() => getCachedCats(true));
  const [loadingCats, setLoadingCats] = useState(cats.length === 0);
  const [allStories, setAllStories] = useState(() => getCachedStories());
  const [displayedStories, setDisplayedStories] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const { showToast } = useToast();

  // Chargement des chats
  useEffect(() => {
    let isMounted = true;
    fetchCats(true)
      .then((freshCats) => {
        if (isMounted) {
          setCats(freshCats);
          setLoadingCats(false);
        }
      })
      .catch((err) => {
        console.warn("Erreur chargement chats accueil :", err);
        if (isMounted) setLoadingCats(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Chargement des témoignages
  useEffect(() => {
    let isMounted = true;
    fetchStories()
      .then((freshStories) => {
        if (isMounted && freshStories.length > 0) {
          setAllStories(freshStories);
        }
      })
      .catch((err) => {
        console.warn("Erreur chargement avis :", err);
      });

    return () => { isMounted = false; };
  }, []);

  // Sélection aléatoire de 3 témoignages
  const pickRandomStories = (storiesList) => {
    if (!storiesList || storiesList.length === 0) return [];
    const shuffled = [...storiesList].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3);
  };

  useEffect(() => {
    if (allStories.length > 0) {
      setDisplayedStories(pickRandomStories(allStories));
    }
  }, [allStories]);

  const handleRefreshStories = () => {
    setDisplayedStories(pickRandomStories(allStories));
    showToast("Nouveaux avis 🐾", "Avis d'adoptants tirés au sort.", "info");
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqItems = [
    {
      q: "Où peut-on rencontrer les chats à l'adoption ?",
      a: "Tous nos chats vivent en Familles d'Accueil (FA) bienveillantes réparties dans le Morbihan (autour de Colpo, Vannes, Lorient, Auray). Après un premier échange téléphonique, une visite est organisée directement chez la famille d'accueil pour faire connaissance."
    },
    {
      q: "Quels sont les frais d'adoption et que comprennent-ils ?",
      a: "Les frais d'adoption participent aux frais vétérinaires réels engagés : identification par puce électronique I-CAD, primo-vaccination + rappel, déparasitage complet (vers et puces), et stérilisation/castration obligatoire dès l'âge requis."
    },
    {
      q: "Puis-je adopter si je vis en appartement ?",
      a: "Absolument ! Le caractère et les besoins de chaque chat sont observés au quotidien dans leur famille d'accueil. Certains chats s'épanouissent parfaitement en intérieur sans accès extérieur, tandis que d'autres ont besoin d'un jardin sécurisé."
    }
  ];

  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16">
      
      {/* Hero Section */}
      <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-24">
        <div className="text-center max-w-3xl mx-auto">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-6 shadow-xs animate-in fade-in">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Association de protection féline • Morbihan (56)</span>
          </div>

          <h1 className="font-title text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 tracking-tight leading-[1.08] mb-6">
            Offrez une nouvelle vie à un <span className="text-brand-gradient">chat heureux</span>.
          </h1>

          <p className="text-sm sm:text-lg text-gray-600 font-medium mb-8 leading-relaxed max-w-2xl mx-auto">
            Basée à <strong>Colpo</strong> dans le Morbihan, notre association recueille, soigne et place des chats abandonnés au sein de <strong>familles d'accueil chaleureuses</strong> avant leur adoption définitive.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              to="/adoption"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-gradient text-white text-sm sm:text-base font-bold px-8 py-4 rounded-2xl shadow-lg shadow-pink-500/25 hover:shadow-xl hover:opacity-95 transition-all hover:-translate-y-0.5"
            >
              <span>Découvrir nos chats</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              to="/soutenir"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-800 text-sm sm:text-base font-bold px-7 py-4 rounded-2xl border border-gray-200 shadow-xs hover:bg-gray-50 transition-all"
            >
              <Heart className="w-4 h-4 text-pink-500 fill-pink-500" />
              <span>Soutenir nos actions</span>
            </Link>
          </div>

        </div>

        {/* Chiffres clés / Engagements */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
          {[
            { 
              icon: <Home className="w-5 h-5 text-pink-500" />,
              bgIcon: "bg-pink-50",
              label: "100% Familles d'Accueil", 
              sub: "Zéro box, zéro cage" 
            },
            { 
              icon: <Stethoscope className="w-5 h-5 text-[#7db1f9]" />,
              bgIcon: "bg-blue-50",
              label: "Parcours Santé Complet", 
              sub: "Stérilisés, identifiés & soignés" 
            },
            { 
              icon: <Heart className="w-5 h-5 text-emerald-500" />,
              bgIcon: "bg-emerald-50",
              label: "Adoptions Responsables", 
              sub: "Accompagnement bienveillant" 
            },
            { 
              icon: <ShieldCheck className="w-5 h-5 text-purple-500" />,
              bgIcon: "bg-purple-50",
              label: "Association Reconnue", 
              sub: "Loi 1901 Morbihan (56)" 
            }
          ].map((item, i) => (
            <div key={i} className="glass-card rounded-2xl p-4 sm:p-5 text-center flex flex-col items-center border border-slate-100 hover-lift">
              <div className={`w-10 h-10 rounded-xl ${item.bgIcon} flex items-center justify-center mb-3 shadow-xs`}>
                {item.icon}
              </div>
              <strong className="block text-xs sm:text-sm font-black text-gray-900 mb-0.5">{item.label}</strong>
              <span className="text-[11px] text-gray-500 font-semibold">{item.sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Section : Nos Petits Protégés en Vedette */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 sm:mb-28">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#d24de3] mb-1">
              <Heart className="w-3.5 h-3.5 fill-[#d24de3]" />
              <span>Ils attendent leur famille</span>
            </div>
            <h2 className="font-title text-2xl sm:text-4xl font-black text-gray-900">
              Nos chats à l'adoption
            </h2>
          </div>

          <Link
            to="/adoption"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#d24de3] hover:text-pink-600 transition-colors"
          >
            <span>Voir tout le catalogue ({cats.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingCats && cats.length === 0 ? (
          <div className="py-20 text-center text-gray-400 font-bold text-sm">
            <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            Chargement de nos pensionnaires...
          </div>
        ) : cats.length === 0 ? (
          <div className="glass-card rounded-3xl p-12 text-center text-gray-500 font-medium">
            Tous nos chats ont trouvé une famille pour le moment ! De nouveaux sauvetages sont en cours.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cats.slice(0, 6).map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </section>

      {/* Section : Pourquoi adopter chez Chat L'Heureux 56 */}
      <section className="bg-gradient-to-b from-pink-50/50 to-purple-50/30 py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-y border-pink-100/50 mb-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-black uppercase tracking-wider text-[#d24de3] mb-2 block">
              Nos Valeurs
            </span>
            <h2 className="font-title text-2xl sm:text-4xl font-black text-gray-900 mb-4">
              Une démarche éthique et bienveillante
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
              Nous n'avons pas de refuge traditionnel avec des cages : tous nos chats vivent au sein de familles d'accueil pour favoriser leur équilibre et bien connaître leur caractère.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card rounded-3xl p-8 bg-white border border-pink-100 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 text-[#d24de3] flex items-center justify-center text-xl mb-5">
                <Home className="w-6 h-6" />
              </div>
              <h3 className="font-title text-lg sm:text-xl font-black text-gray-900 mb-2">100% Familles d'Accueil</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                Habitués aux bruits du quotidien, aux enfants, et souvent à d'autres animaux, nos chats sont sociables et prêts pour leur foyer définitif.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 bg-white border border-pink-100 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl mb-5">
                <Stethoscope className="w-6 h-6" />
              </div>
              <h3 className="font-title text-lg sm:text-xl font-black text-gray-900 mb-2">Parcours Santé Rigoureux</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                Chaque chat est examiné par nos vétérinaires partenaires, pucé, primo-vacciné, déparasité et stérilisé. Aucun départ sans protocole sanitaire complet.
              </p>
            </div>

            <div className="glass-card rounded-3xl p-8 bg-white border border-pink-100 hover-lift">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#d24de3] flex items-center justify-center text-xl mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-title text-lg sm:text-xl font-black text-gray-900 mb-2">Accompagnement & Conseils</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                Nous prenons le temps d'échanger pour nous assurer que le tempérament du chat correspond à votre mode de vie, pour une adoption sereine et durable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 sm:mb-28">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-10">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#d24de3] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ils ont trouvé leur bonheur</span>
            </div>
            <h2 className="font-title text-2xl sm:text-4xl font-black text-gray-900">
              Des nouvelles de nos adoptés
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {allStories.length > 3 && (
              <button
                type="button"
                onClick={handleRefreshStories}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pink-50 text-[#d24de3] hover:bg-pink-100 font-bold text-xs transition-colors"
                title="Découvrir d'autres témoignages"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Changer d'avis</span>
              </button>
            )}
            <Link
              to="/temoignages"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-700 hover:text-[#d24de3] transition-colors"
            >
              <span>Tous les avis</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {displayedStories.length === 0 ? (
          <div className="glass-card rounded-3xl p-8 text-center max-w-xl mx-auto border border-pink-100 bg-white">
            <Heart className="w-10 h-10 text-[#d24de3] mx-auto mb-3" />
            <h4 className="font-title text-base font-bold text-gray-900 mb-1">Vous avez adopté chez nous ?</h4>
            <p className="text-xs text-gray-600 font-medium mb-4">
              Partagez des nouvelles et des photos de votre protégé dans son nouveau foyer !
            </p>
            <a 
              href="mailto:asso.chatslheureux@gmail.com?subject=T%C3%A9moignage%20d'adoption" 
              className="text-xs font-bold text-[#d24de3] hover:underline"
            >
              asso.chatslheureux@gmail.com
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {displayedStories.map((story) => (
              <div 
                key={story.id} 
                className="glass-card rounded-3xl p-6 border border-pink-100 flex flex-col justify-between hover-lift bg-white shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      {story.photos && story.photos.length > 0 ? (
                        <img 
                          src={story.photos[0]} 
                          alt={story.catName} 
                          className="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-pink-200" 
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-pink-100 text-[#d24de3] font-black text-xs flex items-center justify-center shrink-0">
                          {(story.adoptant?.charAt(0) || story.catName?.charAt(0) || 'A').toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-title text-sm sm:text-base font-bold text-gray-900 truncate">
                          {story.catName}
                        </h4>
                        <span className="text-[11px] text-gray-500 block truncate">
                          Par {story.adoptant} ({story.location || '56'})
                        </span>
                      </div>
                    </div>
                    <div className="flex text-amber-400 text-xs shrink-0 gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-3 h-3 fill-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-600 font-medium italic leading-relaxed mb-4 line-clamp-4">
                    « {story.content} »
                  </p>
                </div>

                <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1.5 pt-3 border-t border-gray-100">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{story.tag || 'Heureux au foyer'}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAQ Rapide */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto mb-20 sm:mb-28">
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-wider text-[#d24de3] mb-1 block">
            Questions Fréquentes
          </span>
          <h2 className="font-title text-2xl sm:text-3xl font-black text-gray-900">
            Tout savoir avant d'adopter
          </h2>
        </div>

        <div className="space-y-3">
          {faqItems.map((item, idx) => (
            <div 
              key={idx}
              className="glass-card rounded-2xl bg-white border border-gray-200 overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 font-title font-bold text-sm sm:text-base text-gray-900 hover:text-[#d24de3] transition-colors"
              >
                <span>{item.q}</span>
                <ChevronDown 
                  className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-300 ${
                    openFaq === idx ? 'rotate-180 text-[#d24de3]' : ''
                  }`} 
                />
              </button>
              {openFaq === idx && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-gray-600 font-medium leading-relaxed border-t border-gray-100 animate-in fade-in">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="glass-card rounded-3xl sm:rounded-[2.5rem] p-8 sm:p-14 bg-gradient-to-br from-slate-900 to-slate-950 text-white text-center relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="font-title text-2xl sm:text-4xl font-black mb-3">
              Prêt à accueillir un compagnon pour la vie ?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 font-medium mb-8 leading-relaxed">
              Consultez notre catalogue et contactez-nous dès aujourd'hui pour organiser une première rencontre avec l'un de nos petits protégés.
            </p>
            <Link
              to="/adoption"
              className="inline-flex items-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-pink-500/30 hover:opacity-95 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span>Voir les chats disponibles</span>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
