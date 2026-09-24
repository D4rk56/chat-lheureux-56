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
  RefreshCw,
  Archive,
  Trash2,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';
import { 
  ADOPTION_STATUS, 
  ADOPTION_ARCHIVE_DAYS, 
  ADOPTION_PURGE_DAYS, 
  getAdoptionLifecycleInfo 
} from '../../firebase/adoptionsService';

export default function AdoptionsTab({ 
  adoptions = [], 
  loading = false, 
  onRefresh, 
  onSelectAdoption,
  onArchiveAdoption,
  onArchiveAllOld,
  onPurgeExpired,
  canDelete = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [confirmPurgeOpen, setConfirmPurgeOpen] = useState(false);
  const [purging, setPurging] = useState(false);
  const [archiving, setArchiving] = useState(false);

  // Statistiques
  const stats = {
    total: adoptions.length,
    nouveau: adoptions.filter(a => (a.status || ADOPTION_STATUS.NOUVEAU) === ADOPTION_STATUS.NOUVEAU).length,
    enCours: adoptions.filter(a => a.status === ADOPTION_STATUS.EN_COURS).length,
    validee: adoptions.filter(a => a.status === ADOPTION_STATUS.VALIDEE).length,
    refusee: adoptions.filter(a => a.status === ADOPTION_STATUS.REFUSEE).length,
    archivee: adoptions.filter(a => a.status === ADOPTION_STATUS.ARCHIVEE).length,
  };

  // Demandes éligibles à l'archivage (> 30j) et à la suppression (> 60j)
  const archivableRequests = adoptions.filter(a => {
    const info = getAdoptionLifecycleInfo(a);
    return info.isArchivable;
  });

  const purgableRequests = adoptions.filter(a => {
    const info = getAdoptionLifecycleInfo(a);
    return info.isPurgable;
  });

  // Filtrage
  const filtered = adoptions.filter((item) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || 
      (item.catName || '').toLowerCase().includes(q) ||
      (item.catId || '').toLowerCase().includes(q) ||
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
    [ADOPTION_STATUS.REFUSEE]: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    [ADOPTION_STATUS.ARCHIVEE]: 'bg-slate-700/40 text-slate-300 border-slate-600'
  };

  const handleArchiveAllClick = async () => {
    if (!onArchiveAllOld) return;
    setArchiving(true);
    try {
      await onArchiveAllOld();
    } finally {
      setArchiving(false);
    }
  };

  const handlePurgeConfirm = async () => {
    if (!onPurgeExpired) return;
    setPurging(true);
    try {
      await onPurgeExpired();
      setConfirmPurgeOpen(false);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Barre de Statistiques / Filtres Rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
            <span className="text-xs font-bold text-slate-400">Nouvelles</span>
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
            <span className="text-xs font-bold text-slate-400">En cours</span>
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
            <span className="text-xs font-bold text-slate-400">Validées</span>
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
            <span className="text-xs font-bold text-slate-400">Refusées</span>
            <Heart className="w-4 h-4 text-rose-400" />
          </div>
          <span className="font-title text-2xl font-black text-rose-400">{stats.refusee}</span>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === ADOPTION_STATUS.ARCHIVEE ? null : ADOPTION_STATUS.ARCHIVEE)}
          className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
            statusFilter === ADOPTION_STATUS.ARCHIVEE 
              ? 'ring-2 ring-slate-400 bg-slate-800/80 border-slate-500' 
              : 'border-slate-800 hover:border-slate-700'
          }`}
          title="Demandes archivées au bout de 30 jours"
        >
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-slate-400">Archivées (&gt;30j)</span>
            <Archive className="w-4 h-4 text-slate-400" />
          </div>
          <span className="font-title text-2xl font-black text-slate-300">{stats.archivee}</span>
        </button>
      </div>

      {/* Bannières d'action pour le cycle de vie : Archivage 30j & Purge 60j */}
      <div className="space-y-3">
        {/* Alerte Archivage automatique (> 30 jours) */}
        {archivableRequests.length > 0 && onArchiveAllOld && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-300">
              <Archive className="w-4 h-4 shrink-0" />
              <span>
                <strong>{archivableRequests.length} demande(s)</strong> ont plus de 30 jours et peuvent être basculées dans les archives.
              </span>
            </div>
            <button
              type="button"
              disabled={archiving}
              onClick={handleArchiveAllClick}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold transition-all shrink-0 self-start sm:self-auto flex items-center gap-1.5"
            >
              {archiving ? (
                <span>Archivage en cours...</span>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  <span>Archiver les demandes &gt; 30j</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Alerte Purge définitive (> 60 jours) */}
        {purgableRequests.length > 0 && canDelete && onPurgeExpired && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>{purgableRequests.length} demande(s)</strong> ont plus de 60 jours et sont arrivées à expiration pour suppression complète.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setConfirmPurgeOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold transition-all shrink-0 self-start sm:self-auto flex items-center gap-1.5 shadow-sm"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purger l'historique (&gt; 60j)</span>
            </button>
          </div>
        )}
      </div>

      {/* Barre de Recherche et Filtres */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom de chat, adoptant, téléphone, ville ou ID..."
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
              : "Les candidatures envoyées depuis le site apparaîtront ici."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filtered.map((item) => {
            const statusKey = item.status || ADOPTION_STATUS.NOUVEAU;
            const badgeClass = statusBadges[statusKey] || 'bg-slate-800 text-slate-300';
            const lifeInfo = getAdoptionLifecycleInfo(item);

            return (
              <div
                key={item.id}
                className={`admin-glass-card p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 group ${
                  statusKey === ADOPTION_STATUS.ARCHIVEE
                    ? 'border-slate-800/60 opacity-80 bg-slate-950/30'
                    : 'border-slate-800/80 hover:border-pink-500/40'
                }`}
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-title text-base sm:text-lg font-black text-white group-hover:text-pink-300 transition-colors">
                      {item.catName}
                    </span>
                    {item.catId && (
                      <span className="text-[10px] font-mono bg-slate-900 text-slate-400 px-2 py-0.5 rounded-lg border border-slate-800">
                        ID: #{item.catId.slice(-6)}
                      </span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${badgeClass}`}>
                      {statusKey}
                    </span>
                    
                    <span className="text-[11px] text-slate-400" title={item.submittedAt}>
                      • Reçue le {formatDate(item.submittedAt)} ({lifeInfo.days === 0 ? "Aujourd'hui" : `il y a ${lifeInfo.days}j`})
                    </span>

                    {/* Badge alertes 30j / 60j */}
                    {lifeInfo.isPurgable ? (
                      <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                        ⚠️ &gt; 60j (Purger)
                      </span>
                    ) : lifeInfo.isArchivable ? (
                      <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        📦 &gt; 30j
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-pink-400" />
                      {item.fullName}
                    </span>
                    <a 
                      href={`tel:${(item.phone || '').replace(/\s+/g, '')}`}
                      className="flex items-center gap-1 text-emerald-400 font-mono hover:underline"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      {item.phone}
                    </a>
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500" />
                      {item.postalCodeCity}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 truncate">
                    Logement : {item.housingType} {item.hasGarden === 'Oui' ? '• Jardin' : ''} {item.hasBalcony === 'Oui' ? '• Balcon' : ''} • Animaux : {item.hasAnimals === 'Oui' ? item.animalDetails || 'Oui' : 'Aucun'}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800">
                  {/* Bouton Archiver / Désarchiver rapide */}
                  {onArchiveAdoption && statusKey !== ADOPTION_STATUS.ARCHIVEE && (
                    <button
                      type="button"
                      onClick={() => onArchiveAdoption(item.id)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all"
                      title="Archiver cette demande (garder trace sans encombrer la vue active)"
                    >
                      <Archive className="w-3.5 h-3.5 text-amber-400" />
                    </button>
                  )}

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

      {/* Modale de Confirmation Purge Définitive (> 60 jours) */}
      {confirmPurgeOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-500/40 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setConfirmPurgeOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-title text-xl font-black text-white mb-1">
                Supprimer les demandes expirées ?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Cette action supprimera définitivement les <strong>{purgableRequests.length} demande(s)</strong> de plus de 60 jours pour respecter le cycle de vie et la confidentialité des données adoptants.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmPurgeOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handlePurgeConfirm}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
              >
                {purging ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Purge en cours...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Confirmer la purge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
