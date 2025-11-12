'use client';

import { useCallback, useEffect, useState } from 'react';
import StreamVideoPlayer from 'components/StreamVideoPlayer';
import { getIdToken } from 'services/firebase/auth/client.js';
import { claimVideoRecord } from 'utils/backend.js';
import styles from './FullscreenPlayer.module.css';

const ensureDownloadExtension = (filename) =>
    /\.[a-z0-9]+$/i.test(filename) ? filename : `${filename}.mp4`;

const getDownloadFileName = (video) => {
    const fallbackBase = video.projectId || video.title || 'video';
    try {
        const url = new URL(video.videoUrl);
        const lastSegment = url.pathname.split('/').filter(Boolean).pop();
        if (lastSegment) {
            return ensureDownloadExtension(decodeURIComponent(lastSegment));
        }
    } catch {
        // noop - fall back to derived filename below
    }
    const trimmed = `${fallbackBase}`.trim() || 'video';
    return ensureDownloadExtension(trimmed);
};

const triggerFileDownload = (fileUrl, filename) => {
    const anchor = document.createElement('a');
    anchor.href = fileUrl;
    anchor.download = filename;
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
};

const FullscreenPlayer = ({ video, onClose, onClaimSuccess }) => {
    const [claimFeedback, setClaimFeedback] = useState(null);
    const [claiming, setClaiming] = useState(false);

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

    useEffect(() => {
        setClaimFeedback(null);
        setClaiming(false);
    }, [video]);

    const handleClaim = useCallback(async () => {
        if (!video || claiming) {
            return;
        }

        setClaimFeedback(null);
        setClaiming(true);

        try {
            const token = await getIdToken();
            if (!token) {
                setClaimFeedback({
                    type: 'error',
                    text: 'Authentication required. Please sign in and try again.',
                });
                return;
            }

            await claimVideoRecord(token, video.projectId);

            if (video.videoUrl) {
                const filename = getDownloadFileName(video);
                triggerFileDownload(video.videoUrl, filename);
            } else {
                console.warn('No video URL available to download for project', video.projectId);
            }

            onClaimSuccess?.(video);
        } catch (error) {
            if (error?.status === 409) {
                setClaimFeedback({
                    type: 'error',
                    text: "Oops, sorry you're too late, the video is taken by someone.",
                });
                return;
            }

            // TODO: Capture this exception with Sentry.
            setClaimFeedback({
                type: 'error',
                text: 'Server error. Please try again.',
            });
        } finally {
            setClaiming(false);
        }
    }, [video, claiming, onClaimSuccess]);

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
                <div className={styles.actions}>
                    <button
                        type="button"
                        className={styles.claimButton}
                        onClick={handleClaim}
                        disabled={claiming}
                    >
                        {claiming ? 'Claiming...' : 'Claim'}
                    </button>
                    {claimFeedback ? (
                        <p
                            className={`${styles.claimMessage} ${
                                claimFeedback.type === 'error'
                                    ? styles.claimMessageError
                                    : styles.claimMessageSuccess
                            }`}
                        >
                            {claimFeedback.text}
                        </p>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

export default FullscreenPlayer;
