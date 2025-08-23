'use client';

import { useState } from 'react';
import { FaDownload } from 'react-icons/fa';
import styles from './FileCard.module.css';

export default function FileCard({ file, accessToken, onFileDownloaded }) {
  const [thumbnailError, setThumbnailError] = useState(false);
  const [thumbnailLoading, setThumbnailLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

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

  const handleDownload = async () => {
    if (!accessToken || !file.id || downloading) return;
    
    try {
      setDownloading(true);
      
      const response = await fetch('/api/download-and-move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId: file.id,
          fileName: file.name,
          accessToken: accessToken,
          parentId: file.parents?.[0] // Current folder ID to determine the correct Posted folder
        }),
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      // Get the file blob for download
      const blob = await response.blob();
      
      // Create download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Notify parent component that file was downloaded/moved
      if (onFileDownloaded) {
        onFileDownloaded(file.id);
      }

    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Failed to download file: ${error.message}`);
    } finally {
      setDownloading(false);
    }
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
        <div className={styles.fileActions}>
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
          <button
            onClick={handleDownload}
            disabled={downloading}
            className={styles.downloadButton}
            title="Download and move to Posted folder"
          >
            <FaDownload className={styles.downloadIcon} />
            {downloading ? 'Downloading...' : 'Download & Post'}
          </button>
        </div>
      </div>
    </div>
  );
}
