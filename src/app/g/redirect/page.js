'use client';

import { useEffect, useState } from 'react';
import { exchangeCodeForTokens, tokenStorage } from '@/lib/auth';

export default function RedirectPage() {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        // Get the authorization code from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        setStatus('exchanging');

        // Exchange the authorization code for tokens
        const tokens = await exchangeCodeForTokens(code);

        if (!tokens.access_token || !tokens.refresh_token) {
          throw new Error('Invalid tokens received from Google');
        }

        // Store tokens in localStorage (separate lines as requested)
        tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);

        setStatus('success');

        // Redirect to home page after a brief delay
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);

      } catch (err) {
        console.error('OAuth callback error:', err);
        setError(err.message);
        setStatus('error');
      }
    };

    handleOAuthCallback();
  }, []);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <>
            <div style={styles.spinner}></div>
            <h2 style={styles.title}>Processing authentication...</h2>
            <p style={styles.description}>Please wait while we complete your login.</p>
          </>
        );

      case 'exchanging':
        return (
          <>
            <div style={styles.spinner}></div>
            <h2 style={styles.title}>Completing sign in...</h2>
            <p style={styles.description}>Getting your account information from Google.</p>
          </>
        );

      case 'success':
        return (
          <>
            <div style={styles.checkmark}>✓</div>
            <h2 style={styles.title}>Success!</h2>
            <p style={styles.description}>
              You have been successfully authenticated. Redirecting to home page...
            </p>
          </>
        );

      case 'error':
        return (
          <>
            <div style={styles.errorIcon}>✗</div>
            <h2 style={styles.title}>Authentication Failed</h2>
            <p style={styles.description}>
              {error || 'An error occurred during authentication.'}
            </p>
            <button
              onClick={() => window.location.href = '/g/auth'}
              style={styles.retryButton}
            >
              Try Again
            </button>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {renderContent()}
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    fontFamily: 'var(--font-geist-sans)',
  },
  card: {
    backgroundColor: 'white',
    padding: '3rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
    margin: '0 1rem',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  description: {
    fontSize: '1rem',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '1rem',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #1976d2',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 1.5rem',
  },
  checkmark: {
    width: '60px',
    height: '60px',
    backgroundColor: '#10b981',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontSize: '2rem',
    color: 'white',
    fontWeight: 'bold',
  },
  errorIcon: {
    width: '60px',
    height: '60px',
    backgroundColor: '#ef4444',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1.5rem',
    fontSize: '2rem',
    color: 'white',
    fontWeight: 'bold',
  },
  retryButton: {
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    marginTop: '1rem',
  },
};

// Add spinner animation via a style tag
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
