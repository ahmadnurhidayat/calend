import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-server';
import { hash } from 'bcryptjs';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}

export async function POST(request: NextRequest) {
    // Rate limit by IP
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`signup:${ip}`, RATE_LIMITS.signup)) {
        return NextResponse.json(
            { error: 'Too many attempts. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json() as SignUpRequest;
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Use admin client to check existing user (prevents email enumeration via response timing)
        const supabase = getSupabaseAdmin();
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        // Always hash password to equalize response time regardless of whether user exists
        const passwordHash = await hash(password, 12);

        if (existing) {
            // Still hash to prevent timing attack, but return generic error
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        // Generate username from email
        const suffix = crypto.randomUUID().replace(/-/g, '').substring(0, 4);
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + suffix;

        const { error } = await supabase.from('users').insert({
            email,
            name,
            username,
            password_hash: passwordHash,
        });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
