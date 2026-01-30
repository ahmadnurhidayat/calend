'use client';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background py-3">
            <div className="max-w-6xl mx-auto px-4 sm:px-8">
                <div className="flex items-center justify-between text-sm text-muted">
                    {/* Logo & Copyright */}
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <span>© {currentYear} Calend</span>
                    </div>

                    {/* Made with */}
                    <div>
                        Made with <span className="text-red-500">♥</span> by{' '}
                        <a
                            href="https://beyondyou.my.id"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                        >
                            Calend BeyondYou
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
