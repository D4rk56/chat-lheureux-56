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
  Clock, 
  RefreshCw,
  Plus,
  X,
  Sparkles
} from 'lucide-react';
import { USER_ROLES, ROLE_LABELS, isSuperAdminEmail } from '../../utils/roles';

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
  onDeleteInviteCode
}) {
  const [copiedCodeId, setCopiedCodeId] = useState(null);
  const [copiedLinkId, setCopiedLinkId] = useState(null);

  // Modale Création de Code
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [newRole, setNewRole] = useState(USER_ROLES.BENEVOLE);
  const [newNote, setNewNote] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);

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

  return (
    <div className="space-y-10">
      
      {/* ================= SECTION 1 : MEMBRES & RÔLES ================= */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="font-title text-lg sm:text-xl font-black text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-pink-400" />
              <span>Membres & Rôles de l'association ({members.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Gérez les niveaux d'accès de votre équipe : Administrateur, Gestion ou Bénévole.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700 self-start sm:self-auto"
            title="Rafraîchir les listes"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-pink-400' : ''}`} />
          </button>
        </div>

        {/* Tableau des Membres */}
        <div className="admin-glass-card rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 sm:px-6">Membre</th>
                  <th className="py-3.5 px-4">Rôle attribué</th>
                  <th className="py-3.5 px-4 hidden md:table-cell">Inscription</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Dernière activité</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => {
                  const isCurrent = m.uid === currentUserId;
                  const isSuperAdmin = isSuperAdminEmail(m.email);
                  return (
                    <tr key={m.uid || m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-bold text-white flex flex-wrap items-center gap-2">
                          <span>{m.displayName || 'Bénévole'}</span>
                          {isSuperAdmin && (
                            <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                              👑 Admin Principal
                            </span>
                          )}
                          {isCurrent && !isSuperAdmin && (
                            <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-2 py-0.5 rounded-full font-bold">
                              Vous
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">{m.email}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={isSuperAdmin ? USER_ROLES.ADMIN : (m.role || USER_ROLES.BENEVOLE)}
                          onChange={(e) => onUpdateRole(m.uid, e.target.value)}
                          disabled={isSuperAdmin}
                          title={isSuperAdmin ? "L'administrateur principal conserve toujours les droits d'administration complets." : "Modifier le rôle"}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none transition-all ${
                            isSuperAdmin
                              ? 'bg-amber-900/30 border-amber-500/40 text-amber-300 cursor-not-allowed opacity-90'
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

                      <td className="py-3.5 px-4 hidden md:table-cell text-slate-400">
                        {formatDate(m.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 hidden lg:table-cell text-slate-400">
                        {formatDate(m.lastLoginAt)}
                      </td>

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

                          {!isCurrent && !isSuperAdmin && (
                            <button
                              type="button"
                              onClick={() => onDeleteMember(m.uid, m.displayName || m.email)}
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
                })}
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

      {/* ================= MODALE CRÉATION DE CODE ================= */}
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
