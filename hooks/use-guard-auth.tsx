"use client";

import { useState, useEffect, useCallback } from 'react';
import { guardApiClient } from '@/lib/guard-api';

interface Guard {
  id: string;
  name: string;
  phone_number: string;
  created_at: string;
  updated_at: string;
}

interface UseGuardAuthReturn {
  guard: Guard | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (guardData: { name: string; phone_number: string; password: string }) => Promise<{ success: boolean; error?: string }>;
}

export const useGuardAuth = (): UseGuardAuthReturn => {
  const [guard, setGuard] = useState<Guard | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const token = guardApiClient.getCurrentToken();
        const guardName = guardApiClient.getStoredGuardName();
        
        if (token && guardName) {
          // Create a mock guard object from stored data
          // In a real app, you might want to fetch the full guard data from the API
          setGuard({
            id: 'stored-guard-id', // You might want to store this too
            name: guardName,
            phone_number: '', // Not stored for security
            created_at: '',
            updated_at: ''
          });
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setGuard(null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setIsAuthenticated(false);
        setGuard(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (credentials: { username: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await guardApiClient.loginGuard(credentials);
      
      if (response.status === 200 && response.data) {
        const guardData: Guard = {
          id: 'logged-in-guard-id', // You might get this from the token or API
          name: response.data.user_name,
          phone_number: credentials.username,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        setGuard(guardData);
        setIsAuthenticated(true);
        
        return { success: true };
      } else {
        setIsAuthenticated(false);
        setGuard(null);
        return { 
          success: false, 
          error: response.error || 'Échec de la connexion' 
        };
      }
    } catch (error: any) {
      setIsAuthenticated(false);
      setGuard(null);
      return { 
        success: false, 
        error: error.message || 'Erreur de connexion' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await guardApiClient.logoutGuard();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      setGuard(null);
      setIsAuthenticated(false);
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (guardData: { name: string; phone_number: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await guardApiClient.createGuard(guardData);
      
      if (response.status === 201) {
        return { success: true };
      } else {
        return { 
          success: false, 
          error: response.error || 'Échec de la création du compte' 
        };
      }
    } catch (error: any) {
      return { 
        success: false, 
        error: error.message || 'Erreur lors de la création du compte' 
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    guard,
    isAuthenticated,
    isLoading,
    login,
    logout,
    register
  };
};

