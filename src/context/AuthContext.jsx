import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  subscribeToAuthState, 
  loginUser, 
  logoutUser, 
  resetPassword,
  registerUser,
  loginWithGoogle
} from '../firebase/authService';
import { 
  ensureUserRecord, 
  fetchUserProfile, 
  redeemInviteCode,
  isRegisteredMember,
  KNOWN_ACCOUNTS
} from '../firebase/memberService';
import { USER_ROLES, isSuperAdminEmail, isAssoPresidentEmail } from '../utils/roles';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  role: USER_ROLES.BENEVOLE,
  loading: true,
  login: async () => {},
  loginGoogle: async () => {},
  logout: async () => {},
  sendPasswordReset: async () => {},
  registerWithInvite: async () => {},
  registerGoogleWithInvite: async () => {},
  cancelGoogleRegistration: async () => {},
  refreshProfile: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [role, setRole] = useState(USER_ROLES.BENEVOLE);
  const [loading, setLoading] = useState(true);
  const pendingRegisterRoleRef = useRef(null);

  const loadUserProfile = useCallback(async (firebaseUser, explicitRole = null) => {
    if (!firebaseUser) {
      setUserProfile(null);
      setRole(USER_ROLES.BENEVOLE);
      return null;
    }
    const isSuperAdmin = isSuperAdminEmail(firebaseUser.email);
    if (isSuperAdmin) {
      setRole(USER_ROLES.ADMIN);
    }
    const cleanEmail = (firebaseUser.email || '').trim().toLowerCase();
    const isKnown = isSuperAdmin || isAssoPresidentEmail(cleanEmail) || KNOWN_ACCOUNTS.some(k => k.email?.toLowerCase() === cleanEmail);

    try {
      const existing = await fetchUserProfile(firebaseUser.uid);

      // Si l'utilisateur n'existe pas encore en base, n'est pas un compte connu, et n'a pas de code d'invitation en cours d'application
      if (!existing && !isKnown && !explicitRole && !pendingRegisterRoleRef.current) {
        // Utilisateur non encore autorisé / première connexion Google sans code
        setUserProfile(null);
        setRole(USER_ROLES.BENEVOLE);
        return null;
      }

      const roleToAssign = isSuperAdmin ? USER_ROLES.ADMIN : (explicitRole || pendingRegisterRoleRef.current);
      const profile = await ensureUserRecord(firebaseUser, roleToAssign);
      setUserProfile(profile);
      setRole(isSuperAdmin ? USER_ROLES.ADMIN : (profile?.role || USER_ROLES.BENEVOLE));
      return profile;
    } catch (err) {
      console.warn("Erreur chargement profil utilisateur :", err);
      setRole(isSuperAdmin ? USER_ROLES.ADMIN : USER_ROLES.BENEVOLE);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (isSuperAdminEmail(currentUser.email)) {
          setRole(USER_ROLES.ADMIN);
        }
        await loadUserProfile(currentUser);
      } else {
        setUserProfile(null);
        setRole(USER_ROLES.BENEVOLE);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadUserProfile]);

  const login = async (email, password) => {
    const cred = await loginUser(email, password);
    if (cred.user) {
      await loadUserProfile(cred.user);
    }
    return cred;
  };

  const logout = async () => {
    setUserProfile(null);
    setRole(USER_ROLES.BENEVOLE);
    return await logoutUser();
  };

  const sendPasswordReset = async (email) => {
    return await resetPassword(email);
  };

  /**
   * Inscription d'un nouveau bénévole/membre avec validation et consommation de son code d'invitation
   */
  const registerWithInvite = async ({ email, password, displayName, fullName, phone, pseudo, codeDoc }) => {
    const assignedRole = codeDoc.role || USER_ROLES.BENEVOLE;
    // Pré-enregistrer le rôle pour éviter que onAuthStateChanged ne l'écrase
    pendingRegisterRoleRef.current = assignedRole;

    try {
      // 1. Créer le compte Firebase Auth
      const finalDisplayName = (pseudo && pseudo.trim()) || (fullName && fullName.trim()) || displayName;
      const newUser = await registerUser(email, password, finalDisplayName);
      
      // 2. Initialiser le profil utilisateur avec le rôle spécifié par le code et les coordonnées
      const profile = await ensureUserRecord(newUser, assignedRole, {
        fullName: fullName || displayName || '',
        phone: phone || '',
        pseudo: pseudo || '',
        displayName: finalDisplayName
      });

      // 3. Marquer le code d'invitation comme utilisé
      try {
        await redeemInviteCode(codeDoc.id, newUser.uid, email);
      } catch (err) {
        console.warn("Erreur lors de la consommation du code d'invitation :", err);
      }

      setUserProfile(profile);
      setRole(assignedRole);
      return newUser;
    } finally {
      pendingRegisterRoleRef.current = null;
    }
  };

  const loginGoogle = async () => {
    const cred = await loginWithGoogle();
    if (cred?.user) {
      const isMember = await isRegisteredMember(cred.user);
      if (isMember) {
        await loadUserProfile(cred.user);
        return { success: true, user: cred.user, isNewUser: false };
      } else {
        return { success: true, user: cred.user, isNewUser: true, needsInviteCode: true };
      }
    }
    return { success: false, error: "Connexion Google interrompue." };
  };

  /**
   * Finalisation d'inscription avec Google et consommation du code d'invitation
   */
  const registerGoogleWithInvite = async ({ googleUser, codeDoc, fullName, phone, pseudo }) => {
    const targetUser = googleUser || user;
    if (!targetUser) throw new Error("Aucun utilisateur Google connecté.");
    if (!codeDoc) throw new Error("Code d'invitation requis.");

    const assignedRole = codeDoc.role || USER_ROLES.BENEVOLE;
    pendingRegisterRoleRef.current = assignedRole;

    try {
      const finalDisplayName = (pseudo && pseudo.trim()) || (fullName && fullName.trim()) || targetUser.displayName || targetUser.email?.split('@')[0];
      const profile = await ensureUserRecord(targetUser, assignedRole, {
        fullName: fullName || targetUser.displayName || '',
        phone: phone || '',
        pseudo: pseudo || '',
        displayName: finalDisplayName,
        photoURL: targetUser.photoURL || ''
      });

      try {
        await redeemInviteCode(codeDoc.id, targetUser.uid, targetUser.email);
      } catch (err) {
        console.warn("Erreur lors de la consommation du code d'invitation :", err);
      }

      setUserProfile(profile);
      setRole(assignedRole);
      return profile;
    } finally {
      pendingRegisterRoleRef.current = null;
    }
  };

  const cancelGoogleRegistration = async () => {
    setUserProfile(null);
    setRole(USER_ROLES.BENEVOLE);
    return await logoutUser();
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      role, 
      loading, 
      login, 
      loginGoogle,
      logout, 
      sendPasswordReset,
      registerWithInvite,
      registerGoogleWithInvite,
      cancelGoogleRegistration,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
