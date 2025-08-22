'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getValidAccessToken, tokenStorage, getUserInfo } from '@/lib/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if we have tokens
        if (!tokenStorage.hasTokens()) {
          setIsLoading(false);
          return;
        }

        // Try to get a valid access token (will refresh if needed)
        const validAccessToken = await getValidAccessToken();
        
        if (!validAccessToken) {
          // Token refresh failed, redirect to auth
          setIsLoading(false);
          return;
        }

        // Store the access token
        setAccessToken(validAccessToken);

        // Get user info
        const userInfo = await getUserInfo(validAccessToken);
        setUser(userInfo);
        setIsAuthenticated(true);
        
      } catch (error) {
        console.error('Authentication check failed:', error);
        // Clear invalid tokens
        tokenStorage.clearTokens();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  // Redirect to auth page if not authenticated and not loading
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Only redirect if we're not already on an auth page
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith('/g/')) {
        window.location.href = '/g/auth';
      }
    }
  }, [isLoading, isAuthenticated]);

  const getAccessToken = async () => {
    try {
      // If we already have a valid token, return it
      if (accessToken) {
        return accessToken;
      }

      // Try to get a valid access token (will refresh if needed)
      const validAccessToken = await getValidAccessToken();
      
      if (!validAccessToken) {
        // Token refresh failed, redirect to auth
        window.location.href = '/g/auth';
        return null;
      }

      // Update the stored access token
      setAccessToken(validAccessToken);
      return validAccessToken;
    } catch (error) {
      console.error('Error getting access token:', error);
      // Clear invalid tokens and redirect
      tokenStorage.clearTokens();
      window.location.href = '/g/auth';
      return null;
    }
  };

  const logout = () => {
    tokenStorage.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    setAccessToken(null);
    window.location.href = '/g/auth';
  };

  const contextValue = {
    isAuthenticated,
    isLoading,
    user,
    accessToken,
    getAccessToken,
    logout,
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div style={loadingStyles.container}>
        <div style={loadingStyles.spinner}></div>
        <p style={loadingStyles.text}>Loading...</p>
      </div>
    );
  }

  // Don't render children if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const loadingStyles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'var(--font-geist-sans)',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #1976d2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1rem',
  },
  text: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: 0,
  },
};

// Add spinner animation
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('#auth-spinner-style');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'auth-spinner-style';
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}
