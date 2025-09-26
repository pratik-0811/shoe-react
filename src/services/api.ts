import axios, { AxiosError, AxiosResponse } from 'axios';
import { API_URL } from '../config/env';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Retry logic for failed requests
const retryRequest = async (error: AxiosError, retryCount = 0): Promise<AxiosResponse> => {
  if (retryCount >= MAX_RETRIES) {
    return Promise.reject(error);
  }

  // Only retry on network errors or 5xx server errors
  if (
    !error.response ||
    (error.response.status >= 500 && error.response.status < 600) ||
    error.code === 'NETWORK_ERROR' ||
    error.code === 'TIMEOUT'
  ) {
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
    return api.request(error.config!);
  }

  return Promise.reject(error);
};

// Add a request interceptor to include auth token and handle loading states
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request timestamp for debugging
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors and responses
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Handle different types of errors
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Handle unauthorized - clear auth data but don't force redirect
          // Let individual components decide whether to redirect or handle gracefully
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          break;

        case 403:
          // Handle forbidden - show error message
          break;

        case 404:
          // Handle not found
          break;

        case 422:
          // Handle validation errors
          break;

        case 429:
          // Handle rate limiting
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Handle server errors with retry
          return retryRequest(error);

        default:
          break;
      }
    } else if (error.request) {
      // Handle network errors
      if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') {
        return retryRequest(error);
      }
    } else {
      // Handle other errors
    }

    // Enhance error object with user-friendly messages
    const enhancedError = {
      ...error,
      userMessage: getUserFriendlyErrorMessage(error),
      timestamp: new Date().toISOString(),
    };

    return Promise.reject(enhancedError);
  }
);

// Helper function to get user-friendly error messages
const getUserFriendlyErrorMessage = (error: AxiosError): string => {
  if (!error.response) {
    if (error.code === 'NETWORK_ERROR') {
      return 'Network connection failed. Please check your internet connection.';
    }
    if (error.code === 'TIMEOUT') {
      return 'Request timed out. Please try again.';
    }
    return 'Something went wrong. Please try again.';
  }

  const { status, data } = error.response;
  const message = (data as { message?: string } | undefined)?.message;

  switch (status) {
    case 400:
      return message || 'Invalid request. Please check your input.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 422:
      return message || 'Please check your input and try again.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
      return 'Server error. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'Service temporarily unavailable. Please try again later.';
    default:
      return message || 'Something went wrong. Please try again.';
  }
};



export { api };
export default api;

// Type augmentation for metadata
declare module 'axios' {
  interface AxiosRequestConfig {
    metadata?: {
      startTime: Date;
    };
  }
}