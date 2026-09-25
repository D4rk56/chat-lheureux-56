import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  X,
  KeyRound,
  Users,
  Sparkles,
  Shield,
  History,
  ChevronDown,
  ChevronUp,
  Link2
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
import { 
  fetchAdoptionRequests, 
  updateAdoptionRequest, 
  deleteAdoptionRequest, 
  archiveAdoptionRequest,
  archiveOldAdoptions,
  purgeExpiredAdoptions,
  ADOPTION_STATUS,
  ADOPTION_ARCHIVE_DAYS,
  ADOPTION_PURGE_DAYS
} from '../firebase/adoptionsService';
import { 
  fetchAllUsers, 
  updateUserRole, 
  updateMemberProfile,
  deleteUserRecord, 
  addManualMember,
  createInviteCode, 
  fetchInviteCodes, 
  deleteInviteCode,
  validateInviteCode,
  toggleMemberAdoptionNotification,
  KNOWN_ACCOUNTS
} from '../firebase/memberService';
import { 
  USER_ROLES, 
  ROLE_LABELS, 
  isAdminRole, 
  canEditCats, 
  canDeleteCats, 
  canManageStories, 
  canManageAdoptions, 
  canDeleteAdoptions, 
  canManageMembers,
  isSuperAdminEmail,
  isAssoPresidentEmail,
  getDefaultTabForRole
} from '../utils/roles.js';
import { calculateAgeFromBirthDate, getCatAdoptionInfo, ADOPTED_EXPIRATION_DAYS } from '../utils/age.js';
import { compressImageFile } from '../utils/imageCompressor.js';
import { normalizeInviteCode } from '../utils/inviteCodes.js';
import GoogleIcon from '../components/icons/GoogleIcon';

import AdoptionsTab from '../components/admin/AdoptionsTab';
import MembersTab from '../components/admin/MembersTab';
import ActivityTab from '../components/admin/ActivityTab';
import AdoptionDetailModal from '../components/admin/AdoptionDetailModal';
import PasswordResetModal from '../components/admin/PasswordResetModal';
import { 
  logActivity, 
  LOG_CATEGORIES, 
  LOG_ACTIONS, 
  fetchRecentActivityLogs, 
  subscribeActivityLogs, 
  purgeOldActivityLogs, 
  MAX_LOG_RETENTION_DAYS 
} from '../firebase/activityLogService';
import { 
  CAT_SORT_MODES, 
  sortCats, 
  isCatIncomplete, 
  formatCatAdminDate 
} from '../utils/catSorting.js';
import ClickableText from '../components/common/ClickableText';
import { normalizeUrl } from '../utils/linkParser';

