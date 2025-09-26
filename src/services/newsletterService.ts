import api from './api';

export interface NewsletterSubscription {
  email: string;
  source?: 'website' | 'mobile' | 'social';
  preferences?: {
    newArrivals?: boolean;
    promotions?: boolean;
    styleUpdates?: boolean;
  };
}

export interface NewsletterResponse {
  success: boolean;
  message: string;
  data?: {
    email: string;
    subscribedAt: string;
    status: 'subscribed' | 'resubscribed';
  };
}

export interface NewsletterStats {
  totalSubscribers: number;
  activeSubscribers: number;
  inactiveSubscribers: number;
  monthlyGrowth: number;
  recentSubscribersCount: number;
  conversionRate: string;
}

class NewsletterService {
  // Subscribe to newsletter
  async subscribe(subscriptionData: NewsletterSubscription): Promise<NewsletterResponse> {
    try {
      const response = await api.post('/newsletter/subscribe', subscriptionData);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to subscribe to newsletter');
      }
      throw new Error('Network error. Please try again.');
    }
  }

  // Unsubscribe from newsletter
  async unsubscribe(email: string): Promise<NewsletterResponse> {
    try {
      const response = await api.post('/newsletter/unsubscribe', { email });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to unsubscribe from newsletter');
      }
      throw new Error('Network error. Please try again.');
    }
  }

  // Get newsletter statistics (Admin only)
  async getStats(): Promise<NewsletterStats> {
    try {
      const response = await api.get('/newsletter/stats');
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch newsletter statistics');
      }
      throw new Error('Network error. Please try again.');
    }
  }

  // Get all subscribers (Admin only)
  async getSubscribers(params?: {
    page?: number;
    limit?: number;
    status?: 'all' | 'active' | 'inactive';
  }) {
    try {
      const response = await api.get('/newsletter/subscribers', { params });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw new Error(error.response.data.message || 'Failed to fetch subscribers');
      }
      throw new Error('Network error. Please try again.');
    }
  }

  // Validate email format
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get subscription preferences template
  getDefaultPreferences() {
    return {
      newArrivals: true,
      promotions: true,
      styleUpdates: true
    };
  }
}

export default new NewsletterService();