import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  RefreshCw, 
  Trash2, 
  User, 
  Heart, 
  PawPrint, 
  Users, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Info, 
  Calendar,
  Filter,
  PlusCircle,
  Edit3,
  Archive,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { 
  LOG_CATEGORIES, 
  MAX_LOG_RETENTION_DAYS,
  ACTION_NATURE,
  ACTION_NATURE_LABELS,
  getActionNature
} from '../../firebase/activityLogService';

export default function ActivityTab({ 
  logs = [], 
  loading = false, 
  error = null,
  onRefresh, 
  onPurgeExpired, 
  canPurge = false 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [natureFilter, setNatureFilter] = useState('ALL');
  const [memberFilter, setMemberFilter] = useState('ALL');
  const [purging, setPurging] = useState(false);
  const [purgeSuccess, setPurgeSuccess] = useState(null);
  const [dismissErrorBanner, setDismissErrorBanner] = useState(false);

  const handleManualPurge = async () => {
    if (!onPurgeExpired) return;
    setPurging(true);
    setPurgeSuccess(null);
    try {
      const res = await onPurgeExpired();
      if (res && typeof res.deletedCount === 'number') {
        setPurgeSuccess(res.deletedCount === 0 
          ? "Aucun log expiré (> 7 jours) à supprimer." 
          : `${res.deletedCount} log(s) expiré(s) (> 7 jours) supprimé(s).`);
        setTimeout(() => setPurgeSuccess(null), 4000);
      }
    } finally {
      setPurging(false);
    }
  };

  // Liste distincte des membres ayant des actions enregistrées dans les 7 jours
  const distinctMembers = useMemo(() => {
    const map = new Map();
    logs.forEach(log => {
      const id = log.userId || log.userEmail || log.userName;
      if (id && !map.has(id)) {
        map.set(id, {
          id,
          name: log.userName || log.userEmail || 'Utilisateur',
          email: log.userEmail,
          role: log.userRole
        });
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }, [logs]);

  // Filtrage combiné : Catégorie, Type d'action (Nature), Membre et Texte
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filtre catégorie
      if (categoryFilter !== 'ALL' && log.category !== categoryFilter) {
        return false;
      }

      // Filtre nature d'action (Création, Modif, Suppression, Purge)
      if (natureFilter !== 'ALL') {
        const nature = getActionNature(log.actionType);
        if (nature !== natureFilter) {
          return false;
        }
      }

      // Filtre par membre auteur
      if (memberFilter !== 'ALL') {
        const logMemberId = log.userId || log.userEmail || log.userName;
        if (logMemberId !== memberFilter) {
          return false;
        }
      }

      // Filtre recherche textuelle
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const desc = (log.description || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const actor = (log.userName || '').toLowerCase();
        const email = (log.userEmail || '').toLowerCase();
        const target = (log.targetName || '').toLowerCase();
        return desc.includes(q) || details.includes(q) || actor.includes(q) || email.includes(q) || target.includes(q);
      }

      return true;
    });
  }, [logs, categoryFilter, natureFilter, memberFilter, searchQuery]);

  const formatRelativeTime = (timestamp) => {
    if (!timestamp) return 'Récemment';
    const timeMs = typeof timestamp === 'number' ? timestamp : new Date(timestamp).getTime();
    if (isNaN(timeMs)) return 'Récemment';

    const diffMs = Date.now() - timeMs;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "À l'instant";
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return `Hier`;
    return `Il y a ${diffDays}j`;
  };

  const formatExactDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  const categoryIcons = {
    [LOG_CATEGORIES.CHATS]: <PawPrint className="w-4 h-4 text-pink-400" />,
    [LOG_CATEGORIES.ADOPTIONS]: <Heart className="w-4 h-4 text-emerald-400" />,
    [LOG_CATEGORIES.MEMBERS]: <Users className="w-4 h-4 text-sky-400" />,
    [LOG_CATEGORIES.STORIES]: <Sparkles className="w-4 h-4 text-amber-400" />,
    [LOG_CATEGORIES.SYSTEM]: <Info className="w-4 h-4 text-purple-400" />
  };

  const categoryLabels = {
    [LOG_CATEGORIES.CHATS]: 'Chats',
    [LOG_CATEGORIES.ADOPTIONS]: 'Adoptions',
    [LOG_CATEGORIES.MEMBERS]: 'Membres',
    [LOG_CATEGORIES.STORIES]: 'Avis',
    [LOG_CATEGORIES.SYSTEM]: 'Système'
  };

  const categoryBadges = {
    [LOG_CATEGORIES.CHATS]: 'bg-pink-500/10 text-pink-300 border-pink-500/30',
    [LOG_CATEGORIES.ADOPTIONS]: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    [LOG_CATEGORIES.MEMBERS]: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
    [LOG_CATEGORIES.STORIES]: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    [LOG_CATEGORIES.SYSTEM]: 'bg-purple-500/10 text-purple-300 border-purple-500/30'
  };

  // Configuration des badges par Nature d'action (Vert, Bleu, Rouge, Violet)
  const natureBadgeStyles = {
    [ACTION_NATURE.CREATE]: {
      label: 'Création',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400',
      border: 'border-emerald-500/40',
      icon: <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
    },
    [ACTION_NATURE.UPDATE]: {
      label: 'Modification',
      badge: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
      dot: 'bg-sky-400',
      border: 'border-sky-500/40',
      icon: <Edit3 className="w-3.5 h-3.5 text-sky-400" />
    },
    [ACTION_NATURE.DELETE]: {
      label: 'Suppression',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      dot: 'bg-rose-400',
      border: 'border-rose-500/40',
      icon: <Trash2 className="w-3.5 h-3.5 text-rose-400" />
    },
    [ACTION_NATURE.PURGE]: {
      label: 'Purge / Archive',
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400',
      border: 'border-purple-500/40',
      icon: <Archive className="w-3.5 h-3.5 text-purple-400" />
    },
    [ACTION_NATURE.OTHER]: {
      label: 'Action',
      badge: 'bg-slate-800 text-slate-300 border-slate-700',
      dot: 'bg-slate-400',
      border: 'border-slate-700',
      icon: <Info className="w-3.5 h-3.5 text-slate-400" />
    }
  };

  // Détection d'une erreur de permission Firestore
  const isPermissionDenied = error?.code === 'permission-denied' || 
    (typeof error?.message === 'string' && error.message.toLowerCase().includes('permission'));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Bannière de diagnostic si les règles Firestore ne sont pas déployées */}
      {error && !dismissErrorBanner && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-2 animate-in fade-in">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <ShieldAlert className="w-5 h-5 shrink-0 text-amber-400" />
              <span>Alerte d'accès aux règles Firestore de l'historique</span>
            </div>
            <button
              type="button"
              onClick={() => setDismissErrorBanner(true)}
              className="text-amber-400 hover:text-white text-xs font-bold px-2 py-0.5 rounded-lg hover:bg-amber-500/20 transition-colors"
            >
              Ignorer
            </button>
          </div>
          <p className="text-xs text-amber-200/90 leading-relaxed">
            {isPermissionDenied ? (
              <>
                L'accès à la collection <strong><code>activityLogs</code></strong> est refusé par vos règles de sécurité Firestore.
                <br />
                Veuillez vous assurer que la section <strong><code>match /activityLogs/&#123;logId&#125;</code></strong> présente dans le fichier <code className="bg-amber-950/60 px-1 py-0.5 rounded">firestore.rules</code> a bien été copiée et publiée dans votre <strong>Console Firebase &gt; Firestore Database &gt; Règles</strong>.
              </>
            ) : (
              <>
                Erreur de chargement de l'historique : {error?.message || 'Erreur de connexion Firestore'}.
              </>
            )}
          </p>
        </div>
      )}

      {/* En-tête de section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="font-title text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <History className="w-6 h-6 text-pink-500" />
              <span>Historique des Actions</span>
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
              {filteredLogs.length} action(s)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-pink-400" />
            <span>Conservation glissante sur <strong>{MAX_LOG_RETENTION_DAYS} jours</strong> — Les entrées antérieures sont effacées au fur et à mesure.</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {canPurge && onPurgeExpired && (
            <button
              type="button"
              disabled={purging}
              onClick={handleManualPurge}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
              title="Nettoyer manuellement les logs de plus de 7 jours"
            >
              <Trash2 className={`w-3.5 h-3.5 text-rose-400 ${purging ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Purger &gt; 7j</span>
            </button>
          )}

          <button
            type="button"
            onClick={onRefresh}
            className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            title="Actualiser l'historique"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-400' : ''}`} />
            <span className="hidden sm:inline">Actualiser</span>
          </button>
        </div>
      </div>

      {/* Message de confirmation purge */}
      {purgeSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{purgeSuccess}</span>
        </div>
      )}

      {/* Filtres & Recherche */}
      <div className="space-y-3">
        
        {/* Ligne 1 : Catégories & Barre de recherche */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Filtres par catégorie */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 custom-scrollbar">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                categoryFilter === 'ALL'
                  ? 'bg-brand-gradient text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Toutes les rubriques
            </button>

            {Object.entries(LOG_CATEGORIES).map(([key, cat]) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-brand-gradient text-white shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                {categoryIcons[cat]}
                <span>{categoryLabels[cat]}</span>
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative w-full md:w-80 shrink-0">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par action, chat, membre..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>

        {/* Ligne 2 : Filtres Type d'Action (Nature) et Sélection Membre */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/60">
          
          {/* Boutons Type d'action (Création, Modification, Suppression, Purge) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3 text-pink-400" />
              <span>Type :</span>
            </span>

            <button
              type="button"
              onClick={() => setNatureFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                natureFilter === 'ALL'
                  ? 'bg-slate-200 text-slate-900 shadow-sm'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Tous
            </button>

            <button
              type="button"
              onClick={() => setNatureFilter(ACTION_NATURE.CREATE)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                natureFilter === ACTION_NATURE.CREATE
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'bg-slate-900 text-emerald-400 hover:bg-emerald-950/40 border border-emerald-900/40'
              }`}
            >
              <PlusCircle className="w-3 h-3" />
              <span>Créations</span>
            </button>

            <button
              type="button"
              onClick={() => setNatureFilter(ACTION_NATURE.UPDATE)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                natureFilter === ACTION_NATURE.UPDATE
                  ? 'bg-sky-500 text-white shadow-sm'
                  : 'bg-slate-900 text-sky-400 hover:bg-sky-950/40 border border-sky-900/40'
              }`}
            >
              <Edit3 className="w-3 h-3" />
              <span>Modifications</span>
            </button>

            <button
              type="button"
              onClick={() => setNatureFilter(ACTION_NATURE.DELETE)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                natureFilter === ACTION_NATURE.DELETE
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-slate-900 text-rose-400 hover:bg-rose-950/40 border border-rose-900/40'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Suppressions</span>
            </button>

            <button
              type="button"
              onClick={() => setNatureFilter(ACTION_NATURE.PURGE)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                natureFilter === ACTION_NATURE.PURGE
                  ? 'bg-purple-500 text-white shadow-sm'
                  : 'bg-slate-900 text-purple-400 hover:bg-purple-950/40 border border-purple-900/40'
              }`}
            >
              <Archive className="w-3 h-3" />
              <span>Purges & Archives</span>
            </button>
          </div>

          {/* Sélecteur Membre */}
          {distinctMembers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3 h-3 text-pink-400" />
                <span>Auteur :</span>
              </span>
              <div className="relative">
                <select
                  value={memberFilter}
                  onChange={(e) => setMemberFilter(e.target.value)}
                  className="pl-3 pr-7 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white appearance-none focus:outline-none focus:border-pink-500 cursor-pointer"
                >
                  <option value="ALL">Tous les membres ({distinctMembers.length})</option>
                  {distinctMembers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.role ? `(${m.role})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Liste chronologique des actions */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          Chargement du journal d'activité...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="admin-glass-card rounded-3xl p-10 text-center border border-slate-800 text-slate-400">
          <History className="w-10 h-10 mx-auto mb-3 text-slate-600" />
          <p className="font-bold text-sm text-slate-300">Aucune action trouvée</p>
          <p className="text-xs mt-1 text-slate-500">
            {searchQuery || categoryFilter !== 'ALL' || natureFilter !== 'ALL' || memberFilter !== 'ALL'
              ? "Aucune action ne correspond à vos filtres actuels."
              : "Les prochaines modifications sur les chats, adoptions et membres apparaîtront ici."}
          </p>
          {(categoryFilter !== 'ALL' || natureFilter !== 'ALL' || memberFilter !== 'ALL' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setCategoryFilter('ALL');
                setNatureFilter('ALL');
                setMemberFilter('ALL');
                setSearchQuery('');
              }}
              className="mt-4 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l border-slate-800 ml-4 sm:ml-6 pl-4 sm:pl-6 space-y-4">
          {filteredLogs.map((log) => {
            const nature = getActionNature(log.actionType);
            const natureMeta = natureBadgeStyles[nature] || natureBadgeStyles[ACTION_NATURE.OTHER];
            const catBadge = categoryBadges[log.category] || 'bg-slate-800 text-slate-300 border-slate-700';
            const catIcon = categoryIcons[log.category] || <Info className="w-3.5 h-3.5 text-slate-400" />;
            const relativeTime = formatRelativeTime(log.timestamp || log.createdAt);
            const exactDate = formatExactDate(log.timestamp || log.createdAt);

            return (
              <div 
                key={log.id} 
                className="relative admin-glass-card p-4 sm:p-5 rounded-2xl border border-slate-800/80 hover:border-pink-500/30 transition-all group"
              >
                {/* Pastille sur la ligne de temps aux couleurs de la nature de l'action */}
                <div className={`absolute -left-[27px] sm:-left-[35px] top-5 w-4 h-4 rounded-full bg-slate-900 border-2 ${natureMeta.border} flex items-center justify-center`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${natureMeta.dot}`}></div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      
                      {/* Badge Rubrique */}
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${catBadge}`}>
                        {catIcon}
                        <span>{categoryLabels[log.category] || 'Autre'}</span>
                      </span>

                      {/* Badge Nature d'action (Création, Modification, Suppression, Purge) */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${natureMeta.badge}`}>
                        {natureMeta.icon}
                        <span>{natureMeta.label}</span>
                      </span>

                      {/* Cible concernée */}
                      {log.targetName && (
                        <span className="font-title font-bold text-white text-sm group-hover:text-pink-300 transition-colors">
                          {log.targetName}
                        </span>
                      )}

                      {/* Heure et date */}
                      <span className="text-[11px] text-slate-400 font-mono" title={exactDate}>
                        • {relativeTime} ({exactDate})
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 font-medium leading-relaxed">
                      {log.description}
                    </p>

                    {log.details && (
                      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-300 font-mono">
                        {log.details}
                      </div>
                    )}
                  </div>

                  {/* Auteur de l'action */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                        {(log.userName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-bold text-slate-200 text-xs">{log.userName}</span>
                    </div>
                    {log.userRole && (
                      <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800">
                        {log.userRole}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
