'use client';

import { VIDEO_STATUS } from 'db/models/videos';
import styles from './VideoFileBlock.module.css';

const formatDate = (value) => {
    if (!value) {
        return '—';
    }
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '—';
    }
    return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' }).format(date);
};

const VideoFileBlock = ({ video, onClick, highlightStatus = false }) => {
    const displayName = video.title || video.projectId || 'Untitled';
    const createdAtLabel = formatDate(video.createdAt);
    const createdAtIso =
        video.createdAt instanceof Date ? video.createdAt.toISOString() : undefined;
    const fallbackLetter = displayName.charAt(0).toUpperCase();
    let statusClassName = '';
    if (highlightStatus) {
        if (video.status === VIDEO_STATUS.CLAIMED) {
            statusClassName = styles.blockStatusClaimed;
        } else if (video.status === VIDEO_STATUS.REVISIONING) {
            statusClassName = styles.blockStatusRevisioning;
        } else if (video.status === VIDEO_STATUS.POSTED) {
            statusClassName = styles.blockStatusPosted;
        }
    }

    return (
        <button
            type="button"
            className={`${styles.block} ${statusClassName}`}
            onClick={() => onClick(video)}
            aria-label={`Open ${displayName}`}
        >
            <div className={styles.thumbnail}>
                {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={video.thumbnailUrl}
                        alt={displayName}
                        className={styles.thumbnailImage}
                        loading="lazy"
                    />
                ) : (
                    <span className={styles.thumbnailFallback}>{fallbackLetter}</span>
                )}
            </div>
            <div className={styles.meta}>
                <span className={styles.name} title={displayName}>
                    {displayName}
                </span>
                <div className={styles.footnote}>
                    <span className={styles.tag}>
                        {video.category?.toUpperCase()} · {video.type}
                    </span>
                    <time dateTime={createdAtIso}>{createdAtLabel}</time>
                </div>
            </div>
        </button>
    );
};

export default VideoFileBlock;
