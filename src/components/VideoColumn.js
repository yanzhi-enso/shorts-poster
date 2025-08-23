'use client';

import FileCard from './FileCard';
import styles from './VideoColumn.module.css';

export default function VideoColumn({ title, files, accessToken, emptyMessage = "No video files found", onFileDownloaded }) {
  return (
    <div className={styles.videoColumn}>
      <h2 className={styles.videoColumnTitle}>
        {title} ({files.length})
      </h2>
      <div className={styles.videoColumnFilesList}>
        {files.length === 0 ? (
          <p className={styles.videoColumnEmptyMessage}>{emptyMessage}</p>
        ) : (
          files.map((file) => <FileCard key={file.id} file={file} accessToken={accessToken} onFileDownloaded={onFileDownloaded} />)
        )}
      </div>
    </div>
  );
}
