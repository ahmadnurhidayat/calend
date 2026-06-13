'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
    const [isDark, setIsDark] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setIsDark(savedTheme === 'dark');
        } else {
            setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
        }
    }, []);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }, [isDark]);

    const isActive = (href: string) => pathname === href;

    return (
        <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
            <div className="max-w-6xl mx-auto px-4 sm:px-8">
                <div className="flex items-center justify-between h-16">
                    <Link href="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold text-foreground">Calend</span>
                    </Link>

                    <div className="hidden sm:flex items-center gap-1">
                        {session ? (
                            <>
                                <Link
                                    href="/dashboard"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive('/dashboard')
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted hover:text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    Dashboard
                                </Link>
                                <Link
                                    href="/dashboard/availability"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive('/dashboard/availability')
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted hover:text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    Availability
                                </Link>
                                <Link
                                    href="/dashboard/teams"
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        isActive('/dashboard/teams')
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-muted hover:text-foreground hover:bg-secondary'
                                    }`}
                                >
                                    Teams
                                </Link>
                            </>
                        ) : (
                            <Link href="/age-calculator" className="text-sm text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-secondary transition-colors">
                                Age Calculator
                            </Link>
                        )}
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="p-2 rounded-lg hover:bg-secondary transition-all text-muted hover:text-foreground"
                            aria-label="Toggle theme"
                        >
                            {isDark ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            )}
                        </button>

                        {session ? (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => signOut({ callbackUrl: '/' })}
                                    className="text-sm text-muted hover:text-foreground px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link href="/login" className="btn-secondary text-sm py-2 px-3">
                                    Sign In
                                </Link>
                                <Link href="/signup" className="btn-primary text-sm py-2 px-4">
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
