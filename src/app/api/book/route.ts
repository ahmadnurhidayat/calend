import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { createCalendarEvent } from '@/lib/google-calendar';
import { sendBookingEmails } from '@/lib/emails';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { env } from '@/lib/env';
import crypto from 'crypto';

interface BookingRequest {
    userId: string;
    eventTypeId?: string;
    teamId?: string;
    date: string;
    startTime: string;
    endTime: string;
    startAt?: string;
    endAt?: string;
    candidateName: string;
    candidateEmail: string;
    candidateTimezone?: string;
    reason?: string;
}

const BOOKING_LIMIT_PER_USER = 15;

function generateRescheduleToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`booking:${ip}`, RATE_LIMITS.booking)) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const supabase = getSupabaseAdmin();
        const body = await request.json() as BookingRequest;
        const {
            userId, eventTypeId, teamId, date, startTime, endTime,
            startAt, endAt, candidateName, candidateEmail,
            candidateTimezone, reason
        } = body;

        if (!userId || !date || !startTime || !endTime || !candidateName || !candidateEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(candidateEmail)) {
            return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
        }

        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate < today) {
            return NextResponse.json({ error: 'Cannot book dates in the past' }, { status: 400 });
        }

        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 30);
        if (bookingDate > maxDate) {
            return NextResponse.json({ error: 'Cannot book more than 30 days in advance' }, { status: 400 });
        }

        const { data: targetUser } = await supabase
            .from('users')
            .select('id, name, email, username')
            .eq('id', userId)
            .single();

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Check booking limit
        const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .neq('status', 'cancelled');

        if (bookingCount !== null && bookingCount >= BOOKING_LIMIT_PER_USER) {
            return NextResponse.json({
                error: `This user has reached the maximum limit of ${BOOKING_LIMIT_PER_USER} appointments.`
            }, { status: 429 });
        }

        // Check slot availability (range overlap — prevents race conditions)
        const { data: existing } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', userId)
            .lt('start_time', endTime)
            .gt('end_time', startTime)
            .eq('date', date)
            .neq('status', 'cancelled')
            .maybeSingle();

        if (existing) {
            return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
        }

        // Verify availability
        const dayOfWeek = bookingDate.getDay();
        const { data: availSlot } = await supabase
            .from('availability')
            .select('id')
            .eq('user_id', userId)
            .eq('day_of_week', dayOfWeek)
            .eq('is_active', true)
            .single();

        if (!availSlot) {
            return NextResponse.json({ error: 'This day is not available for booking' }, { status: 400 });
        }

        // Get event type details
        let eventTitle = 'Meeting';
        if (eventTypeId) {
            const { data: eventType } = await supabase
                .from('event_types')
                .select('title')
                .eq('id', eventTypeId)
                .single();
            if (eventType) eventTitle = eventType.title;
        }

        // Generate reschedule token
        const rescheduleToken = generateRescheduleToken();

        // Parse times for Google Calendar
        const [year, month, day] = date.split('-').map(Number);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const tz = candidateTimezone || 'Asia/Jakarta';

        const gCalStart = new Date(year, month - 1, day, startHour, startMin);
        const gCalEnd = new Date(year, month - 1, day, endHour, endMin);

        // Collect attendee emails
        const attendeeEmails = [candidateEmail];
        if (teamId) {
            const { data: members } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', teamId);

            if (members) {
                for (const member of members) {
                    const { data: memberUser } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', member.user_id)
                        .single();
                    if (memberUser && memberUser.email !== targetUser.email) {
                        attendeeEmails.push(memberUser.email);
                    }
                }
            }
        }

        // Create Google Calendar event
        let googleEventId: string | null = null;
        let meetLink: string | undefined;
        try {
            const result = await createCalendarEvent(userId, {
                title: eventTitle,
                description: `${reason || `Scheduled via Calend`}\n\nCandidate: ${candidateName}\nEmail: ${candidateEmail}\n\nReschedule: ${env.nextAuthUrl}/reschedule/${rescheduleToken}`,
                startTime: gCalStart,
                endTime: gCalEnd,
                attendeeEmails,
                timezone: tz,
                addVideoLink: true,
            });
            googleEventId = result;

            // Try to get meet link from the created event
            if (googleEventId) {
                try {
                    const { google } = await import('googleapis');
                    const { getGoogleAuth } = await import('@/lib/google-auth');
                    const auth = await getGoogleAuth(userId);
                    const calendar = google.calendar({ version: 'v3', auth });
                    const event = await calendar.events.get({
                        calendarId: 'primary',
                        eventId: googleEventId,
                    });
                    meetLink = event.data.hangoutLink || undefined;
                } catch {
                    // Meet link not available
                }
            }
        } catch (calendarError) {
            console.error('Failed to create calendar event:', calendarError);
        }

        // Save booking to database
        const { data: booking, error } = await supabase
            .from('bookings')
            .insert({
                user_id: userId,
                event_type_id: eventTypeId || null,
                date,
                start_time: startTime,
                end_time: endTime,
                start_at: startAt || gCalStart.toISOString(),
                end_at: endAt || gCalEnd.toISOString(),
                timezone: tz,
                candidate_name: candidateName,
                candidate_email: candidateEmail,
                reason,
                google_event_id: googleEventId,
                reschedule_token: rescheduleToken,
                status: 'confirmed',
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 });
        }

        // Send emails
        const rescheduleUrl = `${env.nextAuthUrl}/reschedule/${rescheduleToken}`;

        // Get team member emails for notifications
        const teamMemberEmails: string[] = [];
        if (teamId) {
            const { data: members } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', teamId);

            if (members) {
                for (const member of members) {
                    const { data: memberUser } = await supabase
                        .from('users')
                        .select('email')
                        .eq('id', member.user_id)
                        .single();
                    if (memberUser && memberUser.email !== targetUser.email) {
                        teamMemberEmails.push(memberUser.email);
                    }
                }
            }
        }

        try {
            await sendBookingEmails({
                candidateName,
                candidateEmail,
                hostName: targetUser.name,
                hostEmail: targetUser.email,
                eventTitle,
                startTime,
                endTime,
                date,
                timezone: tz,
                reason,
                rescheduleUrl,
                teamMemberEmails,
                meetLink,
            });
        } catch (emailError) {
            console.error('Failed to send emails:', emailError);
        }

        return NextResponse.json({
            success: true,
            booking,
            rescheduleUrl,
            meetLink,
        });
    } catch (error) {
        console.error('Booking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