export default function AdminPage() {
  const { 
    user, 
    userProfile, 
    role, 
    loading: authLoading, 
    login, 
    loginGoogle,
    logout, 
    sendPasswordReset,
    registerGoogleWithInvite,
    cancelGoogleRegistration
  } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // États de connexion
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [forgotPasswordModalOpen, setForgotPasswordModalOpen] = useState(false);

  // États connexion Google & validation code d'invitation
  const [googleLoginSubmitting, setGoogleLoginSubmitting] = useState(false);
  const [googleCodeModalOpen, setGoogleCodeModalOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [googleInviteCode, setGoogleInviteCode] = useState('');
  const [googleFullName, setGoogleFullName] = useState('');
  const [googlePhone, setGooglePhone] = useState('');
  const [googlePseudo, setGooglePseudo] = useState('');
  const [googleCodeError, setGoogleCodeError] = useState('');
  const [googleCodeVerifying, setGoogleCodeVerifying] = useState(false);

  // Données
  const [cats, setCats] = useState([]);
  const [stories, setStories] = useState([]);
  const [adoptions, setAdoptions] = useState([]);
  const [members, setMembers] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [activityError, setActivityError] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [loadingAdoptions, setLoadingAdoptions] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [loadingActivity, setLoadingActivity] = useState(false);

  // Onglet courant : 'cats', 'stories', 'adoptions', 'members', ou 'activity'
  const [currentTab, setCurrentTab] = useState('cats');

  // Modale Détail Demande d'Adoption
  const [selectedAdoption, setSelectedAdoption] = useState(null);
  const [adoptionModalOpen, setAdoptionModalOpen] = useState(false);

  // Filtres admin
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(null);
  const [catSortMode, setCatSortMode] = useState(CAT_SORT_MODES.ALPHA);
  const [filterIncompleteOnly, setFilterIncompleteOnly] = useState(false);
  const [expandedCatDescriptions, setExpandedCatDescriptions] = useState(new Set());

  // Modale Chat (Ajout / Édition)
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [isReadOnlyMode, setIsReadOnlyMode] = useState(false);
  const [activeEditingCatId, setActiveEditingCatId] = useState(null);
  const [initialUpdatedAt, setInitialUpdatedAt] = useState(null);
  const [catFormData, setCatFormData] = useState(getDefaultCatForm());
  const [catPhotos, setCatPhotos] = useState([]);
  const [catPhotoUrlInput, setCatPhotoUrlInput] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [draggedPhotoIdx, setDraggedPhotoIdx] = useState(null);
  const [dragOverPhotoIdx, setDragOverPhotoIdx] = useState(null);
  const [catDescPreview, setCatDescPreview] = useState(false);
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkText, setLinkText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');

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
  const initialTabSetRef = useRef(false);

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
      setAdoptions([]);
      setMembers([]);
      setInviteCodes([]);
      setActivityLogs([]);
    }
  }, [user, role]);

  // Abonnement en temps réel aux logs d'activité (7 jours)
  useEffect(() => {
    if (!user) return;
    const unsub = subscribeActivityLogs(
      (logs) => {
        setActivityLogs(logs);
        setActivityError(null);
      },
      (err) => {
        console.warn("Échec abonnement logs :", err);
        setActivityError(err);
      },
      MAX_LOG_RETENTION_DAYS
    );
    return () => {
      if (unsub) unsub();
    };
  }, [user]);

  // Initialisation de l'onglet par défaut selon le rôle après résolution de la session
  useEffect(() => {
    if (!authLoading && user && !initialTabSetRef.current) {
      initialTabSetRef.current = true;
      setCurrentTab(getDefaultTabForRole(role));
    }
  }, [authLoading, user, role]);

  useEffect(() => {
    if (!user) {
      initialTabSetRef.current = false;
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
      const [catsSettled, storiesSettled, adoptionsSettled, membersSettled, codesSettled, activitySettled] = await Promise.allSettled([
        fetchCats(false),
        fetchStories(),
        canManageAdoptions(role) ? fetchAdoptionRequests() : Promise.resolve([]),
        isAdminRole(role) ? fetchAllUsers() : Promise.resolve([]),
        isAdminRole(role) ? fetchInviteCodes() : Promise.resolve([]),
        fetchRecentActivityLogs(MAX_LOG_RETENTION_DAYS)
      ]);

      if (catsSettled.status === 'fulfilled') {
        setCats(catsSettled.value || []);
      } else {
        console.warn("Échec chargement chats :", catsSettled.reason);
      }

      if (storiesSettled.status === 'fulfilled') {
        setStories(storiesSettled.value || []);
      } else {
        console.warn("Échec chargement avis :", storiesSettled.reason);
      }

      if (adoptionsSettled.status === 'fulfilled') {
        setAdoptions(adoptionsSettled.value || []);
      } else {
        console.warn("Échec chargement adoptions :", adoptionsSettled.reason);
      }

      if (membersSettled && membersSettled.status === 'fulfilled') {
        setMembers(membersSettled.value || []);
      } else if (membersSettled) {
        console.warn("Échec chargement membres :", membersSettled.reason);
      }

      if (codesSettled && codesSettled.status === 'fulfilled') {
        setInviteCodes(codesSettled.value || []);
      } else if (codesSettled) {
        console.warn("Échec chargement codes d'invitation :", codesSettled.reason);
      }

      if (activitySettled && activitySettled.status === 'fulfilled') {
        setActivityLogs(activitySettled.value || []);
        setActivityError(null);
      } else if (activitySettled) {
        console.warn("Échec chargement logs d'activité :", activitySettled.reason);
        setActivityError(activitySettled.reason);
      }

      // Auto-purge silencieuse en tâche de fond des logs de plus de 7 jours
      if (isAdminRole(role)) {
        purgeOldActivityLogs(MAX_LOG_RETENTION_DAYS).catch(e => console.warn("Auto-purge background :", e));
      }
    } catch (err) {
      console.error("Erreur inattendue chargement données admin :", err);
    } finally {
      setLoadingData(false);
    }
  };

  const loadActivityLogs = async () => {
    setLoadingActivity(true);
    try {
      const freshLogs = await fetchRecentActivityLogs(MAX_LOG_RETENTION_DAYS);
      setActivityLogs(freshLogs);
      setActivityError(null);
      if (isAdminRole(role)) {
        purgeOldActivityLogs(MAX_LOG_RETENTION_DAYS).catch(e => console.warn("Auto-purge logs background :", e));
      }
    } catch (err) {
      console.error("Erreur chargement logs :", err);
      setActivityError(err);
      showToast("Erreur", "Impossible de charger l'historique.", "error");
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleManualPurgeActivity = async () => {
    try {
      const res = await purgeOldActivityLogs(MAX_LOG_RETENTION_DAYS);
      if (res && res.deletedCount > 0) {
        logActivity({
          actionType: LOG_ACTIONS.ACTIVITY_PURGE,
          category: LOG_CATEGORIES.SYSTEM,
          description: `Purge manuelle de l'historique d'activité (> 7 jours)`,
          details: `${res.deletedCount} log(s) définitivement effacé(s)`,
          user,
          userProfile
        });
      }
      await loadActivityLogs();
      return res;
    } catch (err) {
      console.error("Erreur purge manuelle logs :", err);
      showToast("Erreur", "Impossible de purger les logs expirés.", "error");
    }
  };

  const loadAdoptions = async () => {
    setLoadingAdoptions(true);
    try {
      const fresh = await fetchAdoptionRequests();
      setAdoptions(fresh);
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de rafraîchir les adoptions.", "error");
    } finally {
      setLoadingAdoptions(false);
    }
  };

  const loadMembersAndCodes = async () => {
    setLoadingMembers(true);
    try {
      const [freshMembers, freshCodes] = await Promise.all([
        fetchAllUsers(),
        fetchInviteCodes()
      ]);
      setMembers(freshMembers);
      setInviteCodes(freshCodes);
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de rafraîchir les membres.", "error");
    } finally {
      setLoadingMembers(false);
    }
  };

  // --- Handlers Demandes d'adoption ---
  const handleSelectAdoption = (adoptionItem) => {
    setSelectedAdoption(adoptionItem);
    setAdoptionModalOpen(true);
  };

  const handleUpdateAdoptionStatus = async (id, updates) => {
    try {
      await updateAdoptionRequest(id, updates);
      const currentTarget = adoptions.find(a => a.id === id) || selectedAdoption;
      setAdoptions(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
      if (selectedAdoption && selectedAdoption.id === id) {
        setSelectedAdoption(prev => ({ ...prev, ...updates, updatedAt: new Date().toISOString() }));
      }
      logActivity({
        actionType: LOG_ACTIONS.ADOPTION_STATUS_CHANGE,
        category: LOG_CATEGORIES.ADOPTIONS,
        description: `Mise à jour du dossier d'adoption de ${currentTarget?.fullName || 'candidat'}`,
        details: updates.status ? `Statut passé à : ${updates.status}` : 'Mise à jour des notes de suivi',
        targetId: id,
        targetName: currentTarget ? `${currentTarget.catName} (${currentTarget.fullName})` : 'Demande d\'adoption',
        user,
        userProfile
      });
      showToast("Suivi enregistré", "Le dossier d'adoption a été mis à jour avec succès.");
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de mettre à jour le dossier.", "error");
    }
  };

  const handleDeleteAdoption = (id, label) => {
    setPendingDelete({ id, type: 'adoption', label });
    setDeleteModalOpen(true);
  };

  const handleArchiveAdoption = async (id) => {
    try {
      await archiveAdoptionRequest(id);
      const currentTarget = adoptions.find(a => a.id === id) || selectedAdoption;
      setAdoptions(prev => prev.map(a => a.id === id ? { ...a, status: ADOPTION_STATUS.ARCHIVEE, archivedAt: new Date().toISOString() } : a));
      if (selectedAdoption && selectedAdoption.id === id) {
        setSelectedAdoption(prev => ({ ...prev, status: ADOPTION_STATUS.ARCHIVEE, archivedAt: new Date().toISOString() }));
      }
      logActivity({
        actionType: LOG_ACTIONS.ADOPTION_ARCHIVE,
        category: LOG_CATEGORIES.ADOPTIONS,
        description: `Archivage de la demande d'adoption`,
        details: currentTarget ? `Pour ${currentTarget.catName} par ${currentTarget.fullName}` : '',
        targetId: id,
        targetName: currentTarget ? `${currentTarget.catName} (${currentTarget.fullName})` : 'Demande d\'adoption',
        user,
        userProfile
      });
      showToast("Dossier archivé", "La demande d'adoption a été déplacée dans les archives.");
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible d'archiver la demande.", "error");
    }
  };

  const handleArchiveAllOldAdoptions = async () => {
    try {
      const count = await archiveOldAdoptions(ADOPTION_ARCHIVE_DAYS);
      if (count > 0) {
        await loadAdoptions();
        logActivity({
          actionType: LOG_ACTIONS.ADOPTION_ARCHIVE,
          category: LOG_CATEGORIES.ADOPTIONS,
          description: `Archivage automatique groupé des demandes de plus de 30 jours`,
          details: `${count} demande(s) archivée(s)`,
          user,
          userProfile
        });
        showToast("Archivage terminé", `${count} demande(s) de plus de 30 jours ont été archivées.`);
      } else {
        showToast("Information", "Aucune demande de plus de 30 jours à archiver.");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Échec de l'archivage automatique.", "error");
    }
  };

  const handlePurgeExpiredAdoptions = async () => {
    try {
      const count = await purgeExpiredAdoptions(ADOPTION_PURGE_DAYS);
      if (count > 0) {
        await loadAdoptions();
        logActivity({
          actionType: LOG_ACTIONS.ADOPTION_PURGE,
          category: LOG_CATEGORIES.ADOPTIONS,
          description: `Purge définitive des demandes expirées de plus de 60 jours`,
          details: `${count} demande(s) supprimée(s)`,
          user,
          userProfile
        });
        showToast("Purge effectuée", `${count} demande(s) de plus de 60 jours ont été supprimées définitivement.`);
      } else {
        showToast("Information", "Aucune demande de plus de 60 jours à purger.");
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Échec de la purge de l'historique.", "error");
    }
  };

  // --- Handlers Membres & Rôles ---
  const handleUpdateMemberProfile = async (uid, updates) => {
    try {
      const updated = await updateMemberProfile(uid, updates);
      setMembers(prev => prev.map(m => (m.uid === uid || m.id === uid) ? { ...m, ...updates } : m));
      logActivity({
        actionType: LOG_ACTIONS.MEMBER_PROFILE_UPDATE,
        category: LOG_CATEGORIES.MEMBERS,
        description: `Mise à jour du profil du membre ${updates.name || updates.pseudo || uid}`,
        targetId: uid,
        targetName: updates.name || updates.pseudo || 'Membre',
        user,
        userProfile
      });
      showToast("Coordonnées mises à jour", "Les informations du membre ont été enregistrées avec succès.");
      return updated;
    } catch (err) {
      console.error(err);
      showToast("Erreur", err.message || "Impossible de modifier les informations du membre.", "error");
      throw err;
    }
  };

  const handleUpdateUserRole = async (uid, newRole) => {
    try {
      await updateUserRole(uid, newRole);
      const targetMember = members.find(m => m.uid === uid || m.id === uid);
      setMembers(prev => prev.map(m => m.uid === uid ? { ...m, role: newRole } : m));
      logActivity({
        actionType: LOG_ACTIONS.MEMBER_ROLE_CHANGE,
        category: LOG_CATEGORIES.MEMBERS,
        description: `Modification du rôle de ${targetMember?.name || targetMember?.email || 'Membre'}`,
        details: `Nouveau rôle : ${ROLE_LABELS[newRole] || newRole}`,
        targetId: uid,
        targetName: targetMember?.name || targetMember?.email || 'Membre',
        user,
        userProfile
      });
      showToast("Rôle mis à jour", `Statut du membre modifié en ${ROLE_LABELS[newRole] || newRole}.`);
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de modifier le rôle du membre.", "error");
    }
  };

  const handleDeleteMember = (uid, label) => {
    setPendingDelete({ id: uid, type: 'member', label: `l'accès de « ${label} »` });
    setDeleteModalOpen(true);
  };

  const handleSendMemberPasswordReset = async (email) => {
    try {
      await sendPasswordReset(email);
      showToast("Lien envoyé", `Un e-mail de réinitialisation a été envoyé à ${email}.`);
    } catch (err) {
      console.error(err);
      showToast("Erreur", getAuthErrorMessage(err.code), "error");
    }
  };

  const handleCreateInviteCode = async ({ role: codeRole, note }) => {
    try {
      const newCode = await createInviteCode({
        role: codeRole,
        note,
        createdBy: user?.email || 'admin'
      });
      setInviteCodes(prev => [newCode, ...prev]);
      logActivity({
        actionType: LOG_ACTIONS.INVITE_CODE_CREATE,
        category: LOG_CATEGORIES.MEMBERS,
        description: `Génération d'un code d'invitation ${newCode.code}`,
        details: `Rôle attribué : ${ROLE_LABELS[codeRole] || codeRole}${note ? ` • Note : ${note}` : ''}`,
        targetId: newCode.id,
        targetName: newCode.code,
        user,
        userProfile
      });
      showToast("Code généré !", `Code d'invitation ${newCode.code} créé.`);
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de générer le code d'invitation.", "error");
    }
  };

  const handleDeleteInviteCode = async (codeId) => {
    try {
      const targetCode = inviteCodes.find(c => c.id === codeId);
      await deleteInviteCode(codeId);
      setInviteCodes(prev => prev.filter(c => c.id !== codeId));
      logActivity({
        actionType: LOG_ACTIONS.INVITE_CODE_DELETE,
        category: LOG_CATEGORIES.MEMBERS,
        description: `Révocation du code d'invitation ${targetCode?.code || codeId}`,
        details: targetCode ? `Rôle associé : ${ROLE_LABELS[targetCode.role] || targetCode.role}` : '',
        targetId: codeId,
        targetName: targetCode?.code || 'Code d\'invitation',
        user,
        userProfile
      });
      showToast("Code révoqué", "Le code d'invitation a été supprimé.");
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de révoquer ce code.", "error");
    }
  };

  const handleAddManualMember = async (memberData) => {
    try {
      const created = await addManualMember(memberData);
      setMembers(prev => {
        const filtered = prev.filter(m => m.email?.toLowerCase().trim() !== memberData.email?.toLowerCase().trim());
        return [created, ...filtered];
      });
      logActivity({
        actionType: LOG_ACTIONS.MEMBER_CREATE,
        category: LOG_CATEGORIES.MEMBERS,
        description: `Ajout d'un compte membre (${memberData.email})`,
        details: `Rôle attribué : ${ROLE_LABELS[memberData.role] || memberData.role}`,
        targetId: created?.uid || created?.id,
        targetName: memberData.name || memberData.pseudo || memberData.email,
        user,
        userProfile
      });
      showToast("Membre synchronisé !", `Le compte ${memberData.email} a été ajouté avec succès.`);
      return created;
    } catch (err) {
      console.error(err);
      showToast("Erreur", err.message || "Impossible d'ajouter le membre.", "error");
      throw err;
    }
  };

  const handleToggleMemberNotification = async (uid, enabled) => {
    try {
      await toggleMemberAdoptionNotification(uid, enabled);
      setMembers(prev => prev.map(m => (m.uid === uid || m.id === uid) ? { ...m, receiveAdoptionEmails: enabled } : m));
      const targetMember = members.find(m => m.uid === uid || m.id === uid);
      logActivity({
        actionType: LOG_ACTIONS.MEMBER_PROFILE_UPDATE,
        category: LOG_CATEGORIES.MEMBERS,
        description: `${enabled ? 'Activation' : 'Désactivation'} des alertes e-mail d'adoption`,
        details: `Membre : ${targetMember?.fullName || targetMember?.email || uid} (${enabled ? 'Actif' : 'Inactif'})`,
        targetId: uid,
        targetName: targetMember?.fullName || targetMember?.email || 'Membre',
        user,
        userProfile
      });
      showToast(
        enabled ? "Alertes activées" : "Alertes désactivées",
        `Le membre ${enabled ? 'recevra' : 'ne recevra plus'} les formulaires d'adoption par e-mail.`
      );
    } catch (err) {
      console.error(err);
      showToast("Erreur", "Impossible de modifier les préférences d'alerte.", "error");
    }
  };

  const handleSelfPasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordReset(user.email);
      showToast("E-mail envoyé", `Un lien de réinitialisation vous a été envoyé à ${user.email}.`);
    } catch (err) {
      showToast("Erreur", getAuthErrorMessage(err.code), "error");
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

  const handleGoogleLoginClick = async () => {
    setLoginError('');
    setGoogleLoginSubmitting(true);
    try {
      const res = await loginGoogle();
      if (!res.success) {
        if (res.error) setLoginError(res.error);
        return;
      }

      if (res.isNewUser && res.needsInviteCode) {
        setPendingGoogleUser(res.user);
        setGoogleFullName(res.user.displayName || '');
        setGoogleInviteCode('');
        setGoogleCodeError('');
        setGoogleCodeModalOpen(true);
      } else {
        showToast("Connexion réussie", "Bienvenue dans l'espace administration !");
      }
    } catch (err) {
      console.error("Erreur Google Auth :", err);
      setLoginError(getAuthErrorMessage(err.code));
    } finally {
      setGoogleLoginSubmitting(false);
    }
  };

  const handleVerifyAndCompleteGoogleRegistration = async (e) => {
    e.preventDefault();
    setGoogleCodeError('');
    const targetUser = pendingGoogleUser || user;
    if (!targetUser) {
      setGoogleCodeError("Aucune session Google active.");
      return;
    }

    const cleanedCode = normalizeInviteCode(googleInviteCode);
    if (!cleanedCode) {
      setGoogleCodeError("Veuillez saisir votre code d'invitation.");
      return;
    }

    setGoogleCodeVerifying(true);
    try {
      const validation = await validateInviteCode(cleanedCode);
      if (!validation.valid) {
        setGoogleCodeError(validation.error || "Ce code d'invitation est invalide ou expiré.");
        return;
      }

      await registerGoogleWithInvite({
        googleUser: targetUser,
        codeDoc: validation.codeDoc,
        fullName: (googleFullName || targetUser.displayName || '').trim(),
        phone: googlePhone.trim(),
        pseudo: googlePseudo.trim()
      });

      setGoogleCodeModalOpen(false);
      setPendingGoogleUser(null);
      showToast("Accès activé !", "Votre compte Google a été enregistré avec succès en tant que Bénévole.");
    } catch (err) {
      console.error("Erreur validation code Google :", err);
      setGoogleCodeError(err.message || "Erreur lors de l'activation du compte.");
    } finally {
      setGoogleCodeVerifying(false);
    }
  };

  const handleCancelGoogleRegistration = async () => {
    setGoogleCodeModalOpen(false);
    setPendingGoogleUser(null);
    setGoogleInviteCode('');
    setGoogleCodeError('');
    await cancelGoogleRegistration();
  };

  const handleLogout = async () => {
    try {
      cleanupLock();
      await logout();
      showToast("Déconnexion", "À bientôt !", "info");
      navigate('/', { replace: true });
    } catch (err) {
      console.error("Erreur lors de la déconnexion :", err);
      navigate('/', { replace: true });
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
      if (count > 0) {
        logActivity({
          actionType: LOG_ACTIONS.CAT_PURGE_EXPIRED,
          category: LOG_CATEGORIES.CHATS,
          description: `Purge automatique des chats adoptés depuis +60 jours`,
          details: `${count} fiche(s) de chat supprimée(s)`,
          user,
          userProfile
        });
      }
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

    const initialPhotos = (Array.isArray(catItem.photos) && catItem.photos.length > 0)
      ? [...catItem.photos]
      : (catItem.image ? [catItem.image] : []);
    setCatPhotos(initialPhotos);
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
    setCatDescPreview(false);
    setLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('');
  };

  // Insertion d'un lien assisté dans la description du chat
  const handleConfirmInsertLink = () => {
    const rawUrl = linkUrl.trim();
    if (!rawUrl) return;
    const finalUrl = normalizeUrl(rawUrl);
    const label = linkText.trim() || finalUrl;
    const markdownSnippet = `[${label}](${finalUrl})`;

    setCatFormData((prev) => {
      const currentDesc = prev.description || '';
      const separator = currentDesc.length > 0 && !currentDesc.endsWith(' ') && !currentDesc.endsWith('\n') ? ' ' : '';
      return {
        ...prev,
        description: `${currentDesc}${separator}${markdownSnippet}`
      };
    });

    setLinkModalOpen(false);
    setLinkText('');
    setLinkUrl('');
    showToast("Lien inséré", `Le lien « ${label} » a été ajouté à la description.`);
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

  const handlePhotoDragStart = (e, idx) => {
    if (isReadOnlyMode) return;
    setDraggedPhotoIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', String(idx));
    } catch (_) {}
  };

  const handlePhotoDragOver = (e, idx) => {
    e.preventDefault();
    if (isReadOnlyMode || draggedPhotoIdx === null) return;
    if (dragOverPhotoIdx !== idx) {
      setDragOverPhotoIdx(idx);
    }
  };

  const handlePhotoDrop = (e, targetIdx) => {
    e.preventDefault();
    if (isReadOnlyMode || draggedPhotoIdx === null) return;
    if (draggedPhotoIdx === targetIdx) {
      setDraggedPhotoIdx(null);
      setDragOverPhotoIdx(null);
      return;
    }
    setCatPhotos((prev) => {
      const arr = [...prev];
      const [movedItem] = arr.splice(draggedPhotoIdx, 1);
      arr.splice(targetIdx, 0, movedItem);
      return arr;
    });
    setDraggedPhotoIdx(null);
    setDragOverPhotoIdx(null);
  };

  const handlePhotoDragEnd = () => {
    setDraggedPhotoIdx(null);
    setDragOverPhotoIdx(null);
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
      photos: catPhotos.filter((p) => typeof p === 'string' && p.trim().length > 0),
      image: (catPhotos.length > 0 && catPhotos[0]) ? catPhotos[0] : 'https://placehold.co/600x400?text=Pas+de+photo'
    };

    try {
      const savedCatId = await saveCat(payload, activeEditingCatId, user?.email || 'Admin');
      logActivity({
        actionType: activeEditingCatId ? LOG_ACTIONS.CAT_UPDATE : LOG_ACTIONS.CAT_CREATE,
        category: LOG_CATEGORIES.CHATS,
        description: activeEditingCatId 
          ? `Mise à jour de la fiche de ${payload.name}` 
          : `Création de la fiche de ${payload.name}`,
        details: `Statut : ${payload.status} • Ville : ${payload.location}${payload.photos?.length ? ` • ${payload.photos.length} photo(s)` : ''}`,
        targetId: savedCatId || activeEditingCatId,
        targetName: payload.name,
        user,
        userProfile
      });
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
      const savedStoryId = await saveStory(payload, activeEditingStoryId);
      logActivity({
        actionType: activeEditingStoryId ? LOG_ACTIONS.STORY_UPDATE : LOG_ACTIONS.STORY_CREATE,
        category: LOG_CATEGORIES.STORIES,
        description: activeEditingStoryId 
          ? `Mise à jour du témoignage de ${payload.catName}` 
          : `Ajout d'un témoignage pour ${payload.catName}`,
        details: payload.adoptant ? `Adoptant : ${payload.adoptant}` : '',
        targetId: savedStoryId || activeEditingStoryId,
        targetName: payload.catName,
        user,
        userProfile
      });
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
        logActivity({
          actionType: LOG_ACTIONS.CAT_DELETE,
          category: LOG_CATEGORIES.CHATS,
          description: `Suppression définitive de la fiche chat`,
          details: pendingDelete.label || '',
          targetId: pendingDelete.id,
          targetName: pendingDelete.label,
          user,
          userProfile
        });
      } else if (pendingDelete.type === 'story') {
        await deleteStory(pendingDelete.id);
        logActivity({
          actionType: LOG_ACTIONS.STORY_DELETE,
          category: LOG_CATEGORIES.STORIES,
          description: `Suppression d'un témoignage`,
          details: pendingDelete.label || '',
          targetId: pendingDelete.id,
          targetName: pendingDelete.label,
          user,
          userProfile
        });
      } else if (pendingDelete.type === 'adoption') {
        await deleteAdoptionRequest(pendingDelete.id);
        logActivity({
          actionType: LOG_ACTIONS.ADOPTION_PURGE,
          category: LOG_CATEGORIES.ADOPTIONS,
          description: `Suppression définitive d'une demande d'adoption`,
          details: pendingDelete.label || '',
          targetId: pendingDelete.id,
          targetName: pendingDelete.label,
          user,
          userProfile
        });
        setAdoptionModalOpen(false);
      } else if (pendingDelete.type === 'member') {
        await deleteUserRecord(pendingDelete.id);
        logActivity({
          actionType: LOG_ACTIONS.MEMBER_DELETE,
          category: LOG_CATEGORIES.MEMBERS,
          description: `Suppression d'un compte membre`,
          details: pendingDelete.label || '',
          targetId: pendingDelete.id,
          targetName: pendingDelete.label,
          user,
          userProfile
        });
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

  // Bascule du dépliage de description
  const toggleCatDescription = (catId) => {
    setExpandedCatDescriptions((prev) => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  // Nombre de fiches nécessitant d'être complétées
  const incompleteCatsCount = useMemo(() => {
    return cats.filter((c) => isCatIncomplete(c).incomplete).length;
  }, [cats]);

  // Filtrage et tri admin des fiches chats
  const filteredCats = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = cats.filter((c) => {
      const matchQuery = !q || 
        (c.name || '').toLowerCase().includes(q) || 
        (c.location || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q);
      const matchStatus = !statusFilter || (c.status || 'Disponible') === statusFilter;
      const matchIncomplete = !filterIncompleteOnly || isCatIncomplete(c).incomplete;
      return matchQuery && matchStatus && matchIncomplete;
    });
    return sortCats(filtered, catSortMode);
  }, [cats, searchQuery, statusFilter, filterIncompleteOnly, catSortMode]);

  // Si utilisateur non connecté : formulaire de connexion
  if (authLoading) {
    return (
      <main className="flex-grow pt-28 pb-20 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        Vérification de session...
      </main>
    );
  }

  // Si l'utilisateur est authentifié avec Google mais n'a pas encore validé de code d'invitation
  const isGoogleUser = user?.providerData?.some((p) => p.providerId === 'google.com') || false;
  const userCleanEmail = (user?.email || '').trim().toLowerCase();
  const isKnownEmail = isSuperAdminEmail(userCleanEmail) || 
    isAssoPresidentEmail(userCleanEmail) || 
    KNOWN_ACCOUNTS.some(k => k.email?.toLowerCase() === userCleanEmail);
  const isGooglePendingInvite = Boolean(
    !authLoading &&
    user &&
    isGoogleUser &&
    !userProfile &&
    !isKnownEmail
  );

  if (isGooglePendingInvite) {
    return (
      <div className="min-h-screen bg-[#090d16] text-white flex flex-col justify-center items-center p-4">
        <div className="admin-glass-panel w-full max-w-md p-6 sm:p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden animate-in fade-in">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand-gradient rounded-2xl flex items-center justify-center text-white text-2xl mx-auto mb-4 shadow-lg shadow-pink-500/20">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="font-title text-2xl font-black text-white mb-1">Code d'Invitation Requis</h1>
            <p className="text-xs text-slate-400">
              Compte Google : <strong className="text-white">{user?.email}</strong>
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mb-5 leading-relaxed">
            Pour la sécurité de l'association, l'accès à cet espace est réservé aux bénévoles autorisés. Veuillez renseigner le code d'invitation généré par un administrateur pour activer votre accès.
          </div>

          {googleCodeError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-4 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{googleCodeError}</span>
            </div>
          )}

          <form onSubmit={handleVerifyAndCompleteGoogleRegistration} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Code d'invitation (format CLH-XXXX-XXXX)
              </label>
              <input
                type="text"
                required
                value={googleInviteCode}
                onChange={(e) => setGoogleInviteCode(e.target.value.toUpperCase())}
                placeholder="CLH-XXXX-XXXX"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white font-mono text-center tracking-widest text-base focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Numéro de téléphone</span>
                <span className="text-[10px] text-pink-400 font-bold lowercase">Recommandé</span>
              </label>
              <input
                type="tel"
                value={googlePhone}
                onChange={(e) => setGooglePhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Pseudo affiché</span>
                <span className="text-[10px] text-slate-500 font-normal lowercase">Optionnel</span>
              </label>
              <input
                type="text"
                value={googlePseudo}
                onChange={(e) => setGooglePseudo(e.target.value)}
                placeholder="Ex: CamilleM"
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500"
              />
            </div>

            <button
              type="submit"
              disabled={googleCodeVerifying}
              className="w-full py-3.5 rounded-xl bg-brand-gradient text-white font-bold text-sm shadow-lg shadow-pink-500/25 hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {googleCodeVerifying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Vérification du code...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Activer mon accès Bénévole</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleCancelGoogleRegistration}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
            >
              Annuler et se déconnecter
            </button>
          </form>
        </div>
      </div>
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
            <h1 className="font-title text-2xl font-black text-white mb-1">Espace Bénévoles & Gestion</h1>
            <p className="text-xs font-semibold text-slate-400">
              Association Chat L'Heureux 56
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs font-semibold mb-5 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Bouton Connexion Google */}
          <button
            type="button"
            onClick={handleGoogleLoginClick}
            disabled={loginSubmitting || googleLoginSubmitting}
            className="w-full py-3.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2.5 shadow-lg shadow-slate-950/20 active:scale-[0.99] disabled:opacity-60 mb-5"
          >
            {googleLoginSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <span>Connexion Google en cours...</span>
              </>
            ) : (
              <>
                <GoogleIcon className="w-4 h-4 shrink-0" />
                <span>Continuer avec Google</span>
              </>
            )}
          </button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-800"></div></div>
            <div className="relative"><span className="bg-[#090d16] px-3 text-[11px] text-slate-500 font-bold uppercase tracking-wider">ou par mot de passe</span></div>
          </div>

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
                  onClick={() => setForgotPasswordModalOpen(true)}
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

          {/* Lien vers Inscription Bénévole par Code */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Futur bénévole avec un code d'invitation ?
            </p>
            <Link 
              to="/inscription" 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-400 hover:text-pink-300 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>S'inscrire avec un code d'invitation</span>
            </Link>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 text-center">
            <Link to="/" className="text-xs font-bold text-slate-400 hover:text-white transition-colors">
              &larr; Retourner sur le site public
            </Link>
          </div>
        </div>

        {/* Modale Mot de passe oublié */}
        <PasswordResetModal
          isOpen={forgotPasswordModalOpen}
          onClose={() => setForgotPasswordModalOpen(false)}
          initialEmail={loginEmail}
          onSendReset={sendPasswordReset}
        />
      </div>
    );
  }

  // Utilisateur connecté : Tableau de bord administration complet
  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
      
      {/* Top Header Admin */}
      <header className="admin-glass-panel sticky top-0 z-40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <span className="font-title font-black text-base sm:text-2xl text-brand-gradient truncate">
              Chat L'Heureux 56
            </span>
            <span className={`text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full border shrink-0 ${
              role === USER_ROLES.ADMIN
                ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                : role === USER_ROLES.GESTION
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
            }`}>
              {ROLE_LABELS[role] || role}
            </span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Bouton Réinitialiser mon mot de passe */}
            <button
              type="button"
              onClick={handleSelfPasswordReset}
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700"
              title="M'envoyer un e-mail de réinitialisation de mot de passe"
            >
              <Lock className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="hidden lg:inline">Mon mot de passe</span>
            </button>

            {canEditCats(role) && (
              <button
                type="button"
                onClick={handleExportBackup}
                className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700"
                title="Télécharger une sauvegarde complète en JSON"
              >
                <Download className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                <span className="hidden sm:inline">Sauvegarde JSON</span>
              </button>
            )}

            <Link
              to="/"
              target="_blank"
              className="text-xs font-bold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 bg-slate-800 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-700"
              title="Voir le site public"
            >
              <ExternalLink className="w-3.5 h-3.5 text-pink-400 shrink-0" />
              <span className="hidden md:inline">Voir le site</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="text-xs font-bold bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white border border-rose-500/30 p-2 sm:px-3 sm:py-1.5 rounded-xl transition-all flex items-center gap-1.5"
              title="Se déconnecter"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-grow max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        
        {/* Barre de stats adaptative */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Disponible' ? null : 'Disponible')}
            className={`admin-glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${
              statusFilter === 'Disponible' 
                ? 'ring-2 ring-emerald-500 bg-emerald-500/10 border-emerald-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400">Disponibles</span>
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 shrink-0" />
            </div>
            <span className="font-title text-xl sm:text-2xl font-black text-white">{stats.dispo}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Urgence' ? null : 'Urgence')}
            className={`admin-glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${
              statusFilter === 'Urgence' 
                ? 'ring-2 ring-rose-500 bg-rose-500/10 border-rose-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400">Urgences</span>
              <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400 shrink-0" />
            </div>
            <span className="font-title text-xl sm:text-2xl font-black text-rose-400">{stats.urgence}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Réservé' ? null : 'Réservé')}
            className={`admin-glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${
              statusFilter === 'Réservé' 
                ? 'ring-2 ring-amber-500 bg-amber-500/10 border-amber-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400">Réservés</span>
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            </div>
            <span className="font-title text-xl sm:text-2xl font-black text-amber-400">{stats.reserve}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter(statusFilter === 'Adopté' ? null : 'Adopté')}
            className={`admin-glass-card p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all ${
              statusFilter === 'Adopté' 
                ? 'ring-2 ring-pink-500 bg-pink-500/10 border-pink-500' 
                : 'border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400">Adoptés</span>
              <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-pink-400 shrink-0" />
            </div>
            <div className="flex items-baseline gap-1.5 sm:gap-2">
              <span className="font-title text-xl sm:text-2xl font-black text-pink-400">{stats.adopte}</span>
              {stats.expiredAdopted > 0 && (
                <span className="text-[10px] font-bold text-rose-400 truncate">
                  ({stats.expiredAdopted} exp.)
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Alerte Purge si chats expirés (+60j) (Réservé admin) */}
        {canDeleteCats(role) && stats.expiredAdopted > 0 && (
          <div className="mb-6 sm:mb-8 p-3.5 sm:p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
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
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shrink-0 shadow-md text-center"
            >
              Purger les fiches expirées
            </button>
          </div>
        )}

        {/* Onglets navigation multi-paliers : Chats vs Témoignages vs Adoptions vs Membres */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar pb-1 -mx-3 px-3 sm:mx-0 sm:px-0 flex-nowrap w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setCurrentTab('cats')}
              className={`shrink-0 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs transition-all ${
                currentTab === 'cats'
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {canEditCats(role) ? `Chats (${cats.length})` : `Chats (Consultation)`}
            </button>

            {canManageStories(role) && (
              <button
                type="button"
                onClick={() => setCurrentTab('stories')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs transition-all ${
                  currentTab === 'stories'
                    ? 'bg-brand-gradient text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                Avis & Témoignages ({stories.length})
              </button>
            )}

            {canManageAdoptions(role) && (
              <button
                type="button"
                onClick={() => setCurrentTab('adoptions')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  currentTab === 'adoptions'
                    ? 'bg-brand-gradient text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <span>Demandes ({adoptions.length})</span>
                {adoptions.filter(a => (a.status || ADOPTION_STATUS.NOUVEAU) === ADOPTION_STATUS.NOUVEAU).length > 0 && (
                  <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {adoptions.filter(a => (a.status || ADOPTION_STATUS.NOUVEAU) === ADOPTION_STATUS.NOUVEAU).length}
                  </span>
                )}
              </button>
            )}

            {canManageMembers(role) && (
              <button
                type="button"
                onClick={() => setCurrentTab('members')}
                className={`shrink-0 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                  currentTab === 'members'
                    ? 'bg-brand-gradient text-white shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>Membres & Invitations</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setCurrentTab('activity')}
              className={`shrink-0 whitespace-nowrap px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 ${
                currentTab === 'activity'
                  ? 'bg-brand-gradient text-white shadow-md'
                  : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historique ({activityLogs.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {currentTab === 'cats' && canEditCats(role) && (
              <button
                type="button"
                onClick={openNewCatModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter un chat</span>
              </button>
            )}

            {currentTab === 'stories' && canManageStories(role) && (
              <button
                type="button"
                onClick={openNewStoryModal}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md transition-colors"
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
            {/* Bannière d'information consultation bénévole */}
            {!canEditCats(role) && (
              <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>
                  <strong>Espace consultation bénévole :</strong> Vous pouvez explorer et consulter toutes les fiches de chats pour renseigner les futurs adoptants. L'ajout et l'édition de fiches sont réservés aux gestionnaires et administrateurs.
                </span>
              </div>
            )}

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

            {/* Barre de sous-onglets de tri & filtres rapides pour les fiches chats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 bg-slate-900/60 p-2 sm:p-2.5 rounded-2xl border border-slate-800/80">
              {/* Sous-onglets de tri */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 hidden sm:inline">
                  Trier :
                </span>

                <button
                  type="button"
                  onClick={() => setCatSortMode(CAT_SORT_MODES.ALPHA)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                    catSortMode === CAT_SORT_MODES.ALPHA
                      ? 'bg-brand-gradient text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                  title="Trier par ordre alphabétique de A à Z"
                >
                  <span>🔤 Alphabétique (A-Z)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCatSortMode(CAT_SORT_MODES.DATE_ADDED)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                    catSortMode === CAT_SORT_MODES.DATE_ADDED
                      ? 'bg-brand-gradient text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                  title="Trier par date d'enregistrement (plus récents en premier)"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Date d'ajout</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCatSortMode(CAT_SORT_MODES.DATE_UPDATED)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                    catSortMode === CAT_SORT_MODES.DATE_UPDATED
                      ? 'bg-brand-gradient text-white shadow-sm'
                      : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                  title="Trier par date de dernière modification"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Récemment modifiés</span>
                </button>
              </div>

              {/* Filtre fiches incomplètes & compteur */}
              <div className="flex items-center gap-2 justify-between sm:justify-end shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                <button
                  type="button"
                  onClick={() => setFilterIncompleteOnly(!filterIncompleteOnly)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    filterIncompleteOnly
                      ? 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-400 font-extrabold'
                      : incompleteCatsCount > 0
                      ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25'
                      : 'bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200'
                  }`}
                  title="Afficher uniquement les fiches sans description ou sans photo"
                >
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Fiches incomplètes</span>
                  {incompleteCatsCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                      filterIncompleteOnly ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/30 text-amber-200'
                    }`}>
                      {incompleteCatsCount}
                    </span>
                  )}
                </button>

                <span className="text-[11px] text-slate-400 font-semibold">
                  {filteredCats.length} chat{filteredCats.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {loadingData && cats.length === 0 ? (
              <div className="py-20 text-center text-slate-500">
                <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Chargement des fiches...
              </div>
            ) : filteredCats.length === 0 ? (
              <div className="admin-glass-card rounded-2xl p-12 text-center text-slate-400 text-xs sm:text-sm">
                {filterIncompleteOnly 
                  ? 'Toutes les fiches de chats sont complètes ! (Aucune fiche sans texte ni photo)'
                  : 'Aucun chat ne correspond à ces critères.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredCats.map((cat) => {
                  const photo = cat.photos?.[0] || cat.image || 'https://placehold.co/600x400?text=Photo';
                  const isLocked = isCatLockedByOther(cat, user?.email);
                  const isAdopted = cat.status === 'Adopté';
                  const adoptionInfo = getCatAdoptionInfo(cat);
                  const isExpanded = expandedCatDescriptions.has(cat.id);
                  const incompleteInfo = isCatIncomplete(cat);
                  const catDateStr = formatCatAdminDate(cat, catSortMode === CAT_SORT_MODES.DATE_UPDATED ? 'updated' : 'added');

                  return (
                    <div
                      key={cat.id}
                      className={`admin-glass-card rounded-2xl p-4 flex flex-col justify-between border ${
                        isAdopted && adoptionInfo.isExpired
                          ? 'border-rose-500/40 bg-rose-950/20'
                          : isLocked
                          ? 'border-amber-500/50 bg-amber-950/10'
                          : incompleteInfo.incomplete
                          ? 'border-amber-500/40 bg-amber-950/5'
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

                        {/* Titre & Date */}
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-title text-xl font-black text-white">
                            {cat.name}
                          </h3>
                          {catDateStr && (
                            <span 
                              className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 rounded-lg shrink-0 mt-0.5 flex items-center gap-1"
                              title={catDateStr}
                            >
                              <Clock className="w-2.5 h-2.5 text-slate-500" />
                              <span>{catDateStr}</span>
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-400 font-semibold mb-2">
                          <MapPin className="w-3 h-3 text-pink-400 inline mr-1" />
                          {cat.location || 'Morbihan (56)'}
                        </p>

                        {/* Alerte fiche incomplète */}
                        {incompleteInfo.incomplete && (
                          <div className="mb-2.5 p-1.5 px-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold flex items-center gap-1.5">
                            <AlertTriangle className="w-3 h-3 shrink-0 text-amber-400" />
                            <span>
                              {incompleteInfo.missingDescription && incompleteInfo.missingPhoto 
                                ? '⚠️ Description et photo manquantes' 
                                : incompleteInfo.missingDescription 
                                ? '⚠️ Description manquante' 
                                : '⚠️ Photo manquante'}
                            </span>
                          </div>
                        )}

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

                        {/* Description avec voir plus / replier */}
                        <div className="mb-3">
                          {cat.description ? (
                            <ClickableText
                              as="p"
                              text={cat.description}
                              className={`text-slate-300 text-xs ${isExpanded ? 'whitespace-pre-line leading-relaxed' : 'line-clamp-2'}`}
                              linkClassName="text-pink-400 hover:text-pink-300 underline font-semibold transition-colors inline-flex items-baseline gap-0.5 break-all"
                            />
                          ) : (
                            <p className="text-slate-500 italic text-xs">Pas de description renseignée.</p>
                          )}
                          {cat.description && cat.description.trim().length > 70 && (
                            <button
                              type="button"
                              onClick={() => toggleCatDescription(cat.id)}
                              className="text-[11px] font-bold text-pink-400 hover:text-pink-300 mt-1 inline-flex items-center gap-1 transition-colors"
                            >
                              {isExpanded ? (
                                <>
                                  <ChevronUp className="w-3 h-3" />
                                  <span>Replier</span>
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" />
                                  <span>Voir plus</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
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
                          {canEditCats(role) ? (
                            <button
                              type="button"
                              onClick={() => openEditCatModal(cat)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                            >
                              <Edit3 className="w-3 h-3" />
                              <span>Modifier</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openEditCatModal(cat, false, true)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                              title="Consulter la fiche"
                            >
                              <Eye className="w-3 h-3 text-emerald-400" />
                              <span>Consulter</span>
                            </button>
                          )}

                          {canDeleteCats(role) && (
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
                          )}
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

        {/* Vue Onglet 3 : Demandes d'adoption */}
        {currentTab === 'adoptions' && canManageAdoptions(role) && (
          <AdoptionsTab
            adoptions={adoptions}
            loading={loadingAdoptions}
            onRefresh={loadAdoptions}
            onSelectAdoption={handleSelectAdoption}
            onArchiveAdoption={handleArchiveAdoption}
            onArchiveAllOld={handleArchiveAllOldAdoptions}
            onPurgeExpired={handlePurgeExpiredAdoptions}
            canDelete={canDeleteAdoptions(role)}
          />
        )}

        {/* Vue Onglet 4 : Membres & Invitations */}
        {currentTab === 'members' && canManageMembers(role) && (
          <MembersTab
            currentUserId={user?.uid}
            members={members}
            inviteCodes={inviteCodes}
            loading={loadingMembers}
            onRefresh={loadMembersAndCodes}
            onUpdateRole={handleUpdateUserRole}
            onEditMember={handleUpdateMemberProfile}
            onDeleteMember={handleDeleteMember}
            onSendPasswordReset={handleSendMemberPasswordReset}
            onCreateInviteCode={handleCreateInviteCode}
            onDeleteInviteCode={handleDeleteInviteCode}
            onAddManualMember={handleAddManualMember}
            onToggleNotification={handleToggleMemberNotification}
          />
        )}

        {/* Vue Onglet 5 : Historique d'activité (7 jours) */}
        {currentTab === 'activity' && (
          <ActivityTab
            logs={activityLogs}
            loading={loadingActivity}
            error={activityError}
            onRefresh={loadActivityLogs}
            onPurgeExpired={handleManualPurgeActivity}
            canPurge={isAdminRole(role)}
          />
        )}

      </main>

      {/* --- MODALE DÉTAILS DEMANDE D'ADOPTION --- */}
      <AdoptionDetailModal
        isOpen={adoptionModalOpen}
        onClose={() => setAdoptionModalOpen(false)}
        adoption={selectedAdoption}
        onUpdateStatus={handleUpdateAdoptionStatus}
        onDelete={handleDeleteAdoption}
        canDelete={canDeleteAdoptions(role)}
      />

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
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Description & Caractère
                  </label>
                  
                  <div className="flex items-center gap-1.5">
                    {!isReadOnlyMode && (
                      <button
                        type="button"
                        onClick={() => setLinkModalOpen(!linkModalOpen)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                          linkModalOpen 
                            ? 'bg-pink-600 text-white shadow-xs' 
                            : 'bg-slate-800 hover:bg-slate-700 text-pink-400 border border-slate-700'
                        }`}
                        title="Insérer un lien cliquable (ex: album Facebook, vidéo YouTube, page Instagram)"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Insérer un lien</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCatDescPreview(!catDescPreview)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                        catDescPreview 
                          ? 'bg-brand-gradient text-white shadow-xs' 
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                      }`}
                      title={catDescPreview ? "Revenir à l'édition du texte" : "Prévisualiser le texte avec les liens cliquables"}
                    >
                      <Eye className="w-3 h-3" />
                      <span>{catDescPreview ? 'Rédiger' : 'Aperçu'}</span>
                    </button>
                  </div>
                </div>

                {/* Assistant d'insertion de lien */}
                {linkModalOpen && !isReadOnlyMode && (
                  <div className="mb-2.5 p-3 rounded-xl bg-slate-950 border border-pink-500/40 space-y-2.5 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-bold text-pink-300">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-pink-400" />
                        <span>Ajouter un lien cliquable</span>
                      </span>
                      <button 
                        type="button" 
                        onClick={() => setLinkModalOpen(false)}
                        className="text-slate-400 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Texte affiché (Ex: Album Facebook de Mimi)
                        </label>
                        <input
                          type="text"
                          value={linkText}
                          onChange={(e) => setLinkText(e.target.value)}
                          placeholder="Ex: Voir son album photos"
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                          Adresse web (URL) *
                        </label>
                        <input
                          type="text"
                          value={linkUrl}
                          onChange={(e) => setLinkUrl(e.target.value)}
                          placeholder="https://facebook.com/..."
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-pink-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500 italic">
                        Insère automatiquement [Texte](Adresse)
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLinkModalOpen(false)}
                          className="px-2.5 py-1 rounded-lg text-slate-400 hover:text-white text-xs"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          disabled={!linkUrl.trim()}
                          onClick={handleConfirmInsertLink}
                          className="px-3 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs"
                        >
                          Insérer le lien
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Zone de saisie ou aperçu interactif */}
                {catDescPreview ? (
                  <div className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-700 min-h-[90px] text-xs sm:text-sm">
                    {catFormData.description ? (
                      <ClickableText
                        as="p"
                        text={catFormData.description}
                        className="text-slate-200 whitespace-pre-line leading-relaxed"
                        linkClassName="text-pink-400 hover:text-pink-300 underline font-semibold transition-colors inline-flex items-baseline gap-0.5 break-all"
                      />
                    ) : (
                      <span className="text-slate-500 italic">Aucun texte saisi pour le moment.</span>
                    )}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    disabled={isReadOnlyMode}
                    value={catFormData.description}
                    onChange={(e) => setCatFormData({ ...catFormData, description: e.target.value })}
                    placeholder="Racontez son histoire, son comportement, ses petites habitudes... Les adresses https://... ou [Mon titre](https://...) seront cliquables !"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-pink-500 disabled:opacity-60"
                  />
                )}
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

                {/* Galerie de miniatures avec réorganisation (Glisser-Déposer & Boutons Gauche/Droite) */}
                {catPhotos.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>
                        📸 <strong>{catPhotos.length}/5 photo{catPhotos.length > 1 ? 's' : ''}</strong>
                      </span>
                      {!isReadOnlyMode && (
                        <span className="text-slate-400 text-[10px]">
                          Glissez-déposez ou utilisez ◀ ▶ pour réorganiser
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      {catPhotos.map((p, idx) => (
                        <div
                          key={idx}
                          draggable={!isReadOnlyMode}
                          onDragStart={(e) => handlePhotoDragStart(e, idx)}
                          onDragOver={(e) => handlePhotoDragOver(e, idx)}
                          onDrop={(e) => handlePhotoDrop(e, idx)}
                          onDragEnd={handlePhotoDragEnd}
                          className={`relative h-28 rounded-2xl overflow-hidden bg-slate-800 border transition-all select-none ${
                            idx === 0
                              ? 'border-pink-500 ring-2 ring-pink-500/50 shadow-md'
                              : 'border-slate-700/80 hover:border-slate-500'
                          } ${dragOverPhotoIdx === idx ? 'ring-4 ring-pink-400 scale-[1.03] z-20' : ''} ${
                            draggedPhotoIdx === idx ? 'opacity-40' : ''
                          }`}
                        >
                          <img src={p} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover pointer-events-none" />

                          {/* Badge Statut Couverture ou Ordre */}
                          {idx === 0 ? (
                            <span className="absolute top-1.5 left-1.5 bg-brand-gradient text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-md flex items-center gap-1 z-10 pointer-events-none">
                              ★ Couverture
                            </span>
                          ) : (
                            <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-slate-300 text-[9px] font-bold px-1.5 py-0.5 rounded-md z-10 pointer-events-none">
                              #{idx + 1}
                            </span>
                          )}

                          {/* Bouton Supprimer */}
                          {!isReadOnlyMode && (
                            <button
                              type="button"
                              onClick={() => removePhoto(idx)}
                              title="Supprimer cette photo"
                              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-black flex items-center justify-center shadow-md transition-all z-20"
                            >
                              ✕
                            </button>
                          )}

                          {/* Barre d'actions inférieure (Flèches gauche/droite et mise en couverture) */}
                          {!isReadOnlyMode && (
                            <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between gap-1 z-20 bg-slate-950/75 backdrop-blur-xs p-1 rounded-xl">
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => movePhoto(idx, -1)}
                                title="Déplacer vers la gauche"
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-pink-600 disabled:opacity-20 disabled:hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center transition-colors"
                              >
                                ◀
                              </button>

                              {idx > 0 && (
                                <button
                                  type="button"
                                  onClick={() => setPrimaryPhoto(idx)}
                                  title="Définir comme photo de couverture"
                                  className="px-1.5 h-6 rounded-lg bg-pink-600/90 hover:bg-pink-500 text-white text-[9px] font-black flex items-center gap-0.5 shadow transition-colors"
                                >
                                  ★ Couv.
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={idx === catPhotos.length - 1}
                                onClick={() => movePhoto(idx, 1)}
                                title="Déplacer vers la droite"
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-pink-600 disabled:opacity-20 disabled:hover:bg-slate-800 text-white text-xs font-black flex items-center justify-center transition-colors"
                              >
                                ▶
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
