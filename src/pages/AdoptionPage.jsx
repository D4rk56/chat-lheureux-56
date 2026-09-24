import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, Heart, Sparkles, Filter, RotateCcw } from 'lucide-react';
import CatCard from '../components/CatCard';
import { fetchCats, getCachedCats } from '../firebase/catsService';
import { useFavorites } from '../context/FavoritesContext';

export default function AdoptionPage() {
  const [cats, setCats] = useState(() => getCachedCats(true));
  const [loading, setLoading] = useState(cats.length === 0);
  const [searchParams, setSearchParams] = useSearchParams();

  // Filtres
  const currentFilter = searchParams.get('filter') || 'all';
  const searchQuery = searchParams.get('q') || '';
  const compatCats = searchParams.get('compatCats') === 'true';
  const compatDogs = searchParams.get('compatDogs') === 'true';
  const compatKids = searchParams.get('compatKids') === 'true';

  const { favorites, favoritesCount } = useFavorites();

  useEffect(() => {
    let isMounted = true;
    fetchCats(true)
      .then((freshCats) => {
        if (isMounted) {
          setCats(freshCats);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn("Erreur chargement catalogue :", err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  const updateParam = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value === null || value === '' || value === false) {
        next.delete(key);
      } else {
        next.set(key, String(value));
      }
      return next;
    });
  };

  const handleSearchChange = (e) => {
    updateParam('q', e.target.value);
  };

  const clearSearch = () => {
    updateParam('q', '');
  };

  const resetAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const filterButtons = [
    { id: 'all', label: 'Tous' },
    { id: 'Disponible', label: 'Disponibles' },
    { id: 'Urgence', label: '🚨 Urgences' },
    { 
      id: 'favorites', 
      label: `❤️ Coups de cœur ${favoritesCount > 0 ? `(${favoritesCount})` : ''}` 
    },
    { id: 'Femelle', label: 'Femelles' },
    { id: 'Mâle', label: 'Mâles' },
    { id: 'Réservé', label: 'Réservés' },
    { id: 'Adopté', label: 'Déjà adoptés' }
  ];

  // Filtrage des chats
  const filteredCats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return cats.filter((cat) => {
      const name = (cat.name || '').toLowerCase();
      const location = (cat.location || '').toLowerCase();
      const desc = (cat.description || '').toLowerCase();
      const matchQuery = !q || name.includes(q) || location.includes(q) || desc.includes(q);

      const gender = cat.sex || cat.gender;
      const status = cat.status || 'Disponible';

      let matchFilter = true;
      if (currentFilter === 'all') {
        matchFilter = true;
      } else if (currentFilter === 'favorites') {
        matchFilter = favorites.includes(cat.id);
      } else if (currentFilter === 'Femelle' || currentFilter === 'Mâle') {
        matchFilter = (gender === currentFilter);
      } else if (currentFilter === 'Urgence' || currentFilter === 'Adopté' || currentFilter === 'Réservé') {
        matchFilter = (status === currentFilter);
      } else if (currentFilter === 'Disponible') {
        matchFilter = (status === 'Disponible' || (!status && status !== 'Urgence' && status !== 'Réservé' && status !== 'Adopté'));
      }

      // Compatibilités
      const comp = cat.compatibilities || {};
      let matchCompat = true;
      if (compatCats && (comp.cats || '').toLowerCase() !== 'oui') matchCompat = false;
      if (compatDogs && (comp.dogs || '').toLowerCase() !== 'oui') matchCompat = false;
      if (compatKids && (comp.kids || '').toLowerCase() !== 'oui') matchCompat = false;

      return matchQuery && matchFilter && matchCompat;
    });
  }, [cats, searchQuery, currentFilter, compatCats, compatDogs, compatKids, favorites]);

  const hasActiveFilters = currentFilter !== 'all' || searchQuery.trim().length > 0 || compatCats || compatDogs || compatKids;

  return (
    <main className="flex-grow pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      
      {/* En-tête */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-50 border border-pink-200/80 text-[#d24de3] text-xs font-black uppercase tracking-wider mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Familles d'Accueil • Morbihan (56)</span>
        </div>
        <h1 className="font-title text-3xl sm:text-5xl font-black text-gray-900 tracking-tight mb-3">
          Nos chats à l'adoption
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 font-medium">
          Trouvez votre futur compagnon de vie parmi nos petits protégés. Utilisez les filtres pour affiner votre recherche selon votre foyer.
        </p>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 mb-8 border border-gray-200/80 bg-white/90 shadow-sm">
        
        {/* Champ de recherche */}
        <div className="relative mb-5">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Rechercher par prénom, ville, mot-clé..."
            className="w-full pl-11 pr-10 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d24de3]/40 focus:border-[#d24de3]"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              aria-label="Effacer la recherche"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Boutons Filtres par statut/sexe/favoris */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {filterButtons.map((btn) => {
            const isSelected = currentFilter === btn.id;
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => updateParam('filter', btn.id === 'all' ? null : btn.id)}
                className={`text-xs font-bold px-3.5 py-2 rounded-xl transition-all ${
                  isSelected
                    ? 'bg-brand-gradient text-white shadow-md shadow-pink-500/20'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>

        {/* Filtres de compatibilité */}
        <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-gray-500 flex items-center gap-1.5 mr-1">
              <Filter className="w-3.5 h-3.5 text-pink-500" />
              <span>Compatibilités :</span>
            </span>

            {[
              { key: 'compatCats', label: '🐱 Entente Chats', state: compatCats },
              { key: 'compatDogs', label: '🐶 Entente Chiens', state: compatDogs },
              { key: 'compatKids', label: '👶 Enfants bienvenus', state: compatKids }
            ].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => updateParam(c.key, !c.state)}
                className={`px-3 py-1.5 rounded-lg font-bold border transition-colors ${
                  c.state
                    ? 'bg-pink-50 text-[#d24de3] border-pink-300'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Bouton Réinitialiser */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose-500 hover:text-rose-600 flex items-center gap-1.5 ml-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>

      </div>

      {/* Compteur de résultats & Bandeau d'information Coups de cœur */}
      {currentFilter === 'favorites' && (
        <div className="mb-6 p-4 rounded-2xl bg-pink-50/90 border border-pink-200 flex items-start sm:items-center gap-3.5 text-xs sm:text-sm text-pink-950 shadow-xs animate-in fade-in">
          <div className="w-9 h-9 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center shrink-0 shadow-xs">
            <Heart className="w-4 h-4 fill-pink-500 text-pink-500" />
          </div>
          <div className="flex-1 leading-relaxed">
            <strong className="block font-black text-pink-900">
              Vos coups de cœur mémorisés ({favoritesCount})
            </strong>
            <span className="text-pink-800/90 font-medium text-xs">
              💡 <strong>Rappel :</strong> vos coups de cœur sont enregistrés localement sur cet appareil (votre navigateur). Si vous changez de téléphone, de tablette ou d'ordinateur, vos favoris ne seront pas synchronisés.
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 px-1">
        <span className="text-xs font-bold text-gray-500">
          {filteredCats.length} moustachu{filteredCats.length > 1 ? 's' : ''} trouvé{filteredCats.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Grille des chats */}
      {loading && cats.length === 0 ? (
        <div className="py-24 text-center text-gray-400 font-bold text-sm">
          <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Recherche de nos adorables moustachus...
        </div>
      ) : filteredCats.length === 0 ? (
        <div className="glass-card rounded-3xl p-12 sm:p-16 text-center max-w-lg mx-auto border border-dashed border-gray-300 bg-white/80">
          {currentFilter === 'favorites' ? (
            <>
              <div className="w-14 h-14 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                <Heart className="w-7 h-7 fill-pink-500" />
              </div>
              <h3 className="font-title text-lg font-bold text-gray-900 mb-1">
                Aucun coup de cœur pour l'instant
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
                Cliquez sur le petit cœur présent sur la photo de n'importe quel chat pour l'enregistrer dans votre sélection.
                <span className="block text-[11px] text-gray-400 mt-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                  📱 <strong>Bon à savoir :</strong> les coups de cœur sont stockés uniquement sur cet appareil et ne sont pas transférés entre différents téléphones ou ordinateurs.
                </span>
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="bg-brand-gradient text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-md"
              >
                Voir tous les chats
              </button>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="font-title text-lg font-bold text-gray-900 mb-1">
                Aucun chat ne correspond à ces critères
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
                Essayez d'élargir votre recherche ou de réinitialiser les filtres de compatibilité.
              </p>
              <button
                type="button"
                onClick={resetAllFilters}
                className="bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-slate-800"
              >
                Réinitialiser les filtres
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCats.map((cat) => (
            <CatCard key={cat.id} cat={cat} />
          ))}
        </div>
      )}

    </main>
  );
}
