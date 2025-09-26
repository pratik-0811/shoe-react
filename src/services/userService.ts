import api from './api';
import { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
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
  async login(credentials: LoginCredentials): Promise<User> {
    const response = await api.post<AuthResponse>('/users/login', credentials);
    const { token, user } = response.data;
    this.storeUserData({ token, user });
    return user;
  }

  async register(userData: RegisterData): Promise<User> {
    const response = await api.post<AuthResponse>('/users/register', userData);
    const { token, user } = response.data;
    this.storeUserData({ token, user });
    return user;
  }

  async sendOTP(phone: string): Promise<void> {
    await api.post('/users/send-otp', { phone });
  }

  async verifyOTPLogin(phone: string, otp: string, rememberMe?: boolean): Promise<User> {
    const response = await api.post<AuthResponse>('/users/verify-otp-login', { phone, otp, rememberMe });
    const { token, user } = response.data;
    this.storeUserData({ token, user });
    return user;
  }

  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  }

  async updateUser(userData: Partial<User>): Promise<User> {
    const response = await api.put<User>('/users/me', userData);
    const updatedUser = response.data;
    // Update stored user data after successful update
    const currentData = this.getStoredUser();
    if (currentData) {
      const updatedData = { ...currentData, ...updatedUser };
      localStorage.setItem('user', JSON.stringify(updatedData));
    }
    return updatedUser;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    return this.updateUser(userData);
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> {
    const response = await api.put<{ message: string }>('/users/change-password', data);
    return response.data;
  }

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Get user statistics (orders, wishlist, reviews counts)
  async getUserStats(): Promise<{
    orderCount: number;
    wishlistCount: number;
    reviewCount: number;
  }> {
    try {
      const response = await api.get('/users/stats');
      return response.data.data;
    } catch (error) {
      return {
        orderCount: 0,
        wishlistCount: 0,
        reviewCount: 0
      };
    }
  }



  // Update notification preferences
  async updateNotificationPreferences(preferences: {
    emailNotifications?: boolean;
    smsNotifications?: boolean;
    orderUpdates?: boolean;
    promotionalEmails?: boolean;
  }): Promise<any> {
    try {
      const response = await api.put('/users/notification-preferences', preferences);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr || userStr === 'undefined' || userStr === 'null') {
      return null;
    }
    try {
      return JSON.parse(userStr);
    } catch (error) {
      return null;
    }
  }

  storeUserData(data: AuthResponse): void {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
  }
}

export default new UserService();