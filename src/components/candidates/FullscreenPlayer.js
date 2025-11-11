'use client';

import { useEffect } from 'react';
import StreamVideoPlayer from 'components/StreamVideoPlayer';
import styles from './FullscreenPlayer.module.css';

const FullscreenPlayer = ({ video, onClose }) => {
    useEffect(() => {
        if (!video) {
            return undefined;
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [video, onClose]);

    if (!video) {
        return null;
    }

    const title = video.title || 'Untitled video';

    return (
        <div className={styles.backdrop} role="dialog" aria-modal="true">
            <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Close viewer">
                ×
            </button>
            <div className={styles.playerWrapper}>
                {video.videoManifestUrl ? (
                    <StreamVideoPlayer manifestUrl={video.videoManifestUrl} className={styles.player} />
                ) : (
                    <div className={styles.playerFallback}>No manifest URL available.</div>
                )}
            </div>
            <div className={styles.meta}>
                <h3 className={styles.metaTitle}>{title}</h3>
                <p className={styles.metaSubtitle}>
                    {video.category?.toUpperCase()} · {video.type} · Project {video.projectId}
                </p>
                <div className={styles.metaGrid}>
                    <div>
                        <span className={styles.metaLabel}>Status</span>
                        <span className={styles.metaValue}>{video.status}</span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Author</span>
                        <span className={styles.metaValue}>{video.authorName}</span>
                    </div>
                    <div>
                        <span className={styles.metaLabel}>Created</span>
                        <span className={styles.metaValue}>
                            {video.createdAt?.toLocaleDateString?.() ?? '—'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullscreenPlayer;
