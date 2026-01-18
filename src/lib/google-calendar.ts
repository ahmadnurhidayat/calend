import { google } from 'googleapis';
import { supabase } from './supabase';

export async function createCalendarEvent(
    userId: string,
    event: {
        title: string;
        description?: string;
        startTime: Date;
        endTime: Date;
        attendeeEmail: string;
    }
) {
    // Get user's tokens from database
    const { data: user, error } = await supabase
        .from('users')
        .select('google_access_token, google_refresh_token')
        .eq('id', userId)
        .single();

    if (error || !user?.google_access_token) {
        throw new Error('User not found or not connected to Google');
    }

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        access_token: user.google_access_token,
        refresh_token: user.google_refresh_token,
    });

    // Create calendar event
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const calendarEvent = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: {
            summary: event.title,
            description: event.description,
            start: {
                dateTime: event.startTime.toISOString(),
                timeZone: 'Asia/Jakarta',
            },
            end: {
                dateTime: event.endTime.toISOString(),
                timeZone: 'Asia/Jakarta',
            },
            attendees: [{ email: event.attendeeEmail }],
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 },
                ],
            },
        },
        sendUpdates: 'all',
    });

    return calendarEvent.data.id;
}
