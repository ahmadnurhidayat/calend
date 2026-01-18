'use client';

import { useState, useEffect, useMemo } from 'react';

type CalculatorMode = 'calculate' | 'add' | 'subtract';

export default function DateCalculator() {
    const [mode, setMode] = useState<CalculatorMode>('calculate');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [daysToAdd, setDaysToAdd] = useState(4);
    const [includeEndDate, setIncludeEndDate] = useState(true);
    const [includeTime, setIncludeTime] = useState(false);
    const [selectedTime, setSelectedTime] = useState('09:00');
    const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
    const [result, setResult] = useState<string>('');

    const timezones = useMemo(() => [
        'Asia/Jakarta',
        'Asia/Singapore',
        'Asia/Tokyo',
        'Asia/Seoul',
        'Asia/Hong_Kong',
        'Asia/Shanghai',
        'Asia/Kolkata',
        'Asia/Dubai',
        'Europe/London',
        'Europe/Paris',
        'Europe/Berlin',
        'Europe/Moscow',
        'America/New_York',
        'America/Chicago',
        'America/Denver',
        'America/Los_Angeles',
        'America/Sao_Paulo',
        'Australia/Sydney',
        'Australia/Melbourne',
        'Pacific/Auckland',
    ], []);

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
    }, []);

    const formatDateInTimezone = (date: Date, tz: string) => {
        try {
            return new Intl.DateTimeFormat('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: includeTime ? '2-digit' : undefined,
                minute: includeTime ? '2-digit' : undefined,
                timeZone: tz,
                timeZoneName: includeTime ? 'short' : undefined
            }).format(date);
        } catch {
            return date.toLocaleString('en-US');
        }
    };

    const calculateDuration = () => {
        if (!startDate || !endDate) {
            setResult('Please select both dates');
            return;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (includeEndDate) diffDays += 1;

        setResult(`${diffDays} days`);
    };

    const calculateAddDays = () => {
        if (!startDate) {
            setResult('Please select start date');
            return;
        }
        const start = new Date(startDate);
        const resultDate = new Date(start);
        resultDate.setDate(resultDate.getDate() + daysToAdd);

        if (includeTime) {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            resultDate.setHours(hours, minutes, 0, 0);
        }

        setResult(formatDateInTimezone(resultDate, timezone));
    };

    const calculateSubtractDays = () => {
        if (!startDate) {
            setResult('Please select start date');
            return;
        }
        const start = new Date(startDate);
        const resultDate = new Date(start);
        resultDate.setDate(resultDate.getDate() - daysToAdd);

        if (includeTime) {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            resultDate.setHours(hours, minutes, 0, 0);
        }

        setResult(formatDateInTimezone(resultDate, timezone));
    };

    const handleCalculate = () => {
        switch (mode) {
            case 'calculate':
                calculateDuration();
                break;
            case 'add':
                calculateAddDays();
                break;
            case 'subtract':
                calculateSubtractDays();
                break;
        }
    };

    const setToday = (field: 'start' | 'end') => {
        const today = new Date().toISOString().split('T')[0];
        if (field === 'start') setStartDate(today);
        else setEndDate(today);
    };

    const timeSlots = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 30) {
            const hour = h.toString().padStart(2, '0');
            const minute = m.toString().padStart(2, '0');
            timeSlots.push(`${hour}:${minute}`);
        }
    }

    const quickDays = [1, 2, 3, 4, 5, 7, 14, 30, 60, 90];

    const tabs = [
        { id: 'calculate' as const, label: 'Calculate Days' },
        { id: 'add' as const, label: 'Add Days' },
        { id: 'subtract' as const, label: 'Subtract Days' },
    ];

    return (
        <div className="glass-card p-6 sm:p-8">
            <h2 className="text-2xl font-bold text-center mb-6 text-foreground">
                Date Calculator
            </h2>

            {/* Tabs */}
            <div className="flex justify-center gap-2 mb-6 flex-wrap">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { setMode(tab.id); setResult(''); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === tab.id
                                ? 'bg-primary text-cream'
                                : 'text-muted hover:text-foreground hover:bg-secondary'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="max-w-lg mx-auto space-y-4">
                {/* Start Date */}
                <div>
                    <label className="block text-sm text-muted mb-2">Start Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="input-field w-full"
                        />
                        <button
                            onClick={() => setToday('start')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-primary text-cream rounded"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* End Date (for calculate mode) */}
                {mode === 'calculate' && (
                    <div>
                        <label className="block text-sm text-muted mb-2">End Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field w-full"
                            />
                            <button
                                onClick={() => setToday('end')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs bg-primary text-cream rounded"
                            >
                                Today
                            </button>
                        </div>
                    </div>
                )}

                {/* Days Input (for add/subtract mode) */}
                {(mode === 'add' || mode === 'subtract') && (
                    <>
                        <div>
                            <label className="block text-sm text-muted mb-2">
                                {mode === 'add' ? 'Add' : 'Subtract'} Days
                            </label>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setDaysToAdd(Math.max(1, daysToAdd - 1))}
                                    className="w-10 h-10 rounded-lg bg-secondary border border-border hover:bg-primary hover:text-cream transition-all flex items-center justify-center text-lg"
                                >
                                    −
                                </button>
                                <input
                                    type="number"
                                    value={daysToAdd}
                                    onChange={(e) => setDaysToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                                    className="input-field w-24 text-center text-lg font-bold"
                                    min="1"
                                />
                                <button
                                    onClick={() => setDaysToAdd(daysToAdd + 1)}
                                    className="w-10 h-10 rounded-lg bg-secondary border border-border hover:bg-primary hover:text-cream transition-all flex items-center justify-center text-lg"
                                >
                                    +
                                </button>
                            </div>
                        </div>

                        {/* Quick Select */}
                        <div className="flex flex-wrap gap-2">
                            {quickDays.map(d => (
                                <button
                                    key={d}
                                    onClick={() => setDaysToAdd(d)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all ${daysToAdd === d
                                            ? 'bg-primary text-cream'
                                            : 'bg-secondary border border-border hover:bg-primary hover:text-cream'
                                        }`}
                                >
                                    {d}
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* Include End Date (for calculate mode) */}
                {mode === 'calculate' && (
                    <label className="flex items-center gap-3 py-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={includeEndDate}
                            onChange={(e) => setIncludeEndDate(e.target.checked)}
                            className="w-4 h-4 rounded border-border accent-primary"
                        />
                        <span className="text-sm text-muted">Include end date in calculation (+1 day)</span>
                    </label>
                )}

                {/* Include Time Toggle (for add/subtract mode) */}
                {(mode === 'add' || mode === 'subtract') && (
                    <>
                        <div className="flex items-center justify-between py-2">
                            <label className="text-sm text-muted">Include specific time</label>
                            <button
                                onClick={() => setIncludeTime(!includeTime)}
                                className={`w-12 h-6 rounded-full transition-all ${includeTime ? 'bg-primary' : 'bg-secondary border border-border'
                                    }`}
                            >
                                <div
                                    className={`w-5 h-5 rounded-full bg-cream shadow transition-all ${includeTime ? 'translate-x-6' : 'translate-x-0.5'
                                        }`}
                                />
                            </button>
                        </div>

                        {includeTime && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm text-muted mb-2">Time</label>
                                    <select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        className="input-field w-full"
                                    >
                                        {timeSlots.map(slot => (
                                            <option key={slot} value={slot}>{slot}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm text-muted mb-2">Timezone</label>
                                    <select
                                        value={timezone}
                                        onChange={(e) => setTimezone(e.target.value)}
                                        className="input-field w-full text-sm"
                                    >
                                        {timezones.map(tz => (
                                            <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Calculate Button */}
                <button
                    onClick={handleCalculate}
                    className="btn-primary w-full mt-4"
                >
                    {mode === 'calculate' ? 'Calculate Duration' : 'Calculate Date'}
                </button>

                {/* Result */}
                {result && (
                    <div className="bg-primary/10 rounded-xl p-4 mt-4 border border-primary/30">
                        <div className="text-xs text-muted mb-1">Result</div>
                        <div className="text-xl font-bold text-primary">
                            {result}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
