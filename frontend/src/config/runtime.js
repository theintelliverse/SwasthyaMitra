const envApiUrl = import.meta.env.VITE_API_URL || '';
const envSocketUrl = import.meta.env.VITE_SOCKET_URL || '';

export const API_BASE_URL = envApiUrl.replace(/\/$/, '');
export const SOCKET_URL = envSocketUrl.replace(/\/$/, '');
