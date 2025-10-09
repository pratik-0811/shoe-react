// Environment configuration

// API URL - change this based on environment
const getApiUrl = () => {
  // Check if we're in production (on solewaale.com domain)
  if (typeof window !== 'undefined' && window.location.hostname.includes('solewaale.com')) {
    return 'https://api.solewaale.com/api';
  }
  // Use environment variable or fallback to localhost for development
  return import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api';
};

export const API_URL = getApiUrl();
export const APP_TITLE = 'Solewaale';
export const APP_DESCRIPTION = 'Premium footwear with seamless shopping experience';

export const APP_ENV = import.meta.env.MODE || 'development';
export const IS_PRODUCTION = APP_ENV === 'production' || (typeof window !== 'undefined' && window.location.hostname.includes('solewaale.com'));
export const IS_DEVELOPMENT = APP_ENV === 'development' && !(typeof window !== 'undefined' && window.location.hostname.includes('solewaale.com'));