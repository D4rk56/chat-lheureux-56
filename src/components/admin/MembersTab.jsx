import React, { useState } from 'react';
import { 
  Users, 
  KeyRound, 
  ShieldCheck, 
  UserPlus, 
  Trash2, 
  Copy, 
  Check, 
  Mail, 
  Phone,
  Search,
  AtSign,
  Clock, 
  RefreshCw,
  Plus,
  X,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { 
  USER_ROLES, 
  ROLE_LABELS, 
  isSuperAdminEmail, 
  isAssoPresidentEmail 
} from '../../utils/roles';

export default function MembersTab({
  currentUserId,
  members = [],
  inviteCodes = [],
  loading = false,
  onRefresh,
  onUpdateRole,
  onDeleteMember,
  onSendPasswordReset,
  onCreateInviteCode,
  onDeleteInviteCode,
  onAddManualMember
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);

  // Modale Création de Code d'invitation
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [newRole, setNewRole] = useState(USER_ROLES.BENEVOLE);
  const [newNote, setNewNote] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);

  // Modale Ajout de Membre Existant / Manuel
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [manualFullName, setManualFullName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualPseudo, setManualPseudo] = useState('');
  const [manualRole, setManualRole] = useState(USER_ROLES.BENEVOLE);
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState('');

  const handleCopyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleCopyLink = (code, id) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/inscription?code=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const handleCopyPhone = (phone, id) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  const handleCreateCodeSubmit = async (e) => {
    e.preventDefault();
    setCreatingCode(true);
    try {
      await onCreateInviteCode({
        role: newRole,
        note: newNote.trim()
      });
      setCodeModalOpen(false);
      setNewNote('');
      setNewRole(USER_ROLES.BENEVOLE);
    } finally {
      setCreatingCode(false);
    }
  };

  const handleAddManualSubmit = async (e) => {
    e.preventDefault();
    setManualError('');

    if (!manualEmail.trim() || !manualEmail.includes('@')) {
      setManualError("Veuillez saisir une adresse e-mail valide.");
      return;
    }
    if (!manualFullName.trim()) {
      setManualError("Le vrai nom & prénom sont obligatoires.");
      return;
    }
    if (!manualPhone.trim()) {
      setManualError("Le numéro de téléphone est obligatoire.");
      return;
    }

    setManualSubmitting(true);
    try {
      if (onAddManualMember) {
        await onAddManualMember({
          email: manualEmail.trim(),
          fullName: manualFullName.trim(),
          phone: manualPhone.trim(),
          pseudo: manualPseudo.trim(),
          role: manualRole
        });
      }
      setManualModalOpen(false);
      setManualEmail('');
      setManualFullName('');
      setManualPhone('');
      setManualPseudo('');
      setManualRole(USER_ROLES.BENEVOLE);
    } catch (err) {
      setManualError(err.message || "Erreur lors de l'enregistrement du membre.");
    } finally {
      setManualSubmitting(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Inconnue';
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

  // Filtrage de l'annuaire des membres
  const filteredMembers = members.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const cleanPhone = (m.phone || '').replace(/\s+/g, '');
    const cleanQPhone = q.replace(/\s+/g, '');
    return (
      (m.fullName && m.fullName.toLowerCase().includes(q)) ||
      (m.displayName && m.displayName.toLowerCase().includes(q)) ||
      (m.pseudo && m.pseudo.toLowerCase().includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (cleanPhone && cleanPhone.includes(cleanQPhone))
    );
  });

  return (
    <div className="space-y-10">
      
      {/* ================= SECTION 1 : MEMBRES & CONTACTS ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-title text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              <span>Annuaire des Membres & Contacts ({members.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Coordonnées et droits d'accès de l'équipe (Administrateur, Gestion ou Bénévole).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onAddManualMember && (
              <button
                type="button"
                onClick={() => {
                  setManualError('');
                  setManualModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:text-white text-xs font-bold transition-all shadow-sm"
                title="Synchroniser un compte créé manuellement dans Firebase"
              >
                <UserPlus className="w-4 h-4 text-pink-400" />
                <span>Ajouter un membre existant</span>
              </button>
            )}

            <button
              type="button"
              onClick={onRefresh}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700"
              title="Rafraîchir les listes"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Barre de Recherche et Filtres */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, téléphone, e-mail ou pseudo..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="text-[11px] font-semibold text-slate-400 px-1 self-center">
            {filteredMembers.length} {filteredMembers.length > 1 ? 'membres affichés' : 'membre affiché'}
          </div>
        </div>

        {/* Tableau des Membres */}
        <div className="admin-glass-card rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Membre</th>
                  <th className="py-3.5 px-4">Coordonnées (Contact)</th>
                  <th className="py-3.5 px-4">Rôle attribué</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Inscription</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Dernière activité</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                      Aucun membre ne correspond à votre recherche.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => {
                    const isCurrent = m.uid === currentUserId;
                    const isSuperAdmin = isSuperAdminEmail(m.email);
                    const isPresident = isAssoPresidentEmail(m.email);
                    const isProtected = isSuperAdmin || isPresident;
                    const memberId = m.uid || m.id;

                    const effectiveFullName = m.fullName || m.displayName || 'Membre';
                    const hasPseudo = m.pseudo && m.pseudo.trim() && m.pseudo.toLowerCase() !== effectiveFullName.toLowerCase();

                    return (
                      <tr key={memberId} className="hover:bg-slate-800/30 transition-colors">
                        
                        {/* Colonne 1 : Identité & Badges */}
                        <td className="py-3.5 px-4 sm:px-6">
                          <div className="font-bold text-white flex flex-wrap items-center gap-1.5">
                            <span className="text-sm">{effectiveFullName}</span>
                            {hasPseudo && (
                              <span className="text-[11px] font-medium text-pink-400">
                                @{m.pseudo}
                              </span>
                            )}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            {isSuperAdmin && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1">
                                👑 Admin Principal
                              </span>
                            )}
                            {isPresident && (
                              <span className="text-[10px] bg-purple-500/25 text-purple-300 border border-purple-500/40 px-2 py-0.5 rounded-full font-black inline-flex items-center gap-1">
                                🏛️ Présidence / Association
                              </span>
                            )}
                            {isCurrent && (
                              <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold">
                                Vous
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Colonne 2 : Coordonnées (Téléphone & E-mail) */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            {/* Numéro de téléphone */}
                            <div className="flex items-center gap-1.5">
                              {m.phone ? (
                                <>
                                  <a
                                    href={`tel:${m.phone.replace(/\s+/g, '')}`}
                                    className="font-mono text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 transition-colors"
                                    title="Appeler ce numéro"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span>{m.phone}</span>
                                  </a>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyPhone(m.phone, memberId)}
                                    className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                                    title="Copier le numéro de téléphone"
                                  >
                                    {copiedPhoneId === memberId ? (
                                      <Check className="w-3 h-3 text-emerald-400" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-500 italic flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-600" />
                                  <span>Tél. non renseigné</span>
                                </span>
                              )}
                            </div>

                            {/* Adresse e-mail */}
                            <div>
                              <a
                                href={`mailto:${m.email}`}
                                className="font-mono text-[11px] text-slate-400 hover:text-pink-300 transition-colors flex items-center gap-1"
                                title="Envoyer un e-mail"
                              >
                                <Mail className="w-3 h-3 text-slate-500" />
                                <span>{m.email}</span>
                              </a>
                            </div>
                          </div>
                        </td>

                        {/* Colonne 3 : Rôle attribué */}
                        <td className="py-3.5 px-4">
                          <select
                            value={isProtected ? USER_ROLES.ADMIN : (m.role || USER_ROLES.BENEVOLE)}
                            onChange={(e) => onUpdateRole(m.uid, e.target.value)}
                            disabled={isProtected}
                            title={
                              isSuperAdmin
                                ? "L'administrateur principal conserve toujours les droits d'administration complets."
                                : isPresident
                                  ? "Le compte officiel de la présidence / association dispose des droits Administrateur permanents."
                                  : "Modifier le rôle"
                            }
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all ${
                              isSuperAdmin
                                ? 'bg-amber-900/30 border-amber-500/40 text-amber-300 cursor-not-allowed opacity-90'
                                : isPresident
                                  ? 'bg-purple-900/40 border-purple-500/50 text-purple-300 cursor-not-allowed opacity-90'
                                  : m.role === USER_ROLES.ADMIN
                                    ? 'bg-purple-900/30 border-purple-500/40 text-purple-300'
                                    : m.role === USER_ROLES.GESTION
                                      ? 'bg-blue-900/30 border-blue-500/40 text-blue-300'
                                      : 'bg-emerald-900/30 border-emerald-500/40 text-emerald-300'
                            }`}
                          >
                            <option value={USER_ROLES.ADMIN}>Administrateur (Tous droits)</option>
                            <option value={USER_ROLES.GESTION}>Gestion (Chats & Avis)</option>
                            <option value={USER_ROLES.BENEVOLE}>Bénévole (Adoptions)</option>
                          </select>
                        </td>

                        {/* Colonne 4 : Date Inscription */}
                        <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                          {formatDate(m.createdAt)}
                        </td>

                        {/* Colonne 5 : Dernière connexion */}
                        <td className="py-3.5 px-4 hidden lg:table-cell text-slate-400">
                          {m.lastLoginAt ? formatDate(m.lastLoginAt) : <span className="text-slate-500 italic">Jamais connecté</span>}
                        </td>

                        {/* Colonne 6 : Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onSendPasswordReset(m.email)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                              title="Envoyer un lien de réinitialisation de mot de passe"
                            >
                              <Mail className="w-3.5 h-3.5 text-pink-400" />
                            </button>

                            {!isCurrent && !isProtected && (
                              <button
                                type="button"
                                onClick={() => onDeleteMember(m.uid, effectiveFullName || m.email)}
                                className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors"
                                title="Retirer le membre de l'association"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ================= SECTION 2 : CODES D'INVITATION ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-title text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <span>Codes d'invitation Bénévoles (Accès sécurisé)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Codes aléatoires à usage unique permettant aux nouveaux bénévoles de créer leur compte sans inscription publique ouverte.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setCodeModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Générer un code d'invitation</span>
          </button>
        </div>

        {/* Tableau des codes */}
        <div className="admin-glass-card rounded-2xl border border-slate-800 overflow-hidden">
          {inviteCodes.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              Aucun code d'invitation en cours. Cliquez sur "Générer un code d'invitation" pour inviter un nouveau membre.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4 sm:px-6">Code Aléatoire</th>
                    <th className="py-3.5 px-4">Rôle</th>
                    <th className="py-3.5 px-4 hidden sm:table-cell">Note</th>
                    <th className="py-3.5 px-4">Statut</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {inviteCodes.map((c) => {
                    const isUsed = c.used;
                    return (
                      <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-mono font-bold text-white tracking-wider">
                          <span className="bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                            {c.code}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-200">
                          {ROLE_LABELS[c.role] || c.role}
                        </td>

                        <td className="py-3.5 px-4 hidden sm:table-cell text-slate-400 italic">
                          {c.note || '—'}
                        </td>

                        <td className="py-3.5 px-4">
                          {isUsed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700">
                              Utilisé le {formatDate(c.usedAt)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              Actif (En attente)
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isUsed && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(c.code, c.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1"
                                  title="Copier le code"
                                >
                                  {copiedCodeId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                                  <span className="hidden md:inline">Code</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleCopyLink(c.code, c.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-pink-600/20 hover:bg-pink-600 text-pink-300 hover:text-white border border-pink-500/30 text-xs font-bold transition-colors flex items-center gap-1"
                                  title="Copier le lien complet d'inscription"
                                >
                                  {copiedLinkId === c.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5" />}
                                  <span className="hidden md:inline">Lien d'invitation</span>
                                </button>
                              </>
                            )}

                            <button
                              type="button"
                              onClick={() => onDeleteInviteCode(c.id)}
                              className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500 text-rose-300 hover:text-white transition-colors"
                              title="Révoquer / Supprimer ce code"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ================= MODALE AJOUT MANUEL D'UN MEMBRE ================= */}
      {manualModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700/80 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setManualModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-gradient text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/20">
                <UserPlus className="w-6 h-6" />
              </div>
              <h3 className="font-title text-xl font-black text-white mb-1">
                Ajouter / Synchroniser un membre
              </h3>
              <p className="text-xs text-slate-400">
                Enregistrez les coordonnées d'un compte créé manuellement dans Firebase Authentication.
              </p>
            </div>

            {manualError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{manualError}</span>
              </div>
            )}

            <form onSubmit={handleAddManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Adresse E-mail du compte *</span>
                  <span className="text-[10px] text-pink-400 lowercase">Obligatoire</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    placeholder="ex: galexandre@galexandre.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Nom complet (Vrai nom & Prénom) *</span>
                  <span className="text-[10px] text-pink-400 lowercase">Obligatoire</span>
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={manualFullName}
                    onChange={(e) => setManualFullName(e.target.value)}
                    placeholder="Ex: Alexandre G."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Numéro de téléphone *</span>
                  <span className="text-[10px] text-pink-400 lowercase">Obligatoire</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="tel"
                    required
                    value={manualPhone}
                    onChange={(e) => setManualPhone(e.target.value)}
                    placeholder="06 12 34 56 78"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                  <span>Pseudo (Optionnel)</span>
                  <span className="text-[10px] text-slate-500 lowercase">Optionnel</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="text"
                    value={manualPseudo}
                    onChange={(e) => setManualPseudo(e.target.value)}
                    placeholder="Ex: Alexandre"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Rôle attribué *
                </label>
                <select
                  value={manualRole}
                  onChange={(e) => setManualRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-pink-500"
                >
                  <option value={USER_ROLES.BENEVOLE}>Bénévole (Adoptions)</option>
                  <option value={USER_ROLES.GESTION}>Gestion (Chats & Témoignages)</option>
                  <option value={USER_ROLES.ADMIN}>Administrateur (Tous droits)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setManualModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={manualSubmitting}
                  className="flex-1 py-3 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {manualSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Enregistrement...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Ajouter le membre</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODALE CRÉATION DE CODE D'INVITATION ================= */}
      {codeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-700/80 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => setCodeModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-brand-gradient text-white flex items-center justify-center mx-auto mb-3 shadow-lg shadow-pink-500/20">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-title text-xl font-black text-white mb-1">
                Générer un code d'invitation
              </h3>
              <p className="text-xs text-slate-400">
                Ce code aléatoire unique permettra au futur membre de créer son compte.
              </p>
            </div>

            <form onSubmit={handleCreateCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Rôle attribué à l'inscription *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-pink-500"
                >
                  <option value={USER_ROLES.BENEVOLE}>Bénévole (Gestion des adoptions)</option>
                  <option value={USER_ROLES.GESTION}>Gestionnaire (Chats & Témoignages)</option>
                  <option value={USER_ROLES.ADMIN}>Administrateur (Tous les droits)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bénéficiaire / Note interne (optionnel)
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Ex: Camille - permanence accueil du samedi"
                  className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setCodeModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={creatingCode}
                  className="flex-1 py-3 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                >
                  {creatingCode ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Génération...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Créer le code</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
