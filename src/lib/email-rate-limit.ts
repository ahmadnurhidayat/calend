import { getSupabaseAdmin } from './supabase-server';

const MAX_EMAILS_PER_MONTH = 2;

export async function canSendEmail(candidateEmail: string): Promise<boolean> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data, error } = await supabase
        .from('email_sends')
        .select('count')
        .eq('candidate_email', candidateEmail)
        .eq('year_month', yearMonth)
        .single();

    if (error || !data) return true;

    return data.count < MAX_EMAILS_PER_MONTH;
}

export async function recordEmailSend(candidateEmail: string): Promise<void> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data: existing } = await supabase
        .from('email_sends')
        .select('id, count')
        .eq('candidate_email', candidateEmail)
        .eq('year_month', yearMonth)
        .single();

    if (existing) {
        await supabase
            .from('email_sends')
            .update({ count: existing.count + 1, updated_at: now.toISOString() })
            .eq('id', existing.id);
    } else {
        await supabase
            .from('email_sends')
            .insert({
                candidate_email: candidateEmail,
                year_month: yearMonth,
                count: 1,
            });
    }
}

export async function getEmailSendCount(candidateEmail: string): Promise<number> {
    const supabase = getSupabaseAdmin();
    const now = new Date();
    const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const { data } = await supabase
        .from('email_sends')
        .select('count')
        .eq('candidate_email', candidateEmail)
        .eq('year_month', yearMonth)
        .single();

    return data?.count || 0;
}
