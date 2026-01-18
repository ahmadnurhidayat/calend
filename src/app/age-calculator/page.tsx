'use client';

import { useState } from 'react';

interface AgeResult {
    years: number;
    months: number;
    days: number;
    totalDays: number;
    totalWeeks: number;
    totalMonths: number;
    nextBirthday: Date;
    daysUntilBirthday: number;
    zodiacSign: string;
    chineseZodiac: string;
}

export default function AgeCalculatorPage() {
    const [birthDate, setBirthDate] = useState('');
    const [result, setResult] = useState<AgeResult | null>(null);

    const getZodiacSign = (month: number, day: number): string => {
        const signs = [
            { sign: 'Capricorn', end: [1, 19] },
            { sign: 'Aquarius', end: [2, 18] },
            { sign: 'Pisces', end: [3, 20] },
            { sign: 'Aries', end: [4, 19] },
            { sign: 'Taurus', end: [5, 20] },
            { sign: 'Gemini', end: [6, 20] },
            { sign: 'Cancer', end: [7, 22] },
            { sign: 'Leo', end: [8, 22] },
            { sign: 'Virgo', end: [9, 22] },
            { sign: 'Libra', end: [10, 22] },
            { sign: 'Scorpio', end: [11, 21] },
            { sign: 'Sagittarius', end: [12, 21] },
            { sign: 'Capricorn', end: [12, 31] },
        ];

        for (const { sign, end } of signs) {
            if (month < end[0] || (month === end[0] && day <= end[1])) {
                return sign;
            }
        }
        return 'Capricorn';
    };

    const getChineseZodiac = (year: number): string => {
        const animals = ['Rat', 'Ox', 'Tiger', 'Rabbit', 'Dragon', 'Snake', 'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig'];
        return animals[(year - 1900) % 12];
    };

    const calculateAge = () => {
        if (!birthDate) return;

        const birth = new Date(birthDate);
        const today = new Date();

        let years = today.getFullYear() - birth.getFullYear();
        let months = today.getMonth() - birth.getMonth();
        let days = today.getDate() - birth.getDate();

        if (days < 0) {
            months--;
            const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += prevMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        const diffTime = Math.abs(today.getTime() - birth.getTime());
        const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(totalDays / 7);
        const totalMonths = years * 12 + months;

        // Calculate next birthday
        let nextBirthday = new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
        if (nextBirthday <= today) {
            nextBirthday = new Date(today.getFullYear() + 1, birth.getMonth(), birth.getDate());
        }
        const daysUntilBirthday = Math.ceil((nextBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        setResult({
            years,
            months,
            days,
            totalDays,
            totalWeeks,
            totalMonths,
            nextBirthday,
            daysUntilBirthday,
            zodiacSign: getZodiacSign(birth.getMonth() + 1, birth.getDate()),
            chineseZodiac: getChineseZodiac(birth.getFullYear()),
        });
    };

    return (
        <div className="min-h-screen p-4 sm:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Age Calculator</h1>
                    <p className="text-muted">
                        Calculate your exact age in years, months, and days. Get detailed information including
                        your zodiac sign, Chinese zodiac, and countdown to your next birthday.
                    </p>
                </div>

                {/* Calculator Card */}
                <div className="glass-card p-6 sm:p-8 mb-8">
                    <div className="max-w-md mx-auto">
                        <label className="block text-sm text-muted mb-2">Your Birth Date</label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="input-field w-full mb-4"
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <button
                            onClick={calculateAge}
                            className="btn-primary w-full"
                            disabled={!birthDate}
                        >
                            Calculate Age
                        </button>
                    </div>
                </div>

                {/* Results */}
                {result && (
                    <div className="space-y-6">
                        {/* Main Age Display */}
                        <div className="glass-card p-6 text-center">
                            <div className="text-sm text-muted mb-2">Your Age</div>
                            <div className="text-4xl font-bold text-primary mb-2">
                                {result.years} years, {result.months} months, {result.days} days
                            </div>
                        </div>

                        {/* Detailed Statistics */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="glass-card p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{result.totalMonths.toLocaleString()}</div>
                                <div className="text-sm text-muted">Total Months</div>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{result.totalWeeks.toLocaleString()}</div>
                                <div className="text-sm text-muted">Total Weeks</div>
                            </div>
                            <div className="glass-card p-4 text-center">
                                <div className="text-2xl font-bold text-foreground">{result.totalDays.toLocaleString()}</div>
                                <div className="text-sm text-muted">Total Days</div>
                            </div>
                        </div>

                        {/* Birthday Countdown & Zodiac */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="glass-card p-6">
                                <h3 className="font-semibold text-foreground mb-3">Next Birthday</h3>
                                <div className="text-3xl font-bold text-primary mb-1">
                                    {result.daysUntilBirthday} days
                                </div>
                                <div className="text-sm text-muted">
                                    {result.nextBirthday.toLocaleDateString('en-US', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            </div>
                            <div className="glass-card p-6">
                                <h3 className="font-semibold text-foreground mb-3">Zodiac Signs</h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-muted">Western:</span>
                                        <span className="font-medium text-foreground">{result.zodiacSign}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted">Chinese:</span>
                                        <span className="font-medium text-foreground">{result.chineseZodiac}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Description Section */}
                <div className="glass-card p-6 sm:p-8 mt-8">
                    <h2 className="text-xl font-bold text-foreground mb-4">About This Calculator</h2>
                    <div className="space-y-4 text-muted">
                        <p>
                            This age calculator provides a comprehensive breakdown of your age. Simply enter your
                            birth date to discover:
                        </p>
                        <ul className="list-disc list-inside space-y-2 ml-4">
                            <li><strong className="text-foreground">Exact Age</strong> - Your precise age in years, months, and days</li>
                            <li><strong className="text-foreground">Total Statistics</strong> - Your age expressed in total months, weeks, and days</li>
                            <li><strong className="text-foreground">Birthday Countdown</strong> - Days remaining until your next birthday</li>
                            <li><strong className="text-foreground">Western Zodiac</strong> - Your astrological sign based on your birth date</li>
                            <li><strong className="text-foreground">Chinese Zodiac</strong> - Your Chinese zodiac animal based on your birth year</li>
                        </ul>
                        <p>
                            The calculation accounts for leap years and varying month lengths to give you the most
                            accurate result possible.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
