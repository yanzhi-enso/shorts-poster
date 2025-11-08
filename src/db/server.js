import { getServerFirestore } from 'services/firebase/firestore/server.js';
import { VIDEO_COLLECTION, parseVideoRecord, serializeVideo } from 'db/models/videos';

const collectionName = VIDEO_COLLECTION.name;

/**
 * Create a new video document.
 * @param {Omit<import('db/models/videos').Video, 'createdAt' | 'modifiedAt'> & Partial<Pick<import('db/models/videos').Video, 'createdAt' | 'modifiedAt'>>} payload
 */
export async function createVideo(payload) {
    const firestore = getServerFirestore();
    const now = new Date();
    const video = {
        ...payload,
        channelOwnerId: payload.channelOwnerId ?? null,
        createdAt: payload.createdAt ?? now,
        modifiedAt: payload.modifiedAt ?? now,
    };

    const record = serializeVideo(video);
    const docRef = firestore.collection(collectionName).doc();
    await docRef.set(record);
    return {
        id: docRef.id,
        ...parseVideoRecord(record),
    };
}

/**
 * Claim ownership of a video via transaction to avoid races.
 * @param {string} videoId
 * @param {string} channelOwnerId
 */
export async function claimVideo(videoId, channelOwnerId) {
    if (!videoId || !channelOwnerId) {
        throw new Error('Both videoId and channelOwnerId are required to claim a video.');
    }

    const firestore = getServerFirestore();
    const docRef = firestore.collection(collectionName).doc(videoId);

    return firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(docRef);

        if (!snapshot.exists) {
            throw new Error('Video not found.');
        }

        const currentData = snapshot.data();
        if (currentData.channel_owner_id) {
            if (currentData.channel_owner_id === channelOwnerId) {
                return {
                    id: videoId,
                    ...parseVideoRecord(currentData),
                };
            }
            throw new Error('Video already claimed by another user.');
        }

        const update = {
            channel_owner_id: channelOwnerId,
            modified_at: new Date(),
        };

        transaction.update(docRef, update);

        return {
            id: videoId,
            ...parseVideoRecord({
                ...currentData,
                ...update,
            }),
        };
    });
}
