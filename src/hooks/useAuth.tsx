import React, { useState, useEffect, createContext, useContext, ReactNode, useMemo } from 'react';
import userService from '../services/userService';
import { User } from '../types';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, rememberMe?: boolean, onLoginSuccess?: () => Promise<void>) => Promise<void>;
  register: (data: { name: string; email: string; password: string }, onRegisterSuccess?: () => Promise<void>) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (userService.isAuthenticated()) {
          // First try to get stored user data
          const storedUser = userService.getStoredUser();
          if (storedUser) {
            setUser(storedUser);
            // Verify token is still valid by making a quick API call
            try {
              const currentUser = await userService.getCurrentUser();
              // Update stored data if API returns different data
              if (JSON.stringify(currentUser) !== JSON.stringify(storedUser)) {
                setUser(currentUser);
                localStorage.setItem('user', JSON.stringify(currentUser));
              }
            } catch (apiErr) {
              // Token might be expired, clear auth data
              userService.logout();
              setUser(null);
            }
          } else {
            // Fallback to API call if no stored user
            try {
              const currentUser = await userService.getCurrentUser();
              setUser(currentUser);
              localStorage.setItem('user', JSON.stringify(currentUser));
            } catch (apiErr) {
              // Clear invalid token
              userService.logout();
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        // Silent fail - error handled by UI state
        setError('Failed to initialize authentication');
        userService.logout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string, rememberMe?: boolean, onLoginSuccess?: () => Promise<void>) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.login({ email, password, rememberMe });
      setUser(userData);
      
      // Call the success callback if provided (for cart/wishlist merging)
      if (onLoginSuccess) {
        await onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: { name: string; email: string; password: string }, onRegisterSuccess?: () => Promise<void>) => {
    try {
      setLoading(true);
      setError(null);
      const userData = await userService.register(data);
      setUser(userData);
      
      // Call the success callback if provided (for cart/wishlist merging)
      if (onRegisterSuccess) {
        await onRegisterSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    userService.logout();
    setUser(null);
    setError(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      setError(null);
      const updatedUser = await userService.updateUser(userData);
      setUser(updatedUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = useMemo(() => {
    return !!user && !!localStorage.getItem('token');
  }, [user]);

  const value = {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Export at the end for Fast Refresh compatibility
export { AuthProvider, useAuth };