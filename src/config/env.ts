// Environment configuration

// API URL - change this based on environment
export const API_URL = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000/api';
export const APP_TITLE = 'Solewaale';
export const APP_DESCRIPTION = 'Premium footwear with seamless shopping experience';

export const APP_ENV = import.meta.env.MODE || 'development';
export const IS_PRODUCTION = APP_ENV === 'production';
export const IS_DEVELOPMENT = APP_ENV === 'development';