'use client';

import { useState } from 'react';
import styles from './FileCard.module.css';

export default function FileCard({ file, accessToken }) {
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
