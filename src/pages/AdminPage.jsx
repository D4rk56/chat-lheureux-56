import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  LogOut, 
  Download, 
  ExternalLink, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Heart, 
  MapPin, 
  Image as ImageIcon, 
  Calendar, 
  User, 
  Star,
  Eye,
  RefreshCw,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getAuthErrorMessage } from '../firebase/authService';
import { 
  fetchCats, 
  saveCat, 
  deleteCat, 
  acquireCatLock, 
  releaseCatLock, 
  subscribeCat, 
  isCatLockedByOther,
  purgeExpiredAdoptedCats 
} from '../firebase/catsService';
import { fetchStories, saveStory, deleteStory } from '../firebase/storiesService';
import { calculateAgeFromBirthDate, getCatAdoptionInfo, ADOPTED_EXPIRATION_DAYS } from '../utils/age.js';
import { compressImageFile } from '../utils/imageCompressor.js';

export default function AdminPage() {
  const { user, loading: authLoading, login, logout, sendPasswordReset } = useAuth();
  const { showToast } = useToast();

  // États de connexion
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Données
  const [cats, setCats] = useState([]);
  const [stories, setStories] = useState([]);
  const [loadingData, setLoadingData] = useState(false);

  // Onglet courant : 'cats' ou 'stories'
  const [currentTab, setCurrentTab] = useState('cats');

  // Filtres admin
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);

  // Modale Chat (Ajout / Édition)
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [activeEditingCatId, setActiveEditingCatId] = useState(null);
  const [initialUpdatedAt, setInitialUpdatedAt] = useState(null);
  const [catFormData, setCatFormData] = useState(getDefaultCatForm());
  const [catPhotos, setCatPhotos] = useState([]);
  const [catPhotoUrlInput, setCatPhotoUrlInput] = useState('');
  const [savingCat, setSavingCat] = useState(false);

  // Conflit d'édition
  const [lockConflictModalOpen, setLockConflictModalOpen] = useState(false);
  const [conflictingLockInfo, setConflictingLockInfo] = useState(null);
  const [concurrentAlert, setConcurrentAlert] = useState(null);

  // Modale Avis (Ajout / Édition)
  const [storyModalOpen, setStoryModalOpen] = useState(false);
  const [activeEditingStoryId, setActiveEditingStoryId] = useState(null);
  const [storyFormData, setStoryFormData] = useState(getDefaultStoryForm());
  const [storyPhotos, setStoryPhotos] = useState([]);
  const [storyPhotoUrlInput, setStoryPhotoUrlInput] = useState('');
  const [savingStory, setSavingStory] = useState(false);

  // Modale Suppression
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { id, type: 'cat'|'story', label }

  // Modale Purge
  const [purgeModalOpen, setPurgeModalOpen] = useState(false);
  const [purging, setPurging] = useState(false);

  // Heartbeat & Snapshot listeners
  const lockHeartbeatRef = useRef(null);
  const snapshotUnsubRef = useRef(null);

  function getDefaultCatForm() {
    return {
      name: '',
      status: 'Disponible',
      adoptedAt: '',
      sex: 'Femelle',
      ageMode: 'birthDate', // 'birthDate' ou 'freeText'
      birthDate: '',
      freeAge: '',
      location: 'Colpo (56)',
      description: '',
      idealHome: '',
      tags: '',
      compatCats: 'Oui',
      compatDogs: 'Non testé',
      compatKids: 'Oui',
      vetSterilized: true,
      vetChipped: true,
      vetVaccinated: true,
      vetTested: false
    };
  }

  function getDefaultStoryForm() {
    return {
      catName: '',
      adoptant: '',
      location: 'Morbihan (56)',
      content: '',
      tag: 'Heureux au foyer'
    };
  }

  // Chargement des données au login
  useEffect(() => {
    if (user) {
      loadAllData();
    } else {
      setCats([]);
      setStories([]);
    }
  }, [user]);

  // Nettoyage lors de la fermeture ou du démontage
  useEffect(() => {
    return () => {
      if (lockHeartbeatRef.current) clearInterval(lockHeartbeatRef.current);
      if (snapshotUnsubRef.current) snapshotUnsubRef.current();
      if (activeEditingCatId && !isReadOnlyMode && user) {
        releaseCatLock(activeEditingCatId);
      }
    };
  }, [activeEditingCatId, isReadOnlyMode, user]);

  const loadAllData = async () => {
    setLoadingData(true);
    try {
      const [allCats, allStories] = await Promise.all([
        fetchCats(false),
        fetchStories()
      ]);
      setCats(allCats);
      setStories(allStories);
    } catch (err) {
      console.error("Erreur chargement données admin :", err);
      showToast("Erreur", "Impossible de charger les données.", "error");
    } finally {
      setLoadingData(false);
    }
  };

  // Authentification
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoginSubmitting(true);
    try {
      await login(loginEmail, loginPassword);
      showToast("Connexion réussie", "Bienvenue dans l'espace administration.");
    } catch (err) {
      console.error("Erreur connexion :", err);
      setLoginError(getAuthErrorMessage(err.code));
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      showToast("Déconnexion", "À bientôt !", "info");
    } catch (err) {
      console.error(err);
    }
  };

  const handlePasswordReset = async () => {
    if (!loginEmail) {
      setLoginError("Veuillez saisir votre adresse e-mail ci-dessus avant de demander la réinitialisation.");
      return;
    }
    try {
      await sendPasswordReset(loginEmail);
      showToast("E-mail envoyé", "Vérifiez votre boîte de réception pour réinitialiser votre mot de passe.", "info");
    } catch (err) {
      setLoginError(getAuthErrorMessage(err.code));
    }
  };

  // Export Sauvegarde JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        association: "Chat L'Heureux 56",
        exportDate: new Date().toISOString(),
        exportedBy: user?.email,
        totalCats: cats.length,
        totalStories: stories.length,
        chats: cats,
        testimonials: stories
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `sauvegarde-chats-lheureux-56-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast("Sauvegarde téléchargée", "Le fichier JSON complet a été généré avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de générer la sauvegarde.", "error");
    }
  };

  // Statistiques
  const stats = {
    total: cats.length,
    dispo: cats.filter((c) => (c.status || 'Disponible') === 'Disponible').length,
    urgence: cats.filter((c) => c.status === 'Urgence').length,
    reserve: cats.filter((c) => c.status === 'Réservé').length,
    adopte: cats.filter((c) => c.status === 'Adopté').length,
    expiredAdopted: cats.filter((c) => getCatAdoptionInfo(c).isExpired).length
  };

  // Purge des chats expirés (+60j)
  const handleConfirmPurge = async () => {
    setPurging(true);
    try {
      const count = await purgeExpiredAdoptedCats(cats);
      showToast("Purge réussie", `${count} fiche(s) de chats adoptés depuis +60j ont été supprimées.`);
      setPurgeModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Une erreur est survenue lors de la purge.", "error");
    } finally {
      setPurging(false);
    }
  };

  // --- Gestion Modale Chat ---
  const openNewCatModal = () => {
    cleanupLock();
    setActiveEditingCatId(null);
    setInitialUpdatedAt(null);
    setIsReadOnlyMode(false);
    setConcurrentAlert(null);
    setCatFormData(getDefaultCatForm());
    setCatPhotos([]);
    setCatPhotoUrlInput('');
    setCatModalOpen(true);
  };

  const openEditCatModal = async (catItem, force = false, readOnly = false) => {
    // Vérification du verrou concurrent
    if (!readOnly && !force && isCatLockedByOther(catItem, user?.email)) {
      setConflictingLockInfo(catItem);
      setLockConflictModalOpen(true);
      return;
    }

    cleanupLock();

    setActiveEditingCatId(catItem.id);
    setInitialUpdatedAt(catItem.updatedAt || null);
    setIsReadOnlyMode(readOnly);
    setConcurrentAlert(null);

    // Initialisation formulaire
    const isBirth = !!catItem.birthDate;
    setCatFormData({
      name: catItem.name || '',
      status: catItem.status || 'Disponible',
      adoptedAt: catItem.adoptedAt ? catItem.adoptedAt.slice(0, 10) : '',
      sex: catItem.sex || catItem.gender || 'Femelle',
      ageMode: isBirth ? 'birthDate' : 'freeText',
      birthDate: catItem.birthDate || '',
      freeAge: catItem.age || '',
      location: catItem.location || 'Colpo (56)',
      description: catItem.description || '',
      idealHome: catItem.idealHome || '',
      tags: Array.isArray(catItem.tags) ? catItem.tags.join(', ') : '',
      compatCats: catItem.compatibilities?.cats || 'Oui',
      compatDogs: catItem.compatibilities?.dogs || 'Non testé',
      compatKids: catItem.compatibilities?.kids || 'Oui',
      vetSterilized: !!catItem.vetStatus?.sterilized,
      vetChipped: !!catItem.vetStatus?.chipped,
      vetVaccinated: !!catItem.vetStatus?.vaccinated,
      vetTested: !!catItem.vetStatus?.tested
    });

    setCatPhotos(catItem.photos ? [...catItem.photos] : (catItem.image ? [catItem.image] : []));
    setCatPhotoUrlInput('');

    // Acquérir le verrou
    if (!readOnly && user) {
      await acquireCatLock(catItem.id, user.email);
      lockHeartbeatRef.current = setInterval(() => {
        acquireCatLock(catItem.id, user.email);
      }, 60000);
    }

    // Écoute temps réel des changements distants
    snapshotUnsubRef.current = subscribeCat(catItem.id, (freshCat) => {
      if (!freshCat) return;
      const myEmail = (user?.email || '').trim().toLowerCase();
      const updater = (freshCat.updatedBy || '').trim().toLowerCase();
      if (updater && updater === myEmail) return;

      if (freshCat.updatedAt && initialUpdatedAt && freshCat.updatedAt !== initialUpdatedAt) {
        setConcurrentAlert({
          updater: freshCat.updatedBy || 'Un autre utilisateur',
          time: new Date(freshCat.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    setCatModalOpen(true);
  };

  const cleanupLock = () => {
    if (lockHeartbeatRef.current) {
      clearInterval(lockHeartbeatRef.current);
      lockHeartbeatRef.current = null;
    }
    if (snapshotUnsubRef.current) {
      snapshotUnsubRef.current();
      snapshotUnsubRef.current = null;
    }
    if (activeEditingCatId && !isReadOnlyMode && user) {
      releaseCatLock(activeEditingCatId);
    }
  };

  const closeCatModal = () => {
    cleanupLock();
    setActiveEditingCatId(null);
    setInitialUpdatedAt(null);
    setIsReadOnlyMode(false);
    setConcurrentAlert(null);
    setCatModalOpen(false);
  };

  // Gestion des photos dans le formulaire chat
  const handlePhotoFilesUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = 5 - catPhotos.length;
    if (remainingSlots <= 0) {
      showToast("Limite atteinte", "Vous ne pouvez pas ajouter plus de 5 photos par chat.", "info");
      e.target.value = '';
      return;
    }

    const filesToProcess = files.slice(0, remainingSlots);
    for (const file of filesToProcess) {
      try {
        const compressed = await compressImageFile(file, 800, 0.65);
        setCatPhotos((prev) => (prev.length < 5 ? [...prev, compressed] : prev));
      } catch (err) {
        console.error(err);
        showToast("Erreur image", "Impossible de compresser cette image.", "error");
      }
    }
    e.target.value = '';
  };

  const handleAddPhotoUrl = () => {
    if (!catPhotoUrlInput.trim()) return;
    const urls = catPhotoUrlInput.split(/[\n,]+/).map((u) => u.trim()).filter((u) => u.length > 5);
    setCatPhotos((prev) => {
      const merged = [...prev];
      urls.forEach((u) => {
        if (merged.length < 5 && !merged.includes(u)) merged.push(u);
      });
      return merged;
    });
    setCatPhotoUrlInput('');
  };

  const removePhoto = (idx) => {
    setCatPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const setPrimaryPhoto = (idx) => {
    setCatPhotos((prev) => {
      const arr = [...prev];
      const item = arr.splice(idx, 1)[0];
      return [item, ...arr];
    });
  };

  const movePhoto = (idx, dir) => {
    setCatPhotos((prev) => {
      const arr = [...prev];
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= arr.length) return arr;
      const tmp = arr[idx];
      arr[idx] = arr[newIdx];
      arr[newIdx] = tmp;
      return arr;
    });
  };

  // Enregistrement Chat
  const handleSaveCat = async (e) => {
    e.preventDefault();
    if (isReadOnlyMode) {
      showToast("Lecture seule", "L'enregistrement est désactivé en mode consultation.", "error");
      return;
    }

    setSavingCat(true);

    // Calcul de l'âge
    let computedAge = catFormData.freeAge.trim();
    if (catFormData.ageMode === 'birthDate' && catFormData.birthDate) {
      computedAge = calculateAgeFromBirthDate(catFormData.birthDate);
    }

    // Gestion date d'adoption
    let adoptedAtVal = null;
    if (catFormData.status === 'Adopté') {
      adoptedAtVal = catFormData.adoptedAt 
        ? new Date(catFormData.adoptedAt).toISOString() 
        : new Date().toISOString();
    }

    const parsedTags = catFormData.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      name: catFormData.name.trim(),
      status: catFormData.status,
      adoptedAt: adoptedAtVal,
      sex: catFormData.sex,
      gender: catFormData.sex,
      ageMode: catFormData.ageMode,
      birthDate: catFormData.ageMode === 'birthDate' ? catFormData.birthDate : null,
      age: computedAge,
      location: catFormData.location.trim() || 'Colpo (56)',
      description: catFormData.description.trim(),
      idealHome: catFormData.idealHome.trim(),
      tags: parsedTags.length > 0 ? parsedTags : [catFormData.status || 'À adopter'],
      compatibilities: {
        cats: catFormData.compatCats,
        dogs: catFormData.compatDogs,
        kids: catFormData.compatKids
      },
      vetStatus: {
        sterilized: catFormData.vetSterilized,
        chipped: catFormData.vetChipped,
        vaccinated: catFormData.vetVaccinated,
        tested: catFormData.vetTested
      },
      photos: catPhotos,
      image: catPhotos[0] || 'https://placehold.co/600x400?text=Pas+de+photo'
    };

    try {
      await saveCat(payload, activeEditingCatId, user?.email || 'Admin');
      showToast(
        activeEditingCatId ? "Fiche mise à jour" : "Chat ajouté", 
        `${payload.name} a été enregistré avec succès.`
      );
      closeCatModal();
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible d'enregistrer la fiche.", "error");
    } finally {
      setSavingCat(false);
    }
  };

  // --- Gestion Modale Avis ---
  const openNewStoryModal = () => {
    setActiveEditingStoryId(null);
    setStoryFormData(getDefaultStoryForm());
    setStoryPhotos([]);
    setStoryPhotoUrlInput('');
    setStoryModalOpen(true);
  };

  const openEditStoryModal = (story) => {
    setActiveEditingStoryId(story.id);
    setStoryFormData({
      catName: story.catName || '',
      adoptant: story.adoptant || '',
      location: story.location || 'Morbihan (56)',
      content: story.content || '',
      tag: story.tag || 'Heureux au foyer'
    });
    setStoryPhotos(story.photos ? [...story.photos] : []);
    setStoryPhotoUrlInput('');
    setStoryModalOpen(true);
  };

  const handleStoryPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImageFile(file, 800, 0.65);
      setStoryPhotos([compressed]);
      showToast("Photo ajoutée", "La photo a été compressée avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur image", "Impossible de compresser cette image.", "error");
    }
    e.target.value = '';
  };

  const handleSaveStory = async (e) => {
    e.preventDefault();
    setSavingStory(true);
    try {
      const payload = {
        catName: storyFormData.catName.trim(),
        adoptant: storyFormData.adoptant.trim(),
        location: storyFormData.location.trim(),
        content: storyFormData.content.trim(),
        tag: storyFormData.tag.trim() || 'Heureux au foyer',
        photos: storyPhotos
      };
      await saveStory(payload, activeEditingStoryId);
      showToast(
        activeEditingStoryId ? "Avis mis à jour" : "Avis ajouté", 
        "Témoignage enregistré avec succès."
      );
      setStoryModalOpen(false);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible d'enregistrer le témoignage.", "error");
    } finally {
      setSavingStory(false);
    }
  };

  // --- Suppression ---
  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      if (pendingDelete.type === 'cat') {
        await deleteCat(pendingDelete.id);
      } else {
        await deleteStory(pendingDelete.id);
      }
      showToast("Supprimé", "L'élément a été retiré de la base de données.");
      setDeleteModalOpen(false);
      setPendingDelete(null);
      loadAllData();
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de supprimer cet élément.", "error");
    }
  };

  // Filtrage admin des chats
  const filteredCats = cats.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchQuery = !q || (c.name || '').toLowerCase().includes(q) || (c.location || '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || (c.status || 'Disponible') === statusFilter;
    return matchQuery && matchStatus;
  });

  // Si utilisateur non connecté : formulaire de connexion
  if (authLoading) {
    return (
      <main className="flex-grow pt-28 pb-20 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Vérification de session...
      </main>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center items-center p-4">
        <div className="admin-glass-panel w-full max-w-md p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-pink-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="font-title text-2xl font-black text-white mb-1">Espace Gestion</h1>
            <p className="text-xs font-semibold text-slate-400">
              Accès réservé au bureau de l'association Chat L'Heureux 56
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Adresse E-mail
              </label>
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="admin@chatlheureux56.fr"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Mot de passe
                </label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  className="text-[11px] font-bold text-pink-400 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3.5 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {loginSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Se connecter</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800 text-center">
            <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
              &larr; Retourner sur le site public
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Utilisateur connecté : Tableau de bord administration complet
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Admin */}
      <header className="admin-glass-panel sticky top-0 z-40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-title font-black text-lg sm:text-2xl text-brand-gradient">
              Chat L'Heureux 56
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-pink-500/15 text-pink-400 border border-pink-500/30 px-2.5 py-0.5 rounded-full">
              Console Admin
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={handleExportBackup}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-slate-700"
              title="Télécharger une sauvegarde complète en JSON"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Sauvegarde JSON</span>
            </button>

            <Link
              to="/"
              target="_blank"
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5 text-pink-400" />
              <span className="hidden md:inline">Voir le site</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Barre de stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Disponible' ? null : 'Disponible')}
            className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Disponible' 
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-400">Disponibles</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="font-title text-2xl font-black text-white">{stats.dispo}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Urgence' ? null : 'Urgence')}
            className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Urgence' 
                ? 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-400">Urgences</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <span className="font-title text-2xl font-black text-rose-400">{stats.urgence}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Réservé' ? null : 'Réservé')}
            className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Réservé' 
                ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-400">Réservés</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <span className="font-title text-2xl font-black text-amber-400">{stats.reserve}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Adopté' ? null : 'Adopté')}
            className={`admin-glass-card p-4 rounded-2xl border text-left transition-all ${
              statusFilter === 'Adopté' 
                ? 'ring-2 ring-pink-500 bg-pink-500/10 border-pink-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-slate-400">Adoptés</span>
              <Heart className="w-4 h-4 text-pink-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-title text-2xl font-black text-pink-400">{stats.adopte}</span>
              {stats.expiredAdopted > 0 && (
                <span className="text-[10px] font-bold text-rose-400">
                  ({stats.expiredAdopted} expirés)
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Alerte Purge si chats expirés (+60j) */}
        {stats.expiredAdopted > 0 && (
          <div className="mb-8 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <strong className="block text-xs sm:text-sm font-bold text-white">
                  {stats.expiredAdopted} chat(s) adopté(s) depuis plus de 60 jours
                </strong>
                <span className="text-[11px] text-slate-400">
                  Ces fiches sont masquées du public. Vous pouvez les purger pour libérer de l'espace dans Firestore.
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPurgeModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shrink-0 shadow-md"
            >
              Purger les fiches expirées
            </button>
          </div>
        )}

        {/* Onglets : Chats vs Témoignages */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentTab('cats')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentTab === 'cats'
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Chats ({cats.length})
            </button>
            <button
              type="button"
              onClick={() => setCurrentTab('stories')}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentTab === 'stories'
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              Avis & Témoignages ({stories.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentTab === 'cats' ? (
              <button
                type="button"
                onClick={openNewCatModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un chat</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={openNewStoryModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un avis</span>
              </button>
            )}
          </div>
        </div>

        {/* Vue Onglet 1 : Chats */}
        {currentTab === 'cats' && (
          <div>
            {/* Barre de recherche admin */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un chat par nom ou ville..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                />
              </div>
              {statusFilter && (
                <button
                  type="button"
                  onClick={() => setStatusFilter(null)}
                  className="text-xs font-bold text-pink-400 hover:text-pink-300 self-center px-2"
                >
                  Effacer filtre ({statusFilter})
                </button>
              )}
            </div>

            {loadingData && cats.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Chargement des fiches...
              </div>
            ) : filteredCats.length === 0 ? (
              <div className="admin-glass-card rounded-2xl p-12 text-center text-slate-400 text-xs sm:text-sm">
                Aucun chat ne correspond à ces critères.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCats.map((cat) => {
                  const photo = cat.photos?.[0] || cat.image || 'https://placehold.co/600x400?text=Photo';
                  const isLocked = isCatLockedByOther(cat, user?.email);
                  const isAdopted = cat.status === 'Adopté';
                  const adoptionInfo = getCatAdoptionInfo(cat);

                  return (
                    <div
                      key={cat.id}
                      className={`admin-glass-card rounded-2xl p-4 flex flex-col justify-between border ${
                        isAdopted && adoptionInfo.isExpired
                          ? 'border-rose-500/40 bg-rose-950/20'
                          : isLocked
                          ? 'border-amber-500/50 bg-amber-950/10'
                          : 'border-slate-800'
                      }`}
                    >
                      <div>
                        {/* Image & Badges */}
                        <div className="relative h-48 rounded-xl overflow-hidden mb-3 bg-slate-900">
                          <img 
                            src={photo} 
                            alt={cat.name} 
                            className={`w-full h-full object-cover ${isAdopted ? 'grayscale filter' : ''}`} 
                          />
                          <span className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                            cat.status === 'Urgence'
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/30 animate-pulse'
                              : cat.status === 'Réservé'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                              : isAdopted
                              ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          }`}>
                            {cat.status || 'Disponible'}
                          </span>
                          <span className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-300 border border-slate-800">
                            {cat.sex === 'Femelle' ? '♀' : '♂'} {cat.age || ''}
                          </span>
                        </div>

                        <h3 className="font-title text-xl font-black text-white mb-0.5">
                          {cat.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-semibold mb-2">
                          <MapPin className="w-3 h-3 text-pink-400 inline mr-1" />
                          {cat.location || 'Morbihan (56)'}
                        </p>

                        {/* Alerte Verrou en cours */}
                        {isLocked && (
                          <div className="mb-2.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center justify-between">
                            <span>Édition en cours par :</span>
                            <span className="truncate max-w-[140px] text-amber-200">
                              {cat.editingLock?.email}
                            </span>
                          </div>
                        )}

                        {/* Statut d'adoption */}
                        {isAdopted && (
                          <div className={`mb-3 p-2 rounded-xl text-[11px] font-bold flex items-center justify-between ${
                            adoptionInfo.isExpired
                              ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                              : 'bg-pink-500/10 border border-pink-500/30 text-pink-300'
                          }`}>
                            <span>Adopté le {adoptionInfo.dateStr || 'N/A'}</span>
                            <span className="font-extrabold">
                              {adoptionInfo.isExpired
                                ? `Expiré (+${adoptionInfo.days}j)`
                                : `${60 - adoptionInfo.days}j restants`}
                            </span>
                          </div>
                        )}

                        <p className="text-slate-300 text-xs line-clamp-2 mb-3">
                          {cat.description || 'Pas de description.'}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <Link
                          to={`/chat/${cat.id}`}
                          target="_blank"
                          className="text-xs font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 bg-pink-500/10 border border-pink-500/20 px-2.5 py-1.5 rounded-xl"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Fiche</span>
                        </Link>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openEditCatModal(cat)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Modifier</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPendingDelete({ id: cat.id, type: 'cat', label: `le chat « ${cat.name} »` });
                              setDeleteModalOpen(true);
                            }}
                            className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Vue Onglet 2 : Témoignages */}
        {currentTab === 'stories' && (
          <div>
            {stories.length === 0 ? (
              <div className="admin-glass-card rounded-2xl p-12 text-center text-slate-400 text-xs sm:text-sm">
                Aucun témoignage enregistré pour le moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {stories.map((story) => (
                  <div
                    key={story.id}
                    className="admin-glass-card rounded-2xl p-4 flex flex-col justify-between border border-slate-800"
                  >
                    <div>
                      {story.photos && story.photos.length > 0 && (
                        <div className="relative h-36 rounded-xl overflow-hidden mb-2.5 bg-slate-900">
                          <img src={story.photos[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <h3 className="font-title text-base sm:text-lg font-black text-white mb-0.5">
                        {story.catName}
                      </h3>
                      <p className="text-xs text-pink-400 font-bold mb-2">
                        Par {story.adoptant} • {story.location || 'Morbihan'}
                      </p>
                      <p className="text-slate-400 text-xs italic line-clamp-3 mb-3">
                        « {story.content} »
                      </p>
                    </div>

                    <div className="pt-2.5 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditStoryModal(story)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Modifier</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingDelete({ id: story.id, type: 'story', label: `le témoignage de « ${story.catName} »` });
                          setDeleteModalOpen(true);
                        }}
                        className="bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* --- MODALE AJOUT / ÉDITION CHAT --- */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="admin-glass-panel rounded-2xl sm:rounded-3xl border border-slate-800 max-w-2xl w-full p-5 sm:p-8 my-auto relative shadow-2xl max-h-[92vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="font-title text-xl sm:text-2xl font-black text-white">
                  {isReadOnlyMode 
                    ? `Consultation : ${catFormData.name}`
                    : activeEditingCatId 
                    ? `Modifier ${catFormData.name}` 
                    : "Ajouter un chat"}
                </h2>
                <span className="text-xs text-slate-400">
                  {isReadOnlyMode ? "Mode consultation seule" : "Tous les champs marqués * sont requis"}
                </span>
              </div>
              <button
                type="button"
                onClick={closeCatModal}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Alerte Modification concurrente */}
            {concurrentAlert && (
              <div className="mb-4 p-3.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-200 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Attention : cette fiche a été modifiée par <strong>{concurrentAlert.updater}</strong> à {concurrentAlert.time}.
                </span>
              </div>
            )}

            <form onSubmit={handleSaveCat} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Prénom du chat *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={isReadOnlyMode}
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
                    placeholder="Ex. Nougat"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Statut *
                  </label>
                  <select
                    disabled={isReadOnlyMode}
                    value={catFormData.status}
                    onChange={(e) => setCatFormData({ ...catFormData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Urgence">🚨 Urgence</option>
                    <option value="Réservé">Réservé</option>
                    <option value="Adopté">Adopté</option>
                  </select>
                </div>
              </div>

              {/* Si Adopté : Date d'adoption avec compte à rebours 60j */}
              {catFormData.status === 'Adopté' && (
                <div className="p-3.5 rounded-xl bg-pink-950/30 border border-pink-500/40">
                  <label className="block text-xs font-bold text-pink-300 uppercase tracking-wider mb-1">
                    Date d'adoption
                  </label>
                  <input
                    type="date"
                    disabled={isReadOnlyMode}
                    value={catFormData.adoptedAt}
                    onChange={(e) => setCatFormData({ ...catFormData, adoptedAt: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                  <span className="text-[11px] text-pink-400 mt-1 block">
                    La fiche restera visible sur le site pendant 60 jours après cette date pour fêter l'adoption, puis sera automatiquement archivée.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Sexe
                  </label>
                  <select
                    disabled={isReadOnlyMode}
                    value={catFormData.sex}
                    onChange={(e) => setCatFormData({ ...catFormData, sex: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                  >
                    <option value="Femelle">Femelle</option>
                    <option value="Mâle">Mâle</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Localisation (Commune)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnlyMode}
                    value={catFormData.location}
                    onChange={(e) => setCatFormData({ ...catFormData, location: e.target.value })}
                    placeholder="Colpo (56)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Mode de saisie de l'âge */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Calcul de l'âge
                  </span>
                  <div className="flex gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setCatFormData({ ...catFormData, ageMode: 'birthDate' })}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        catFormData.ageMode === 'birthDate'
                          ? 'bg-pink-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Date de naissance
                    </button>
                    <button
                      type="button"
                      onClick={() => setCatFormData({ ...catFormData, ageMode: 'freeText' })}
                      className={`px-2.5 py-1 rounded-lg transition-colors ${
                        catFormData.ageMode === 'freeText'
                          ? 'bg-pink-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Texte libre
                    </button>
                  </div>
                </div>

                {catFormData.ageMode === 'birthDate' ? (
                  <div>
                    <input
                      type="date"
                      disabled={isReadOnlyMode}
                      value={catFormData.birthDate}
                      onChange={(e) => setCatFormData({ ...catFormData, birthDate: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs mb-1"
                    />
                    <span className="text-xs text-emerald-400 font-bold block">
                      Âge calculé automatiquement : {calculateAgeFromBirthDate(catFormData.birthDate) || "Aucune date choisie"}
                    </span>
                  </div>
                ) : (
                  <input
                    type="text"
                    disabled={isReadOnlyMode}
                    value={catFormData.freeAge}
                    onChange={(e) => setCatFormData({ ...catFormData, freeAge: e.target.value })}
                    placeholder="Ex. 1 an et demi, 3 mois..."
                    className="w-full px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs"
                  />
                )}
              </div>

              {/* Description & Foyer */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Description & Caractère
                </label>
                <textarea
                  rows={3}
                  disabled={isReadOnlyMode}
                  value={catFormData.description}
                  onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                  placeholder="Racontez son histoire, son comportement, ses petites habitudes..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Foyer Idéal
                </label>
                <input
                  type="text"
                  disabled={isReadOnlyMode}
                  value={catFormData.idealHome}
                  onChange={(e) => setCatFormData({ ...catFormData, idealHome: e.target.value })}
                  placeholder="Ex. Maison avec jardin sécurisé, environnement calme..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Mots-clés / Badges (séparés par des virgules)
                </label>
                <input
                  type="text"
                  disabled={isReadOnlyMode}
                  value={catFormData.tags}
                  onChange={(e) => setCatFormData({ ...catFormData, tags: e.target.value })}
                  placeholder="Câlin, Joueur, Très sociable"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                />
              </div>

              {/* Compatibilités */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Chats</label>
                  <select
                    disabled={isReadOnlyMode}
                    value={catFormData.compatCats}
                    onChange={(e) => setCatFormData({ ...catFormData, compatCats: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                  >
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                    <option value="Non testé">Non testé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Chiens</label>
                  <select
                    disabled={isReadOnlyMode}
                    value={catFormData.compatDogs}
                    onChange={(e) => setCatFormData({ ...catFormData, compatDogs: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                  >
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                    <option value="Non testé">Non testé</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Enfants</label>
                  <select
                    disabled={isReadOnlyMode}
                    value={catFormData.compatKids}
                    onChange={(e) => setCatFormData({ ...catFormData, compatKids: e.target.value })}
                    className="w-full p-2 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                  >
                    <option value="Oui">Oui</option>
                    <option value="Non">Non</option>
                    <option value="Non testé">Non testé</option>
                  </select>
                </div>
              </div>

              {/* Statut Vétérinaire */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnlyMode}
                    checked={catFormData.vetSterilized}
                    onChange={(e) => setCatFormData({ ...catFormData, vetSterilized: e.target.checked })}
                    className="rounded text-pink-600 focus:ring-0"
                  />
                  <span>Stérilisé(e)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnlyMode}
                    checked={catFormData.vetChipped}
                    onChange={(e) => setCatFormData({ ...catFormData, vetChipped: e.target.checked })}
                    className="rounded text-pink-600 focus:ring-0"
                  />
                  <span>Identifié(e) par puce</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnlyMode}
                    checked={catFormData.vetVaccinated}
                    onChange={(e) => setCatFormData({ ...catFormData, vetVaccinated: e.target.checked })}
                    className="rounded text-pink-600 focus:ring-0"
                  />
                  <span>Vacciné(e)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={isReadOnlyMode}
                    checked={catFormData.vetTested}
                    onChange={(e) => setCatFormData({ ...catFormData, vetTested: e.target.checked })}
                    className="rounded text-pink-600 focus:ring-0"
                  />
                  <span>Testé FIV / FeLV</span>
                </label>
              </div>

              {/* Gestion des Photos (jusqu'à 5) */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-300">
                    Photos ({catPhotos.length} / 5)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    La 1ère photo sert de couverture
                  </span>
                </div>

                {!isReadOnlyMode && catPhotos.length < 5 && (
                  <div className="space-y-2 mb-3">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoFilesUpload}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-pink-600 file:text-white hover:file:bg-pink-500 cursor-pointer"
                    />
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={catPhotoUrlInput}
                        onChange={(e) => setCatPhotoUrlInput(e.target.value)}
                        placeholder="Ou collez une URL d'image..."
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={handleAddPhotoUrl}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200"
                      >
                        Ajouter
                      </button>
                    </div>
                  </div>
                )}

                {/* Galerie de miniatures */}
                <div className="grid grid-cols-5 gap-2">
                  {catPhotos.map((p, idx) => (
                    <div
                      key={idx}
                      className={`relative h-20 rounded-xl overflow-hidden bg-slate-800 border ${
                        idx === 0 ? 'border-pink-500 ring-2 ring-pink-500/40' : 'border-slate-700'
                      }`}
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                      {!isReadOnlyMode && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-around opacity-0 hover:opacity-100 transition-opacity p-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => setPrimaryPhoto(idx)}
                              title="Définir comme photo principale"
                              className="w-5 h-5 rounded bg-pink-600 text-white text-[10px] flex items-center justify-center font-bold"
                            >
                              ★
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removePhoto(idx)}
                            title="Supprimer"
                            className="w-5 h-5 rounded bg-rose-600 text-white text-[10px] flex items-center justify-center"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-pink-500 text-white text-[8px] font-black px-1 rounded">
                          Couv.
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons Footer Formulaire */}
              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCatModal}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Fermer
                </button>

                {!isReadOnlyMode && (
                  <button
                    type="submit"
                    disabled={savingCat}
                    className="px-6 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-2"
                  >
                    {savingCat ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <span>Enregistrer</span>
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE CONFLIT VERROU D'ÉDITION --- */}
      {lockConflictModalOpen && conflictingLockInfo && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-amber-500/40 text-center shadow-2xl">
            <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="font-title text-xl font-bold text-white mb-2">
              Fiche en cours d'édition
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              La fiche de <strong>« {conflictingLockInfo.name} »</strong> est actuellement ouverte par <strong>{conflictingLockInfo.editingLock?.email}</strong>.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setLockConflictModalOpen(false);
                  openEditCatModal(conflictingLockInfo, false, true);
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700"
              >
                Consulter en lecture seule
              </button>
              <button
                type="button"
                onClick={() => {
                  setLockConflictModalOpen(false);
                  openEditCatModal(conflictingLockInfo, true, false);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold"
              >
                Prendre la main (forcer l'édition)
              </button>
              <button
                type="button"
                onClick={() => setLockConflictModalOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-300 py-1"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE AJOUT / ÉDITION AVIS --- */}
      {storyModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-2xl sm:rounded-3xl border border-slate-800 max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-title text-xl font-black text-white">
                {activeEditingStoryId ? "Modifier le témoignage" : "Ajouter un avis d'adoptant"}
              </h2>
              <button
                type="button"
                onClick={() => setStoryModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveStory} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Nom du chat *
                </label>
                <input
                  type="text"
                  required
                  value={storyFormData.catName}
                  onChange={(e) => setStoryFormData({ ...storyFormData, catName: e.target.value })}
                  placeholder="Ex. Chaussette"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Prénom Adoptant *
                  </label>
                  <input
                    type="text"
                    required
                    value={storyFormData.adoptant}
                    onChange={(e) => setStoryFormData({ ...storyFormData, adoptant: e.target.value })}
                    placeholder="Ex. Céline"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Localisation
                  </label>
                  <input
                    type="text"
                    value={storyFormData.location}
                    onChange={(e) => setStoryFormData({ ...storyFormData, location: e.target.value })}
                    placeholder="Colpo (56)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Contenu du témoignage *
                </label>
                <textarea
                  rows={4}
                  required
                  value={storyFormData.content}
                  onChange={(e) => setStoryFormData({ ...storyFormData, content: e.target.value })}
                  placeholder="Partagez le retour d'expérience de l'adoptant..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Photo du témoignage */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Photo du chat (optionnel)
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors border border-slate-700">
                      <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
                      <span>Choisir un fichier</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStoryPhotoUpload}
                        className="hidden"
                      />
                    </label>
                    <span className="text-[11px] text-slate-500">ou par URL :</span>
                  </div>

                  <input
                    type="url"
                    value={storyPhotoUrlInput}
                    onChange={(e) => {
                      setStoryPhotoUrlInput(e.target.value);
                      if (e.target.value.length > 5) setStoryPhotos([e.target.value]);
                    }}
                    placeholder="https://..."
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-500"
                  />

                  {storyPhotos.length > 0 && (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden mt-1 border border-pink-500/40">
                      <img src={storyPhotos[0]} alt="Aperçu" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setStoryPhotos([]);
                          setStoryPhotoUrlInput('');
                        }}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-950/80 text-rose-400 flex items-center justify-center text-xs hover:bg-rose-600 hover:text-white transition-colors"
                        title="Supprimer la photo"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStoryModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={savingStory}
                  className="px-6 py-2.5 rounded-xl bg-brand-gradient text-white text-xs font-bold shadow-md hover:opacity-95"
                >
                  {savingStory ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODALE CONFIRMATION SUPPRESSION --- */}
      {deleteModalOpen && pendingDelete && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-rose-500/40 text-center shadow-2xl">
            <Trash2 className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h3 className="font-title text-xl font-bold text-white mb-2">
              Confirmer la suppression
            </h3>
            <p className="text-xs text-slate-300 mb-6">
              Êtes-vous sûr de vouloir supprimer définitivement {pendingDelete.label} ? Cette action est irréversible.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODALE PURGE CHATS EXPIRÉS (+60j) --- */}
      {purgeModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="admin-glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full border border-rose-500/40 text-center shadow-2xl">
            <Clock className="w-12 h-12 text-rose-400 mx-auto mb-3" />
            <h3 className="font-title text-xl font-bold text-white mb-2">
              Purger les chats adoptés expirés
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Voulez-vous supprimer définitivement de Firestore les <strong>{stats.expiredAdopted} chat(s)</strong> dont la date d'adoption dépasse 60 jours ? Ces fiches sont déjà masquées du site public.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPurgeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={purging}
                onClick={handleConfirmPurge}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md"
              >
                {purging ? "Suppression..." : "Confirmer la purge"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
