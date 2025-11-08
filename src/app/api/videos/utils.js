import { NextResponse } from 'next/server';
import { verifyFirebaseToken } from 'services/firebase/base/server.js';

const ERROR_STATUS_MAP = {
    UNAUTHORIZED: 401,
    VIDEO_PROJECT_ID_REQUIRED: 400,
    VIDEO_CLAIM_DATA_REQUIRED: 400,
    VIDEO_INVALID_INPUT: 400,
    VIDEO_INVALID_UPDATE: 400,
    VIDEO_NOT_FOUND: 404,
    VIDEO_ALREADY_EXISTS: 409,
    VIDEO_ALREADY_CLAIMED: 409,
};

export async function requireAuthUser(request) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
        throw createApiError('UNAUTHORIZED', 'Missing Authorization header.');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
        throw createApiError('UNAUTHORIZED', 'Missing Authorization token.');
    }

    try {
        return await verifyFirebaseToken(token);
    } catch (error) {
        console.error('Failed to verify Firebase token.', error);
        throw createApiError('UNAUTHORIZED', 'Invalid or expired Firebase token.');
    }
}

export function handleApiError(error, fallbackMessage = 'Unexpected server error') {
    console.error('[Videos API] Error:', error);
    const status = error.status || ERROR_STATUS_MAP[error.code] || 500;
    const message = error.message || fallbackMessage;
    return NextResponse.json({ error: message }, { status });
}

export function createApiError(code, message, status) {
    const error = new Error(message);
    error.code = code;
    error.status = status || ERROR_STATUS_MAP[code];
    return error;
}
