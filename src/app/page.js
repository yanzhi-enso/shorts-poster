'use client';

import { useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import styles from './page.module.css';

export default function Home() {
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // If user is authenticated, redirect to shorts-candidate page
    if (!isLoading && user) {
      window.location.href = '/shorts-candidate';
    }
  }, [user, isLoading]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Loading...</p>
      </div>
    );
  }

  // This should not be reached since AuthProvider redirects unauthenticated users to /g/auth
  // But just in case, show a fallback
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Shorts Poster</h1>
        <p className={styles.subtitle}>Redirecting...</p>
      </header>
    </div>
  );
}
