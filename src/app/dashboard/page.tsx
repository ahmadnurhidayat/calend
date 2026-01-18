'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, Availability, Booking } from '@/lib/supabase';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [username, setUsername] = useState('');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user?.email) {
            loadUserData();
        }
    }, [session]);

    const loadUserData = async () => {
        const { data: user } = await supabase
            .from('users')
            .select('username')
            .eq('email', session?.user?.email)
            .single();

        if (user) {
            setUsername(user.username);
        }

        // Load bookings
        const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*')
            .order('date', { ascending: true });

        if (bookingsData) {
            setBookings(bookingsData);
        }

        // Load availability
        const { data: availData } = await supabase
            .from('availability')
            .select('*')
            .order('day_of_week', { ascending: true });

        if (availData) {
            setAvailability(availData);
        }
    };

    const copyBookingLink = () => {
        const link = `${window.location.origin}/book/${username}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                        <p className="text-muted">Welcome, {session?.user?.name}</p>
                    </div>
                    <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="btn-secondary"
                    >
                        Sign Out
                    </button>
                </div>

                {/* Booking Link */}
                <div className="glass-card p-6 mb-6">
                    <h2 className="font-semibold text-foreground mb-3">Your Booking Link</h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/book/${username}`}
                            readOnly
                            className="input-field flex-1 text-sm"
                        />
                        <button
                            onClick={copyBookingLink}
                            className="btn-primary whitespace-nowrap"
                        >
                            {copied ? 'Copied!' : 'Copy Link'}
                        </button>
                    </div>
                    <p className="text-xs text-muted mt-2">
                        Share this link with candidates to let them book appointments with you.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Upcoming Bookings */}
                    <div className="glass-card p-6">
                        <h2 className="font-semibold text-foreground mb-4">Upcoming Bookings</h2>
                        {bookings.length === 0 ? (
                            <p className="text-muted text-sm">No bookings yet.</p>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="bg-secondary rounded-xl p-4">
                                        <div className="font-medium text-foreground">{booking.candidate_name}</div>
                                        <div className="text-xs text-primary">
                                            {booking.date} at {booking.start_time} - {booking.end_time}
                                        </div>
                                        <div className="text-xs text-muted">{booking.candidate_email}</div>
                                        {booking.reason && (
                                            <div className="text-xs text-muted mt-1">{booking.reason}</div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Availability */}
                    <div className="glass-card p-6">
                        <h2 className="font-semibold text-foreground mb-4">Your Availability</h2>
                        {availability.length === 0 ? (
                            <div>
                                <p className="text-muted text-sm mb-4">No availability set. Add your available hours.</p>
                                <a href="/dashboard/availability" className="btn-primary inline-block">
                                    Set Availability
                                </a>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {availability.filter(a => a.is_active).map(slot => (
                                    <div key={slot.id} className="flex justify-between text-sm">
                                        <span className="text-foreground">{dayNames[slot.day_of_week]}</span>
                                        <span className="text-muted">{slot.start_time} - {slot.end_time}</span>
                                    </div>
                                ))}
                                <a href="/dashboard/availability" className="text-primary text-sm hover:underline block mt-4">
                                    Edit Availability →
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
