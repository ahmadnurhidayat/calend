import { getSupabaseAdmin } from './supabase-server';
import { env } from './env';

interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    token_type: string;
}

/**
 * Get a valid Google access token for a user.
 * Automatically refreshes if expired or near expiration.
 * Uses native fetch (Edge-compatible).
 */
export async function getValidGoogleToken(userId: string): Promise<string | null> {
    const supabase = getSupabaseAdmin();

    const { data: user, error } = await supabase
        .from('users')
        .select('google_access_token, google_refresh_token')
        .eq('id', userId)
        .single();

    if (error || !user?.google_access_token) {
        return null;
    }

    // Try using the existing token first
    const testResponse = await fetch(
        `https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${user.google_access_token}`
    );

    if (testResponse.ok) {
        const tokenInfo = await testResponse.json() as { exp?: string };
        // Check if token expires within 5 minutes
        if (tokenInfo.exp) {
            const expiresIn = parseInt(tokenInfo.exp) * 1000 - Date.now();
            if (expiresIn > 5 * 60 * 1000) {
                return user.google_access_token;
            }
        } else {
            // No expiry info, assume it's still valid
            return user.google_access_token;
        }
    }

    // Token is expired or invalid, refresh it
    if (!user.google_refresh_token) {
        return null;
    }

    const clientId = env.googleClientId;
    const clientSecret = env.googleClientSecret;

    if (!clientId || !clientSecret) {
        return null;
    }

    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: user.google_refresh_token,
            grant_type: 'refresh_token',
        }),
    });

    if (!refreshResponse.ok) {
        console.error('Google token refresh failed:', await refreshResponse.text());
        return null;
    }

    const data = await refreshResponse.json() as GoogleTokenResponse;

    // Update the tokens in the database
    await supabase
        .from('users')
        .update({
            google_access_token: data.access_token,
            ...(data.refresh_token && { google_refresh_token: data.refresh_token }),
        })
        .eq('id', userId);

    return data.access_token;
}

/**
 * Get Google OAuth2 client credentials for a user.
 * Returns an object ready to pass to googleapis.
 */
export async function getGoogleAuth(userId: string) {
    const { google } = await import('googleapis');
    const accessToken = await getValidGoogleToken(userId);

    if (!accessToken) {
        throw new Error('Google not connected for this user');
    }

    const oauth2Client = new google.auth.OAuth2(
        env.googleClientId,
        env.googleClientSecret
    );

    oauth2Client.setCredentials({ access_token: accessToken });

    return oauth2Client;
}
