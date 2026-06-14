import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

interface TeamInput {
    name: string;
    slug: string;
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

        const { data: memberships } = await supabase
            .from('team_members')
            .select('team_id, role')
            .eq('user_id', user.id);

        if (!memberships || memberships.length === 0) {
            return NextResponse.json({ teams: [] });
        }

        const teamIds = memberships.map(m => m.team_id);
        const { data: teams } = await supabase
            .from('teams')
            .select('*')
            .in('id', teamIds);

        const teamsWithRole = teams?.map(team => ({
            ...team,
            role: memberships.find(m => m.team_id === team.id)?.role,
        })) || [];

        return NextResponse.json({ teams: teamsWithRole });
    } catch (error) {
        console.error('Get teams error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as TeamInput;
        const { name, slug } = body;

        if (!name || !slug) {
            return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 });
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 });
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

        const { data: team, error: teamError } = await supabase
            .from('teams')
            .insert({ name, slug })
            .select()
            .single();

        if (teamError) {
            if (teamError.code === '23505') {
                return NextResponse.json({ error: 'A team with this slug already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: teamError.message }, { status: 500 });
        }

        const { error: memberError } = await supabase
            .from('team_members')
            .insert({
                team_id: team.id,
                user_id: user.id,
                role: 'admin',
            });

        if (memberError) {
            return NextResponse.json({ error: memberError.message }, { status: 500 });
        }

        return NextResponse.json({ team: { ...team, role: 'admin' } });
    } catch (error) {
        console.error('Create team error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as { id: string; name: string; slug: string };
        const { id, name, slug } = body;

        if (!id || !name || !slug) {
            return NextResponse.json({ error: 'ID, name, and slug are required' }, { status: 400 });
        }

        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Slug must be lowercase alphanumeric with hyphens' }, { status: 400 });
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

        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', id)
            .eq('user_id', user.id)
            .single();

        if (!membership || membership.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can edit teams' }, { status: 403 });
        }

        const { data: team, error: teamError } = await supabase
            .from('teams')
            .update({ name, slug })
            .eq('id', id)
            .select()
            .single();

        if (teamError) {
            if (teamError.code === '23505') {
                return NextResponse.json({ error: 'A team with this slug already exists' }, { status: 409 });
            }
            return NextResponse.json({ error: teamError.message }, { status: 500 });
        }

        return NextResponse.json({ team });
    } catch (error) {
        console.error('Update team error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as { id: string };
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'Team ID is required' }, { status: 400 });
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

        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', id)
            .eq('user_id', user.id)
            .single();

        if (!membership || membership.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can delete teams' }, { status: 403 });
        }

        const { error } = await supabase.from('teams').delete().eq('id', id);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete team error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
