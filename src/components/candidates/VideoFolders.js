'use client';

import VideoFileBlock from './VideoFileBlock';
import styles from './VideoFolders.module.css';

const VideoFolders = ({
    videos,
    loading,
    error,
    hasMore,
    onLoadMore,
    onSelect,
    canQuery,
}) => (
    <section className={styles.container}>
        <div className={styles.header}>
            <span className={styles.headerLabel}>Files</span>
            <span className={styles.badge}>{videos.length}</span>
        </div>

        {!canQuery && (
            <div className={styles.emptyState}>
                <div className={styles.emptyStateText}>
                    <p>Select a production lane on the left to start browsing.</p>
                </div>
            </div>
        )}

        {canQuery && (
            <>
                {error && <p className={styles.error}>{error}</p>}
                {!loading && !videos.length && !error && (
                    <div className={styles.emptyState}>
                        <p>This lane is empty right now. Fresh drops will show up here soon.</p>
                    </div>
                )}
                <div className={styles.grid}>
                    {videos.map((video) => (
                        <VideoFileBlock key={video.id} video={video} onClick={() => onSelect(video)} />
                    ))}
                    {loading && <div className={styles.skeleton} aria-hidden="true" />}
                </div>
                {hasMore && (
                    <button
                        type="button"
                        className={styles.loadMore}
                        onClick={onLoadMore}
                        disabled={loading}
                    >
                        Load more
                    </button>
                )}
            </>
        )}
    </section>
);

export default VideoFolders;
