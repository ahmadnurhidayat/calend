import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase-server';

interface MemberInput {
    team_id: string;
    email: string;
    role?: 'admin' | 'member';
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const teamId = searchParams.get('team_id');

        if (!teamId) {
            return NextResponse.json({ error: 'team_id is required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', currentUser.id)
            .single();

        if (!membership) {
            return NextResponse.json({ error: 'Not a member of this team' }, { status: 403 });
        }

        const { data: members, error } = await supabase
            .from('team_members')
            .select('id, role, user_id, users:user_id(id, email, name, username)')
            .eq('team_id', teamId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ members, currentUserRole: membership.role });
    } catch (error) {
        console.error('Get members error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json() as MemberInput;
        const { team_id, email, role } = body;

        if (!team_id || !email) {
            return NextResponse.json({ error: 'team_id and email are required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', team_id)
            .eq('user_id', currentUser.id)
            .single();

        if (!membership || membership.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can add members' }, { status: 403 });
        }

        const { data: targetUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (!targetUser) {
            return NextResponse.json({ error: 'User not found. They must sign up first.' }, { status: 404 });
        }

        const { data: existingMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('team_id', team_id)
            .eq('user_id', targetUser.id)
            .single();

        if (existingMember) {
            return NextResponse.json({ error: 'User is already a member of this team' }, { status: 409 });
        }

        const { data: newMember, error } = await supabase
            .from('team_members')
            .insert({
                team_id,
                user_id: targetUser.id,
                role: role || 'member',
            })
            .select('id, role, user_id')
            .single();

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ member: { ...newMember, users: { id: targetUser.id, email, name: null, username: null } } });
    } catch (error) {
        console.error('Add member error:', error);
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
        const memberId = searchParams.get('id');
        const teamId = searchParams.get('team_id');

        if (!memberId || !teamId) {
            return NextResponse.json({ error: 'id and team_id are required' }, { status: 400 });
        }

        const supabase = getSupabaseAdmin();

        const { data: currentUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', session.user.email)
            .single();

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { data: membership } = await supabase
            .from('team_members')
            .select('role')
            .eq('team_id', teamId)
            .eq('user_id', currentUser.id)
            .single();

        if (!membership || membership.role !== 'admin') {
            return NextResponse.json({ error: 'Only admins can remove members' }, { status: 403 });
        }

        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', memberId)
            .eq('team_id', teamId);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Remove member error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
