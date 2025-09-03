/**
 * Exchange authorization code for tokens via backend API
 */
export async function exchangeCodeForTokens(code, redirectUri = null) {
    const finalRedirectUri = redirectUri ||
        (typeof window !== 'undefined'
            ? `${window.location.origin}/g/redirect`
            : 'http://localhost:3000/g/redirect');

    try {
        const response = await fetch('/api/auth/exchange-tokens', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                code,
                redirectUri: finalRedirectUri,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Token exchange failed: ${errorData.error}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error exchanging code for tokens:', error);
        throw error;
    }
}

/**
 * Refresh access token using refresh token via backend API
 */
export async function refreshAccessToken(refreshToken) {
    try {
        const response = await fetch('/api/auth/refresh-token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                refreshToken,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Token refresh failed: ${errorData.error}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error refreshing access token:', error);
        throw error;
    }
}
