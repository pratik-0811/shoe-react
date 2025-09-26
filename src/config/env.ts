// Environment configuration

// API URL - change this based on environment
export const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api';

// Other environment variables
export const APP_TITLE = import.meta.env.VITE_APP_TITLE || 'Luxora Shoe Store';
export const APP_DESCRIPTION = import.meta.env.VITE_APP_DESCRIPTION || 'Premium shoe store with the latest styles and brands';

// Environment detection
export const APP_ENV = import.meta.env.MODE || 'development';
export const IS_PRODUCTION = APP_ENV === 'production';
export const IS_DEVELOPMENT = APP_ENV === 'development';