import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { updateCalendarEvent } from '@/lib/google-calendar';
import { sendRescheduleEmails } from '@/lib/emails';
import { env } from '@/lib/env';

interface HostRescheduleRequest {
    bookingId: string;
    date: string;
    startTime: string;
    endTime: string;
    timezone?: string;
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const body = await request.json() as HostRescheduleRequest;
        const { bookingId, date, startTime, endTime, timezone } = body;

        if (!bookingId || !date || !startTime || !endTime) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify host owns this booking
        const { data: hostUser } = await supabase
            .from('users')
            .select('id, name, email')
            .eq('email', session.user.email)
            .single();

        if (!hostUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data: booking, error: fetchError } = await supabase
            .from('bookings')
            .select('*, users!bookings_user_id_fkey(name, email)')
            .eq('id', bookingId)
            .eq('user_id', hostUser.id)
            .single();

        if (fetchError || !booking) {
            return NextResponse.json({ error: 'Booking not found or unauthorized' }, { status: 404 });
        }

        if (booking.status === 'cancelled') {
            return NextResponse.json({ error: 'This booking has been cancelled' }, { status: 400 });
        }

        // Check slot availability (range overlap)
        const { data: conflict } = await supabase
            .from('bookings')
            .select('id')
            .eq('user_id', hostUser.id)
            .eq('date', date)
            .lt('start_time', endTime)
            .gt('end_time', startTime)
            .neq('status', 'cancelled')
            .neq('id', bookingId)
            .maybeSingle();

        if (conflict) {
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
                await updateCalendarEvent(hostUser.id, booking.google_event_id, {
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
            })
            .eq('id', bookingId);

        if (updateError) {
            console.error('Database error:', updateError);
            return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
        }

        // Send reschedule emails
        const rescheduleUrl = `${env.nextAuthUrl}/reschedule/${booking.reschedule_token}`;

        try {
            await sendRescheduleEmails({
                candidateName: booking.candidate_name,
                candidateEmail: booking.candidate_email,
                hostName: hostUser.name,
                hostEmail: hostUser.email,
                eventTitle: 'Meeting',
                oldStartTime: booking.start_time,
                oldEndTime: booking.end_time,
                oldDate: booking.date,
                newStartTime: startTime,
                newEndTime: endTime,
                newDate: date,
                timezone: tz,
                rescheduleUrl,
            });
        } catch (emailError) {
            console.error('Failed to send reschedule emails:', emailError);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Host reschedule error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
