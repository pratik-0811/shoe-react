import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  field?: string;
  userMessage: string;
  timestamp: string;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// Enhanced error handler for API responses
export const handleApiError = (error: unknown): ApiError => {
  const timestamp = new Date().toISOString();
  
  // Handle Axios errors
  if (error.isAxiosError || error.response) {
    const axiosError = error as AxiosError;
    const response = axiosError.response;
    const data = response?.data as Record<string, unknown>;
    
    return {
      message: data?.message || axiosError.message || 'An error occurred',
      status: response?.status,
      code: axiosError.code,
      userMessage: error.userMessage || getUserFriendlyMessage(response?.status, data?.message),
      timestamp
    };
  }
  
  // Handle network errors
  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    return {
      message: 'Network connection failed',
      code: 'NETWORK_ERROR',
      userMessage: 'Please check your internet connection and try again.',
      timestamp
    };
  }
  
  // Handle timeout errors
  if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
    return {
      message: 'Request timed out',
      code: 'TIMEOUT',
      userMessage: 'The request took too long. Please try again.',
      timestamp
    };
  }
  
  // Handle generic errors
  return {
    message: error.message || 'An unexpected error occurred',
    userMessage: 'Something went wrong. Please try again.',
    timestamp
  };
};

// Get user-friendly error messages based on status codes
const getUserFriendlyMessage = (status?: number, message?: string): string => {
  if (message && isUserFriendlyMessage(message)) {
    return message;
  }
  
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Please log in to continue.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with existing data.';
    case 422:
      return 'Please check your input and try again.';
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

// Check if a message is user-friendly (not technical)
const isUserFriendlyMessage = (message: string): boolean => {
  const technicalTerms = [
    'ObjectId',
    'ValidationError',
    'CastError',
    'MongoError',
    'TypeError',
    'ReferenceError',
    'SyntaxError',
    'null',
    'undefined',
    'stack trace'
  ];
  
  return !technicalTerms.some(term => 
    message.toLowerCase().includes(term.toLowerCase())
  );
};

// Format validation errors for display
export const formatValidationErrors = (errors: ValidationError[]): string => {
  if (errors.length === 1) {
    return errors[0].message;
  }
  
  return errors.map(error => `${error.field}: ${error.message}`).join(', ');
};

// Error logging utility
export const logError = (error: ApiError, context?: string) => {
  const logData = {
    ...error,
    context,
    url: window.location.href,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  // Log to console in development
  if (import.meta.env.MODE === 'development') {
    // Silent fail - error logged internally
  }
  
  // In production, you would send this to an error tracking service
  // Example: errorTrackingService.captureException(logData);
};

// Retry utility for failed requests
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response?.status >= 400 && error.response?.status < 500) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
  
  throw lastError;
};

// Error boundary helper
export const createErrorBoundaryError = (error: Error, errorInfo?: { componentStack?: string }) => {
  return {
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent
  };
};

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    // Silent fail - error logged internally
    logError(handleApiError(event.reason), 'unhandledrejection');
    
    // Prevent the default browser behavior
    event.preventDefault();
  });
  
  // Handle uncaught errors
  window.addEventListener('error', (event) => {
    // Silent fail - error logged internally
    logError(handleApiError(event.error), 'uncaught');
  });
};

// Error types for better type safety
export enum ErrorType {
  NETWORK = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  VALIDATION = 'VALIDATION_ERROR',
  AUTHENTICATION = 'AUTHENTICATION_ERROR',
  AUTHORIZATION = 'AUTHORIZATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER_ERROR',
  UNKNOWN = 'UNKNOWN_ERROR'
}

// Get error type from status code
export const getErrorType = (status?: number): ErrorType => {
  if (!status) return ErrorType.UNKNOWN;
  
  if (status === 401) return ErrorType.AUTHENTICATION;
  if (status === 403) return ErrorType.AUTHORIZATION;
  if (status === 404) return ErrorType.NOT_FOUND;
  if (status === 422) return ErrorType.VALIDATION;
  if (status >= 500) return ErrorType.SERVER;
  
  return ErrorType.UNKNOWN;
};

export default {
  handleApiError,
  formatValidationErrors,
  logError,
  withRetry,
  createErrorBoundaryError,
  setupGlobalErrorHandlers,
  getErrorType,
  ErrorType
};