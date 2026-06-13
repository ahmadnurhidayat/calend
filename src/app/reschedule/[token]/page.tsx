'use client';

import { useState, useEffect, use, useCallback } from 'react';
import { getSupabase, Booking } from '@/lib/supabase';

interface TimeSlot {
    time: string;
    endTime: string;
    available: boolean;
}

interface BookingWithUser extends Booking {
    users?: { name: string; email: string; username: string };
    event_types?: { title: string; duration: number };
}

export default function ReschedulePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params);
    const [booking, setBooking] = useState<BookingWithUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [updating, setUpdating] = useState(false);
    const [success, setSuccess] = useState(false);
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

    const loadBooking = useCallback(async () => {
        const supabase = getSupabase();
        const { data, error: fetchError } = await supabase
            .from('bookings')
            .select('*, users(name, email, username), event_types(title, duration)')
            .eq('reschedule_token', token)
            .single();

        if (fetchError || !data) {
            setError('Invalid or expired reschedule link');
            setLoading(false);
            return;
        }

        if (data.status === 'cancelled') {
            setError('This booking has been cancelled');
            setLoading(false);
            return;
        }

        setBooking(data);
        setLoading(false);
    }, [token]);

    useEffect(() => {
        loadBooking();
    }, [loadBooking]);

    const getAvailableSlots = (): TimeSlot[] => {
        if (!booking?.user_id) return [];

        const slots: TimeSlot[] = [];

        // Simple slot generation (baseline from availability)
        for (let h = 9; h < 17; h++) {
            for (let m = 0; m < 60; m += 30) {
                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                const endH = m + 30 >= 60 ? h + 1 : h;
                const endM = (m + 30) % 60;
                const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                slots.push({ time: timeStr, endTime: endTimeStr, available: true });
            }
        }
        return slots;
    };

    const handleReschedule = async () => {
        if (!booking || !selectedDate || !selectedTime) return;

        setUpdating(true);
        try {
            const [h, m] = selectedTime.split(':').map(Number);
            const duration = booking.event_types?.duration || 30;
            const endMinutes = h * 60 + m + duration;
            const endH = Math.floor(endMinutes / 60);
            const endM = endMinutes % 60;
            const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

            const dateStr = selectedDate.toISOString().split('T')[0];

            const res = await fetch('/api/book/reschedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    date: dateStr,
                    startTime: selectedTime,
                    endTime,
                    timezone,
                }),
            });

            if (res.ok) {
                setSuccess(true);
            } else {
                const data = await res.json() as { error?: string };
                setError(data.error || 'Failed to reschedule');
            }
        } catch {
            setError('Failed to reschedule');
        }
        setUpdating(false);
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

    if (error && !booking) {
        return (
            <div className="flex-1 flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
                    <p className="text-muted">{error}</p>
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
                    <h1 className="text-2xl font-bold text-foreground mb-2">Rescheduled!</h1>
                    <p className="text-muted mb-4">
                        Your meeting has been rescheduled to {selectedDate?.toLocaleDateString()} at {selectedTime}.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Reschedule Meeting</h1>
                    <p className="text-muted">
                        Current: {booking?.date} at {booking?.start_time} - {booking?.end_time}
                    </p>
                    <p className="text-sm text-muted mt-1">
                        With {booking?.users?.name} - {booking?.event_types?.title || 'Meeting'}
                    </p>
                </div>

                {/* Timezone selector */}
                <div className="glass-card p-4 mb-6">
                    <label className="text-sm text-muted">Your Timezone</label>
                    <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
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
                    <h2 className="font-semibold text-foreground mb-4">Select a New Date</h2>
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
                        <h2 className="font-semibold text-foreground mb-4">Select a New Time</h2>
                        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                            {getAvailableSlots().map(slot => (
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

                {/* Confirm */}
                {selectedDate && selectedTime && (
                    <div className="glass-card p-6">
                        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
                        <button
                            onClick={handleReschedule}
                            disabled={updating}
                            className="btn-primary w-full"
                        >
                            {updating ? 'Rescheduling...' : 'Confirm Reschedule'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
