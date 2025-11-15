import { COLLECTION_VIDEOS } from 'services/firebase/firestore/common.js';

export const VIDEO_COLLECTION = {
    name: COLLECTION_VIDEOS,
    fields: {
        projectId: 'project_id',
        title: 'title',
        videoUrl: 'video_url',
        videoManifestUrl: 'video_manifest_url',
        thumbnailUrl: 'thumbnail_url',
        category: 'category',
        type: 'type',
        postWeekDay: 'post_week_day',
        authorId: 'author_id',
        authorName: 'author_name',
        channelOwnerId: 'channel_owner_id',
        channelOwnerName: 'channel_owner_name',
        status: 'status',
        claimedAt: 'claimed_at',
        createdAt: 'created_at',
        modifiedAt: 'modified_at',
    },
} as const;

export const VIDEO_CATEGORY_VALUES = ['ib', 'cat', 'mermaid'] as const;
export const VIDEO_TYPE_VALUES = ['1min', 'shorts'] as const;
export const VIDEO_STATUS = {
    READY: 'ready',
    REVISIONING: 'revisioning',
    CLAIMED: 'claimed',
    POSTED: 'posted',
} as const;
export const VIDEO_STATUS_VALUES = [
    VIDEO_STATUS.READY,
    VIDEO_STATUS.REVISIONING,
    VIDEO_STATUS.CLAIMED,
    VIDEO_STATUS.POSTED,
] as const;

export type VideoCategory = (typeof VIDEO_CATEGORY_VALUES)[number];
export type VideoType = (typeof VIDEO_TYPE_VALUES)[number];
export type VideoStatus = (typeof VIDEO_STATUS_VALUES)[number];
export type VideoWithId = Video & { id: string };

type FirestoreDateValue = Date | string | number | { toDate: () => Date };

// raw db record
export interface VideoRecord {
    project_id: string;
    title: string;
    video_url: string;
    video_manifest_url: string;
    thumbnail_url: string;
    category: string;
    type: string;
    post_week_day: FirestoreDateValue;
    author_id: string;
    author_name: string;
    channel_owner_id: string | null;
    channel_owner_name: string | null;
    status: string;
    claimed_at: FirestoreDateValue | null;
    created_at: FirestoreDateValue;
    modified_at: FirestoreDateValue;
}

// normalized app model
export interface Video {
    projectId: string;
    title: string;
    videoUrl: string;
    videoManifestUrl: string;
    thumbnailUrl: string;
    category: VideoCategory;
    type: VideoType;
    postWeekDay: Date;
    authorId: string;
    authorName: string;
    channelOwnerId: string | null;
    channelOwnerName: string | null;
    claimedAt: Date | null;
    status: VideoStatus;
    createdAt: Date;
    modifiedAt: Date;
}

const normalizeDate = (value: FirestoreDateValue, fieldName: string): Date => {
    if (value instanceof Date) {
        return value;
    }
    if (typeof value === 'number') {
        return new Date(value);
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        if (!Number.isNaN(parsed.getTime())) {
            return parsed;
        }
    } else if (value && typeof value.toDate === 'function') {
        return value.toDate();
    }
    throw new Error(`Invalid ${fieldName} date value.`);
};

const ensureEnumValue = <T extends readonly string[]>(
    value: string,
    allowed: T,
    fieldName: string
): T[number] => {
    if (allowed.includes(value as T[number])) {
        return value as T[number];
    }
    throw new Error(`Invalid ${fieldName} value "${value}".`);
};

export const parseVideoRecord = (raw: VideoRecord): Video => ({
    projectId: raw.project_id,
    title: raw.title ?? '',
    videoUrl: raw.video_url,
    videoManifestUrl: raw.video_manifest_url,
    thumbnailUrl: raw.thumbnail_url ?? '',
    category: ensureEnumValue(raw.category, VIDEO_CATEGORY_VALUES, 'category'),
    type: ensureEnumValue(raw.type, VIDEO_TYPE_VALUES, 'type'),
    postWeekDay: normalizeDate(raw.post_week_day, 'post_week_day'),
    authorId: raw.author_id,
    authorName: raw.author_name,
    channelOwnerId: raw.channel_owner_id ?? null,
    channelOwnerName: raw.channel_owner_name ?? null,
    claimedAt: raw.claimed_at ? normalizeDate(raw.claimed_at, 'claimed_at') : null,
    status: ensureEnumValue(raw.status, VIDEO_STATUS_VALUES, 'status'),
    createdAt: normalizeDate(raw.created_at, 'created_at'),
    modifiedAt: normalizeDate(raw.modified_at, 'modified_at'),
});

const ensureDateInstance = (value: Date, fieldName: string): Date => {
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        throw new Error(`Invalid ${fieldName} Date instance.`);
    }
    return value;
};

const ensureOptionalDateInstance = (value: Date | null, fieldName: string): Date | null => {
    if (value === null) {
        return null;
    }
    return ensureDateInstance(value, fieldName);
};

export const serializeVideo = (video: Video): VideoRecord => ({
    project_id: video.projectId,
    title: video.title,
    video_url: video.videoUrl,
    video_manifest_url: video.videoManifestUrl,
    thumbnail_url: video.thumbnailUrl,
    category: ensureEnumValue(video.category, VIDEO_CATEGORY_VALUES, 'category'),
    type: ensureEnumValue(video.type, VIDEO_TYPE_VALUES, 'type'),
    post_week_day: ensureDateInstance(video.postWeekDay, 'postWeekDay'),
    author_id: video.authorId,
    author_name: video.authorName,
    channel_owner_id: video.channelOwnerId,
    channel_owner_name: video.channelOwnerName,
    claimed_at: ensureOptionalDateInstance(video.claimedAt, 'claimedAt'),
    status: ensureEnumValue(video.status, VIDEO_STATUS_VALUES, 'status'),
    created_at: ensureDateInstance(video.createdAt, 'createdAt'),
    modified_at: ensureDateInstance(video.modifiedAt, 'modifiedAt'),
});
