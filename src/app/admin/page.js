'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import styles from './page.module.css';
import { useAuth } from 'authManager/authContext';
import withAuth from 'authManager/withAuth';
import {
    countVideosByCategoryAndType,
    listVideosByCategoryAndType,
} from 'db/client.js';
import { VideoCatalog, VIDEO_ENTRY_KEY_MAP } from 'components/videoViewer/VideoCatalog';
import VideoList from 'components/videoViewer/VideoList';
import FullscreenPlayer from 'components/videoViewer/FullscreenPlayer';

const VIDEO_QUERY_MODES = {
    latestByPostWeek: {
        key: 'latestByPostWeek',
        description: 'All videos sorted by most recent post week day.',
        list: listVideosByCategoryAndType,
        count: countVideosByCategoryAndType,
    },
};

const DEFAULT_QUERY_MODE_KEY = 'latestByPostWeek';

export default withAuth(function AdminVideosPage() {
    const { user } = useAuth();
    const [selectedFilter, setSelectedFilter] = useState(null);
    const [videos, setVideos] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeVideo, setActiveVideo] = useState(null);
    const [countsByFilter, setCountsByFilter] = useState({});
    const [countsLoading, setCountsLoading] = useState(false);
    const [queryModeKey] = useState(DEFAULT_QUERY_MODE_KEY);
    const loadMoreInFlightRef = useRef(false);

    const queryConfig =
        VIDEO_QUERY_MODES[queryModeKey] ?? VIDEO_QUERY_MODES[DEFAULT_QUERY_MODE_KEY];
    const selectedCategory = selectedFilter?.category ?? null;
    const selectedType = selectedFilter?.type ?? null;

    const canQuery = useMemo(
        () => Boolean(selectedCategory && selectedType && queryConfig?.list),
        [selectedCategory, selectedType, queryConfig],
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
            if (!canQuery || !queryConfig?.list) {
                if (reset) {
                    resetListState();
                }
                return;
            }
            setLoading(true);
            setError('');
            try {
                const result = await queryConfig.list({
                    category: selectedCategory,
                    type: selectedType,
                    cursor: reset ? undefined : cursor,
                });

                setVideos((prev) => (reset ? result.videos : [...prev, ...result.videos]));
                setCursor(result.cursor ?? null);
                setHasMore(result.hasMore);
            } catch (err) {
                console.error('Failed to fetch admin videos', err);
                setError(err?.message ?? 'Failed to fetch videos');
            } finally {
                setLoading(false);
            }
        },
        [canQuery, queryConfig, selectedCategory, selectedType, cursor, resetListState],
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
    }, [selectedCategory, selectedType, queryConfig]);

    const fetchCounts = useCallback(async () => {
        if (!queryConfig?.count) {
            setCountsByFilter({});
            return;
        }
        setCountsLoading(true);
        try {
            const entries = await Promise.all(
                VIDEO_ENTRY_KEY_MAP.map(async (filter) => {
                    try {
                        const total = await queryConfig.count({
                            category: filter.category,
                            type: filter.type,
                        });
                        return [filter.id, total];
                    } catch (err) {
                        console.error(
                            'Failed to count admin videos for filter',
                            filter.id,
                            err,
                        );
                        return [filter.id, 0];
                    }
                }),
            );
            setCountsByFilter(Object.fromEntries(entries));
        } catch (err) {
            console.error('Failed to fetch admin video counts', err);
        } finally {
            setCountsLoading(false);
        }
    }, [queryConfig]);

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

    if (!user) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.title}>Admin Video Console</h1>
                    <p className={styles.subtitle}>Please sign in with an admin account.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Admin Video Console</h1>
                <p className={styles.subtitle}>
                    Inspect every video by preset. Query strategies are pluggable via the map.
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
                    highlightStatus
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
