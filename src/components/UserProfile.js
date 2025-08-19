'use client';

import { useAuth } from './AuthProvider';

export default function UserProfile() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading || !user) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingSkeleton}></div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.profileCard}>
        <div style={styles.avatarContainer}>
          <img
            src={user.picture}
            alt={`${user.name}'s profile picture`}
            style={styles.avatar}
            onError={(e) => {
              // Fallback to a default avatar if image fails to load
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff&size=120`;
            }}
          />
        </div>
        
        <div style={styles.userInfo}>
          <h2 style={styles.userName}>{user.name}</h2>
          <p style={styles.userEmail}>{user.email}</p>
        </div>

        <div style={styles.userDetails}>
          <div style={styles.detailItem}>
            <span style={styles.detailLabel}>ID:</span>
            <span style={styles.detailValue}>{user.id}</span>
          </div>
          {user.verified_email && (
            <div style={styles.verifiedBadge}>
              <span style={styles.verifiedIcon}>✓</span>
              Email Verified
            </div>
          )}
        </div>

        <button
          onClick={logout}
          style={styles.logoutButton}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#dc2626';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#ef4444';
          }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '80vh',
    padding: '2rem',
    fontFamily: 'var(--font-geist-sans)',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '3rem',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%',
  },
  avatarContainer: {
    marginBottom: '1.5rem',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid #e5e7eb',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },
  userInfo: {
    marginBottom: '2rem',
  },
  userName: {
    fontSize: '1.875rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '0.5rem',
    margin: 0,
  },
  userEmail: {
    fontSize: '1rem',
    color: '#6b7280',
    margin: '0.5rem 0 0 0',
  },
  userDetails: {
    marginBottom: '2rem',
    textAlign: 'left',
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.75rem 0',
    borderBottom: '1px solid #f3f4f6',
  },
  detailLabel: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#6b7280',
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#1f2937',
    fontFamily: 'var(--font-geist-mono)',
  },
  verifiedBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    backgroundColor: '#dcfdf7',
    color: '#065f46',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.875rem',
    fontWeight: '500',
    marginTop: '1rem',
  },
  verifiedIcon: {
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: '50%',
    width: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '0.75rem 2rem',
    fontSize: '1rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease-in-out',
    width: '100%',
  },
  loadingSkeleton: {
    backgroundColor: '#f3f4f6',
    borderRadius: '16px',
    width: '400px',
    height: '500px',
    animation: 'pulse 2s infinite',
  },
};

// Add pulse animation for loading skeleton
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('#user-profile-style');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'user-profile-style';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }
}
