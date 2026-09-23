import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscribeToAuthState, loginUser, logoutUser, resetPassword } from '../firebase/authService';

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  sendPasswordReset: async () => {}
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    return await loginUser(email, password);
  };

  const logout = async () => {
    return await logoutUser();
  };

  const sendPasswordReset = async (email) => {
    return await resetPassword(email);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, sendPasswordReset }}>
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
