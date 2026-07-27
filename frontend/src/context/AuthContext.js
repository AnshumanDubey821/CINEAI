// src/context/AuthContext.js
// Global authentication state — wraps the whole app.
// Provides: user, login, logout, isLoading

import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isLoading, setLoading] = useState(true);

  // Restore session from localStorage on first load
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cineai_user');
      if (saved) setUser(JSON.parse(saved));
    } catch (_) {}
    finally { setLoading(false); }
  }, []);

  // Called after successful Google OAuth or email login
  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('cineai_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cineai_user');
    // If using Google Sign-In SDK, also sign out there:
    if (window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
