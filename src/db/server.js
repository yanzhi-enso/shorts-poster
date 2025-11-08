import { getServerFirestore } from 'services/firebase/firestore/server.js';
import { VIDEO_COLLECTION, parseVideoRecord, serializeVideo } from 'db/models/videos';

const collectionName = VIDEO_COLLECTION.name;

const makeError = (code, message) => {
    const error = new Error(message);
    error.code = code;
    return error;
};

const getDocRef = (firestore, projectId) => firestore.collection(collectionName).doc(projectId);

/**
 * Create a new video document.
 * @param {Omit<import('db/models/videos').Video, 'createdAt' | 'modifiedAt'> & Partial<Pick<import('db/models/videos').Video, 'createdAt' | 'modifiedAt'>>} payload
 */
export async function createVideo(payload) {
    if (!payload?.projectId) {
        throw makeError('VIDEO_PROJECT_ID_REQUIRED', 'projectId is required to create a video.');
    }

    const firestore = getServerFirestore();
    const now = new Date();
    const docRef = getDocRef(firestore, payload.projectId);
    const existing = await docRef.get();

    if (existing.exists) {
        throw makeError('VIDEO_ALREADY_EXISTS', 'A video with this projectId already exists.');
    }

    const video = {
        ...payload,
        channelOwnerId: payload.channelOwnerId ?? null,
        channelOwnerName: payload.channelOwnerName ?? null,
        claimTime: payload.claimTime ?? null,
        createdAt: payload.createdAt ?? now,
        modifiedAt: payload.modifiedAt ?? now,
    };

    const record = serializeVideo(video);
    await docRef.set(record);
    return {
        id: docRef.id,
        ...parseVideoRecord(record),
    };
}

/**
 * Claim ownership of a video via transaction to avoid races.
 * @param {string} projectId
 * @param {string} channelOwnerId
 * @param {string} channelOwnerName
 */
export async function claimVideo(projectId, channelOwnerId, channelOwnerName) {
    if (!projectId || !channelOwnerId || !channelOwnerName) {
        throw makeError(
            'VIDEO_CLAIM_DATA_REQUIRED',
            'projectId, channelOwnerId and channelOwnerName are required to claim a video.',
        );
    }

    const firestore = getServerFirestore();
    const docRef = getDocRef(firestore, projectId);

    return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(docRef);

        if (!snapshot.exists) {
            throw makeError('VIDEO_NOT_FOUND', 'Video not found.');
        }

        const currentData = snapshot.data();
        if (currentData.channel_owner_id) {
            if (currentData.channel_owner_id === channelOwnerId) {
                return {
                    id: projectId,
                    ...parseVideoRecord(currentData),
                };
            }
            throw makeError('VIDEO_ALREADY_CLAIMED', 'Video already claimed by another user.');
        }

        const now = new Date();
        const update = {
            channel_owner_id: channelOwnerId,
            channel_owner_name: channelOwnerName,
            claim_time: now,
            modified_at: now,
        };

        transaction.update(docRef, update);

        return {
            id: projectId,
            ...parseVideoRecord({
                ...currentData,
                ...update,
            }),
        };
    });
}

/**
 * Update selected video fields by projectId.
 * @param {string} projectId
 * @param {Partial<Pick<import('db/models/videos').Video, 'videoUrl' | 'videoManifestUrl' | 'thumbnailUrl' | 'status'>>} updates
 */
export async function updateVideo(projectId, updates) {
    if (!projectId) {
        throw makeError('VIDEO_PROJECT_ID_REQUIRED', 'projectId is required to update a video.');
    }

    const firestore = getServerFirestore();
    const docRef = getDocRef(firestore, projectId);

    return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(docRef);

        if (!snapshot.exists) {
            throw makeError('VIDEO_NOT_FOUND', 'Video not found.');
        }

        const currentVideo = parseVideoRecord(snapshot.data());
        const nextVideo = {
            ...currentVideo,
            videoUrl: updates.videoUrl ?? currentVideo.videoUrl,
            videoManifestUrl: updates.videoManifestUrl ?? currentVideo.videoManifestUrl,
            thumbnailUrl: updates.thumbnailUrl ?? currentVideo.thumbnailUrl,
            status: updates.status ?? currentVideo.status,
            modifiedAt: new Date(),
        };

        const record = serializeVideo(nextVideo);
        transaction.set(docRef, record);

        return {
            id: projectId,
            ...parseVideoRecord(record),
        };
    });
}

/**
 * Delete a video document by projectId.
 * @param {string} projectId
 */
export async function deleteVideo(projectId) {
    if (!projectId) {
        throw makeError('VIDEO_PROJECT_ID_REQUIRED', 'projectId is required to delete a video.');
    }

    const firestore = getServerFirestore();
    const docRef = getDocRef(firestore, projectId);
    const snapshot = await docRef.get();

    if (!snapshot.exists) {
        throw makeError('VIDEO_NOT_FOUND', 'Video not found.');
    }

    await docRef.delete();
    return true;
}
