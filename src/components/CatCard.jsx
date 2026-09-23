import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, PawPrint, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from '../context/ToastContext';
import { getCatAdoptionInfo } from '../utils/age';

export default function CatCard({ cat }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();

  if (!cat) return null;

  const photo = (cat.photos && cat.photos.length > 0)
    ? cat.photos[0]
    : (cat.image || 'https://placehold.co/600x400?text=Photo+en+cours');

  const gender = cat.sex || cat.gender || 'Femelle';
  const isFemale = gender === 'Femelle';
  const age = cat.age || '';
  const name = cat.name || 'Chat';
  const desc = cat.description || '';
  const tags = cat.tags || [cat.status || 'À adopter'];
  const status = cat.status || 'Disponible';
  const location = cat.location || 'Morbihan (56)';
  const fav = isFavorite(cat.id);

  const adoptionInfo = getCatAdoptionInfo(cat);
  const isAdopted = status === 'Adopté';

  const handleFavoriteClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const adding = toggleFavorite(cat.id);
    if (adding) {
      showToast("Coup de cœur ajouté ❤️", `${name} a été ajouté à votre sélection.`, "heart");
    } else {
      showToast("Retiré des favoris", `${name} a été retiré de vos coups de cœur.`, "info");
    }
  };

  // Bordures et classes dynamiques
  let borderClass = 'border-gray-100';
  if (status === 'Urgence') borderClass = 'border-2 border-rose-200';
  if (status === 'Réservé') borderClass = 'border-2 border-amber-200';
  if (isAdopted) borderClass = 'border-gray-200 bg-gray-50/80';

  let adoptedLabel = "Adopté 🎉";
  if (isAdopted && adoptionInfo) {
    if (adoptionInfo.days === 0) adoptedLabel = "Adopté aujourd'hui 🎉";
    else if (adoptionInfo.days === 1) adoptedLabel = "Adopté hier 🎉";
    else adoptedLabel = `Adopté il y a ${adoptionInfo.days}j 🎉`;
  }

  return (
    <Link
      to={`/chat/${cat.id}`}
      className={`glass-card rounded-[2rem] p-4 hover-lift group cursor-pointer flex flex-col h-full transition-all ${borderClass} ${
        isAdopted ? 'opacity-85' : 'bg-white'
      }`}
    >
      {/* Conteneur Photo */}
      <div className="relative h-56 sm:h-64 rounded-3xl overflow-hidden mb-4 bg-gray-100">
        <img
          src={photo}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://placehold.co/600x400?text=Photo+en+cours';
          }}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${
            isAdopted ? 'grayscale filter blur-[0.3px]' : ''
          }`}
        />

        {/* Bouton Coup de cœur */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className={`absolute top-3 left-3 w-9 h-9 rounded-full backdrop-blur-md flex items-center justify-center transition-all z-20 text-sm ${
            fav
              ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/30'
              : 'bg-slate-900/60 text-white/90 hover:bg-pink-500 hover:text-white'
          }`}
        >
          <Heart className={`w-4 h-4 ${fav ? 'fill-white scale-110' : ''}`} />
        </button>

        {/* Badge Sexe / Âge */}
        <div
          className={`absolute top-3 right-3 backdrop-blur-md px-3 py-1 rounded-full text-xs font-black shadow-xs ${
            isFemale
              ? 'bg-pink-100/90 text-pink-700 border border-pink-200'
              : 'bg-blue-100/90 text-blue-700 border border-blue-200'
          }`}
        >
          {isFemale ? '♀' : '♂'} {age}
        </div>

        {/* Badge Statut (Bas gauche) */}
        {status === 'Urgence' && (
          <span className="absolute bottom-3 left-3 bg-rose-500 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg animate-pulse flex items-center gap-1.5 border border-white/20 z-10">
            <AlertCircle className="w-3.5 h-3.5" /> 🚨 Urgence
          </span>
        )}
        {status === 'Réservé' && (
          <span className="absolute bottom-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-white/20 z-10">
            <Clock className="w-3.5 h-3.5" /> Réservé
          </span>
        )}
        {isAdopted && (
          <span className="absolute bottom-3 left-3 bg-slate-950/90 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-white/20 z-10">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" /> {adoptedLabel}
          </span>
        )}
        {status === 'Disponible' && (
          <span className="absolute bottom-3 left-3 bg-emerald-500 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5 border border-white/20 z-10">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disponible
          </span>
        )}

        {/* Badge Localisation (Bas droite) */}
        <span className="absolute bottom-3 right-3 bg-slate-950/80 backdrop-blur-md text-white text-[10px] sm:text-[11px] font-extrabold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 border border-white/20 z-10">
          <MapPin className="w-3 h-3 text-pink-400" /> {location}
        </span>
      </div>

      {/* Contenu textuel */}
      <div className="px-1 flex-grow flex flex-col">
        <div className="flex justify-between items-center mb-1.5">
          <h3
            className={`font-title text-xl sm:text-2xl font-black ${
              isAdopted ? 'text-gray-500 line-through' : 'text-gray-900'
            }`}
          >
            {name}
          </h3>
          <div className="w-8 h-8 rounded-full bg-pink-50 text-[#d24de3] flex items-center justify-center text-xs group-hover:bg-[#d24de3] group-hover:text-white transition-colors shrink-0">
            <PawPrint className="w-4 h-4" />
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2.5">
          {tags.slice(0, 2).map((t, idx) => (
            <span
              key={idx}
              className="bg-purple-50 text-[#d24de3] text-[11px] px-2.5 py-0.5 rounded-lg font-bold"
            >
              {t}
            </span>
          ))}
        </div>

        {/* Description courte */}
        <p className="text-gray-600 text-xs sm:text-sm line-clamp-2 font-medium flex-grow mb-1">
          {desc || 'Découvrez la fiche complète de ce gentil protégé en cliquant ici.'}
        </p>
      </div>
    </Link>
  );
}
