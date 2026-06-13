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

interface TimeSlot {
    time: string;
    endTime: string;
    available: boolean;
}

interface TeamMember {
    user_id: string;
    users?: { name: string; email: string };
}

export default function TeamEventTypeBookingPage({
    params
}: {
    params: Promise<{ teamSlug: string; eventSlug: string }>
}) {
    const { teamSlug, eventSlug } = use(params);
    const [team, setTeam] = useState<Team | null>(null);
    const [eventType, setEventType] = useState<EventType | null>(null);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [candidateTimezone, setCandidateTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [meetLink, setMeetLink] = useState('');

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

        const { data: event } = await supabase
            .from('event_types')
            .select('*')
            .eq('team_id', teamData.id)
            .eq('slug', eventSlug)
            .eq('is_active', true)
            .single();

        if (!event) {
            setLoading(false);
            return;
        }
        setEventType(event);

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
    }, [teamSlug, eventSlug]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);

    useEffect(() => {
        if (!selectedDate || !teamSlug || !eventSlug) return;

        const fetchSlots = async () => {
            const dateStr = selectedDate.toISOString().split('T')[0];
            try {
                const res = await fetch(
                    `/api/slots?teamSlug=${teamSlug}&eventSlug=${eventSlug}&date=${dateStr}&timezone=${candidateTimezone}`
                );
                const data = await res.json() as { slots?: TimeSlot[] };
                setAvailableSlots(data.slots || []);
            } catch {
                setAvailableSlots([]);
            }
        };

        fetchSlots();
    }, [selectedDate, candidateTimezone, teamSlug, eventSlug]);

    const handleBooking = async () => {
        if (!team || !eventType || !selectedDate || !selectedTime || !candidateName || !candidateEmail) {
            setError('Please fill in all required fields');
            return;
        }

        // Get primary user ID from team members
        const primaryMember = teamMembers[0];
        if (!primaryMember) {
            setError('Team has no members');
            return;
        }

        setBooking(true);
        setError('');

        try {
            const [h, m] = selectedTime.split(':').map(Number);
            const endMinutes = h * 60 + m + eventType.duration;
            const endH = Math.floor(endMinutes / 60);
            const endM = endMinutes % 60;
            const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

            const res = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: primaryMember.user_id,
                    eventTypeId: eventType.id,
                    teamId: team.id,
                    date: selectedDate.toISOString().split('T')[0],
                    startTime: selectedTime,
                    endTime,
                    candidateName,
                    candidateEmail,
                    candidateTimezone,
                    reason,
                }),
            });

            if (res.ok) {
                const data = await res.json() as { meetLink?: string };
                setMeetLink(data.meetLink || '');
                setSuccess(true);
            } else {
                const data = await res.json() as { error?: string };
                setError(data.error || 'Failed to book appointment');
            }
        } catch {
            setError('Failed to book appointment');
        }

        setBooking(false);
    };

    const generateCalendarDays = () => {
        const today = new Date();
        const days: Date[] = [];
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    if (!team || !eventType) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Not Found</h1>
                    <p className="text-muted">This team event does not exist or is no longer active.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
                    <p className="text-muted mb-4">
                        Your {eventType.duration}-minute {eventType.title} with {team.name} has been scheduled.
                    </p>
                    <p className="text-sm text-primary font-medium mb-4">
                        {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedTime}
                    </p>
                    {meetLink && (
                        <a href={meetLink} target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">
                            Join Google Meet
                        </a>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">{eventType.title}</h1>
                    <p className="text-muted">{team.name} &middot; {eventType.duration} minutes</p>
                    {eventType.description && (
                        <p className="text-sm text-muted mt-2">{eventType.description}</p>
                    )}
                    <div className="flex justify-center gap-2 mt-4">
                        {teamMembers.map(member => (
                            <div key={member.user_id} className="bg-secondary px-3 py-1 rounded-full text-sm text-muted">
                                {member.users?.name}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Timezone selector */}
                <div className="glass-card p-4 mb-6">
                    <label className="text-sm text-muted">Your Timezone</label>
                    <select
                        value={candidateTimezone}
                        onChange={(e) => setCandidateTimezone(e.target.value)}
                        className="input-field w-full mt-2"
                    >
                        <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                        <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                        <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                        <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                        <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                        <option value="Europe/London">Europe/London (GMT)</option>
                    </select>
                </div>

                {/* Date Selection */}
                <div className="glass-card p-6 mb-6">
                    <h2 className="font-semibold text-foreground mb-4">Select a Date</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {generateCalendarDays().map(date => {
                            const isSelected = selectedDate?.toDateString() === date.toDateString();
                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                                    className={`flex-shrink-0 p-3 rounded-xl text-center transition-all ${isSelected
                                        ? 'bg-primary text-white'
                                        : 'bg-secondary hover:bg-primary/20'
                                        }`}
                                >
                                    <div className="text-xs">{dayNames[date.getDay()]}</div>
                                    <div className="text-lg font-bold">{date.getDate()}</div>
                                    <div className="text-xs">{monthNames[date.getMonth()]}</div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Time Selection */}
                {selectedDate && (
                    <div className="glass-card p-6 mb-6">
                        <h2 className="font-semibold text-foreground mb-4">Select a Time</h2>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {availableSlots.map(slot => (
                                <button
                                    key={slot.time}
                                    onClick={() => setSelectedTime(slot.time)}
                                    disabled={!slot.available}
                                    className={`p-2 rounded-lg text-sm font-medium transition-all ${selectedTime === slot.time
                                        ? 'bg-primary text-white'
                                        : slot.available
                                            ? 'bg-secondary hover:bg-primary/20'
                                            : 'opacity-50 cursor-not-allowed line-through'
                                        }`}
                                >
                                    {slot.time}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Booking Form */}
                {selectedTime && (
                    <div className="glass-card p-6">
                        <h2 className="font-semibold text-foreground mb-4">Your Details</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-muted mb-2">Name *</label>
                                <input
                                    type="text"
                                    value={candidateName}
                                    onChange={(e) => setCandidateName(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="Your full name"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-2">Email *</label>
                                <input
                                    type="email"
                                    value={candidateEmail}
                                    onChange={(e) => setCandidateEmail(e.target.value)}
                                    className="input-field w-full"
                                    placeholder="your@email.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-muted mb-2">Reason (optional)</label>
                                <textarea
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    className="input-field w-full h-20 resize-none"
                                    placeholder="What would you like to discuss?"
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <button
                                onClick={handleBooking}
                                disabled={booking}
                                className="btn-primary w-full"
                            >
                                {booking ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
