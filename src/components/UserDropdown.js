'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { FaUser, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

export default function UserDropdown() {
  const { user, logout, isLoading } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  if (isLoading || !user) {
    return (
      <div style={styles.loadingSkeleton}>
        <div style={styles.avatarSkeleton}></div>
      </div>
    );
  }

  const handleLogoutClick = () => {
    setShowConfirmDialog(true);
    setIsDropdownOpen(false);
  };

  const confirmLogout = () => {
    setShowConfirmDialog(false);
    logout();
  };

  const cancelLogout = () => {
    setShowConfirmDialog(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (!e.target.closest('.user-dropdown-container')) {
      setIsDropdownOpen(false);
    }
  };

  // Add event listener for clicking outside
  if (typeof window !== 'undefined') {
    if (isDropdownOpen) {
      document.addEventListener('click', handleClickOutside);
    } else {
      document.removeEventListener('click', handleClickOutside);
    }
  }

  return (
    <>
      <div className="user-dropdown-container" style={styles.container}>
        <button
          onClick={toggleDropdown}
          style={{
            ...styles.triggerButton,
            ...(isDropdownOpen ? styles.triggerButtonActive : {})
          }}
          onMouseOver={(e) => {
            if (!isDropdownOpen) {
              e.target.style.backgroundColor = '#f3f4f6';
            }
          }}
          onMouseOut={(e) => {
            if (!isDropdownOpen) {
              e.target.style.backgroundColor = 'transparent';
            }
          }}
        >
          <img
            src={user.picture}
            alt={`${user.name}'s profile picture`}
            style={styles.avatar}
            onError={(e) => {
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff&size=40`;
            }}
          />
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user.name}</span>
            <span style={styles.userEmail}>{user.email}</span>
          </div>
          <FaChevronDown 
            style={{
              ...styles.chevron,
              transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
            }} 
          />
        </button>

        {isDropdownOpen && (
          <div style={styles.dropdown}>
            <div style={styles.dropdownHeader}>
              <img
                src={user.picture}
                alt={`${user.name}'s profile picture`}
                style={styles.dropdownAvatar}
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=1976d2&color=fff&size=48`;
                }}
              />
              <div style={styles.dropdownUserInfo}>
                <div style={styles.dropdownUserName}>{user.name}</div>
                <div style={styles.dropdownUserEmail}>{user.email}</div>
              </div>
            </div>
            
            <div style={styles.dropdownDivider}></div>
            
            <button
              onClick={handleLogoutClick}
              style={styles.logoutButton}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#fef2f2';
                e.target.style.color = '#dc2626';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#374151';
              }}
            >
              <FaSignOutAlt style={styles.logoutIcon} />
              Sign Out
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div style={styles.overlay}>
          <div style={styles.confirmDialog}>
            <h3 style={styles.confirmTitle}>Confirm Logout</h3>
            <p style={styles.confirmMessage}>
              Are you sure you want to sign out?
            </p>
            <div style={styles.confirmButtons}>
              <button
                onClick={cancelLogout}
                style={styles.cancelButton}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#ffffff';
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                style={styles.confirmButton}
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
        </div>
      )}
    </>
  );
}

const styles = {
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  loadingSkeleton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  avatarSkeleton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    animation: 'pulse 2s infinite',
  },
  triggerButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '200px',
  },
  triggerButtonActive: {
    backgroundColor: '#f3f4f6',
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e5e7eb',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#1f2937',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '120px',
  },
  userEmail: {
    fontSize: '0.75rem',
    color: '#6b7280',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '120px',
  },
  chevron: {
    fontSize: '0.75rem',
    color: '#6b7280',
    transition: 'transform 0.2s ease',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '0.25rem',
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    minWidth: '250px',
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1rem',
    backgroundColor: '#f9fafb',
  },
  dropdownAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #e5e7eb',
  },
  dropdownUserInfo: {
    flex: 1,
    minWidth: 0,
  },
  dropdownUserName: {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.25rem',
  },
  dropdownUserEmail: {
    fontSize: '0.875rem',
    color: '#6b7280',
    wordBreak: 'break-word',
  },
  dropdownDivider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    width: '100%',
    padding: '0.75rem 1rem',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    transition: 'all 0.2s ease',
  },
  logoutIcon: {
    fontSize: '1rem',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  },
  confirmDialog: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    maxWidth: '400px',
    width: '90%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  confirmTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.75rem',
    margin: '0 0 0.75rem 0',
  },
  confirmMessage: {
    fontSize: '1rem',
    color: '#6b7280',
    marginBottom: '1.5rem',
    margin: '0 0 1.5rem 0',
  },
  confirmButtons: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    padding: '0.5rem 1rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  confirmButton: {
    padding: '0.5rem 1rem',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#ef4444',
    color: '#ffffff',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
};

// Add animations
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('#user-dropdown-style');
  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = 'user-dropdown-style';
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);
  }
}
