import {
    collection,
    getCountFromServer,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where,
} from 'firebase/firestore';
import { db } from 'services/firebase/firestore/client.js';
import { COLLECTION_VIDEOS } from 'services/firebase/firestore/common.js';
import { VIDEO_COLLECTION, VIDEO_STATUS, parseVideoRecord } from 'db/models/videos';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Retrieve paginated videos filtered by category, type and availability.
 * @param {Object} params
 * @param {import('db/models/videos').VideoCategory} params.category
 * @param {import('db/models/videos').VideoType} params.type
 * @param {number} [params.pageSize=DEFAULT_PAGE_SIZE]
 * @param {import('firebase/firestore').DocumentSnapshot} [params.cursor]
 * @returns {Promise<{videos: import('db/models/videos').VideoWithId[], cursor: import('firebase/firestore').DocumentSnapshot | null, hasMore: boolean}>}
 */
export async function listUnassignedVideos({
    category,
    type,
    pageSize = DEFAULT_PAGE_SIZE,
    cursor = undefined,
}) {
    if (!category || !type) {
        throw new Error('Both category and type are required to list videos.');
    }

    const constraints = [
        where(VIDEO_COLLECTION.fields.category, '==', category),
        where(VIDEO_COLLECTION.fields.type, '==', type),
        // ready means it's ready to be claimed
        // as for claimed video, the status will be 'claimed'
        where(VIDEO_COLLECTION.fields.status, '==', VIDEO_STATUS.READY),
        orderBy(VIDEO_COLLECTION.fields.postWeekDay, 'desc'),
        limit(pageSize),
    ];

    if (cursor) {
        constraints.push(startAfter(cursor));
    }

    // Requires composite index: category ASC, type ASC, status ASC, modified_at DESC
    const videoQuery = query(collection(db, COLLECTION_VIDEOS), ...constraints);
    const snapshot = await getDocs(videoQuery);

    const videos = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...parseVideoRecord(doc.data()),
    }));
    const hasMore = snapshot.docs.length === pageSize;
    const nextCursor = hasMore ? snapshot.docs[snapshot.docs.length - 1] : null;

    return {
        videos,
        cursor: nextCursor,
        hasMore,
    };
}

/**
 * Count how many unassigned videos match a given category and type.
 * Keeps the UI in sync with the total number of claimable videos.
 * @param {Object} params
 * @param {import('db/models/videos').VideoCategory} params.category
 * @param {import('db/models/videos').VideoType} params.type
 * @returns {Promise<number>}
 */
export async function countUnassignedVideos({ category, type }) {
    if (!category || !type) {
        throw new Error('Both category and type are required to count videos.');
    }

    const constraints = [
        where(VIDEO_COLLECTION.fields.category, '==', category),
        where(VIDEO_COLLECTION.fields.type, '==', type),
        where(VIDEO_COLLECTION.fields.status, '==', VIDEO_STATUS.READY),
    ];

    const baseQuery = query(collection(db, COLLECTION_VIDEOS), ...constraints);
    const snapshot = await getCountFromServer(baseQuery);

    return snapshot.data().count ?? 0;
}
