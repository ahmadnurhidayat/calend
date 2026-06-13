'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

const features = [
    {
        title: 'Set Your Availability',
        description: 'Define your available hours for each day of the week. Only show times that work for you.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
    {
        title: 'Share Your Link',
        description: 'Get a personalized booking link. Share it via email, chat, or embed it on your website.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
        ),
    },
    {
        title: 'Get Booked Instantly',
        description: 'Candidates pick a date and time. Events are added to your Google Calendar automatically.',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
    },
];

const steps = [
    { step: '1', title: 'Sign Up', description: 'Create your free account in seconds.' },
    { step: '2', title: 'Set Availability', description: 'Choose the hours you\'re available.' },
    { step: '3', title: 'Share Link', description: 'Send your booking link to anyone.' },
    { step: '4', title: 'Get Booked', description: 'Meetings appear on your calendar.' },
];

export default function HomePage() {
    const { data: session } = useSession();

    return (
        <div className="min-h-full">
            {/* Hero */}
            <section className="relative overflow-hidden">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Free scheduling for professionals
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-6 leading-tight">
                            Stop the back-and-forth.<br />
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Let people book you.
                            </span>
                        </h1>
                        <p className="text-lg text-muted mb-8 max-w-2xl mx-auto">
                            Calend lets you set your availability, share a booking link, and let candidates
                            schedule meetings directly &mdash; no emails required.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            {session ? (
                                <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
                                    Go to Dashboard
                                </Link>
                            ) : (
                                <>
                                    <Link href="/signup" className="btn-primary text-base px-8 py-3">
                                        Get Started Free
                                    </Link>
                                    <Link href="/login" className="btn-secondary text-base px-8 py-3">
                                        Sign In
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="border-t border-border bg-secondary/30">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                            How Calend Works
                        </h2>
                        <p className="text-muted max-w-xl mx-auto">
                            Three simple steps to let others book time with you.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {features.map((feature, i) => (
                            <div key={i} className="glass-card p-6 text-center">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4 text-primary">
                                    {feature.icon}
                                </div>
                                <h3 className="font-semibold text-foreground mb-2">{feature.title}</h3>
                                <p className="text-sm text-muted">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Steps */}
            <section className="border-t border-border">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                            Get Started in Minutes
                        </h2>
                        <p className="text-muted max-w-xl mx-auto">
                            No complicated setup. Just sign up and start sharing your link.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step, i) => (
                            <div key={i} className="relative">
                                <div className="glass-card p-6">
                                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg mb-4">
                                        {step.step}
                                    </div>
                                    <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                                    <p className="text-sm text-muted">{step.description}</p>
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-0.5 bg-border" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="border-t border-border bg-secondary/30">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 py-16 sm:py-20 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
                        Ready to simplify your scheduling?
                    </h2>
                    <p className="text-muted mb-8 max-w-xl mx-auto">
                        Join Calend and let others book meetings with you in seconds.
                    </p>
                    {session ? (
                        <Link href="/dashboard" className="btn-primary text-base px-8 py-3">
                            Go to Dashboard
                        </Link>
                    ) : (
                        <Link href="/signup" className="btn-primary text-base px-8 py-3">
                            Create Free Account
                        </Link>
                    )}
                </div>
            </section>
        </div>
    );
}
