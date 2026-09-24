import React, { useState } from 'react';
import { 
  Heart, 
  Search, 
  CheckCircle2, 
  Clock, 
  User, 
  Phone, 
  MapPin, 
  Eye, 
  AlertCircle, 
  RefreshCw 
} from 'lucide-react';
import { ADOPTION_STATUS } from '../../firebase/adoptionsService';

export default function AdoptionsTab({ 
  adoptions = [], 
  loading = false, 
  onRefresh, 
  onSelectAdoption 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  // Statistiques
  const stats = {
    total: adoptions.length,
    nouveau: adoptions.filter(a => (a.status || ADOPTION_STATUS.NOUVEAU) === ADOPTION_STATUS.NOUVEAU).length,
    enCours: adoptions.filter(a => a.status === ADOPTION_STATUS.EN_COURS).length,
    validee: adoptions.filter(a => a.status === ADOPTION_STATUS.VALIDEE).length,
    refusee: adoptions.filter(a => a.status === ADOPTION_STATUS.REFUSEE).length,
  };

  // Filtrage
  const filtered = adoptions.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      (item.catName || '').toLowerCase().includes(q) ||
      (item.fullName || '').toLowerCase().includes(q) ||
      (item.phone || '').includes(q) ||
      (item.email || '').toLowerCase().includes(q) ||
      (item.postalCodeCity || '').toLowerCase().includes(q);

    const itemStatus = item.status || ADOPTION_STATUS.NOUVEAU;
    const matchStatus = !statusFilter || itemStatus === statusFilter;

    return matchQuery && matchStatus;
  });

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return isoString;
    }
  };

  const statusBadges = {
    [ADOPTION_STATUS.NOUVEAU]: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    [ADOPTION_STATUS.EN_COURS]: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    [ADOPTION_STATUS.VALIDEE]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    [ADOPTION_STATUS.REFUSEE]: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
  };

  return (
    <div className="space-y-6">
      
      {/* Barre de Statistiques */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === ADOPTION_STATUS.NOUVEAU ? null : ADOPTION_STATUS.NOUVEAU)}
          className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
            statusFilter === ADOPTION_STATUS.NOUVEAU 
              ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-400">Nouvelles à traiter</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <span className="font-title text-2xl font-black text-amber-400">{stats.nouveau}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === ADOPTION_STATUS.EN_COURS ? null : ADOPTION_STATUS.EN_COURS)}
          className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
            statusFilter === ADOPTION_STATUS.EN_COURS 
              ? 'ring-2 ring-sky-500 bg-sky-500/10 border-sky-500' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-400">En cours d'instruction</span>
            <AlertCircle className="w-4 h-4 text-sky-400" />
          </div>
          <span className="font-title text-2xl font-black text-sky-400">{stats.enCours}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === ADOPTION_STATUS.VALIDEE ? null : ADOPTION_STATUS.VALIDEE)}
          className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
            statusFilter === ADOPTION_STATUS.VALIDEE 
              ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-400">Dossiers validés</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <span className="font-title text-2xl font-black text-emerald-400">{stats.validee}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === ADOPTION_STATUS.REFUSEE ? null : ADOPTION_STATUS.REFUSEE)}
          className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
            statusFilter === ADOPTION_STATUS.REFUSEE 
              ? 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-400">Refusées / Clôturées</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <span className="font-title text-2xl font-black text-rose-400">{stats.refusee}</span>
        </button>
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par chat, adoptant, téléphone, ville..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-2">
          {statusFilter && (
            <button
              type="button"
              onClick={() => setStatusFilter(null)}
              className="text-xs text-pink-400 hover:text-pink-300 font-bold underline px-2 py-1"
            >
              Effacer filtre ({statusFilter})
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
            title="Rafraîchir la liste"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Liste des Demandes */}
      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Chargement des demandes d'adoption...
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-glass-card rounded-3xl p-10 text-center border border-slate-800 text-slate-400">
          <Heart className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="font-bold text-sm text-slate-300">Aucune demande d'adoption trouvée</p>
          <p className="text-xs mt-1 text-slate-500">
            {searchQuery || statusFilter 
              ? "Modifiez vos filtres de recherche pour afficher des résultats." 
              : "Les futures candidatures envoyées depuis le site apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtered.map((item) => {
            const statusKey = item.status || ADOPTION_STATUS.NOUVEAU;
            const badgeClass = statusBadges[statusKey] || 'bg-slate-800 text-slate-300';

            return (
              <div
                key={item.id}
                className="admin-glass-card p-4 sm:p-5 rounded-2xl border border-slate-800/80 hover:border-pink-500/40 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-title text-base sm:text-lg font-black text-white group-hover:text-pink-300 transition-colors">
                      {item.catName}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                      {statusKey}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      • {formatDate(item.submittedAt)}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      {item.fullName}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      {item.phone}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {item.postalCodeCity}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">
                    Logement : {item.housingType} {item.hasGarden === 'Oui' ? '• Jardin' : ''} {item.hasBalcony === 'Oui' ? '• Balcon' : ''} • Animaux : {item.hasAnimals === 'Oui' ? item.animalDetails || 'Oui' : 'Aucun'}
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <button
                    type="button"
                    onClick={() => onSelectAdoption(item)}
                    className="px-4 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Consulter le dossier</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
