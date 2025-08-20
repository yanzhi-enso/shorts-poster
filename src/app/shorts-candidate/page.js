'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { getValidAccessToken } from '@/lib/auth';
import { listDriveFiles } from '@/lib/gdrive';
import styles from './page.module.css';

export default function ShortsCandidatePage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [oneMinFiles, setOneMinFiles] = useState([]);
  const [shortsFiles, setShortsFiles] = useState([]);

  // Google Drive folder IDs
  const ONE_MIN_FOLDER_ID = '1rhc9L6ISTDbrZ6swO6COQa9gA24dopcT';
  const SHORTS_FOLDER_ID = '1zAH7h3LcquWdF-OEuBI_OeXagRD3rPce';

  useEffect(() => {
    const fetchFiles = async () => {
      if (authLoading || !user) return;

      try {
        setLoading(true);
        setError(null);

        // Get valid access token
        const accessToken = await getValidAccessToken();
        if (!accessToken) {
          // Token validation failed, redirect to auth
          window.location.href = '/g/auth';
          return;
        }

        // Fetch files from both folders in parallel
        const [oneMinResponse, shortsResponse] = await Promise.all([
          listDriveFiles(accessToken, {
            q: `'${ONE_MIN_FOLDER_ID}' in parents and trashed=false`,
            pageSize: 100
          }),
          listDriveFiles(accessToken, {
            q: `'${SHORTS_FOLDER_ID}' in parents and trashed=false`,
            pageSize: 100
          })
        ]);

        // Filter to only show MP4 files (exclude folders)
        const filterVideoFiles = (files) => 
          files.filter(file => 
            file.mimeType === 'video/mp4' || 
            (file.name && file.name.toLowerCase().endsWith('.mp4'))
          );

        setOneMinFiles(filterVideoFiles(oneMinResponse.files || []));
        setShortsFiles(filterVideoFiles(shortsResponse.files || []));

      } catch (err) {
        console.error('Error fetching files:', err);
        setError(err.message);
        
        // If it's an auth error, redirect to auth page
        if (err.message.includes('401') || err.message.includes('unauthorized')) {
          window.location.href = '/g/auth';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [user, authLoading]);

  // Show loading while auth is checking
  if (authLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p className={styles.loadingText}>Checking authentication...</p>
      </div>
    );
  }

  // Show loading while fetching files
  if (loading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Shorts Candidate</h1>
          <p className={styles.subtitle}>Loading video files...</p>
        </header>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p className={styles.loadingText}>Fetching files from Google Drive...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Shorts Candidate</h1>
          <p className={styles.subtitle}>Error loading files</p>
        </header>
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Shorts Candidate</h1>
        <p className={styles.subtitle}>Video files from Google Drive folders</p>
      </header>

      <main className={styles.main}>
        <div className={styles.columnsContainer}>
          {/* One Min Folder Column */}
          <div className={styles.column}>
            <h2 className={styles.columnTitle}>
              One Min Videos ({oneMinFiles.length})
            </h2>
            <div className={styles.filesList}>
              {oneMinFiles.length === 0 ? (
                <p className={styles.emptyMessage}>No video files found</p>
              ) : (
                oneMinFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))
              )}
            </div>
          </div>

          {/* Shorts Folder Column */}
          <div className={styles.column}>
            <h2 className={styles.columnTitle}>
              Shorts Videos ({shortsFiles.length})
            </h2>
            <div className={styles.filesList}>
              {shortsFiles.length === 0 ? (
                <p className={styles.emptyMessage}>No video files found</p>
              ) : (
                shortsFiles.map((file) => (
                  <FileCard key={file.id} file={file} />
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// File card component
function FileCard({ file }) {
  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className={styles.fileCard}>
      <div className={styles.fileIcon}>🎥</div>
      <div className={styles.fileInfo}>
        <h3 className={styles.fileName}>{file.name}</h3>
        <div className={styles.fileDetails}>
          <p className={styles.fileDetail}>Size: {formatFileSize(file.size)}</p>
          <p className={styles.fileDetail}>Modified: {formatDate(file.modifiedTime)}</p>
        </div>
        {file.webViewLink && (
          <a 
            href={file.webViewLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.viewLink}
          >
            View in Drive
          </a>
        )}
      </div>
    </div>
  );
}
