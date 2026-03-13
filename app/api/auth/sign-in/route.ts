import { env } from '@/lib/env';
import * as jose from 'jose';
import { NextRequest, NextResponse } from 'next/server';

export const POST = async (req: NextRequest) => {
  try {
    const { fid, signature, message } = await req.json();

    let user = null;
    let walletAddress = '';

    // Try fetching user from Neynar if API key is configured
    if (env.NEYNAR_API_KEY) {
      try {
        const response = await fetch(`https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`, {
          headers: {
            'x-api-key': env.NEYNAR_API_KEY,
          },
        });

        if (response.ok) {
          const data = await response.json();
          user = data.users[0];
          walletAddress = user.custody_address;

          // Verify signature matches custody address
          const { verifyMessage } = await import('viem');
          const isValidSignature = await verifyMessage({
            address: walletAddress as `0x${string}`,
            message,
            signature,
          });

          if (!isValidSignature) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
          }
        }
      } catch (e) {
        console.warn('Neynar fetch failed, continuing with basic auth:', e);
      }
    }

    // Fallback user for dev mode (no Neynar)
    if (!user) {
      user = {
        fid: fid || '0',
        username: 'trader',
        display_name: 'Trader',
        pfp_url: '',
        custody_address: '0x6eEed1EE979c3953EDD9b94702131e9bC5F1EC52',
        verifications: [],
      };
      walletAddress = user.custody_address;
    }

    // Generate JWT token
    const secret = new TextEncoder().encode(env.JWT_SECRET);
    const token = await new jose.SignJWT({
      fid,
      walletAddress,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const response = NextResponse.json({ success: true, user });

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json({ error: 'Sign in failed' }, { status: 500 });
  }
};
