import { getSupabaseAdmin } from './supabase-server';
import { getValidGoogleToken } from './google-auth';

interface BusySlot {
    start: string;
    end: string;
}

interface TimeSlot {
    time: string;
    endTime: string;
    available: boolean;
}

/**
 * Query Google Calendar freebusy for a user over a date range.
 * Returns array of busy time ranges.
 */
async function getGoogleBusySlots(
    userId: string,
    timeMin: Date,
    timeMax: Date
): Promise<BusySlot[]> {
    const token = await getValidGoogleToken(userId);
    if (!token) return [];

    const response = await fetch(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                timeMin: timeMin.toISOString(),
                timeMax: timeMax.toISOString(),
                items: [{ id: 'primary' }],
            }),
        }
    );

    if (!response.ok) {
        console.error('Google freebusy failed:', await response.text());
        return [];
    }

    const data = await response.json() as {
        calendars: {
            primary: {
                busy: Array<{ start: string; end: string }>;
            };
        };
    };

    return data.calendars?.primary?.busy || [];
}

/**
 * Get all team member user IDs for a team.
 */
async function getTeamMemberIds(teamId: string): Promise<string[]> {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
        .from('team_members')
        .select('user_id')
        .eq('team_id', teamId);

    return data?.map(m => m.user_id) || [];
}

/**
 * Generate available time slots for a given date, considering:
 * 1. User's baseline weekly availability
 * 2. Google Calendar busy times
 * 3. Existing bookings in the database
 * 4. Team member busy times (for team events)
 */
export async function generateAvailableSlots(
    userId: string,
    date: Date,
    durationMinutes: number,
    teamId?: string
): Promise<TimeSlot[]> {
    const supabase = getSupabaseAdmin();
    const dayOfWeek = date.getDay();

    // 1. Get baseline availability from DB
    const { data: availability } = await supabase
        .from('availability')
        .select('start_time, end_time')
        .eq('user_id', userId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_active', true)
        .single();

    if (!availability) return [];

    const [startHour, startMin] = availability.start_time.split(':').map(Number);
    const [endHour, endMin] = availability.end_time.split(':').map(Number);

    // 2. Get Google Calendar busy slots
    const dayStart = new Date(date);
    dayStart.setHours(startHour, startMin, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMin, 0, 0);

    const userIds = [userId];
    if (teamId) {
        const teamMemberIds = await getTeamMemberIds(teamId);
        userIds.push(...teamMemberIds.filter(id => id !== userId));
    }

    // Query Google freebusy for all users in parallel
    const busySlotArrays = await Promise.all(
        userIds.map(id => getGoogleBusySlots(id, dayStart, dayEnd))
    );
    const allBusySlots = busySlotArrays.flat();

    // 3. Get existing bookings from DB
    const dateStr = date.toISOString().split('T')[0];
    const { data: existingBookings } = await supabase
        .from('bookings')
        .select('start_at, end_at')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .neq('status', 'cancelled');

    // 4. Generate all possible slots
    const slots: TimeSlot[] = [];
    const slotDuration = durationMinutes;

    for (let h = startHour; h < endHour || (h === endHour && 0 < endMin); h++) {
        for (let m = 0; m < 60; m += slotDuration) {
            if (h === startHour && m < startMin) continue;

            const slotStartMinutes = h * 60 + m;
            const slotEndMinutes = slotStartMinutes + slotDuration;

            if (slotEndMinutes > endHour * 60 + endMin) break;

            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            const endH = Math.floor(slotEndMinutes / 60);
            const endM = slotEndMinutes % 60;
            const endTimeStr = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

            const slotStart = new Date(date);
            slotStart.setHours(h, m, 0, 0);
            const slotEnd = new Date(date);
            slotEnd.setHours(endH, endM, 0, 0);

            // Check if slot overlaps with Google Calendar busy times
            const isGoogleBusy = allBusySlots.some(busy => {
                const busyStart = new Date(busy.start);
                const busyEnd = new Date(busy.end);
                return slotStart < busyEnd && slotEnd > busyStart;
            });

            // Check if slot overlaps with existing bookings
            const isBooked = (existingBookings || []).some(booking => {
                const bStart = new Date(booking.start_at);
                const bEnd = new Date(booking.end_at);
                return slotStart < bEnd && slotEnd > bStart;
            });

            slots.push({
                time: timeStr,
                endTime: endTimeStr,
                available: !isGoogleBusy && !isBooked,
            });
        }
    }

    return slots;
}
