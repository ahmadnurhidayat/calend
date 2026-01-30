import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createCalendarEvent } from '@/lib/google-calendar';

interface BookingRequest {
    userId: string;
    date: string;
    startTime: string;
    endTime: string;
    candidateName: string;
    candidateEmail: string;
    reason?: string;
}

const BOOKING_LIMIT_PER_USER = 15;

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as BookingRequest;
        const { userId, date, startTime, endTime, candidateName, candidateEmail, reason } = body;

        // Validate required fields
        if (!userId || !date || !startTime || !endTime || !candidateName || !candidateEmail) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check rate limit - max 15 bookings per user
        const { count: bookingCount } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId);

        if (bookingCount !== null && bookingCount >= BOOKING_LIMIT_PER_USER) {
            return NextResponse.json({
                error: `This recruiter has reached the maximum limit of ${BOOKING_LIMIT_PER_USER} appointments.`
            }, { status: 429 });
        }

        // Check if slot is still available
        const { data: existing } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', userId)
            .eq('date', date)
            .eq('start_time', startTime)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
        }

        // Get recruiter details
        const { data: recruiter } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', userId)
            .single();

        // Create Google Calendar event
        let googleEventId: string | undefined;
        try {
            const [year, month, day] = date.split('-').map(Number);
            const [startHour, startMin] = startTime.split(':').map(Number);
            const [endHour, endMin] = endTime.split(':').map(Number);

            const startDate = new Date(year, month - 1, day, startHour, startMin);
            const endDate = new Date(year, month - 1, day, endHour, endMin);

            googleEventId = await createCalendarEvent(userId, {
                title: `Meeting with ${candidateName}`,
                description: reason || `Scheduled via Calend\n\nCandidate: ${candidateName}\nEmail: ${candidateEmail}`,
                startTime: startDate,
                endTime: endDate,
                attendeeEmail: candidateEmail,
            });
        } catch (calendarError) {
            console.error('Failed to create calendar event:', calendarError);
            // Continue without Google Calendar - booking still works
        }

        // Save booking to database
        const { data: booking, error } = await supabase
            .from('bookings')
            .insert({
                user_id: userId,
                date,
                start_time: startTime,
                end_time: endTime,
                candidate_name: candidateName,
                candidate_email: candidateEmail,
                reason,
                google_event_id: googleEventId ?? undefined,
            })
            .select()
            .single();

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            booking,
            recruiterName: recruiter?.name,
            recruiterEmail: recruiter?.email,
        });
    } catch (error) {
        console.error('Booking error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
