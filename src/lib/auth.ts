import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { supabase } from '@/lib/supabase';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            authorization: {
                params: {
                    scope: 'openid email profile https://www.googleapis.com/auth/calendar',
                    access_type: 'offline',
                    prompt: 'consent',
                },
            },
        }),
    ],
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'google' && user.email) {
                // Check if user exists
                const { data: existingUser } = await supabase
                    .from('users')
                    .select('*')
                    .eq('email', user.email)
                    .single();

                if (existingUser) {
                    // Update tokens
                    await supabase
                        .from('users')
                        .update({
                            google_access_token: account.access_token,
                            google_refresh_token: account.refresh_token,
                        })
                        .eq('email', user.email);
                } else {
                    // Create new user
                    const username = user.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');
                    await supabase.from('users').insert({
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        username: username,
                        google_access_token: account.access_token,
                        google_refresh_token: account.refresh_token,
                    });
                }
            }
            return true;
        },
        async jwt({ token, account, user }) {
            if (account) {
                token.accessToken = account.access_token;
                token.refreshToken = account.refresh_token;
            }
            if (user) {
                token.userId = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as { id?: string }).id = token.userId as string;
                (session as { accessToken?: string }).accessToken = token.accessToken as string;
            }
            return session;
        },
    },
    pages: {
        signIn: '/login',
    },
    secret: process.env.NEXTAUTH_SECRET,
};
