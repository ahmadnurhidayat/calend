'use client';

import { useState } from 'react';
import { downloadICSFile } from './CalendarExport';

interface Appointment {
    id: string;
    date: Date;
    time: string;
    note: string;
}

interface AppointmentModalProps {
    isOpen: boolean;
    selectedDate: Date | null;
    onClose: () => void;
    onSave: (appointment: Appointment) => void;
}

export default function AppointmentModal({ isOpen, selectedDate, onClose, onSave }: AppointmentModalProps) {
    const [time, setTime] = useState('09:00');
    const [note, setNote] = useState('');

    if (!isOpen || !selectedDate) return null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleSave = () => {
        const appointment: Appointment = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: selectedDate,
            time,
            note
        };
        onSave(appointment);
        setNote('');
        setTime('09:00');
        onClose();
    };

    const handleExportCalendar = (type: 'google' | 'apple') => {
        const [hours, minutes] = time.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);

        const title = note || 'Appointment';
        const filename = type === 'google' ? 'google-calendar-event' : 'apple-calendar-event';

        downloadICSFile(title, note, startDate, endDate, filename);
    };

    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            timeSlots.push(`${hour}:${minute}`);
        }
    }

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
            <div className="glass-card p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">New Appointment</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-glass transition-all text-muted hover:text-foreground"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Selected Date Display */}
                <div className="bg-secondary rounded-xl p-4 mb-6">
                    <div className="text-sm text-muted mb-1">Selected Date</div>
                    <div className="text-lg font-semibold text-accent">
                        {dayNames[selectedDate.getDay()]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                    </div>
                </div>

                {/* Time Picker */}
                <div className="mb-4">
                    <label className="block text-sm text-muted mb-2">Time</label>
                    <select
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="input-field w-full"
                    >
                        {timeSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                        ))}
                    </select>
                </div>

                {/* Note Input */}
                <div className="mb-6">
                    <label className="block text-sm text-muted mb-2">Note / Description</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add your appointment details..."
                        className="input-field w-full h-24 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button onClick={handleSave} className="btn-primary w-full">
                        Save Appointment
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => handleExportCalendar('google')}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary border border-border hover:border-primary transition-all text-sm font-medium"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 4c.75 0 1.5.067 2.218.2L12 6.618 9.782 4.2A8 8 0 0112 4zm-8 8c0-.75.067-1.5.2-2.218L6.618 12 4.2 14.218A8 8 0 014 12zm8 8a8 8 0 01-2.218-.2L12 17.382l2.218 2.418A8 8 0 0112 20zm6.8-5.782L16.382 12 18.8 9.782c.133.718.2 1.468.2 2.218s-.067 1.5-.2 2.218z" />
                            </svg>
                            Google Calendar
                        </button>
                        <button
                            onClick={() => handleExportCalendar('apple')}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary border border-border hover:border-primary transition-all text-sm font-medium"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                            Apple Calendar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
