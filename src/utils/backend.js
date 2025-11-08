const API_BASE = '/api/videos';

const jsonHeaders = (token) => ({
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
});

const buildClaimUrl = (projectId) => `${API_BASE}/claim?pid=${encodeURIComponent(projectId)}`;

async function handleResponse(response) {
    if (response.ok) {
        return response.json();
    }

    const errorBody = await response.json().catch(() => null);
    const message = errorBody?.error || 'Request failed';
    const err = new Error(message);
    err.status = response.status;
    throw err;
}

export async function claimVideoRecord(token, projectId) {
    if (!projectId) {
        throw new Error('projectId is required to claim a video.');
    }

    const response = await fetch(buildClaimUrl(projectId), {
        method: 'GET',
        headers: jsonHeaders(token),
    });
    return handleResponse(response);
}

