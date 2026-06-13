import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface EventTypeInput {
    id?: string;
    title: string;
    slug: string;
    description?: string;
    duration: number;
    is_active?: boolean;
    team_id?: string;
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
            .from('event_types')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ eventTypes: data });
    } catch (error) {
        console.error('Get event types error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as EventTypeInput;
        const { title, slug, description, duration, team_id } = body;

        if (!title || !slug || !duration) {
            return NextResponse.json({ error: 'Title, slug, and duration are required' }, { status: 400 });
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
            .from('event_types')
            .insert({
                user_id: user.id,
                team_id: team_id || null,
                title,
                slug,
                description: description || null,
                duration,
            })
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ eventType: data });
    } catch (error) {
        console.error('Create event type error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as EventTypeInput;
        const { id, title, slug, description, duration, is_active } = body;

        if (!id) {
            return NextResponse.json({ error: 'Event type ID required' }, { status: 400 });
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

        const updateData: Record<string, unknown> = {};
        if (title) updateData.title = title;
        if (slug) updateData.slug = slug;
        if (description !== undefined) updateData.description = description;
        if (duration) updateData.duration = duration;
        if (is_active !== undefined) updateData.is_active = is_active;

        const { data, error } = await supabase
            .from('event_types')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ eventType: data });
    } catch (error) {
        console.error('Update event type error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Event type ID required' }, { status: 400 });
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

        const { error } = await supabase
            .from('event_types')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete event type error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
