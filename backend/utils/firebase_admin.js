const admin = require('firebase-admin');

const projectId = process.env.FB_PROJECT_ID;
const clientEmail = process.env.FB_CLIENT_EMAIL;
const privateKey = process.env.FB_PRIVATE_KEY
    ? process.env.FB_PRIVATE_KEY.replace(/\\n/g, '\n')
    : null;

const hasFirebaseEnv = Boolean(projectId && clientEmail && privateKey);

if (hasFirebaseEnv && admin.apps.length === 0) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey
        })
    });
}

const getFirebaseAuth = () => {
    if (!hasFirebaseEnv || admin.apps.length === 0) {
        throw new Error('Firebase Admin is not configured. Set FB_PROJECT_ID, FB_CLIENT_EMAIL, and FB_PRIVATE_KEY.');
    }

    return admin.auth();
};

module.exports = { getFirebaseAuth };
