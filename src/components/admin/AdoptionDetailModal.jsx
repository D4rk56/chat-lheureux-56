import React, { useState, useEffect } from 'react';
import { 
  X, 
  Heart, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Home, 
  PawPrint, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  Trash2, 
  Copy, 
  Check 
} from 'lucide-react';
import { ADOPTION_STATUS } from '../../firebase/adoptionsService';

export default function AdoptionDetailModal({ 
  isOpen, 
  onClose, 
  adoption, 
  onUpdateStatus, 
  onDelete, 
  canDelete = false 
}) {
  const [currentStatus, setCurrentStatus] = useState(ADOPTION_STATUS.NOUVEAU);
  const [internalNotes, setInternalNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  useEffect(() => {
    if (adoption) {
      setCurrentStatus(adoption.status || ADOPTION_STATUS.NOUVEAU);
      setInternalNotes(adoption.internalNotes || '');
    }
  }, [adoption]);

  if (!isOpen || !adoption) return null;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdateStatus(adoption.id, {
        status: currentStatus,
        internalNotes: internalNotes.trim()
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'Date inconnue';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const statusColors = {
    [ADOPTION_STATUS.NOUVEAU]: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    [ADOPTION_STATUS.EN_COURS]: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    [ADOPTION_STATUS.VALIDEE]: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    [ADOPTION_STATUS.REFUSEE]: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    [ADOPTION_STATUS.ARCHIVEE]: 'bg-slate-700/40 text-slate-300 border-slate-600'
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2.5 sm:p-6 overflow-y-auto">
      <div className="admin-glass-panel rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-3xl w-full border border-slate-700/80 shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Modale */}
        <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${statusColors[adoption.status] || 'bg-slate-800 text-slate-300'}`}>
                {adoption.status || 'Nouveau'}
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400">
                Reçue le {formatDate(adoption.submittedAt)}
              </span>
            </div>
            <h2 className="font-title text-lg sm:text-2xl font-black text-white flex items-center gap-2">
              <Heart className="w-5 h-5 text-pink-400 fill-pink-400/20 shrink-0" />
              <span className="truncate">Demande pour : {adoption.catName}</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps Défilable */}
        <div className="overflow-y-auto py-4 sm:py-5 space-y-5 flex-grow pr-1 custom-scrollbar">
          
          {/* Section 1 : Candidat & Coordonnées */}
          <div className="admin-glass-card p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-pink-400 mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>Candidat & Coordonnées</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Nom & Prénom</span>
                <span className="text-white font-bold text-sm">{adoption.fullName}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Profession</span>
                <span className="text-slate-200">{adoption.profession || 'Non renseignée'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Téléphone</span>
                <div className="flex items-center gap-2">
                  <a 
                    href={`tel:${adoption.phone}`} 
                    className="text-pink-400 hover:underline font-bold text-sm"
                  >
                    {adoption.phone}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(adoption.phone, 'phone')}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copier le téléphone"
                  >
                    {copiedField === 'phone' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Adresse E-mail</span>
                <div className="flex items-center gap-2">
                  <a 
                    href={`mailto:${adoption.email}`} 
                    className="text-pink-400 hover:underline font-bold text-sm truncate"
                  >
                    {adoption.email}
                  </a>
                  <button
                    type="button"
                    onClick={() => handleCopy(adoption.email, 'email')}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copier l'email"
                  >
                    {copiedField === 'email' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2">
                <span className="text-slate-400 block mb-0.5 font-semibold">Adresse postale & Commune</span>
                <span className="text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                  <span>{adoption.address}, {adoption.postalCodeCity}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Section 2 : Foyer & Logement */}
          <div className="admin-glass-card p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-pink-400 mb-3 flex items-center gap-2">
              <Home className="w-4 h-4" />
              <span>Foyer & Logement</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Composition du foyer</span>
                <span className="text-slate-200">
                  {adoption.adultsCount} adulte(s) • {adoption.childrenCount || 0} enfant(s)
                </span>
              </div>

              {parseInt(adoption.childrenCount, 10) > 0 && (
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Détails enfants</span>
                  <span className="text-slate-200">
                    Âges : {adoption.childrenAges || 'Non précisé'} • Contacts animaux : {adoption.childrenAnimalContact || 'Non'}
                  </span>
                </div>
              )}

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Type de logement</span>
                <span className="text-slate-200">
                  {adoption.housingType === 'Autre' && adoption.housingTypeOther ? `Autre (${adoption.housingTypeOther})` : adoption.housingType} {adoption.floor ? `(${adoption.floor}e étage)` : ''}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Pièce isolée avec fenêtre</span>
                <span className="text-slate-200">{adoption.hasIsolatedRoom || 'Non renseigné'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Balcon</span>
                <span className="text-slate-200">
                  {adoption.hasBalcony === 'Oui' 
                    ? `Oui (Sécurisé : ${adoption.isBalconySecured || 'Non précisé'})` 
                    : 'Non'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Jardin</span>
                <span className="text-slate-200">
                  {adoption.hasGarden === 'Oui' 
                    ? `Oui (${adoption.gardenSurface || 'Superficie non précisée'})` 
                    : 'Non'}
                </span>
              </div>
            </div>
          </div>

          {/* Section 3 : Animaux Actuels */}
          <div className="admin-glass-card p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-pink-400 mb-3 flex items-center gap-2">
              <PawPrint className="w-4 h-4" />
              <span>Animaux au Foyer</span>
            </h3>
            {adoption.hasAnimals === 'Oui' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Animaux présents</span>
                  <span className="text-white font-semibold">{adoption.animalDetails || 'Oui (détails non fournis)'}</span>
                </div>

                {adoption.dogDetails && (
                  <div>
                    <span className="text-slate-400 block mb-0.5 font-semibold">Chiens (Race / Âge)</span>
                    <span className="text-slate-200">{adoption.dogDetails}</span>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Statut vétérinaire</span>
                  <span className="text-slate-200">
                    {Array.isArray(adoption.animalStatus) && adoption.animalStatus.length > 0
                      ? adoption.animalStatus.join(', ')
                      : 'Non spécifié'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5 font-semibold">Sociables avec congénères</span>
                  <span className="text-slate-200">{adoption.isSociable || 'Non renseigné'}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Aucun autre animal actuellement présent dans le foyer.
              </p>
            )}
          </div>

          {/* Section 4 : Mode de Vie & Accueil */}
          <div className="admin-glass-card p-5 rounded-2xl border border-slate-800">
            <h3 className="text-xs font-black uppercase tracking-wider text-pink-400 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Conditions d'Accueil & Rythme</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Accès à toutes les pièces</span>
                <span className="text-slate-200">{adoption.fullAccess || 'Oui'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Où dormira-t-il ?</span>
                <span className="text-slate-200">{adoption.sleepingPlace || 'Non précisé'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Heures d'absence quotidiennes</span>
                <span className="text-slate-200">{adoption.hoursAbsent || 'Non précisé'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Emplacement durant absence</span>
                <span className="text-slate-200">{adoption.absenceLocation || 'Non précisé'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Retour le midi ?</span>
                <span className="text-slate-200">{adoption.lunchReturn || 'Non'}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5 font-semibold">Restera seul ?</span>
                <span className="text-slate-200">{adoption.staysAlone || 'Non'}</span>
              </div>
            </div>
          </div>

          {/* Section 5 : Remarques du candidat */}
          {adoption.comments && (
            <div className="admin-glass-card p-5 rounded-2xl border border-slate-800">
              <h3 className="text-xs font-black uppercase tracking-wider text-pink-400 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>Remarques de l'adoptant</span>
              </h3>
              <p className="text-xs text-slate-200 whitespace-pre-line leading-relaxed">
                {adoption.comments}
              </p>
            </div>
          )}

          {/* Section 6 : Suivi interne de l'équipe (Bénévoles / Admin) */}
          <div className="p-5 rounded-2xl bg-pink-950/20 border border-pink-500/30 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-pink-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-pink-400" />
              <span>Suivi & Traitement de la Demande</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Statut de la demande
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => setCurrentStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-pink-500"
                >
                  <option value={ADOPTION_STATUS.NOUVEAU} style={{ backgroundColor: '#0b0f19', color: '#ffffff' }}>Nouveau (À traiter)</option>
                  <option value={ADOPTION_STATUS.EN_COURS} style={{ backgroundColor: '#0b0f19', color: '#ffffff' }}>En cours d'instruction</option>
                  <option value={ADOPTION_STATUS.VALIDEE} style={{ backgroundColor: '#0b0f19', color: '#ffffff' }}>Validée (Visite/Adoption)</option>
                  <option value={ADOPTION_STATUS.REFUSEE} style={{ backgroundColor: '#0b0f19', color: '#ffffff' }}>Refusée / Abandonnée</option>
                  <option value={ADOPTION_STATUS.ARCHIVEE} style={{ backgroundColor: '#0b0f19', color: '#ffffff' }}>Archivée (&gt; 30 jours)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Dernière mise à jour
                </label>
                <div className="px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
                  {formatDate(adoption.updatedAt || adoption.submittedAt)}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Notes internes de suivi (appels, retours FA, rendez-vous)
              </label>
              <textarea
                rows="3"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Ex: 26/09 : Appel avec Mme Dupont. Très bon contact, famille sérieuse. Transmission de la fiche à la FA pour prise de RDV."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-pink-500 leading-relaxed"
              ></textarea>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div>
            {canDelete && (
              <button
                type="button"
                onClick={() => onDelete(adoption.id, `la demande pour ${adoption.catName} (${adoption.fullName})`)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Supprimer la demande</span>
              </button>
            )}
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors text-center"
            >
              Fermer
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Enregistrer</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
