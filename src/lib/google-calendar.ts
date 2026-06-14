import { getGoogleAuth } from './google-auth';

interface CalendarEventParams {
    title: string;
    description?: string;
    startTime: Date;
    endTime: Date;
    attendeeEmails: string[];
    timezone?: string;
    addVideoLink?: boolean;
}

/**
 * Create a Google Calendar event using the user's OAuth token.
 * Supports video conferencing (Google Meet) and multiple attendees.
 * Edge-compatible (uses native fetch via googleapis).
 */
export async function createCalendarEvent(
    userId: string,
    event: CalendarEventParams
): Promise<string | null> {
    try {
        const { google } = await import('googleapis');
        const auth = await getGoogleAuth(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const timezone = event.timezone || 'Asia/Jakarta';

        const requestBody: Record<string, unknown> = {
            summary: event.title,
            description: event.description,
            start: {
                dateTime: event.startTime.toISOString(),
                timeZone: timezone,
            },
            end: {
                dateTime: event.endTime.toISOString(),
                timeZone: timezone,
            },
            attendees: event.attendeeEmails.map(email => ({ email })),
            reminders: {
                useDefault: false,
                overrides: [
                    { method: 'email', minutes: 24 * 60 },
                    { method: 'popup', minutes: 30 },
                ],
            },
        };

        // Add Google Meet video conferencing if requested
        if (event.addVideoLink) {
            requestBody.conferenceData = {
                createRequest: {
                    requestId: `${Date.now()}-${crypto.randomUUID().replace(/-/g, '').substring(0, 8)}`,
                    conferenceSolutionKey: { type: 'hangoutsMeet' },
                },
            };
        }

        const calendarEvent = await calendar.events.insert({
            calendarId: 'primary',
            requestBody,
            conferenceDataVersion: event.addVideoLink ? 1 : 0,
            sendUpdates: 'all',
        });

        return calendarEvent.data.id || null;
    } catch (error) {
        console.error('Failed to create calendar event:', error);
        return null;
    }
}

/**
 * Update an existing Google Calendar event.
 */
export async function updateCalendarEvent(
    userId: string,
    eventId: string,
    event: Partial<CalendarEventParams>
): Promise<boolean> {
    try {
        const { google } = await import('googleapis');
        const auth = await getGoogleAuth(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        const updateData: Record<string, unknown> = {};
        if (event.title) updateData.summary = event.title;
        if (event.description) updateData.description = event.description;
        if (event.startTime) {
            updateData.start = {
                dateTime: event.startTime.toISOString(),
                timeZone: event.timezone || 'Asia/Jakarta',
            };
        }
        if (event.endTime) {
            updateData.end = {
                dateTime: event.endTime.toISOString(),
                timeZone: event.timezone || 'Asia/Jakarta',
            };
        }
        if (event.attendeeEmails) {
            updateData.attendees = event.attendeeEmails.map(email => ({ email }));
        }

        await calendar.events.patch({
            calendarId: 'primary',
            eventId,
            requestBody: updateData,
            sendUpdates: 'all',
        });

        return true;
    } catch (error) {
        console.error('Failed to update calendar event:', error);
        return false;
    }
}

/**
 * Delete a Google Calendar event.
 */
export async function deleteCalendarEvent(
    userId: string,
    eventId: string
): Promise<boolean> {
    try {
        const { google } = await import('googleapis');
        const auth = await getGoogleAuth(userId);
        const calendar = google.calendar({ version: 'v3', auth });

        await calendar.events.delete({
            calendarId: 'primary',
            eventId,
            sendUpdates: 'all',
        });

        return true;
    } catch (error) {
        console.error('Failed to delete calendar event:', error);
        return false;
    }
}
