// services/firebase/auth/client.js
import { app } from 'services/firebase/base/client';
import {
    getAuth,
    GoogleAuthProvider,
    signInWithCredential,
    onAuthStateChanged,
    signOut,
    signInWithPopup,
} from 'firebase/auth';

let auth = null;
if (typeof window !== 'undefined') {
    auth = getAuth(app);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('openid');
googleProvider.addScope('profile');
googleProvider.addScope('email');
googleProvider.addScope('https://www.googleapis.com/auth/drive');

export async function signInWithGoogleTokens({ idToken, accessToken }) {
    if (!auth) throw new Error('Firebase Auth is not initialized on this environment.');
    if (!idToken && !accessToken) {
        throw new Error('Missing Google tokens for credential sign-in');
    }

    const credential = GoogleAuthProvider.credential(idToken, accessToken);
    return signInWithCredential(auth, credential);
}

export function onAuthStateChangedListener(callback) {
    if (!auth) return () => {};
    return onAuthStateChanged(auth, callback);
}

export function signOutUser() {
    if (!auth) return Promise.resolve();
    return signOut(auth);
}

export async function signInWithGooglePopup() {
    if (!auth) throw new Error('Firebase Auth is not initialized on this environment.');
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    return {
        result,
        user: result?.user ?? null,
        credential,
        accessToken: credential?.accessToken ?? null,
        idToken: credential?.idToken ?? null,
    };
}

export const getIdToken = async () => {
    if (!auth) return null;
    const user = auth.currentUser;
    if (user) {
        return await user.getIdToken();
    }
    return null;
}

export { auth };

export const requireAuth = () => {
    const instance = auth ?? getAuth(app);
    const user = instance?.currentUser;
    if (!user) {
        throw new Error('Authentication required');
    }
    return user;
};
