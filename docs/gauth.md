# Google OAuth Authentication Documentation

This document explains how the Google OAuth authentication system works in the Shorts Poster application, including token management, refresh mechanisms, and usage examples.

## Table of Contents

1. [OAuth Flow Overview](#oauth-flow-overview)
2. [Environment Setup](#environment-setup)
3. [Login Flow Step-by-Step](#login-flow-step-by-step)
4. [Token Management](#token-management)
5. [Token Refresh Mechanism](#token-refresh-mechanism)
6. [Code Examples](#code-examples)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

## OAuth Flow Overview

The application uses Google OAuth 2.0 with the authorization code flow to authenticate users and obtain access to their Google Drive. The flow is designed with separate auth routes (`/g/*`) to isolate authentication from the main UI.

### Flow Diagram
```
User visits protected page
         ↓
Is user authenticated?
         ↓ (No)
Redirect to /g/auth
         ↓
User clicks "Login with Google"
         ↓
Redirect to Google OAuth
         ↓
User grants permissions
         ↓
Google redirects to /g/redirect?code=...
         ↓
Exchange code for tokens
         ↓
Store tokens in localStorage
         ↓
Redirect to home page
         ↓
Access protected content
```

## Environment Setup

### Required Environment Variables

Add these to your `.env.local` file:

```env
# Server-side OAuth credentials
GOOGLE_OAuth_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_OAuth_CLIENT_SECRET=your-client-secret

# Client-side accessible version (required for OAuth URL generation)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. Enable the following APIs:
   - Google+ API (for user info)
   - Google Drive API (for file operations)
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/g/redirect` (development)
   - `https://yourdomain.com/g/redirect` (production)

### OAuth Scopes

The application requests the following scopes:

```javascript
const SCOPES = [
  'openid',                                    // OpenID Connect
  'profile',                                   // User profile info
  'email',                                     // User email
  'https://www.googleapis.com/auth/drive'      // Full Google Drive access
].join(' ');
```

## Login Flow Step-by-Step

### Step 1: User Authentication Check

When a user visits any protected page, the `AuthProvider` component checks for existing tokens:

```javascript
// In AuthProvider.js
const checkAuthentication = async () => {
  if (!tokenStorage.hasTokens()) {
    // No tokens found, redirect to auth
    window.location.href = '/g/auth';
    return;
  }
  
  // Try to get valid access token (will refresh if needed)
  const accessToken = await getValidAccessToken();
  if (!accessToken) {
    // Token refresh failed, redirect to auth
    window.location.href = '/g/auth';
    return;
  }
  
  // User is authenticated
  setIsAuthenticated(true);
};
```

### Step 2: Authentication Page (`/g/auth`)

Users are presented with a login interface containing a "Continue with Google" button.

### Step 3: OAuth Authorization

Clicking the login button redirects to Google's OAuth server:

```javascript
// Generated URL example
https://accounts.google.com/o/oauth2/v2/auth?
  client_id=your-client-id
  &redirect_uri=http://localhost:3000/g/redirect
  &response_type=code
  &scope=openid%20profile%20email%20https://www.googleapis.com/auth/drive
  &access_type=offline
  &prompt=consent
```

### Step 4: OAuth Callback (`/g/redirect`)

Google redirects back with an authorization code:

```javascript
// In /g/redirect page
const handleOAuthCallback = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const code = urlParams.get('code');
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);
  
  // Store tokens
  tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
  
  // Redirect to home
  window.location.href = '/';
};
```

### Step 5: Token Storage

Tokens are stored in localStorage on separate lines:

```javascript
localStorage.setItem('google_access_token', accessToken);
localStorage.setItem('google_refresh_token', refreshToken);
```

## Token Management

### Token Storage Location

Tokens are stored in the browser's localStorage:

- **Access Token Key**: `google_access_token`
- **Refresh Token Key**: `google_refresh_token`

### Accessing Tokens

#### Get Access Token
```javascript
import { tokenStorage } from '@/lib/auth';

const accessToken = tokenStorage.getAccessToken();
// Returns: string | null
```

#### Get Refresh Token
```javascript
import { tokenStorage } from '@/lib/auth';

const refreshToken = tokenStorage.getRefreshToken();
// Returns: string | null
```

#### Check if Tokens Exist
```javascript
import { tokenStorage } from '@/lib/auth';

const hasTokens = tokenStorage.hasTokens();
// Returns: boolean (true if both access and refresh tokens exist)
```

### Token Properties

#### Access Token
- **Purpose**: Used for API calls to Google services
- **Lifespan**: ~1 hour
- **Usage**: Include in `Authorization: Bearer {token}` header

#### Refresh Token
- **Purpose**: Used to obtain new access tokens
- **Lifespan**: Long-lived (months/years or until revoked)
- **Usage**: Exchange for new access tokens when they expire

## Token Refresh Mechanism

### Automatic Refresh

The `getValidAccessToken()` function automatically handles token refresh:

```javascript
import { getValidAccessToken } from '@/lib/auth';

const accessToken = await getValidAccessToken();
if (accessToken) {
  // Use token for API calls
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });
} else {
  // User needs to re-authenticate
  window.location.href = '/g/auth';
}
```

### Manual Token Refresh

You can also manually refresh tokens:

```javascript
import { refreshAccessToken, tokenStorage } from '@/lib/auth';

const refreshToken = tokenStorage.getRefreshToken();
if (refreshToken) {
  try {
    const tokens = await refreshAccessToken(refreshToken);
    
    // Update stored tokens
    tokenStorage.setTokens(tokens.access_token, refreshToken);
    
    // Use new access token
    console.log('New access token:', tokens.access_token);
  } catch (error) {
    console.error('Token refresh failed:', error);
    // Redirect to auth page
    window.location.href = '/g/auth';
  }
}
```

### Refresh Token API Call

The refresh process makes this API call:

```javascript
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
```

## Code Examples

### Basic Usage in a Component

```javascript
'use client';

import { useAuth } from '@/components/AuthProvider';
import { getValidAccessToken, listDriveFiles } from '@/lib/auth';

export default function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  
  const handleListFiles = async () => {
    try {
      const accessToken = await getValidAccessToken();
      if (!accessToken) {
        console.error('No valid access token');
        return;
      }
      
      const files = await listDriveFiles(accessToken);
      console.log('Drive files:', files);
    } catch (error) {
      console.error('Error listing files:', error);
    }
  };
  
  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }
  
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button onClick={handleListFiles}>List Drive Files</button>
    </div>
  );
}
```

### Direct Token Access

```javascript
// Get tokens directly from localStorage
const accessToken = localStorage.getItem('google_access_token');
const refreshToken = localStorage.getItem('google_refresh_token');

// Check if tokens exist
if (accessToken && refreshToken) {
  console.log('User is authenticated');
} else {
  console.log('User needs to authenticate');
}
```

### Making API Calls with Tokens

```javascript
import { getValidAccessToken } from '@/lib/auth';

async function callGoogleAPI() {
  const accessToken = await getValidAccessToken();
  
  if (!accessToken) {
    throw new Error('No valid access token available');
  }
  
  const response = await fetch('https://www.googleapis.com/drive/v3/files', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }
  
  return await response.json();
}
```

## API Reference

### `tokenStorage` Object

#### Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `setTokens(accessToken, refreshToken)` | Store both tokens | `void` |
| `getAccessToken()` | Get access token | `string \| null` |
| `getRefreshToken()` | Get refresh token | `string \| null` |
| `clearTokens()` | Remove all tokens | `void` |
| `hasTokens()` | Check if both tokens exist | `boolean` |

### Core Functions

#### `getGoogleAuthUrl()`
- **Purpose**: Generate OAuth authorization URL
- **Returns**: `string` - Complete OAuth URL
- **Usage**: Redirect user to this URL to start auth flow

#### `exchangeCodeForTokens(code)`
- **Purpose**: Exchange authorization code for tokens
- **Parameters**: `code` (string) - Authorization code from Google
- **Returns**: `Promise<{access_token, refresh_token, ...}>` - Token object
- **Usage**: Called in `/g/redirect` page

#### `refreshAccessToken(refreshToken)`
- **Purpose**: Get new access token using refresh token
- **Parameters**: `refreshToken` (string) - Valid refresh token
- **Returns**: `Promise<{access_token, ...}>` - New token object
- **Usage**: Called automatically by `getValidAccessToken()`

#### `getValidAccessToken()`
- **Purpose**: Get valid access token (refresh if needed)
- **Returns**: `Promise<string | null>` - Valid access token or null
- **Usage**: Use this for all API calls

#### `getUserInfo(accessToken)`
- **Purpose**: Get user profile information
- **Parameters**: `accessToken` (string) - Valid access token
- **Returns**: `Promise<{id, name, email, picture, ...}>` - User info object

#### `logout()`
- **Purpose**: Clear tokens and redirect to auth page
- **Returns**: `void`
- **Usage**: Log out the current user

## Troubleshooting

### Common Issues

#### 1. "No valid access token" Error
**Cause**: Access token expired and refresh failed
**Solution**: User needs to re-authenticate
```javascript
// Check if refresh token exists
const refreshToken = tokenStorage.getRefreshToken();
if (!refreshToken) {
  // User needs to log in again
  window.location.href = '/g/auth';
}
```

#### 2. "Token refresh failed" Error
**Cause**: Refresh token is invalid or expired
**Solution**: Clear tokens and re-authenticate
```javascript
tokenStorage.clearTokens();
window.location.href = '/g/auth';
```

#### 3. "Failed to get user info" Error
**Cause**: Access token is invalid
**Solution**: Try refreshing token or re-authenticate
```javascript
try {
  const userInfo = await getUserInfo(accessToken);
} catch (error) {
  // Try getting a fresh token
  const newToken = await getValidAccessToken();
  if (newToken) {
    const userInfo = await getUserInfo(newToken);
  }
}
```

#### 4. OAuth Callback Errors
**Cause**: Redirect URI mismatch
**Solution**: Ensure redirect URI in Google Cloud Console matches exactly:
- Development: `http://localhost:3000/g/redirect`
- Production: `https://yourdomain.com/g/redirect`

### Debug Token Status

```javascript
// Check current token status
function debugTokens() {
  const accessToken = tokenStorage.getAccessToken();
  const refreshToken = tokenStorage.getRefreshToken();
  
  console.log('Access Token:', accessToken ? 'Present' : 'Missing');
  console.log('Refresh Token:', refreshToken ? 'Present' : 'Missing');
  console.log('Has Tokens:', tokenStorage.hasTokens());
  
  if (accessToken) {
    console.log('Access Token Length:', accessToken.length);
    console.log('Access Token Preview:', accessToken.substring(0, 20) + '...');
  }
}
```

### Clear All Authentication Data

```javascript
// Complete logout and cleanup
function forceLogout() {
  tokenStorage.clearTokens();
  
  // Clear any additional auth-related data
  localStorage.removeItem('user_info');
  
  // Redirect to auth page
  window.location.href = '/g/auth';
}
```

## Security Considerations

1. **HTTPS Required**: OAuth requires HTTPS in production
2. **Token Storage**: localStorage is used for simplicity but consider more secure alternatives for sensitive applications
3. **Token Expiration**: Access tokens expire after ~1 hour for security
4. **Refresh Token Protection**: Keep refresh tokens secure - they provide long-term access
5. **Scope Limitations**: Only request necessary scopes to minimize security risk

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api/v3/reference)
- [OAuth 2.0 Security Best Practices](https://tools.ietf.org/html/draft-ietf-oauth-security-topics)
