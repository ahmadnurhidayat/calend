'use client';

import { useState, useEffect } from 'react';
import Calendar from '@/components/Calendar';
import NextDayInfo from '@/components/NextDayInfo';
import AppointmentModal from '@/components/AppointmentModal';
import DateCalculator from '@/components/DateCalculator';

interface Appointment {
	id: string;
	date: string;
	time: string;
	endTime?: string;
	title: string;
	note: string;
}

export default function Home() {
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [appointments, setAppointments] = useState<Appointment[]>([]);

	// Load appointments from localStorage on mount
	useEffect(() => {
		const saved = localStorage.getItem('calendly-appointments');
		if (saved) {
			setAppointments(JSON.parse(saved));
		}
	}, []);

	// Save appointments to localStorage
	useEffect(() => {
		localStorage.setItem('calendly-appointments', JSON.stringify(appointments));
	}, [appointments]);

	const handleDateSelect = (date: Date) => {
		setSelectedDate(date);
		setIsModalOpen(true);
	};

	const handleSaveAppointment = (appointment: { id: string; date: Date; time: string; endTime?: string; title: string; note: string }) => {
		const newAppointment: Appointment = {
			id: appointment.id,
			date: appointment.date.toISOString(),
			time: appointment.time,
			endTime: appointment.endTime,
			title: appointment.title,
			note: appointment.note
		};
		setAppointments(prev => [...prev, newAppointment]);
	};

	const handleDeleteAppointment = (id: string) => {
		setAppointments(prev => prev.filter(a => a.id !== id));
	};

	const eventDates = appointments.map(a => new Date(a.date));

	const formatAppointmentDate = (dateStr: string, time: string, endTime?: string) => {
		const date = new Date(dateStr);
		const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
		const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		const timeDisplay = endTime ? `${time} - ${endTime}` : time;
		return `${dayNames[date.getDay()]}, ${monthNames[date.getMonth()]} ${date.getDate()} at ${timeDisplay}`;
	};

	return (
		<div className="p-4 sm:p-8">

			{/* Main Content */}
			<main className="max-w-6xl mx-auto">
				{/* Hero Section */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-foreground mb-3">Schedule Your Day</h1>
					<p className="text-muted max-w-2xl mx-auto">
						Calendly helps you manage your appointments effortlessly. Click on any date to create
						an appointment, set a time or time range, and export directly to Google or Apple Calendar.
					</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Calendar Section */}
					<div className="lg:col-span-2 flex justify-center lg:justify-start">
						<Calendar
							selectedDate={selectedDate}
							onDateSelect={handleDateSelect}
							eventDates={eventDates}
						/>
					</div>

					{/* Sidebar */}
					<div className="space-y-6">
						{/* Next Day Info */}
						<NextDayInfo />

						{/* Upcoming Appointments */}
						<div className="glass-card p-6">
							<h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
								<svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
								</svg>
								Appointments
							</h3>

							{appointments.length === 0 ? (
								<p className="text-muted text-sm">No appointments yet. Click on a date to create one.</p>
							) : (
								<div className="space-y-3 max-h-64 overflow-y-auto">
									{appointments.slice().reverse().map(apt => (
										<div key={apt.id} className="bg-secondary rounded-xl p-4 group">
											<div className="flex items-start justify-between gap-2">
												<div className="flex-1 min-w-0">
													<div className="font-medium text-foreground">
														{apt.title}
													</div>
													<div className="text-xs text-primary mb-1">
														{formatAppointmentDate(apt.date, apt.time, apt.endTime)}
													</div>
													{apt.note && (
														<div className="text-xs text-muted truncate">
															{apt.note}
														</div>
													)}
												</div>
												<button
													onClick={() => handleDeleteAppointment(apt.id)}
													className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-glass transition-all text-muted hover:text-red-400"
													aria-label="Delete appointment"
												>
													<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
													</svg>
												</button>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>
				</div>
			</main>

			{/* Date Calculator Section - Separate from main calendar */}
			<section className="max-w-3xl mx-auto mt-12 mb-8">
				<DateCalculator />
			</section>

			{/* Appointment Modal */}
			<AppointmentModal
				isOpen={isModalOpen}
				selectedDate={selectedDate}
				onClose={() => setIsModalOpen(false)}
				onSave={handleSaveAppointment}
			/>
		</div>
	);
}
