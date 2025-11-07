import { getFirebaseAdminAuth } from '../base/server';

export async function getUserDisplayName(uid) {
    if (!uid) {
        return null;
    }

    try {
        const auth = getFirebaseAdminAuth();
        const userRecord = await auth.getUser(uid);
        return userRecord.displayName || userRecord.email || uid;
    } catch (error) {
        console.warn('Failed to resolve display name for user', uid, error);
        return uid;
    }
}
