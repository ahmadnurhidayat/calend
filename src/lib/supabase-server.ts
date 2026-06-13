import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
    if (cachedClient) return cachedClient;

    if (!env.supabaseUrl || !env.supabaseServiceKey) {
        throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }

    cachedClient = createClient(env.supabaseUrl, env.supabaseServiceKey);
    return cachedClient;
}
