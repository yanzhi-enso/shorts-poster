import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let adminApp = null;
let adminAuth = null;

// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
    if (adminApp) {
        return { app: adminApp, auth: adminAuth };
    }

    try {
        // Check if any admin apps are already initialized
        const existingApps = getApps();
        if (existingApps.length > 0) {
            adminApp = existingApps[0];
        } else {
            adminApp = initializeApp();
        }

        adminAuth = getAuth(adminApp);
        return { app: adminApp, auth: adminAuth };
    } catch (error) {
        console.error("Failed to initialize Firebase Admin:", error);
        throw error;
    }
}

// Get Firebase Admin Auth instance
export function getFirebaseAdminAuth() {
    if (!adminAuth) {
        const { auth } = initializeFirebaseAdmin();
        return auth;
    }
    return adminAuth;
}

// Verify Firebase ID token and extract user info
export async function verifyFirebaseToken(idToken) {
    try {
        const auth = getFirebaseAdminAuth();
        const decodedToken = await auth.verifyIdToken(idToken);

        return {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            picture: decodedToken.picture,
        };
    } catch (error) {
        console.error("Error verifying Firebase token:", error);
        throw new Error("Invalid or expired Firebase token");
    }
}

export { adminApp, adminAuth };
