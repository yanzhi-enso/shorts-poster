'use client';

import { useEffect, useState } from 'react';
import { exchangeCodeForTokens, tokenStorage } from '@/lib/auth';
import styles from './page.module.css';

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
            <div className={styles.spinner}></div>
            <h2 className={styles.title}>Processing authentication...</h2>
            <p className={styles.description}>Please wait while we complete your login.</p>
          </>
        );

      case 'exchanging':
        return (
          <>
            <div className={styles.spinner}></div>
            <h2 className={styles.title}>Completing sign in...</h2>
            <p className={styles.description}>Getting your account information from Google.</p>
          </>
        );

      case 'success':
        return (
          <>
            <div className={styles.checkmark}>✓</div>
            <h2 className={styles.title}>Success!</h2>
            <p className={styles.description}>
              You have been successfully authenticated. Redirecting to home page...
            </p>
          </>
        );

      case 'error':
        return (
          <>
            <div className={styles.errorIcon}>✗</div>
            <h2 className={styles.title}>Authentication Failed</h2>
            <p className={styles.description}>
              {error || 'An error occurred during authentication.'}
            </p>
            <button
              onClick={() => window.location.href = '/g/auth'}
              className={styles.retryButton}
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
    <div className={styles.container}>
      <div className={styles.card}>
        {renderContent()}
      </div>
    </div>
  );
}
