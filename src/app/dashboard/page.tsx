'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getSupabase, Availability, Booking } from '@/lib/supabase';

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [username, setUsername] = useState('');
    const [copied, setCopied] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const loadUserData = useCallback(async () => {
        const supabase = getSupabase();
        const { data: user } = await supabase
            .from('users')
            .select('id, username')
            .eq('email', session?.user?.email)
            .single();

        if (user) {
            setUsername(user.username);
        }

        if (user?.id) {
            const { data: bookingsData } = await supabase
                .from('bookings')
                .select('*')
                .eq('user_id', user.id)
                .order('date', { ascending: true });

            if (bookingsData) {
                setBookings(bookingsData);
            }

            const { data: availData } = await supabase
                .from('availability')
                .select('*')
                .eq('user_id', user.id)
                .order('day_of_week', { ascending: true });

            if (availData) {
                setAvailability(availData);
            }
        }
    }, [session?.user?.email]);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user?.email) {
            loadUserData();
        }
    }, [session, loadUserData]);

    const copyBookingLink = () => {
        const link = `${window.location.origin}/book/${username}`;
        navigator.clipboard.writeText(link);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCancelBooking = async (bookingId: string) => {
        setCancellingId(bookingId);
        try {
            const res = await fetch('/api/book/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId }),
            });

            if (res.ok) {
                setBookings(prev => prev.filter(b => b.id !== bookingId));
            }
        } catch {
            // silent fail
        }
        setCancellingId(null);
    };

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const hasAvailability = availability.some(a => a.is_active);
    const hasBookings = bookings.length > 0;
    const hasLink = !!username;

    // Onboarding: show setup steps if user hasn't completed them
    const showOnboarding = !hasAvailability && !hasBookings;

    if (status === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-4xl mx-auto">
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

                {/* Onboarding Banner */}
                {showOnboarding && (
                    <div className="glass-card p-6 mb-6 border-primary/30">
                        <h2 className="font-semibold text-foreground mb-2">Get Started with Calend</h2>
                        <p className="text-sm text-muted mb-4">
                            Complete these steps to start receiving bookings:
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${hasAvailability ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                                    {hasAvailability ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : '1'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-foreground">Set your availability</div>
                                    <div className="text-xs text-muted">Choose which days and hours you&apos;re available</div>
                                </div>
                                {!hasAvailability && (
                                    <a href="/dashboard/availability" className="btn-primary text-sm py-1.5 px-3">
                                        Set Up
                                    </a>
                                )}
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${hasLink ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                                    {hasLink ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : '2'}
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-foreground">Share your booking link</div>
                                    <div className="text-xs text-muted">Send it to candidates so they can book with you</div>
                                </div>
                                {hasAvailability && !hasLink && (
                                    <button onClick={copyBookingLink} className="btn-secondary text-sm py-1.5 px-3">
                                        Copy Link
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Booking Link Card */}
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
                            <p className="text-muted text-sm">No bookings yet. Share your link to get started.</p>
                        ) : (
                            <div className="space-y-3 max-h-80 overflow-y-auto">
                                {bookings.map(booking => (
                                    <div key={booking.id} className="bg-secondary rounded-xl p-4 group">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-foreground">{booking.candidate_name}</div>
                                                <div className="text-xs text-primary">
                                                    {booking.date} at {booking.start_time} - {booking.end_time}
                                                </div>
                                                <div className="text-xs text-muted">{booking.candidate_email}</div>
                                                {booking.reason && (
                                                    <div className="text-xs text-muted mt-1">{booking.reason}</div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleCancelBooking(booking.id)}
                                                disabled={cancellingId === booking.id}
                                                className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-glass transition-all text-muted hover:text-red-400 disabled:opacity-50"
                                                aria-label="Cancel booking"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
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
                                    Edit Availability &rarr;
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
