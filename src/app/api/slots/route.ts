import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { generateAvailableSlots } from '@/lib/slots';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const eventSlug = searchParams.get('eventSlug');
        const date = searchParams.get('date');
        const timezone = searchParams.get('timezone') || 'Asia/Jakarta';
        const teamSlug = searchParams.get('teamSlug');

        if (!date) {
            return NextResponse.json({ error: 'Date parameter required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        let userId: string | null = null;
        let eventTypeId: string | null = null;
        let duration = 30;
        let teamId: string | null = null;

        if (teamSlug) {
            // Team event
            const { data: team } = await supabase
                .from('teams')
                .select('id')
                .eq('slug', teamSlug)
                .single();

            if (!team) {
                return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            }
            teamId = team.id;

            const { data: eventType } = await supabase
                .from('event_types')
                .select('id, duration')
                .eq('team_id', team.id)
                .eq('slug', eventSlug)
                .eq('is_active', true)
                .single();

            if (!eventType) {
                return NextResponse.json({ error: 'Event type not found' }, { status: 404 });
            }

            eventTypeId = eventType.id;
            duration = eventType.duration;

            // Get primary user from team members
            const { data: member } = await supabase
                .from('team_members')
                .select('user_id')
                .eq('team_id', team.id)
                .order('created_at', { ascending: true })
                .limit(1)
                .single();

            if (member) {
                userId = member.user_id;
            }
        } else if (username) {
            // Individual event
            const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('username', username)
                .single();

            if (!user) {
                return NextResponse.json({ error: 'User not found' }, { status: 404 });
            }
            userId = user.id;

            if (eventSlug) {
                const { data: eventType } = await supabase
                    .from('event_types')
                    .select('id, duration')
                    .eq('user_id', user.id)
                    .eq('slug', eventSlug)
                    .eq('is_active', true)
                    .single();

                if (eventType) {
                    eventTypeId = eventType.id;
                    duration = eventType.duration;
                }
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Host not found' }, { status: 404 });
        }

        const targetDate = new Date(date);
        const slots = await generateAvailableSlots(userId, targetDate, duration, teamId || undefined);

        return NextResponse.json({
            slots,
            eventTypeId,
            duration,
            timezone,
        });
    } catch (error) {
        console.error('Get slots error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
