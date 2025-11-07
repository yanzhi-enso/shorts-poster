'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    signInWithGoogleTokens,
    signOutUser,
    onAuthStateChangedListener,
    auth,
    signInWithGooglePopup,
} from 'services/firebase/auth/client';

const ACCESS_TOKEN_STORAGE_KEY = 'shorts_poster_google_access_token';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [accessToken, setAccessToken] = useState(null);
    const router = useRouter();

    const persistAccessToken = useCallback((token) => {
        if (typeof window === 'undefined') return;
        if (token) {
            localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
        } else {
            localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const storedToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
        if (storedToken) {
            setAccessToken(storedToken);
        }
    }, []);

    const buildUserData = (firebaseUser) => {
        if (!firebaseUser) return null;
        return {
            uid: firebaseUser.uid,
            id: firebaseUser.uid,
            email: firebaseUser.email,
            name: firebaseUser.displayName || firebaseUser.email || 'Unknown User',
            photoURL: firebaseUser.photoURL,
            picture: firebaseUser.photoURL,
            verified_email: firebaseUser.emailVerified,
        };
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChangedListener((firebaseUser) => {
            const userData = buildUserData(firebaseUser);
            setUser(userData);
            if (!firebaseUser) {
                setAccessToken(null);
                persistAccessToken(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [persistAccessToken]);

    const authenticateWithGoogleTokens = useCallback(async ({ idToken, accessToken }) => {
        try {
            setLoading(true);
            const result = await signInWithGoogleTokens({ idToken, accessToken });
            const firebaseUser = result?.user || auth?.currentUser;

            if (firebaseUser) {
                const userData = buildUserData(firebaseUser);
                setUser(userData);
            }

            if (accessToken) {
                setAccessToken(accessToken);
                persistAccessToken(accessToken);
            }

            setLoading(false);
            return result;
        } catch (error) {
            console.error('Firebase credential sign-in failed:', error);
            setLoading(false);
            throw error;
        }
    }, [persistAccessToken]);

    const loginWithGoogle = useCallback(async () => {
        try {
            setLoading(true);
            const { user: firebaseUser, accessToken: googleAccessToken } = await signInWithGooglePopup();
            const userData = buildUserData(firebaseUser);
            setUser(userData);
            if (googleAccessToken) {
                setAccessToken(googleAccessToken);
                persistAccessToken(googleAccessToken);
            }
        } catch (error) {
            console.error('Firebase Google popup sign-in failed:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [persistAccessToken]);

    const logout = async () => {
        try {
            await signOutUser();
            setUser(null);
            setAccessToken(null);
            persistAccessToken(null);
            router.push('/g/auth');
        } catch (error) {
            console.error('Logout failed:', error);
            throw error;
        }
    };

    const getAccessToken = useCallback(async () => {
        if (accessToken) {
            return accessToken;
        }

        if (typeof window !== 'undefined') {
            const storedToken = localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
            if (storedToken) {
                setAccessToken(storedToken);
                return storedToken;
            }
        }
        return null;
    }, [accessToken]);

    const value = {
        user,
        loading,
        isLoading: loading,
        logout,
        authenticateWithGoogleTokens,
        loginWithGoogle,
        isAuthenticated: !!user,
        accessToken,
        getAccessToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
