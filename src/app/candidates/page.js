'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './page.module.css';
import StreamVideoPlayer from 'components/StreamVideoPlayer';
import { VIDEO_CATEGORY_VALUES, VIDEO_TYPE_VALUES } from 'db/models/videos';
import { listUnassignedVideos } from 'db/client.js';

const SelectionColumn = ({ category, onCategorySelect, type, onTypeSelect, onReset }) => (
    <div className={styles.column}>
        <h2>Category</h2>
        <div className={styles.list}>
            {VIDEO_CATEGORY_VALUES.map((option) => (
                <button
                    key={option}
                    className={category === option ? styles.listItemSelected : styles.listItem}
                    onClick={() => onCategorySelect(option)}
                >
                    {option.toUpperCase()}
                </button>
            ))}
        </div>

        {category && (
            <>
                <div className={styles.sectionDivider} />
                <h2>Video Type</h2>
                <div className={styles.list}>
                    {VIDEO_TYPE_VALUES.map((option) => (
                        <button
                            key={option}
                            className={type === option ? styles.listItemSelected : styles.listItem}
                            onClick={() => onTypeSelect(option)}
                        >
                            {option.toUpperCase()}
                        </button>
                    ))}
                </div>
            </>
        )}

        {(category || type) && (
            <button
                className={`${styles.secondaryButton} ${styles.secondaryButtonBottom}`}
                onClick={onReset}
            >
                Reset choices
            </button>
        )}
    </div>
);

const VideosColumn = ({
    videos,
    loading,
    error,
    onLoadMore,
    hasMore,
    selectedVideoId,
    onSelect,
    onBackToSelection,
}) => (
    <div className={styles.column}>
        <h2>Videos</h2>
        <button
            className={`${styles.secondaryButton} ${styles.backButton}`}
            onClick={onBackToSelection}
        >
            Change selection
        </button>
        {loading && <p className={styles.status}>Loading videos…</p>}
        {error && <p className={styles.error}>{error}</p>}
        {!loading && !videos.length && <p className={styles.status}>No videos found.</p>}
        <div className={styles.videosList}>
            {videos.map((video) => (
                <button
                    key={video.id}
                    className={selectedVideoId === video.id ? styles.videoCardSelected : styles.videoCard}
                    onClick={() => onSelect(video)}
                >
                    <span className={styles.videoTitle}>{video.title || video.projectId}</span>
                    <span className={styles.videoMeta}>{video.category} · {video.type}</span>
                </button>
            ))}
        </div>
        {hasMore && (
            <button className={styles.loadMore} onClick={onLoadMore} disabled={loading}>
                Load more
            </button>
        )}
    </div>
);

const PreviewColumn = ({ video }) => (
    <div className={styles.column}>
        <h2>Preview</h2>
        {!video && <p className={styles.status}>Select a video to preview.</p>}
        {video && (
            <div className={styles.previewPane}>
                <StreamVideoPlayer manifestUrl={video.videoManifestUrl} className={styles.videoPlayer} />
                <div className={styles.previewMeta}>
                    <h3>{video.title || 'Untitled'}</h3>
                    <p className={styles.previewDetail}><strong>Project ID:</strong> {video.projectId}</p>
                    <p className={styles.previewDetail}><strong>Category:</strong> {video.category}</p>
                    <p className={styles.previewDetail}><strong>Type:</strong> {video.type}</p>
                    <p className={styles.previewDetail}><strong>Status:</strong> {video.status}</p>
                </div>
            </div>
        )}
    </div>
);

export default function CandidatesPage() {
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedType, setSelectedType] = useState(null);
    const [videos, setVideos] = useState([]);
    const [cursor, setCursor] = useState(null);
    const [hasMore, setHasMore] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [selectedVideo, setSelectedVideo] = useState(null);

    const canQuery = useMemo(() => Boolean(selectedCategory && selectedType), [selectedCategory, selectedType]);

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
                setCursor(result.cursor);
                setHasMore(result.hasMore);
                if (reset && result.videos.length) {
                    setSelectedVideo(result.videos[0]);
                }
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
            setSelectedVideo(null);
            setCursor(null);
            setHasMore(false);
            return;
        }
        fetchVideos({ reset: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, selectedType]);

    const resetSelections = useCallback(() => {
        setSelectedCategory(null);
        setSelectedType(null);
        setSelectedVideo(null);
        setVideos([]);
        setCursor(null);
        setHasMore(false);
    }, []);

    const handleBackToSelection = useCallback(() => {
        setSelectedType(null);
        setSelectedVideo(null);
    }, []);

    return (
        <div className={styles.container}>
            <h1 className={styles.title}>Video Candidates</h1>
            <div
                className={
                    selectedVideo ? styles.columns : `${styles.columns} ${styles.columnsCompact}`
                }
            >
                <SelectionColumn
                    category={selectedCategory}
                    onCategorySelect={(value) => {
                        setSelectedCategory(value);
                        setSelectedType(null);
                        setSelectedVideo(null);
                    }}
                    type={selectedType}
                    onTypeSelect={setSelectedType}
                    onReset={resetSelections}
                />
                {canQuery && (
                    <VideosColumn
                        videos={videos}
                        loading={loading}
                        error={error}
                        onLoadMore={() => fetchVideos({ reset: false })}
                        hasMore={hasMore}
                        selectedVideoId={selectedVideo?.id}
                        onSelect={setSelectedVideo}
                        onBackToSelection={handleBackToSelection}
                    />
                )}
                {selectedVideo && <PreviewColumn video={selectedVideo} />}
            </div>
        </div>
    );
}
