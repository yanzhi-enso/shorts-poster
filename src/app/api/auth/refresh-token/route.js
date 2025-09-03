import { NextResponse } from 'next/server';

const GOOGLE_OAUTH_CLIENT_ID = '291823411154-7oqitku2enrn2q9n5va5g7oobs30brek.apps.googleusercontent.com';
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_KEY; // Use the same env var name

/**
 * Refresh access token using refresh token
 */
export async function POST(request) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        refresh_token: refreshToken,
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token refresh failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to refresh access token' },
        { status: response.status }
      );
    }

    const tokens = await response.json();
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error in refresh-token API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
