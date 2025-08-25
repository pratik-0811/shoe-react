import api from './api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

class UserService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    return api.post<AuthResponse>('/users/login', credentials);
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return api.post<AuthResponse>('/users/register', userData);
  }

  async getCurrentUser(): Promise<User> {
    return api.get<User>('/users/me');
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    return api.put<User>('/users/me', userData);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    return api.put<{ message: string }>('/users/change-password', data);
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  storeUserData(data: AuthResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}

export default new UserService();