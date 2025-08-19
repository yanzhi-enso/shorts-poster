// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.NEXT_PUBLIC_GOOGLE_OAUTH_CLIENT_SECRET;
const REDIRECT_URI = typeof window !== 'undefined' ? `${window.location.origin}/g/redirect` : 'http://localhost:3000/g/redirect';

// OAuth scopes
const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/drive'  // Full Google Drive access
].join(' ');

/**
 * Generate Google OAuth authorization URL
 */
export function getGoogleAuthUrl() {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent'
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(code) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.statusText}`);
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken) {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokens = await response.json();
    return tokens;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Get user info from Google
 */
export async function getUserInfo(accessToken) {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user info: ${response.statusText}`);
    }

    const userInfo = await response.json();
    return userInfo;
  } catch (error) {
    console.error('Error getting user info:', error);
    throw error;
  }
}

/**
 * Token storage functions
 */
export const tokenStorage = {
  // Store tokens in localStorage (separate lines as requested)
  setTokens(accessToken, refreshToken) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', accessToken);
      localStorage.setItem('google_refresh_token', refreshToken);
    }
  },

  // Get access token
  getAccessToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('google_access_token');
    }
    return null;
  },

  // Get refresh token
  getRefreshToken() {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('google_refresh_token');
    }
    return null;
  },

  // Clear all tokens
  clearTokens() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('google_access_token');
      localStorage.removeItem('google_refresh_token');
    }
  },

  // Check if tokens exist
  hasTokens() {
    return this.getAccessToken() && this.getRefreshToken();
  }
};

/**
 * Get valid access token (refresh if needed)
 */
export async function getValidAccessToken() {
  const accessToken = tokenStorage.getAccessToken();
  const refreshToken = tokenStorage.getRefreshToken();

  if (!refreshToken) {
    return null;
  }

  if (!accessToken) {
    // No access token, try to refresh
    try {
      const tokens = await refreshAccessToken(refreshToken);
      tokenStorage.setTokens(tokens.access_token, refreshToken);
      return tokens.access_token;
    } catch (error) {
      // Refresh failed, clear tokens
      tokenStorage.clearTokens();
      return null;
    }
  }

  // TODO: In production, you might want to check if the token is expired
  // For now, we'll assume it's valid and let the API calls handle expiration
  return accessToken;
}

/**
 * Logout user by clearing tokens
 */
export function logout() {
  tokenStorage.clearTokens();
  if (typeof window !== 'undefined') {
    window.location.href = '/g/auth';
  }
}
