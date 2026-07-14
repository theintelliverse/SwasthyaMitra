export const API_URL = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).replace(/\/$/, '');
export const API_BASE_URL = API_URL;
const defaultSocketUrl = import.meta.env.DEV ? API_URL : '';
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || defaultSocketUrl).replace(/\/$/, '');
