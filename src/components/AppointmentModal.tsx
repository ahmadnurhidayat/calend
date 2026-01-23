'use client';

import { useState } from 'react';
import { downloadICSFile } from './CalendarExport';

interface Appointment {
    id: string;
    date: Date;
    time: string;
    endTime?: string;
    title: string;
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
    const [endTime, setEndTime] = useState('10:00');
    const [useTimeRange, setUseTimeRange] = useState(false);
    const [title, setTitle] = useState('');
    const [note, setNote] = useState('');
    const [error, setError] = useState('');

    if (!isOpen || !selectedDate) return null;

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const handleSave = () => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }
        setError('');

        const appointment: Appointment = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: selectedDate,
            time,
            endTime: useTimeRange ? endTime : undefined,
            title: title.trim(),
            note
        };
        onSave(appointment);
        setTitle('');
        setNote('');
        setTime('09:00');
        setEndTime('10:00');
        setUseTimeRange(false);
        onClose();
    };

    const handleExportCalendar = (type: 'google' | 'apple') => {
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        const [hours, minutes] = time.split(':').map(Number);
        const startDate = new Date(selectedDate);
        startDate.setHours(hours, minutes, 0, 0);

        const endDate = new Date(startDate);
        if (useTimeRange && endTime) {
            const [endHours, endMinutes] = endTime.split(':').map(Number);
            endDate.setHours(endHours, endMinutes, 0, 0);
        } else {
            endDate.setHours(endDate.getHours() + 1);
        }

        const filename = type === 'google' ? 'google-calendar-event' : 'apple-calendar-event';
        downloadICSFile(title.trim(), note, startDate, endDate, filename);
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
            <div className="glass-card p-6 w-full max-w-md animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">New Appointment</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-lg hover:bg-secondary transition-all text-muted hover:text-foreground"
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
                    <div className="text-lg font-semibold text-primary">
                        {dayNames[selectedDate.getDay()]}, {monthNames[selectedDate.getMonth()]} {selectedDate.getDate()}, {selectedDate.getFullYear()}
                    </div>
                </div>

                {/* Time Mode Toggle */}
                <div className="flex items-center justify-between mb-4">
                    <label className="text-sm text-muted">Use time range</label>
                    <button
                        onClick={() => setUseTimeRange(!useTimeRange)}
                        className={`w-12 h-6 rounded-full transition-all ${useTimeRange ? 'bg-primary' : 'bg-secondary border border-border'
                            }`}
                    >
                        <div
                            className={`w-5 h-5 rounded-full bg-white shadow transition-all ${useTimeRange ? 'translate-x-6' : 'translate-x-0.5'
                                }`}
                        />
                    </button>
                </div>

                {/* Time Picker */}
                <div className="mb-4">
                    {useTimeRange ? (
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-sm text-muted mb-2">Start Time</label>
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
                            <div>
                                <label className="block text-sm text-muted mb-2">End Time</label>
                                <select
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="input-field w-full"
                                >
                                    {timeSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ) : (
                        <>
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
                        </>
                    )}
                </div>

                {/* Title Input (Required) */}
                <div className="mb-4">
                    <label className="block text-sm text-muted mb-2">
                        Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => { setTitle(e.target.value); setError(''); }}
                        placeholder="Enter appointment title..."
                        className={`input-field w-full ${error ? 'border-red-500' : ''}`}
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>

                {/* Note Input */}
                <div className="mb-6">
                    <label className="block text-sm text-muted mb-2">Note / Description</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Add your appointment details (optional)..."
                        className="input-field w-full h-20 resize-none"
                    />
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <button onClick={handleSave} className="btn-primary w-full">
                        Save Appointment
                    </button>

                    <button
                        onClick={() => handleExportCalendar('google')}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary border border-border hover:border-primary transition-all text-sm font-medium w-full"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm0 4c.75 0 1.5.067 2.218.2L12 6.618 9.782 4.2A8 8 0 0112 4zm-8 8c0-.75.067-1.5.2-2.218L6.618 12 4.2 14.218A8 8 0 014 12zm8 8a8 8 0 01-2.218-.2L12 17.382l2.218 2.418A8 8 0 0112 20zm6.8-5.782L16.382 12 18.8 9.782c.133.718.2 1.468.2 2.218s-.067 1.5-.2 2.218z" />
                        </svg>
                        Add to Google Calendar
                    </button>
                </div>
            </div>
        </div>
    );
}
