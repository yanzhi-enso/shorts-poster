'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { listDriveFiles } from '@/lib/gdrive';
import UserDropdown from '@/components/UserDropdown';
import styles from './page.module.css';

export default function ShortsCandidatePage() {
  const { user, isLoading: authLoading, accessToken, getAccessToken } = useAuth();
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

        // Get valid access token from AuthProvider
        const token = await getAccessToken();
        if (!token) {
          // Token validation failed, will be handled by AuthProvider
          return;
        }

        // Fetch files from both folders in parallel
        const [oneMinResponse, shortsResponse] = await Promise.all([
          listDriveFiles(token, {
            q: `'${ONE_MIN_FOLDER_ID}' in parents and trashed=false`,
            pageSize: 100
          }),
          listDriveFiles(token, {
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

        const oneMinFiltered = filterVideoFiles(oneMinResponse.files || []);
        const shortsFiltered = filterVideoFiles(shortsResponse.files || []);

        // Debug: Log the first file to see what data we're getting
        if (oneMinFiltered.length > 0) {
          console.log('Debug - First One Min file data:', oneMinFiltered[0]);
          console.log('Debug - Has thumbnailLink?', !!oneMinFiltered[0].thumbnailLink);
          console.log('Debug - ThumbnailLink value:', oneMinFiltered[0].thumbnailLink);
        }
        if (shortsFiltered.length > 0) {
          console.log('Debug - First Shorts file data:', shortsFiltered[0]);
          console.log('Debug - Has thumbnailLink?', !!shortsFiltered[0].thumbnailLink);
          console.log('Debug - ThumbnailLink value:', shortsFiltered[0].thumbnailLink);
        }

        setOneMinFiles(oneMinFiltered);
        setShortsFiles(shortsFiltered);

      } catch (err) {
        console.error('Error fetching files:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFiles();
  }, [user, authLoading, getAccessToken]);

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
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Shorts Candidate</h1>
                    <p className={styles.subtitle}>Loading video files...</p>
                </div>
                <div className={styles.headerRight}>
                    <UserDropdown />
                </div>
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
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Shorts Candidate</h1>
                    <p className={styles.subtitle}>Error loading files</p>
                </div>
                <div className={styles.headerRight}>
                    <UserDropdown />
                </div>
            </header>
            <div className={styles.errorContainer}>
                <p className={styles.errorText}>Error: {error}</p>
                <button onClick={() => window.location.reload()} className={styles.retryButton}>
                    Retry
                </button>
            </div>
        </div>
    );
  }

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.title}>Shorts Candidate</h1>
                </div>
                <div className={styles.headerRight}>
                    <UserDropdown />
                </div>
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
                                oneMinFiles.map((file) => <FileCard key={file.id} file={file} accessToken={accessToken} />)
                            )}
                        </div>
                    </div>

                    {/* Shorts Folder Column */}
                    <div className={styles.column}>
                        <h2 className={styles.columnTitle}>Shorts Videos ({shortsFiles.length})</h2>
                        <div className={styles.filesList}>
                            {shortsFiles.length === 0 ? (
                                <p className={styles.emptyMessage}>No video files found</p>
                            ) : (
                                shortsFiles.map((file) => <FileCard key={file.id} file={file} accessToken={accessToken} />)
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// File card component
function FileCard({ file, accessToken }) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);

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

  // Generate thumbnail URL with authentication and size
  const getThumbnailUrl = () => {
    if (!file.thumbnailLink || !accessToken) {
      console.log(`Debug - FileCard ${file.name}: No thumbnail URL - thumbnailLink: ${!!file.thumbnailLink}, accessToken: ${!!accessToken}`);
      return null;
    }
    // Add size parameter for 150x150 and access token for authentication
    const url = `${file.thumbnailLink}=s150&access_token=${accessToken}`;
    console.log(`Debug - FileCard ${file.name}: Generated thumbnail URL:`, url);
    return url;
  };

  const thumbnailUrl = getThumbnailUrl();

  const handleThumbnailLoad = () => {
    console.log(`Debug - FileCard ${file.name}: Thumbnail loaded successfully`);
    setThumbnailLoading(false);
  };

  const handleThumbnailError = (error) => {
    console.log(`Debug - FileCard ${file.name}: Thumbnail failed to load`, error);
    console.log(`Debug - FileCard ${file.name}: Failed URL was:`, thumbnailUrl);
    setThumbnailError(true);
    setThumbnailLoading(false);
  };

  return (
    <div className={styles.fileCard}>
      <div className={styles.fileIcon}>
        {!thumbnailUrl || thumbnailError ? (
          // Fallback to emoji if no thumbnail or error
          <span className={styles.videoEmoji}>🎥</span>
        ) : (
          <div className={styles.thumbnailContainer}>
            {thumbnailLoading && (
              <div className={styles.thumbnailLoading}>
                <span className={styles.videoEmoji}>🎥</span>
              </div>
            )}
            <img
              src={thumbnailUrl}
              alt={`Thumbnail for ${file.name}`}
              className={styles.thumbnail}
              onLoad={handleThumbnailLoad}
              onError={handleThumbnailError}
              style={{ display: thumbnailLoading ? 'none' : 'block' }}
            />
          </div>
        )}
      </div>
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
