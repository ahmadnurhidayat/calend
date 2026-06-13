import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface CancelRequest {
    bookingId: string;
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as CancelRequest;
        const { bookingId } = body;

        if (!bookingId) {
            return NextResponse.json({ error: 'Booking ID required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        // Get the user ID from the session email
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Verify the booking belongs to this user
        const { data: booking } = await supabase
            .from('bookings')
            .select('id, user_id, google_event_id')
            .eq('id', bookingId)
            .eq('user_id', user.id)
            .single();

        if (!booking) {
            return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
        }

        // Delete from database
        const { error } = await supabase
            .from('bookings')
            .delete()
            .eq('id', bookingId);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 });
        }

        // TODO: If google_event_id exists, delete the Google Calendar event

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Cancel error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
