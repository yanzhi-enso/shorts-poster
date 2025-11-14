'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import { countUnassignedVideos, listUnassignedVideos } from 'db/client.js';
import { VideoCatalog, VIDEO_ENTRY_KEY_MAP } from 'components/candidates/VideoCatalog';
import VideoList from 'components/candidates/VideoList';
import FullscreenPlayer from 'components/candidates/FullscreenPlayer';

export default function CandidatesPage() {
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [videos, setVideos] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeVideo, setActiveVideo] = useState(null);
    const [countsByFilter, setCountsByFilter] = useState({});
    const [countsLoading, setCountsLoading] = useState(false);

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

                // debug code
                if (result.videos.length === 0 && reset) {
                    setVideos([]);
                } else {
                    // duplicate some videos for testing, x 10
                    const extendedVideos = [];
                    for (let i = 0; i < 10; i++) {
                        extendedVideos.push(
                            ...result.videos.map((video) => ({
                                ...video,
                                id: `${video.id}_dup${i}`,
                            })),
                        );
                    }
                    result.videos = extendedVideos; 
                }
                //debug code end

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

    const fetchCounts = useCallback(async () => {
        setCountsLoading(true);
        try {
            const entries = await Promise.all(
                VIDEO_ENTRY_KEY_MAP.map(async (filter) => {
                    try {
                        const total = await countUnassignedVideos({
                            category: filter.category,
                            type: filter.type,
                        });
                        return [filter.id, total];
                    } catch (err) {
                        console.error(
                            'Failed to count videos for filter',
                            filter.id,
                            err,
                        );
                        return [filter.id, 0];
                    }
                }),
            );
            setCountsByFilter(Object.fromEntries(entries));
        } catch (err) {
            console.error('Failed to fetch video counts', err);
        } finally {
            setCountsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCounts();
    }, [fetchCounts]);

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

    const handleClaimSuccess = useCallback(
        (claimedVideo) => {
            if (!claimedVideo) {
                return;
            }
            const targetId = claimedVideo.id ?? claimedVideo.projectId;
            setVideos((prev) =>
                prev.filter(
                    (candidate) =>
                        candidate.id !== targetId && candidate.projectId !== targetId,
                ),
            );
            setActiveVideo(null);
            fetchCounts();
        },
        [setVideos, setActiveVideo, fetchCounts],
    );

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Video Candidates</h1>
                <p className={styles.subtitle}>
                    Choose a preset and tap any video into a fullscreen review.
                </p>
            </div>

            <div className={styles.layout}>
                <VideoCatalog
                    selectedFilterId={selectedFilter?.id ?? null}
                    onSelect={handleSelectFilter}
                    counts={countsByFilter}
                    countsLoading={countsLoading}
                />

                <VideoList
                    videos={videos}
                    loading={loading}
                    error={error}
                    hasMore={hasMore}
                    onLoadMore={() => fetchVideos({ reset: false })}
                    onSelect={handleOpenVideo}
                    canQuery={canQuery}
                />
            </div>

            <FullscreenPlayer
                video={activeVideo}
                onClose={handleCloseVideo}
                onClaimSuccess={handleClaimSuccess}
            />
        </div>
    );
}
