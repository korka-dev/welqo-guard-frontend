"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { guardApiClient } from '@/lib/guard-api';

const GuardAuthContext = createContext();

export const GuardAuthProvider = ({ children }) => {
  const [guard, setGuard] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('guard_access_token');
        if (token) {
          // Appel de l'API pour récupérer le profil du gardien
          const response = await guardApiClient.getGuardProfile();
          
          if (response.status === 200 && response.data) {
            setGuard(response.data);
            setIsAuthenticated(true);
          } else {
            // Token invalide ou expiré
            localStorage.removeItem('guard_access_token');
            localStorage.removeItem('guard_name');
            setGuard(null);
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        // En cas d'erreur, nettoyer les tokens
        localStorage.removeItem('guard_access_token');
        localStorage.removeItem('guard_name');
        setGuard(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await guardApiClient.loginGuard({ username, password });
      
      if (response.status === 200 && response.data) {
        // Après le login réussi, récupérer le profil complet du gardien
        const profileResponse = await guardApiClient.getGuardProfile();
        
        if (profileResponse.status === 200 && profileResponse.data) {
          setGuard(profileResponse.data);
          setIsAuthenticated(true);
          return { success: true };
        } else {
          return { success: false, error: "Impossible de récupérer le profil" };
        }
      } else {
        return { success: false, error: response.error || "Échec de la connexion" };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message || "Erreur lors de la connexion" };
    }
  };

  const logout = async () => {
    try {
      await guardApiClient.logoutGuard();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      // Toujours nettoyer l'état local même en cas d'erreur
      setGuard(null);
      setIsAuthenticated(false);
      localStorage.removeItem('guard_access_token');
      localStorage.removeItem('guard_name');
    }
  };

  const refreshProfile = async () => {
    try {
      const response = await guardApiClient.getGuardProfile();
      if (response.status === 200 && response.data) {
        setGuard(response.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return false;
    }
  };

  return (
    <GuardAuthContext.Provider 
      value={{ 
        guard, 
        isAuthenticated, 
        isLoading, 
        login, 
        logout, 
        refreshProfile 
      }}
    >
      {children}
    </GuardAuthContext.Provider>
  );
};

export const useGuardAuth = () => {
  const context = useContext(GuardAuthContext);
  if (!context) {
    throw new Error('useGuardAuth must be used within a GuardAuthProvider');
  }
  return context;
};
