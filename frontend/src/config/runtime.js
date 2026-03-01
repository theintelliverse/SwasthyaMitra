export const API_BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const defaultSocketUrl = import.meta.env.DEV ? 'http://localhost:5000' : '';
export const SOCKET_URL = (import.meta.env.VITE_SOCKET_URL || defaultSocketUrl).replace(/\/$/, '');
