import UserProfile from '@/components/UserProfile';

export default function Home() {
  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.title}>Shorts Poster</h1>
        <p style={styles.subtitle}>Welcome to your authenticated dashboard</p>
      </header>
      
      <main style={styles.main}>
        <UserProfile />
      </main>
      
      <footer style={styles.footer}>
        <p style={styles.footerText}>
          Powered by Google OAuth 2.0 & Next.js
        </p>
      </footer>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f9fafb',
    fontFamily: 'var(--font-geist-sans)',
  },
  header: {
    textAlign: 'center',
    padding: '2rem 1rem 1rem',
    backgroundColor: 'white',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    fontSize: '3rem',
    fontWeight: '800',
    color: '#1f2937',
    margin: '0 0 0.5rem 0',
    background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '1.125rem',
    color: '#6b7280',
    margin: 0,
  },
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    textAlign: 'center',
    padding: '2rem 1rem',
    backgroundColor: 'white',
    borderTop: '1px solid #e5e7eb',
  },
  footerText: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    margin: 0,
  },
};
