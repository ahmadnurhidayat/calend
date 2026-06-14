import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
    if (cachedClient) return cachedClient;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY');
    }

    cachedClient = createClient(supabaseUrl, supabaseAnonKey);
    return cachedClient;
}

// ============================================
// Database Types
// ============================================

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

export interface Team {
    id: string;
    name: string;
    slug: string;
    created_at: string;
}

export interface TeamMember {
    id: string;
    team_id: string;
    user_id: string;
    role: 'admin' | 'member';
    users?: User;
}

export interface EventType {
    id: string;
    user_id: string | null;
    team_id: string | null;
    title: string;
    slug: string;
    description: string | null;
    duration: number;
    is_active: boolean;
    created_at: string;
}

export interface Availability {
    id: string;
    user_id: string;
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_active: boolean;
}

export interface Booking {
    id: string;
    user_id: string;
    event_type_id: string | null;
    team_id?: string | null;
    candidate_name: string;
    candidate_email: string;
    date: string;
    start_time: string;
    end_time: string;
    start_at: string;
    end_at: string;
    timezone: string;
    reason?: string;
    google_event_id?: string | null;
    reschedule_token?: string | null;
    status: 'confirmed' | 'cancelled' | 'rescheduled';
    created_at: string;
}
