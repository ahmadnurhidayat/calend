import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Calend - Schedule Meetings Effortlessly",
	description: "A modern scheduling tool. Set your availability, share your link, and let others book meetings with you.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="h-full">
			<head>
				<link rel="icon" href="/favicon.svg" type="image/svg+xml"></link>
			</head>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col`}>
				<Providers>
					<Navbar />
					<main className="flex-1">{children}</main>
					<footer className="border-t border-border bg-background py-3">
						<div className="max-w-6xl mx-auto px-4 sm:px-8">
							<div className="flex items-center justify-between text-sm text-muted">
								<div className="flex items-center gap-2">
									<div className="w-5 h-5 rounded bg-primary flex items-center justify-center">
										<svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
										</svg>
									</div>
									<span>&copy; {new Date().getFullYear()} Calend</span>
								</div>
								<div>
									Made with <span className="text-red-500">&hearts;</span> by{' '}
									<a
										href="https://beyondyou.my.id"
										target="_blank"
										rel="noopener noreferrer"
										className="text-primary hover:underline"
									>
										BeyondYou
									</a>
								</div>
							</div>
						</div>
					</footer>
				</Providers>
			</body>
		</html>
	);
}
