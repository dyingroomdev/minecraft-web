import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../lib/types';
import { apiClient } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.roles.includes('ADMIN') || user?.roles.includes('OWNER') || false;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        apiClient.setToken(token);
        const userData = await apiClient.getMe();
        setUser(userData);
      }
    } catch (error) {
      // Token might be expired, try refresh
      try {
        await apiClient.refreshToken();
        const userData = await apiClient.getMe();
        setUser(userData);
      } catch {
        localStorage.removeItem('access_token');
        apiClient.setToken(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const login = () => {
    window.location.href = '/login';
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('access_token');
      apiClient.setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
