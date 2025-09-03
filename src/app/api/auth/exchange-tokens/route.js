import { NextResponse } from 'next/server';

const GOOGLE_OAUTH_CLIENT_ID = '291823411154-7oqitku2enrn2q9n5va5g7oobs30brek.apps.googleusercontent.com';
const GOOGLE_OAUTH_CLIENT_SECRET = process.env.GOOGLE_OAUTH_CLIENT_KEY; // Use the same env var name

/**
 * Exchange authorization code for access and refresh tokens
 */
export async function POST(request) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: 'Authorization code is required' },
        { status: 400 }
      );
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_OAUTH_CLIENT_ID,
        client_secret: GOOGLE_OAUTH_CLIENT_SECRET,
        redirect_uri: redirectUri || 'http://localhost:3000/g/redirect',
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Token exchange failed:', errorData);
      return NextResponse.json(
        { error: 'Failed to exchange authorization code for tokens' },
        { status: response.status }
      );
    }

    const tokens = await response.json();
    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error in exchange-tokens API:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
