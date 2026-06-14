'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { getSupabase, Team } from '@/lib/supabase';

interface EventType {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    duration: number;
    is_active: boolean;
}

interface TeamMember {
    user_id: string;
    users?: { name: string; email: string };
}

export default function TeamBookingPage({
    params
}: {
    params: Promise<{ teamSlug: string }>
}) {
    const { teamSlug } = use(params);
    const [team, setTeam] = useState<Team | null>(null);
    const [eventTypes, setEventTypes] = useState<EventType[]>([]);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        const supabase = getSupabase();
        const { data: teamData } = await supabase
            .from('teams')
            .select('*')
            .eq('slug', teamSlug)
            .single();

        if (!teamData) {
            setLoading(false);
            return;
        }
        setTeam(teamData);

        const { data: events } = await supabase
            .from('event_types')
            .select('*')
            .eq('team_id', teamData.id)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (events) {
            setEventTypes(events);
        }

        const { data: members } = await supabase
            .from('team_members')
            .select('user_id, users(name, email)')
            .eq('team_id', teamData.id);

        if (members) {
            const mapped = members.map((m: Record<string, unknown>) => ({
                user_id: m.user_id as string,
                users: Array.isArray(m.users) ? m.users[0] : m.users,
            })) as TeamMember[];
            setTeamMembers(mapped);
        }

        setLoading(false);
    }, [teamSlug]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    if (!team) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Team Not Found</h1>
                    <p className="text-muted">This team does not exist.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">{team.name}</h1>
                    <p className="text-muted">Select a meeting type to book</p>
                    <div className="flex justify-center gap-2 mt-4">
                        {teamMembers.map(member => (
                            <div key={member.user_id} className="bg-secondary px-3 py-1 rounded-full text-sm text-muted">
                                {member.users?.name}
                            </div>
                        ))}
                    </div>
                </div>

                {eventTypes.length === 0 ? (
                    <div className="glass-card p-8 text-center">
                        <p className="text-muted">No event types available for this team.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {eventTypes.map(event => (
                            <a
                                key={event.id}
                                href={`/book/team/${teamSlug}/${event.slug}`}
                                className="glass-card p-6 block hover:border-primary/30 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h2 className="font-semibold text-foreground text-lg">{event.title}</h2>
                                        {event.description && (
                                            <p className="text-sm text-muted mt-1">{event.description}</p>
                                        )}
                                    </div>
                                    <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                                        {event.duration} min
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
