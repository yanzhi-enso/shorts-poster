'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import { useAuth } from 'authManager/authContext';
import withAuth from 'authManager/withAuth';
import {
    countClaimedVideosByOwner,
    listClaimedVideosByOwner,
} from 'db/client.js';
import { VideoCatalog, VIDEO_ENTRY_KEY_MAP } from 'components/videoViewer/VideoCatalog';
import VideoList from 'components/videoViewer/VideoList';
import FullscreenPlayer from 'components/videoViewer/FullscreenPlayer';

export default withAuth(function MyClaimedVideosPage() {
    const { user, isLoading: authLoading } = useAuth();
    const ownerId = user?.id ?? user?.uid ?? null;
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [videos, setVideos] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeVideo, setActiveVideo] = useState(null);
    const [countsByFilter, setCountsByFilter] = useState({});
    const [countsLoading, setCountsLoading] = useState(false);
    const loadMoreInFlightRef = useRef(false);

    const selectedCategory = selectedFilter?.category ?? null;
    const selectedType = selectedFilter?.type ?? null;
    const canQuery = useMemo(
        () => Boolean(ownerId && selectedCategory && selectedType),
        [ownerId, selectedCategory, selectedType],
    );

    const resetListState = useCallback(() => {
        setVideos([]);
        setActiveVideo(null);
        setCursor(null);
        setHasMore(false);
        setError('');
    }, []);

    const fetchVideos = useCallback(
        async ({ reset } = { reset: false }) => {
            if (!canQuery) {
                if (reset) {
                    resetListState();
                }
                return;
            }
            setLoading(true);
            setError('');
            try {
                const result = await listClaimedVideosByOwner({
                    category: selectedCategory,
                    type: selectedType,
                    ownerId,
                    cursor: reset ? undefined : cursor,
                });

                setVideos((prev) => (reset ? result.videos : [...prev, ...result.videos]));
                setCursor(result.cursor ?? null);
                setHasMore(result.hasMore);
            } catch (err) {
                console.error('Failed to fetch claimed videos', err);
                setError(err?.message ?? 'Failed to fetch videos');
            } finally {
                setLoading(false);
            }
        },
        [canQuery, selectedCategory, selectedType, ownerId, cursor, resetListState],
    );

    const handleLoadMore = useCallback(() => {
        if (loadMoreInFlightRef.current) {
            return;
        }
        loadMoreInFlightRef.current = true;
        fetchVideos({ reset: false }).finally(() => {
            loadMoreInFlightRef.current = false;
        });
    }, [fetchVideos]);

    useEffect(() => {
        if (!canQuery) {
            resetListState();
            return;
        }
        fetchVideos({ reset: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, selectedType, ownerId]);

    const fetchCounts = useCallback(async () => {
        if (!ownerId) {
            setCountsByFilter({});
            return;
        }
        setCountsLoading(true);
        try {
            const entries = await Promise.all(
                VIDEO_ENTRY_KEY_MAP.map(async (filter) => {
                    try {
                        const total = await countClaimedVideosByOwner({
                            category: filter.category,
                            type: filter.type,
                            ownerId,
                        });
                        return [filter.id, total];
                    } catch (err) {
                        console.error(
                            'Failed to count claimed videos for filter',
                            filter.id,
                            err,
                        );
                        return [filter.id, 0];
                    }
                }),
            );
            setCountsByFilter(Object.fromEntries(entries));
        } catch (err) {
            console.error('Failed to fetch claimed video counts', err);
        } finally {
            setCountsLoading(false);
        }
    }, [ownerId]);

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

    if (authLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>My Claimed Videos</h1>
                    <p className={styles.subtitle}>Loading your workspace…</p>
                </div>
            </div>
        );
    }

    if (!ownerId) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>My Claimed Videos</h1>
                    <p className={styles.subtitle}>Please sign in to review your claimed videos.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Claimed Videos</h1>
                <p className={styles.subtitle}>
                    Filter by preset and review videos assigned to your channel.
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
                    onLoadMore={handleLoadMore}
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
});