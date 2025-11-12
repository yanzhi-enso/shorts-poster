'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { listUnassignedVideos } from 'db/client.js';
import VideoFileList from 'components/candidates/VideoFileList';
import VideoFolders from 'components/candidates/VideoFolders';
import FullscreenPlayer from 'components/candidates/FullscreenPlayer';

export default function CandidatesPage() {
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [videos, setVideos] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeVideo, setActiveVideo] = useState(null);

    const selectedCategory = selectedFilter?.category ?? null;
    const selectedType = selectedFilter?.type ?? null;
    const canQuery = useMemo(
        () => Boolean(selectedCategory && selectedType),
        [selectedCategory, selectedType],
    );

    const fetchVideos = useCallback(
        async ({ reset } = { reset: false }) => {
            if (!canQuery) {
                return;
            }
            setLoading(true);
            setError('');
            try {
                const result = await listUnassignedVideos({
                    category: selectedCategory,
                    type: selectedType,
                    cursor: reset ? undefined : cursor,
                });

                setVideos((prev) => (reset ? result.videos : [...prev, ...result.videos]));
                setCursor(result.cursor ?? null);
                setHasMore(result.hasMore);
            } catch (err) {
                console.error('Failed to fetch videos', err);
                setError(err?.message ?? 'Failed to fetch videos');
            } finally {
                setLoading(false);
            }
        },
        [canQuery, selectedCategory, selectedType, cursor],
    );

    useEffect(() => {
        if (!canQuery) {
            setVideos([]);
            setActiveVideo(null);
            setCursor(null);
            setHasMore(false);
            return;
        }
        fetchVideos({ reset: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, selectedType]);

    const handleSelectFilter = useCallback((filter) => {
        setSelectedFilter(filter);
        setActiveVideo(null);
    }, []);

    const handleOpenVideo = useCallback((video) => {
        setActiveVideo(video);
    }, []);

    const handleCloseVideo = useCallback(() => {
        setActiveVideo(null);
    }, []);

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Video Candidates</h1>
                <p className={styles.subtitle}>
                    Choose a preset and tap any video into a fullscreen review.
                </p>
            </div>

            <div className={styles.layout}>
                <VideoFileList
                    selectedFilterId={selectedFilter?.id ?? null}
                    onSelect={handleSelectFilter}
                />

                <VideoFolders
                    videos={videos}
                    loading={loading}
                    error={error}
                    hasMore={hasMore}
                    onLoadMore={() => fetchVideos({ reset: false })}
                    onSelect={handleOpenVideo}
                    canQuery={canQuery}
                />
            </div>

            <FullscreenPlayer video={activeVideo} onClose={handleCloseVideo} />
        </div>
    );
}
