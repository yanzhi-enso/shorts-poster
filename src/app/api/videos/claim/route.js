import { NextResponse } from 'next/server';
import { claimVideo } from 'db/server.js';
import { getUserDisplayName } from 'services/firebase/auth/server.js';
import { requireAuthUser, handleApiError, createApiError } from '../utils';

export async function GET(request) {
    try {
        const user = await requireAuthUser(request);
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('pid');
        if (!projectId) {
            throw createApiError('VIDEO_PROJECT_ID_REQUIRED', 'pid is required to claim a video.');
        }

        const channelOwnerName = await getUserDisplayName(user.uid);
        const video = await claimVideo(projectId.trim(), user.uid, channelOwnerName);
        return NextResponse.json({ video });
    } catch (error) {
        return handleApiError(error, 'Failed to claim video.');
    }
}
