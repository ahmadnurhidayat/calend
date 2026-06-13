import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface AvailabilitySlot {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabaseAdmin();
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('availability')
            .select('*')
            .eq('user_id', user.id)
            .order('day_of_week', { ascending: true });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ availability: data });
    } catch (error) {
        console.error('Get availability error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as { availability: AvailabilitySlot[] };
        const { availability } = body;

        if (!availability || !Array.isArray(availability)) {
            return NextResponse.json({ error: 'Invalid availability data' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // Delete existing availability
        await supabase.from('availability').delete().eq('user_id', user.id);

        // Insert new availability
        const records = availability.map(day => ({
            user_id: user.id,
            day_of_week: day.day_of_week,
            start_time: day.start_time,
            end_time: day.end_time,
            is_active: day.is_active,
        }));

        const { error } = await supabase.from('availability').insert(records);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update availability error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
