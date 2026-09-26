import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  Heart, 
  MapPin, 
  Share2, 
  Check, 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  Copy, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MessageCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { fetchCatById, fetchCats, getCachedCats } from '../firebase/catsService';
import { getCatAdoptionInfo } from '../utils/age';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { getWhatsAppShareUrl, openWhatsAppUrl } from '../utils/whatsapp';
import CatCard from '../components/CatCard';
import ClickableText from '../components/common/ClickableText';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';

export default function CatDetailPage() {
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const queryId = searchParams.get('id');
  const catId = routeId || queryId;

  const [cat, setCat] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [similarCats, setSimilarCats] = useState([]);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!catId) {
      setError("Aucun identifiant de chat spécifié.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    setSelectedPhotoIndex(0);

    fetchCatById(catId)
      .then((catData) => {
        if (!catData) {
          setError("Ce chat n'a pas été trouvé ou a été retiré de la base de données.");
        } else {
          setCat(catData);
          document.title = `${catData.name || 'Chat'} — À l'adoption - Chat L'Heureux 56`;
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement détail chat :", err);
        setError("Une erreur est survenue lors de la récupération des données.");
        setLoading(false);
      });
  }, [catId]);

  // Récupération de suggestions d'autres chats
  useEffect(() => {
    let isMounted = true;
    const cached = getCachedCats(true);
    if (cached.length > 0) {
      const filtered = cached.filter((c) => c.id !== catId && ((c.photos && c.photos.length > 0) || c.image));
      if (filtered.length > 0) {
        setSimilarCats(filtered.slice(0, 3));
      }
    }

    // Toujours rafraîchir avec les données complètes de Firestore
    fetchCats(true)
      .then((all) => {
        if (isMounted && all && all.length > 0) {
          const validCats = all.filter((c) => c.id !== catId);
          setSimilarCats(validCats.slice(0, 3));
        }
      })
      .catch((err) => {
        console.warn("Erreur chargement suggestions d'autres chats :", err);
      });

    return () => { isMounted = false; };
  }, [catId]);

  const handleFavoriteToggle = () => {
    if (!cat) return;
    const adding = toggleFavorite(cat.id);
    if (adding) {
      showToast("Coup de cœur ajouté ❤️", `${cat.name} est dans vos favoris.`, "heart");
    } else {
      showToast("Retiré des favoris", `${cat.name} a été retiré de votre sélection.`, "info");
    }
  };

  const handleShare = async () => {
    const title = `${cat ? cat.name : 'Chat'} — À l'adoption (Chat L'Heureux 56)`;
    const text = `Découvrez ${cat ? cat.name : 'ce chat'} à l'adoption chez Chat L'Heureux 56 dans le Morbihan !`;
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') copyShareLink();
      }
    } else {
      copyShareLink();
    }
  };

  const shareWhatsApp = () => {
    const shareUrl = window.location.href;
    const text = `🐾 Regarde la fiche de ${cat?.name || 'ce chat'} à l'adoption chez Chat L'Heureux 56 dans le Morbihan :\n\n${shareUrl}`;
    const waUrl = getWhatsAppShareUrl(text);
    openWhatsAppUrl(waUrl);
  };

  const shareFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank', 'noopener,noreferrer');
  };

  const copyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      showToast("Lien copié !", "Partagez la fiche de ce chat autour de vous.");
    } catch (e) {
      showToast("Erreur", "Impossible de copier automatiquement le lien.", "error");
    }
  };

  const photos = (cat?.photos && cat.photos.length > 0)
    ? cat.photos
    : [cat?.image || 'https://placehold.co/800x600?text=Photo+en+cours'];

  const nextPhoto = () => {
    if (photos.length > 1) {
      setSelectedPhotoIndex((prev) => (prev + 1) % photos.length);
    }
  };

  const prevPhoto = () => {
    if (photos.length > 1) {
      setSelectedPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length);
    }
  };

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, photos.length]);

  useEffect(() => {
    if (isLightboxOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && photos.length > 1) {
      nextPhoto();
    } else if (isRightSwipe && photos.length > 1) {
      prevPhoto();
    }
  };

  if (loading) {
    return (
      <main className="flex-grow pt-28 pb-20 px-4 text-center">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-bold text-sm">Chargement de la fiche...</p>
      </main>
    );
  }

  if (error || !cat) {
    return (
      <main className="flex-grow pt-28 pb-20 px-4 max-w-xl mx-auto text-center">
        <div className="glass-card rounded-3xl p-8 sm:p-12 border border-rose-200 bg-white shadow-sm">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="font-title text-xl sm:text-2xl font-black text-gray-900 mb-2">
            Fiche introuvable
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium mb-6">
            {error || "Ce chat n'est plus disponible ou l'adresse est erronée."}
          </p>
          <Link
            to="/adoption"
            className="inline-flex items-center gap-2 bg-brand-gradient text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Retour au catalogue</span>
          </Link>
        </div>
      </main>
    );
  }

  const adoptionInfo = getCatAdoptionInfo(cat);
  const isAdopted = cat.status === 'Adopté';
  const isFav = isFavorite(cat.id);
  const isFemale = (cat.sex || cat.gender) === 'Femelle';
  const location = cat.location || 'Morbihan (56)';
  const comp = cat.compatibilities || {};
  const vet = cat.vetStatus || {};

  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full">
      
      {/* Fil d'Ariane & Retour */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyShareLink}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 px-3.5 py-1.5 rounded-xl shadow-xs transition-colors"
            title="Copier le lien de la fiche"
          >
            <Share2 className="w-3.5 h-3.5 text-pink-500" />
            <span>Partager</span>
          </button>

          <button
            type="button"
            onClick={handleFavoriteToggle}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all ${
              isFav
                ? 'bg-pink-500 text-white shadow-md shadow-pink-500/25'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-white' : ''}`} />
            <span>{isFav ? 'Coup de cœur !' : 'Favori'}</span>
          </button>
        </div>
      </div>

      {/* Bandeau si chat adopté */}
      {isAdopted && (
        <div className="glass-card rounded-2xl p-4 mb-6 bg-pink-50/80 border border-pink-200 text-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
              🎉
            </div>
            <div>
              <strong className="block text-xs sm:text-sm font-bold text-pink-900">
                {cat.name} a trouvé sa famille pour la vie !
              </strong>
              <span className="text-[11px] text-pink-700">
                {adoptionInfo.dateStr ? `Adopté(e) le ${adoptionInfo.dateStr}` : 'Ce chat a été adopté.'}
              </span>
            </div>
          </div>
          <Link
            to="/adoption"
            className="text-xs font-bold text-pink-700 hover:underline shrink-0"
          >
            Voir les chats disponibles &rarr;
          </Link>
        </div>
      )}

      {/* Grille principale : Photos à gauche, Infos à droite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        
        {/* Colonne Galerie Photo */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Photo Principale */}
          <div 
            onClick={() => setIsLightboxOpen(true)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsLightboxOpen(true); }}
            role="button"
            tabIndex={0}
            aria-label="Cliquer ou toucher pour agrandir la photo en plein écran"
            className="relative h-80 sm:h-[420px] rounded-3xl overflow-hidden bg-gray-100 shadow-md cursor-zoom-in group select-none focus:outline-none focus:ring-2 focus:ring-[#d24de3]"
          >
            <img
              src={photos[selectedPhotoIndex] || photos[0]}
              alt={cat.name}
              className={`w-full h-full object-cover transition-all duration-300 group-hover:scale-105 ${
                isAdopted ? 'grayscale filter' : ''
              }`}
            />

            {/* Statut Badge Flottant */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2 pointer-events-none">
              {cat.status === 'Urgence' && (
                <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> 🚨 Urgence
                </span>
              )}
              {cat.status === 'Réservé' && (
                <span className="bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Réservé
                </span>
              )}
              {cat.status === 'Disponible' && (
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Disponible à l'adoption
                </span>
              )}
            </div>

            {/* Badge Agrandir / Zoom */}
            <div className="absolute bottom-3 right-3 bg-slate-900/75 hover:bg-slate-900/90 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all shadow-md group-hover:scale-105 pointer-events-none">
              <Maximize2 className="w-3.5 h-3.5 text-pink-400" />
              <span>Agrandir</span>
            </div>
          </div>

          {/* Miniatures */}
          {photos.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-2">
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 transition-all border-2 ${
                    selectedPhotoIndex === idx
                      ? 'border-[#d24de3] scale-105 shadow-md'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Bloc Partage Social & Viralité */}
          <div className="glass-card rounded-2xl p-4 bg-gradient-to-br from-pink-50/50 via-white to-blue-50/40 border border-pink-100 shadow-xs">
            <h4 className="font-title text-xs sm:text-sm font-black text-gray-900 mb-1">
              Aidez <span className="text-[#d24de3]">{cat.name}</span> à trouver sa famille !
            </h4>
            <p className="text-[11px] text-gray-500 font-medium mb-3">
              Un simple partage à vos proches ou sur vos réseaux peut déclencher le coup de cœur décisif 🐾
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={shareWhatsApp}
                className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-white" />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={shareFacebook}
                className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
              >
                <span>Facebook</span>
              </button>
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-bold px-3 py-2 rounded-xl transition-all shadow-xs"
              >
                <Copy className="w-3 h-3 text-pink-500" />
                <span>Copier le lien</span>
              </button>
            </div>
          </div>
        </div>

        {/* Colonne Informations et Formulaire */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            
            {/* Titre et badges rapides */}
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-[#d24de3] block mb-1">
                  Morbihan (56) • Famille d'Accueil
                </span>
                <h1 className="font-title text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
                  {cat.name}
                </h1>
              </div>

              <div className={`px-3 py-1.5 rounded-2xl text-xs font-black shadow-xs ${
                isFemale
                  ? 'bg-pink-100 text-pink-700 border border-pink-200'
                  : 'bg-blue-100 text-blue-700 border border-blue-200'
              }`}>
                {isFemale ? 'Femelle ♀' : 'Mâle ♂'} {cat.age ? `• ${cat.age}` : ''}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-6">
              <MapPin className="w-3.5 h-3.5 text-pink-500" />
              <span>Visible à {location}</span>
            </div>

            {/* Description */}
            <div className="glass-card rounded-2xl p-5 mb-5 bg-white border border-gray-100">
              <h3 className="font-title text-xs font-black uppercase tracking-wider text-gray-400 mb-2">
                Histoire & Personnalité
              </h3>
              <ClickableText
                as="p"
                text={cat.description || "Aucune description détaillée n'est renseignée."}
                className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line"
              />
            </div>

            {/* Foyer Idéal */}
            {cat.idealHome && (
              <div className="glass-card rounded-2xl p-5 mb-5 bg-pink-50/40 border border-pink-100">
                <h3 className="font-title text-xs font-black uppercase tracking-wider text-[#d24de3] mb-1.5">
                  Foyer Idéal
                </h3>
                <ClickableText
                  as="p"
                  text={cat.idealHome}
                  className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-line"
                />
              </div>
            )}

            {/* Suivi Vétérinaire */}
            <div className="glass-card rounded-2xl p-5 mb-5 bg-white border border-gray-100">
              <h3 className="font-title text-xs font-black uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Statut Sanitaire</span>
              </h3>
              <div className="grid grid-cols-2 gap-2.5 text-xs font-bold text-gray-700">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{vet.sterilized ? 'Stérilisé(e)' : 'À stériliser'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{vet.chipped ? 'Puce I-CAD' : 'Identifié(e)'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{vet.vaccinated ? 'Vacciné(e)' : 'Protocole vaccinal'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{vet.tested ? 'Testé FIV/FeLV négatif' : 'Déparasité(e)'}</span>
                </div>
              </div>
            </div>

            {/* Compatibilités */}
            <div className="glass-card rounded-2xl p-5 mb-6 bg-white border border-gray-100">
              <h3 className="font-title text-xs font-black uppercase tracking-wider text-gray-400 mb-3">
                Ententes & Compatibilités
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="block text-[11px] text-gray-500 mb-0.5">Chats</span>
                  <strong className="text-gray-900 font-bold">{comp.cats || 'Oui'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="block text-[11px] text-gray-500 mb-0.5">Chiens</span>
                  <strong className="text-gray-900 font-bold">{comp.dogs || 'Non testé'}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                  <span className="block text-[11px] text-gray-500 mb-0.5">Enfants</span>
                  <strong className="text-gray-900 font-bold">{comp.kids || 'Oui'}</strong>
                </div>
              </div>
            </div>

          </div>

          {/* Action : Postuler à l'adoption */}
          <div className="pt-2 space-y-2.5">
            {!isAdopted ? (
              <>
                <Link
                  to={`/formulaire-adoption?chat=${encodeURIComponent(cat.name)}&catId=${encodeURIComponent(cat.id)}`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-brand-gradient text-white text-xs sm:text-sm font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-pink-500/25 hover:shadow-xl hover:opacity-95 transition-all uppercase tracking-wider"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Remplir le questionnaire d'adoption</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <a
                  href={`mailto:asso.chatslheureux@gmail.com?subject=Demande%20d'adoption%20pour%20${encodeURIComponent(cat.name)}&body=Bonjour%20l'association%20Chat%20L'Heureux%2056,%0A%0AJe%20souhaite%20d%C3%A9poser%20une%20candidature%20d'adoption%20pour%20${encodeURIComponent(cat.name)}.%0A%0AMon%20nom%20:%0AMon%20t%C3%A9l%C3%A9phone%20:%0AMa%20commune%20:%0AType%20de%20logement%20(maison/appartement,%20acc%C3%A8s%20ext%C3%A9rieur)%20:%0AAutres%20animaux%20au%20foyer%20:%0A%0AMerci%20!`}
                  className="w-full inline-flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold py-2.5 px-4 rounded-xl border border-gray-200 hover:border-pink-300 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-pink-500" />
                  <span>Poser une question sur {cat.name} par e-mail</span>
                </a>
              </>
            ) : (
              <button
                disabled
                className="w-full py-3.5 rounded-2xl bg-gray-200 text-gray-500 font-bold text-sm cursor-not-allowed"
              >
                Ce chat est déjà adopté
              </button>
            )}

            <p className="text-[11px] text-center text-gray-500 pt-1 font-medium">
              Des questions ? Appelez-nous au <a href="tel:0661508828" className="text-pink-600 font-bold hover:underline">06 61 50 88 28</a>
            </p>
          </div>

        </div>

      </div>

      {/* Suggestion d'autres chats */}
      {similarCats.length > 0 && (
        <section className="pt-12 border-t border-gray-200">
          <h2 className="font-title text-xl sm:text-2xl font-black text-gray-900 mb-6">
            D'autres moustachus qui cherchent aussi un foyer
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarCats.map((simCat) => (
              <CatCard key={simCat.id} cat={simCat} />
            ))}
          </div>
        </section>
      )}

      {/* Lightbox / Zoom Modal Plein Écran */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between items-center p-3 sm:p-6 animate-in fade-in duration-200 select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Barre supérieure : Nom du chat + Compteur + Bouton Fermer */}
          <div 
            className="w-full max-w-5xl flex items-center justify-between z-20 py-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-white">
              <h3 className="font-title font-bold text-base sm:text-lg">
                {cat.name}
              </h3>
              {photos.length > 1 && (
                <p className="text-xs text-gray-400">
                  Photo {selectedPhotoIndex + 1} sur {photos.length}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all shadow-lg"
              aria-label="Fermer la vue agrandie"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Zone Centrale : Image et flèches de navigation */}
          <div 
            className="relative w-full flex-grow flex items-center justify-center overflow-hidden my-2"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            {photos.length > 1 && (
              <button
                type="button"
                onClick={prevPhoto}
                className="absolute left-2 sm:left-4 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10 shadow-xl"
                aria-label="Photo précédente"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}

            <img
              src={photos[selectedPhotoIndex] || photos[0]}
              alt={`${cat.name} - photo ${selectedPhotoIndex + 1}`}
              className="max-w-[95vw] max-h-[75vh] sm:max-h-[82vh] object-contain rounded-2xl shadow-2xl transition-all duration-200"
            />

            {photos.length > 1 && (
              <button
                type="button"
                onClick={nextPhoto}
                className="absolute right-2 sm:right-4 z-30 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-black/60 hover:bg-black/90 active:scale-95 text-white flex items-center justify-center transition-all border border-white/10 shadow-xl"
                aria-label="Photo suivante"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            )}
          </div>

          {/* Barre inférieure : Miniatures cliquables */}
          {photos.length > 1 && (
            <div 
              className="w-full max-w-xl flex justify-center items-center gap-2 overflow-x-auto py-2 z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {photos.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedPhotoIndex(idx)}
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 transition-all border-2 ${
                    selectedPhotoIndex === idx
                      ? 'border-[#d24de3] scale-105 shadow-md'
                      : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={p} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

    </main>
  );
}
