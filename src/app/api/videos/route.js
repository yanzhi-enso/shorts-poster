import { NextResponse } from 'next/server';
import { createVideo, updateVideo, deleteVideo, getVideo, VIDEO_ERROR_CODES } from 'db/server.js';
import { getUserDisplayName } from 'services/firebase/auth/server.js';
import { requireAuthUser, handleApiError, createApiError } from './utils';

const computeWeekMonday = (inputDate = new Date()) => {
    const date = new Date(inputDate);
    const day = date.getDay();
    const diff = (day + 6) % 7;
    date.setDate(date.getDate() - diff);
    date.setHours(0, 0, 0, 0);
    return date;
};

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');
const parseRequestJson = async (request) => {
    try {
        return await request.json();
    } catch {
        return {};
    }
};

export async function POST(request) {
    try {
        await requireAuthUser(request);
        const body = await parseRequestJson(request);
        const projectId = sanitizeString(body.projectId);
        const title = sanitizeString(body.title);
        const videoUrl = sanitizeString(body.videoUrl);
        const videoManifestUrl = sanitizeString(body.videoManifestUrl);
        const thumbnailUrl = sanitizeString(body.thumbnailUrl);
        const category = sanitizeString(body.category);
        const type = sanitizeString(body.type);
        const authorId = sanitizeString(body.authorId) || null;

        const requiredFields = [
            ['projectId', projectId],
            ['title', title],
            ['videoUrl', videoUrl],
            ['videoManifestUrl', videoManifestUrl],
            ['thumbnailUrl', thumbnailUrl],
            ['category', category],
            ['type', type],
            ['authorId', authorId],
        ];
        const missingFieldEntry = requiredFields.find(([, value]) => !value);
        if (missingFieldEntry) {
            const [fieldName] = missingFieldEntry;
            console.error(`Missing required field: ${fieldName}`);
            throw createApiError(
                'VIDEO_INVALID_INPUT',
                `Missing required field: ${fieldName}.`,
                400,
            );
        }

        const authorName = await getUserDisplayName(authorId);
        const now = new Date();
        const video = await createVideo({
            projectId,
            title,
            videoUrl,
            videoManifestUrl,
            thumbnailUrl,
            category,
            type,
            authorId,
            authorName,
            channelOwnerId: null,
            channelOwnerName: null,
            postWeekDay: computeWeekMonday(now),
            status: 'ready',
            createdAt: now,
            modifiedAt: now,
            claimTime: null,
        });

        return NextResponse.json({ video }, { status: 201 });
    } catch (error) {
        return handleApiError(error, 'Failed to create video.');
    }
}

export async function PUT(request) {
    try {
        await requireAuthUser(request);
        const body = await parseRequestJson(request);
        const projectId = sanitizeString(body.projectId);
        if (!projectId) {
            throw createApiError('VIDEO_PROJECT_ID_REQUIRED', 'projectId is required to update a video.');
        }

        const updates = {};
        if (typeof body.videoUrl === 'string') {
            updates.videoUrl = sanitizeString(body.videoUrl);
        }
        if (typeof body.videoManifestUrl === 'string') {
            updates.videoManifestUrl = sanitizeString(body.videoManifestUrl);
        }
        if (typeof body.thumbnailUrl === 'string') {
            updates.thumbnailUrl = sanitizeString(body.thumbnailUrl);
        }
        if (typeof body.status === 'string') {
            updates.status = sanitizeString(body.status);
        }

        if (!Object.keys(updates).length) {
            throw createApiError('VIDEO_INVALID_UPDATE', 'Provide at least one field to update.');
        }

        const video = await updateVideo(projectId, updates);
        return NextResponse.json({ video });
    } catch (error) {
        return handleApiError(error, 'Failed to update video.');
    }
}

export async function DELETE(request) {
    try {
        await requireAuthUser(request);
        const body = await parseRequestJson(request);
        let projectId = sanitizeString(body.projectId);
        if (!projectId) {
            const { searchParams } = new URL(request.url);
            projectId = sanitizeString(searchParams.get('projectId') || searchParams.get('project_id'));
        }
        if (!projectId) {
            throw createApiError('VIDEO_PROJECT_ID_REQUIRED', 'projectId is required to delete a video.');
        }

        await deleteVideo(projectId);
        return NextResponse.json({ success: true });
    } catch (error) {
        return handleApiError(error, 'Failed to delete video.');
    }
}
export async function GET(request) {
    try {
        await requireAuthUser(request);
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('pid')
        if (!projectId) {
            throw createApiError('VIDEO_PROJECT_ID_REQUIRED', 'projectId (pid) is required to fetch a video.');
        }

        const video = await getVideo(projectId.trim(), { rejectIfClaimed: true });
        return NextResponse.json({
            projectId: video.projectId,
            category: video.category,
            type: video.type,
            status: video.status,
            channelOwnerId: video.channelOwnerId,
            channelOwnerName: video.channelOwnerName,
        });
    } catch (error) {
        return handleApiError(error, 'Failed to fetch video.');
    }
}
