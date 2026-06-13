import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { updateCalendarEvent } from '@/lib/google-calendar';

interface RescheduleRequest {
    token: string;
    date: string;
    startTime: string;
    endTime: string;
    timezone?: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as RescheduleRequest;
        const { token, date, startTime, endTime, timezone } = body;

        if (!token || !date || !startTime || !endTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Find booking by reschedule token
        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, users(name, email)')
            .eq('reschedule_token', token)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Invalid reschedule link' }, { status: 404 });
        }

        if (booking.status === 'cancelled') {
            return NextResponse.json({ error: 'This booking has been cancelled' }, { status: 400 });
        }

        // Check slot availability
        const { data: existing } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', booking.user_id)
            .eq('date', date)
            .eq('start_time', startTime)
            .neq('status', 'cancelled')
            .neq('id', booking.id)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'This time slot is no longer available' }, { status: 409 });
        }

        // Parse times for Google Calendar
        const [year, month, day] = date.split('-').map(Number);
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        const tz = timezone || booking.timezone || 'Asia/Jakarta';

        const gCalStart = new Date(year, month - 1, day, startHour, startMin);
        const gCalEnd = new Date(year, month - 1, day, endHour, endMin);

        // Update Google Calendar event if it exists
        if (booking.google_event_id) {
            try {
                await updateCalendarEvent(booking.user_id, booking.google_event_id, {
                    title: `Meeting with ${booking.candidate_name}`,
                    startTime: gCalStart,
                    endTime: gCalEnd,
                    timezone: tz,
                });
            } catch (calError) {
                console.error('Failed to update calendar event:', calError);
            }
        }

        // Update booking in database
        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                date,
                start_time: startTime,
                end_time: endTime,
                start_at: gCalStart.toISOString(),
                end_at: gCalEnd.toISOString(),
                timezone: tz,
                status: 'confirmed',
            })
            .eq('id', booking.id);

        if (updateError) {
            console.error('Database error:', updateError);
            return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Reschedule error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
