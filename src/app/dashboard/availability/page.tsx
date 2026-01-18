'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface DayAvailability {
    day: number;
    name: string;
    isActive: boolean;
    startTime: string;
    endTime: string;
}

export default function AvailabilityPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const [availability, setAvailability] = useState<DayAvailability[]>(
        dayNames.map((name, i) => ({
            day: i,
            name,
            isActive: i >= 1 && i <= 5, // Mon-Fri default
            startTime: '09:00',
            endTime: '17:00',
        }))
    );

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (session?.user?.email) {
            loadAvailability();
        }
    }, [session]);

    const loadAvailability = async () => {
        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session?.user?.email)
            .single();

        if (!user) return;

        const { data } = await supabase
            .from('availability')
            .select('*')
            .eq('user_id', user.id);

        if (data && data.length > 0) {
            setAvailability(prev =>
                prev.map(day => {
                    const saved = data.find(d => d.day_of_week === day.day);
                    if (saved) {
                        return {
                            ...day,
                            isActive: saved.is_active,
                            startTime: saved.start_time,
                            endTime: saved.end_time,
                        };
                    }
                    return day;
                })
            );
        }
    };

    const handleSave = async () => {
        setSaving(true);

        const { data: user } = await supabase
            .from('users')
            .select('id')
            .eq('email', session?.user?.email)
            .single();

        if (!user) {
            setSaving(false);
            return;
        }

        // Delete existing availability
        await supabase.from('availability').delete().eq('user_id', user.id);

        // Insert new availability
        const records = availability.map(day => ({
            user_id: user.id,
            day_of_week: day.day,
            start_time: day.startTime,
            end_time: day.endTime,
            is_active: day.isActive,
        }));

        await supabase.from('availability').insert(records);

        setSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const toggleDay = (dayIndex: number) => {
        setAvailability(prev =>
            prev.map(day =>
                day.day === dayIndex ? { ...day, isActive: !day.isActive } : day
            )
        );
    };

    const updateTime = (dayIndex: number, field: 'startTime' | 'endTime', value: string) => {
        setAvailability(prev =>
            prev.map(day =>
                day.day === dayIndex ? { ...day, [field]: value } : day
            )
        );
    };

    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            timeSlots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-muted">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">Availability</h1>
                        <p className="text-muted">Set your available hours for bookings</p>
                    </div>
                    <a href="/dashboard" className="text-primary hover:underline">← Back</a>
                </div>

                <div className="glass-card p-6">
                    <div className="space-y-4">
                        {availability.map(day => (
                            <div key={day.day} className="flex items-center gap-4">
                                <button
                                    onClick={() => toggleDay(day.day)}
                                    className={`w-6 h-6 rounded flex items-center justify-center transition-all ${day.isActive ? 'bg-primary' : 'bg-secondary border border-border'
                                        }`}
                                >
                                    {day.isActive && (
                                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                                <span className={`w-24 text-sm ${day.isActive ? 'text-foreground' : 'text-muted'}`}>
                                    {day.name}
                                </span>
                                {day.isActive && (
                                    <div className="flex items-center gap-2 flex-1">
                                        <select
                                            value={day.startTime}
                                            onChange={(e) => updateTime(day.day, 'startTime', e.target.value)}
                                            className="input-field text-sm py-2"
                                        >
                                            {timeSlots.map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                        <span className="text-muted">to</span>
                                        <select
                                            value={day.endTime}
                                            onChange={(e) => updateTime(day.day, 'endTime', e.target.value)}
                                            className="input-field text-sm py-2"
                                        >
                                            {timeSlots.map(slot => (
                                                <option key={slot} value={slot}>{slot}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn-primary w-full mt-6"
                    >
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Availability'}
                    </button>
                </div>
            </div>
        </div>
    );
}
