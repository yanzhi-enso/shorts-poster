'use client';

import Link from 'next/link';
import { useAuth } from '@/authManager/authContext';
import styles from './page.module.css';

export default function Home() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Checking your session…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Shorts Poster</h1>
          <p className={styles.subtitle}>You&apos;re signed in and ready to go.</p>
        </header>
        <main className={styles.main}>
          <div className={styles.statusCard}>
            <p className={styles.statusText}>
              Logged in as <strong>{user.name || user.email}</strong>
            </p>
            <p className={styles.statusSubtext}>
              Continue managing videos by heading to the Shorts Candidate dashboard.
            </p>
            <Link href="/shorts-candidate" className={styles.primaryButton}>
              Open Shorts Candidate
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Shorts Poster</h1>
        <p className={styles.subtitle}>Please sign in to access your workspace.</p>
      </header>
      <main className={styles.main}>
        <div className={styles.statusCard}>
          <p className={styles.statusText}>You&apos;re not logged in.</p>
          <p className={styles.statusSubtext}>
            Use your Google account to continue.
          </p>
          <Link href="/g/auth" className={styles.primaryButton}>
            Go to Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
