import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { hash } from 'bcryptjs';

interface SignUpRequest {
    name: string;
    email: string;
    password: string;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as SignUpRequest;
        const { name, email, password } = body;

        // Validate required fields
        if (!name || !email || !password) {
            return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Check if user already exists
        const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
        }

        // Hash password
        const passwordHash = await hash(password, 12);

        // Generate username from email
        const username = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '') + Math.random().toString(36).substring(2, 6);

        // Create user
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
