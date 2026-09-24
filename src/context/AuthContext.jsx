import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { 
  subscribeToAuthState, 
  loginUser, 
  logoutUser, 
  resetPassword,
  registerUser 
} from '../firebase/authService';
import { 
  ensureUserRecord, 
  fetchUserProfile, 
  redeemInviteCode 
} from '../firebase/memberService';
import { USER_ROLES } from '../utils/roles';

const AuthContext = createContext({
  user: null,
  userProfile: null,
  role: USER_ROLES.BENEVOLE,
  loading: true,
  login: async () => {},
  logout: async () => {},
  sendPasswordReset: async () => {},
  registerWithInvite: async () => {},
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
    try {
      const roleToAssign = explicitRole || pendingRegisterRoleRef.current;
      const profile = await ensureUserRecord(firebaseUser, roleToAssign);
      setUserProfile(profile);
      setRole(profile?.role || USER_ROLES.BENEVOLE);
      return profile;
    } catch (err) {
      console.warn("Erreur chargement profil utilisateur :", err);
      // Fallback par défaut
      setRole(USER_ROLES.BENEVOLE);
      return null;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
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
  const registerWithInvite = async ({ email, password, displayName, codeDoc }) => {
    const assignedRole = codeDoc.role || USER_ROLES.BENEVOLE;
    // Pré-enregistrer le rôle pour éviter que onAuthStateChanged ne l'écrase
    pendingRegisterRoleRef.current = assignedRole;

    try {
      // 1. Créer le compte Firebase Auth
      const newUser = await registerUser(email, password, displayName);
      
      // 2. Initialiser le profil utilisateur avec le rôle spécifié par le code
      const profile = await ensureUserRecord(newUser, assignedRole);

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
      logout, 
      sendPasswordReset,
      registerWithInvite,
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
