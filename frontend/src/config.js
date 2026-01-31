const isDevelopment = window.location.hostname === 'localhost';

export const API_URL = isDevelopment
  ? 'http://localhost:3001' 
  : 'cafecito-production-eab0.up.railway.app'