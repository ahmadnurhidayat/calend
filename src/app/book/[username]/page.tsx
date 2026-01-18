'use client';

import { useState, useEffect, use } from 'react';
import { supabase, User, Availability, Booking } from '@/lib/supabase';

interface TimeSlot {
    time: string;
    available: boolean;
}

export default function BookingPage({ params }: { params: Promise<{ username: string }> }) {
    const { username } = use(params);
    const [recruiter, setRecruiter] = useState<User | null>(null);
    const [availability, setAvailability] = useState<Availability[]>([]);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState('');
    const [candidateName, setCandidateName] = useState('');
    const [candidateEmail, setCandidateEmail] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(true);
    const [booking, setBooking] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadRecruiterData();
    }, [username]);

    const loadRecruiterData = async () => {
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (!user) {
            setLoading(false);
            return;
        }

        setRecruiter(user);

        const { data: availData } = await supabase
            .from('availability')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true);

        if (availData) {
            setAvailability(availData);
        }

        const { data: bookingsData } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', user.id);

        if (bookingsData) {
            setBookings(bookingsData);
        }

        setLoading(false);
    };

    const getAvailableSlots = (date: Date): TimeSlot[] => {
        const dayOfWeek = date.getDay();
        const dayAvail = availability.find(a => a.day_of_week === dayOfWeek);

        if (!dayAvail) return [];

        const slots: TimeSlot[] = [];
        const [startHour, startMin] = dayAvail.start_time.split(':').map(Number);
        const [endHour, endMin] = dayAvail.end_time.split(':').map(Number);

        const dateStr = date.toISOString().split('T')[0];
        const bookedTimes = bookings
            .filter(b => b.date === dateStr)
            .map(b => b.start_time);

        for (let h = startHour; h < endHour || (h === endHour && 0 < endMin); h++) {
            for (let m = 0; m < 60; m += 30) {
                if (h === startHour && m < startMin) continue;
                if (h === endHour && m >= endMin) break;

                const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                slots.push({
                    time: timeStr,
                    available: !bookedTimes.includes(timeStr),
                });
            }
        }

        return slots;
    };

    const handleBooking = async () => {
        if (!recruiter || !selectedDate || !selectedTime || !candidateName || !candidateEmail) {
            setError('Please fill in all required fields');
            return;
        }

        setBooking(true);
        setError('');

        try {
            const response = await fetch('/api/book', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: recruiter.id,
                    date: selectedDate.toISOString().split('T')[0],
                    startTime: selectedTime,
                    endTime: addMinutes(selectedTime, 30),
                    candidateName,
                    candidateEmail,
                    reason,
                }),
            });

            if (response.ok) {
                setSuccess(true);
            } else {
                const data = await response.json();
                setError(data.error || 'Failed to book appointment');
            }
        } catch {
            setError('Failed to book appointment');
        }

        setBooking(false);
    };

    const addMinutes = (time: string, minutes: number): string => {
        const [h, m] = time.split(':').map(Number);
        const totalMin = h * 60 + m + minutes;
        const newH = Math.floor(totalMin / 60);
        const newM = totalMin % 60;
        return `${newH.toString().padStart(2, '0')}:${newM.toString().padStart(2, '0')}`;
    };

    const generateCalendarDays = () => {
        const today = new Date();
        const days: Date[] = [];
        for (let i = 0; i < 14; i++) {
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    if (!recruiter) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-foreground mb-2">User Not Found</h1>
                    <p className="text-muted">The booking link you followed is invalid.</p>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-8 max-w-md text-center">
                    <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Booking Confirmed!</h1>
                    <p className="text-muted mb-4">
                        Your appointment with {recruiter.name} has been scheduled. A calendar invite has been sent to your email.
                    </p>
                    <p className="text-sm text-primary">
                        {selectedDate?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {selectedTime}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-foreground mb-2">Book a Meeting with {recruiter.name}</h1>
                    <p className="text-muted">Select a date and time that works for you.</p>
                </div>

                {/* Date Selection */}
                <div className="glass-card p-6 mb-6">
                    <h2 className="font-semibold text-foreground mb-4">Select a Date</h2>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {generateCalendarDays().map(date => {
                            const slots = getAvailableSlots(date);
                            const hasSlots = slots.some(s => s.available);
                            const isSelected = selectedDate?.toDateString() === date.toDateString();

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => { setSelectedDate(date); setSelectedTime(''); }}
                                    disabled={!hasSlots}
                                    className={`flex-shrink-0 p-3 rounded-xl text-center transition-all ${isSelected
                                            ? 'bg-primary text-white'
                                            : hasSlots
                                                ? 'bg-secondary hover:bg-primary/20'
                                                : 'opacity-50 cursor-not-allowed'
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
                            {getAvailableSlots(selectedDate).map(slot => (
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
