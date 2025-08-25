import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import userService from '../services/userService';
import { User } from '../types';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(userService.getStoredUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(userService.isAuthenticated());

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchCurrentUser();
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const userData = await userService.getCurrentUser();
      setUser(userData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      userService.logout();
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.login({ email, password });
      userService.storeUserData(response);
      setUser(response.user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
      throw err;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await userService.register({ name, email, password });
      userService.storeUserData(response);
      setUser(response.user);
      setIsAuthenticated(true);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    userService.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (userData: Partial<User>) => {
    try {
      setLoading(true);
      const updatedUser = await userService.updateProfile(userData);
      setUser(prevUser => prevUser ? { ...prevUser, ...updatedUser } : updatedUser);
      if (user) {
        userService.storeUserData({ token: localStorage.getItem('token') || '', user: { ...user, ...updatedUser } });
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
      setLoading(false);
      throw err;
    }
  };

  const contextValue = {
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
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};