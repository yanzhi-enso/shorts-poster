'use client';

import LoadMore from 'components/common/LoadMore';
import VideoFileBlock from './VideoFileBlock';
import styles from './VideoList.module.css';

export default function VideoList({
    videos,
    loading,
    error,
    hasMore,
    onLoadMore,
    onSelect,
    canQuery,
}) {
    return (
        <section className={styles.container}>
            {!canQuery && (
                <div className={styles.emptyState}>
                    <div className={styles.emptyStateText}>
                        <p>Select a production lane on the left to start browsing.</p>
                    </div>
                </div>
            )}

            {canQuery && (
                <>
                    {loading && !videos.length && (
                        <div className={styles.loadingState} role="status" aria-live="polite">
                            <div className={styles.spinner} aria-hidden="true" />
                            <p className={styles.loadingText}>Loading files…</p>
                        </div>
                    )}
                    {error && <p className={styles.error}>{error}</p>}
                    {!loading && !videos.length && !error && (
                        <div className={styles.emptyState}>
                            <p>This lane is empty right now. Fresh drops will show up here soon.</p>
                        </div>
                    )}
                    {!!videos.length && (
                        <div className={styles.grid}>
                            {videos.map((video) => (
                                <VideoFileBlock
                                    key={video.id}
                                    video={video}
                                    onClick={() => onSelect(video)}
                                />
                            ))}
                            {loading && (
                                <div
                                    className={`${styles.loadingMore} ${styles.gridFullWidth}`}
                                    role="status"
                                >
                                    Loading more…
                                </div>
                            )}
                            <LoadMore
                                onLoadMore={onLoadMore}
                                disabled={!hasMore}
                                isLoading={loading}
                                className={styles.gridFullWidth}
                            />
                        </div>
                    )}
                </>
            )}
        </section>
    )
};
