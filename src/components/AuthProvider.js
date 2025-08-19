'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getValidAccessToken, tokenStorage, getUserInfo } from '@/lib/auth';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if we have tokens
        if (!tokenStorage.hasTokens()) {
          setIsLoading(false);
          return;
        }

        // Try to get a valid access token (will refresh if needed)
        const accessToken = await getValidAccessToken();
        
        if (!accessToken) {
          // Token refresh failed, redirect to auth
          setIsLoading(false);
          return;
        }

        // Get user info
        const userInfo = await getUserInfo(accessToken);
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

  const logout = () => {
    tokenStorage.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    window.location.href = '/g/auth';
  };

  const contextValue = {
    isAuthenticated,
    isLoading,
    user,
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
