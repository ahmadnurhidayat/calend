import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types for our database
export interface User {
    id: string;
    email: string;
    name: string;
    username: string;
    password_hash?: string;
    google_access_token?: string;
    google_refresh_token?: string;
    created_at: string;
}

export interface Availability {
    id: string;
    user_id: string;
    day_of_week: number; // 0 = Sunday, 6 = Saturday
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export interface Booking {
    id: string;
    user_id: string;
    candidate_name: string;
    candidate_email: string;
    date: string;
    start_time: string;
    end_time: string;
    reason?: string;
    google_event_id?: string;
    created_at: string;
}
