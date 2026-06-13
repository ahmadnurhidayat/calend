'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import { getSupabase, Availability, Booking } from '@/lib/supabase';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function CopyIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

function ExternalLinkIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
    );
}

function EmailIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    );
}

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
        </svg>
    );
}

function XIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

function LinkedInIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );
}

function CalendarIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    );
}

function ClockIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    );
}

function UserIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    );
}

function LinkIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
    );
}

function ShareIcon({ className }: { className?: string }) {
    return (
        <svg className={className || 'w-5 h-5'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
    );
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [username, setUsername] = useState('');
    const [copied, setCopied] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    // Reschedule modal state
    const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
    const [rescheduleDate, setRescheduleDate] = useState<Date | null>(null);
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [rescheduleLoading, setRescheduleLoading] = useState(false);
    const [rescheduleError, setRescheduleError] = useState('');

    const bookingLink = typeof window !== 'undefined'
        ? `${window.location.origin}/book/${username}`
        : '';

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

    const copyBookingLink = async () => {
        try {
            await navigator.clipboard.writeText(bookingLink);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            const input = document.getElementById('booking-link-input') as HTMLInputElement;
            if (input) {
                input.select();
                document.execCommand('copy');
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            }
        }
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

    const shareViaEmail = () => {
        const subject = encodeURIComponent("Let's Schedule a Meeting");
        const body = encodeURIComponent(`Hi,\n\nI'd like to schedule a meeting with you. Please select a time on my calendar here:\n\n${bookingLink}\n\nBest regards`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const shareViaWhatsApp = () => {
        const text = encodeURIComponent(`Hey! You can book a meeting with me here: ${bookingLink}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const shareViaX = () => {
        const text = encodeURIComponent(`Book a meeting with me: ${bookingLink}`);
        window.open(`https://x.com/intent/tweet?text=${text}`, '_blank');
    };

    const shareViaLinkedIn = () => {
        const url = encodeURIComponent(bookingLink);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    };

    const getRescheduleSlots = (date: Date) => {
        const dayOfWeek = date.getDay();
        const dayAvail = availability.find(a => a.day_of_week === dayOfWeek);
        if (!dayAvail) return [];

        const slots: { time: string; available: boolean }[] = [];
        const [startHour, startMin] = dayAvail.start_time.split(':').map(Number);
        const [endHour, endMin] = dayAvail.end_time.split(':').map(Number);
        const dateStr = date.toISOString().split('T')[0];

        const bookedRanges = bookings
            .filter(b => b.date === dateStr && b.status !== 'cancelled' && b.id !== rescheduleBooking?.id)
            .map(b => ({ start: b.start_time, end: b.end_time }));

        for (let h = startHour; h < endHour || (h === endHour && 0 < endMin); h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === startHour && m < startMin) continue;
                if (h === endHour && m >= endMin) break;

                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const slotEndMin = h * 60 + m + 30;
                const slotEnd = `${Math.floor(slotEndMin / 60).toString().padStart(2, '0')}:${(slotEndMin % 60).toString().padStart(2, '0')}`;
                const isBooked = bookedRanges.some(r => r.start < slotEnd && r.end > timeStr);
                slots.push({ time: timeStr, available: !isBooked });
            }
        }
        return slots;
    };

    const handleReschedule = async () => {
        if (!rescheduleBooking || !rescheduleDate || !rescheduleTime) {
            setRescheduleError('Please select a date and time');
            return;
        }

        setRescheduleLoading(true);
        setRescheduleError('');

        const [h, m] = rescheduleTime.split(':').map(Number);
        const endMin = h * 60 + m + 30;
        const endTime = `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;

        try {
            const res = await fetch('/api/book/host-reschedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId: rescheduleBooking.id,
                    date: rescheduleDate.toISOString().split('T')[0],
                    startTime: rescheduleTime,
                    endTime,
                }),
            });

            if (res.ok) {
                setBookings(prev => prev.map(b =>
                    b.id === rescheduleBooking.id
                        ? { ...b, date: rescheduleDate.toISOString().split('T')[0], start_time: rescheduleTime, end_time: endTime }
                        : b
                ));
                setRescheduleBooking(null);
                setRescheduleDate(null);
                setRescheduleTime('');
            } else {
                const data = await res.json() as { error?: string };
                setRescheduleError(data.error || 'Failed to reschedule');
            }
        } catch {
            setRescheduleError('Failed to reschedule');
        }
        setRescheduleLoading(false);
    };

    const generateRescheduleDays = () => {
        const today = new Date();
        const days: Date[] = [];
        for (let i = 0; i < 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            days.push(date);
        }
        return days;
    };

    const hasAvailability = availability.some(a => a.is_active);
    const hasBookings = bookings.length > 0;
    const hasLink = !!username;
    const showOnboarding = !hasAvailability && !hasBookings;
    const activeDays = availability.filter(a => a.is_active).length;

    if (status === 'loading') {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted text-sm mt-1">
                        Welcome back, <span className="text-foreground font-medium">{session?.user?.name || 'there'}</span>
                    </p>
                </div>

                {/* Onboarding Banner */}
                {showOnboarding && (
                    <div className="glass-card p-6 mb-8 border border-primary/20">
                        <h2 className="font-semibold text-foreground mb-2">Get Started with Calend</h2>
                        <p className="text-sm text-muted mb-4">
                            Complete these steps to start receiving bookings:
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${hasAvailability ? 'bg-green-500 text-white' : 'bg-primary text-white'}`}>
                                    {hasAvailability ? <CheckIcon className="w-4 h-4" /> : '1'}
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
                                    {hasLink ? <CheckIcon className="w-4 h-4" /> : '2'}
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

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Upcoming Bookings */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Upcoming Bookings */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-foreground">Upcoming Bookings</h2>
                                {hasBookings && (
                                    <span className="text-xs text-muted bg-secondary px-2 py-1 rounded-full">
                                        {bookings.length} booking{bookings.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </div>
                            {bookings.length === 0 ? (
                                <div className="text-center py-8">
                                    <CalendarIcon className="w-10 h-10 text-muted mx-auto mb-3" />
                                    <p className="text-muted text-sm">No bookings yet.</p>
                                    <p className="text-muted text-xs mt-1">Share your link to get started.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {bookings.map(booking => (
                                        <div key={booking.id} className="group bg-secondary/50 hover:bg-secondary rounded-xl p-4 transition-colors">
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <UserIcon className="w-4 h-4 text-primary" />
                                                        <span className="font-medium text-foreground">{booking.candidate_name}</span>
                                                        {booking.status && (
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                                                                booking.status === 'confirmed'
                                                                    ? 'bg-green-500/10 text-green-500'
                                                                    : booking.status === 'cancelled'
                                                                    ? 'bg-red-500/10 text-red-500'
                                                                    : 'bg-yellow-500/10 text-yellow-500'
                                                            }`}>
                                                                {booking.status}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-muted">
                                                        <span className="flex items-center gap-1">
                                                            <CalendarIcon className="w-3.5 h-3.5" />
                                                            {booking.date}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <ClockIcon className="w-3.5 h-3.5" />
                                                            {booking.start_time} - {booking.end_time}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-muted mt-1">{booking.candidate_email}</div>
                                                    {booking.reason && (
                                                        <div className="text-xs text-muted mt-1 italic">&ldquo;{booking.reason}&rdquo;</div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => {
                                                            setRescheduleBooking(booking);
                                                            setRescheduleDate(null);
                                                            setRescheduleTime('');
                                                            setRescheduleError('');
                                                        }}
                                                        className="p-2 rounded-lg hover:bg-primary/10 transition-all text-muted hover:text-primary"
                                                        aria-label="Reschedule booking"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancelBooking(booking.id)}
                                                        disabled={cancellingId === booking.id}
                                                        className="p-2 rounded-lg hover:bg-red-500/10 transition-all text-muted hover:text-red-500 disabled:opacity-50"
                                                        aria-label="Cancel booking"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Availability Summary */}
                        <div className="glass-card p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-semibold text-foreground">Availability</h2>
                                <a href="/dashboard/availability" className="text-xs text-primary hover:underline">
                                    Edit &rarr;
                                </a>
                            </div>
                            {!hasAvailability ? (
                                <div className="text-center py-6">
                                    <ClockIcon className="w-8 h-8 text-muted mx-auto mb-2" />
                                    <p className="text-muted text-sm mb-3">No availability set yet.</p>
                                    <a href="/dashboard/availability" className="btn-primary inline-block text-sm py-2 px-4">
                                        Set Availability
                                    </a>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {availability.map(slot => (
                                        <div
                                            key={slot.id}
                                            className={`rounded-lg p-3 text-center ${
                                                slot.is_active
                                                    ? 'bg-primary/10 border border-primary/20'
                                                    : 'bg-secondary/50 border border-border opacity-50'
                                            }`}
                                        >
                                            <div className="text-sm font-medium text-foreground">
                                                {dayNames[slot.day_of_week].slice(0, 3)}
                                            </div>
                                            <div className="text-xs text-muted mt-1">
                                                {slot.is_active ? `${slot.start_time} - ${slot.end_time}` : 'Off'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Link Share & Quick Share */}
                    <div className="space-y-6">
                        {/* Your Public Booking Link */}
                        <div className="glass-card p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <LinkIcon className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold text-foreground">Your Public Booking Link</h2>
                            </div>

                            {/* Link Display */}
                            <div className="relative">
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 relative">
                                        <input
                                            id="booking-link-input"
                                            type="text"
                                            value={bookingLink}
                                            readOnly
                                            className="w-full bg-secondary/80 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-2 mt-3">
                                    <button
                                        onClick={copyBookingLink}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                                            copied
                                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                : 'bg-primary text-white hover:bg-primary/90'
                                        }`}
                                    >
                                        {copied ? (
                                            <>
                                                <CheckIcon className="w-4 h-4" />
                                                Copied!
                                            </>
                                        ) : (
                                            <>
                                                <CopyIcon className="w-4 h-4" />
                                                Copy
                                            </>
                                        )}
                                    </button>
                                    <a
                                        href={bookingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
                                    >
                                        <ExternalLinkIcon className="w-4 h-4" />
                                        Preview
                                    </a>
                                </div>
                            </div>

                            {/* Quick Share Buttons */}
                            <div className="mt-5 pt-5 border-t border-border">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShareIcon className="w-4 h-4 text-muted" />
                                    <span className="text-xs font-medium text-muted uppercase tracking-wider">Quick Share</span>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={shareViaEmail}
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all hover:border-primary/30"
                                    >
                                        <EmailIcon className="w-4 h-4" />
                                        Email
                                    </button>
                                    <button
                                        onClick={shareViaWhatsApp}
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all hover:border-green-500/30"
                                    >
                                        <WhatsAppIcon className="w-4 h-4" />
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={shareViaX}
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all hover:border-foreground/30"
                                    >
                                        <XIcon className="w-4 h-4" />
                                        X
                                    </button>
                                    <button
                                        onClick={shareViaLinkedIn}
                                        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-all hover:border-blue-500/30"
                                    >
                                        <LinkedInIcon className="w-4 h-4" />
                                        LinkedIn
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="glass-card p-6">
                            <h2 className="font-semibold text-foreground mb-4">Quick Stats</h2>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">Total Bookings</span>
                                    <span className="text-sm font-semibold text-foreground">{bookings.length}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">Active Days</span>
                                    <span className="text-sm font-semibold text-foreground">{activeDays}/7</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted">This Month</span>
                                    <span className="text-sm font-semibold text-foreground">
                                        {bookings.filter(b => {
                                            const d = new Date(b.date);
                                            const now = new Date();
                                            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                                        }).length}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reschedule Modal */}
            {rescheduleBooking && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setRescheduleBooking(null)}>
                    <div className="glass-card p-6 max-w-md w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="font-semibold text-foreground">Reschedule Booking</h2>
                            <button onClick={() => setRescheduleBooking(null)} className="text-muted hover:text-foreground">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="bg-secondary/50 rounded-lg p-3 mb-4">
                            <p className="text-sm font-medium text-foreground">{rescheduleBooking.candidate_name}</p>
                            <p className="text-xs text-muted">{rescheduleBooking.date} at {rescheduleBooking.start_time} - {rescheduleBooking.end_time}</p>
                        </div>

                        {/* Date Picker */}
                        <div className="mb-4">
                            <label className="block text-sm text-muted mb-2">New Date</label>
                            <div className="flex gap-1.5 overflow-x-auto pb-2">
                                {generateRescheduleDays().map(date => {
                                    const slots = getRescheduleSlots(date);
                                    const hasSlots = slots.some(s => s.available);
                                    const isSelected = rescheduleDate?.toDateString() === date.toDateString();
                                    return (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => { setRescheduleDate(date); setRescheduleTime(''); }}
                                            disabled={!hasSlots}
                                            className={`flex-shrink-0 p-2 rounded-lg text-center transition-all text-xs ${isSelected
                                                ? 'bg-primary text-white'
                                                : hasSlots
                                                    ? 'bg-secondary hover:bg-primary/20'
                                                    : 'opacity-50 cursor-not-allowed'
                                                }`}
                                        >
                                            <div>{dayNames[date.getDay()].slice(0, 2)}</div>
                                            <div className="font-bold">{date.getDate()}</div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Time Picker */}
                        {rescheduleDate && (
                            <div className="mb-4">
                                <label className="block text-sm text-muted mb-2">New Time</label>
                                <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                                    {getRescheduleSlots(rescheduleDate).map(slot => (
                                        <button
                                            key={slot.time}
                                            onClick={() => setRescheduleTime(slot.time)}
                                            disabled={!slot.available}
                                            className={`p-2 rounded-lg text-xs font-medium transition-all ${rescheduleTime === slot.time
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

                        {rescheduleError && <p className="text-red-500 text-sm mb-3">{rescheduleError}</p>}

                        <button
                            onClick={handleReschedule}
                            disabled={rescheduleLoading || !rescheduleDate || !rescheduleTime}
                            className="btn-primary w-full disabled:opacity-50"
                        >
                            {rescheduleLoading ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
