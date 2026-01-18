'use client';

import { useState, useEffect } from 'react';

export default function NextDayInfo() {
    const [timeUntilTomorrow, setTimeUntilTomorrow] = useState('');
    const [tomorrow, setTomorrow] = useState<Date | null>(null);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date();
            const tomorrowDate = new Date(now);
            tomorrowDate.setDate(tomorrowDate.getDate() + 1);
            tomorrowDate.setHours(0, 0, 0, 0);

            setTomorrow(tomorrowDate);

            const diff = tomorrowDate.getTime() - now.getTime();
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeUntilTomorrow(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);

        return () => clearInterval(interval);
    }, []);

    if (!tomorrow) return null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return (
        <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-5 h-5 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-muted">Next Day</h3>
            </div>

            <div className="space-y-3">
                <div className="text-2xl font-bold text-foreground">
                    {dayNames[tomorrow.getDay()]}
                </div>
                <div className="text-lg text-primary">
                    {monthNames[tomorrow.getMonth()]} {tomorrow.getDate()}, {tomorrow.getFullYear()}
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-border">
                    <span className="text-muted text-sm">Countdown:</span>
                    <span className="font-mono text-xl text-primary font-bold">
                        {timeUntilTomorrow}
                    </span>
                </div>
            </div>
        </div>
    );
}
