import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FB_API_KEY,
    authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FB_PROJECT_ID,
    appId: import.meta.env.VITE_FB_APP_ID,
    messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID
};

const hasRequiredFirebaseConfig = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let firebaseAuth = null;

if (hasRequiredFirebaseConfig) {
    try {
        const firebaseApp = initializeApp(firebaseConfig);
        firebaseAuth = getAuth(firebaseApp);
    } catch {
        firebaseAuth = null;
    }
}

export const isFirebaseConfigured = hasRequiredFirebaseConfig && Boolean(firebaseAuth);
export { firebaseAuth };
