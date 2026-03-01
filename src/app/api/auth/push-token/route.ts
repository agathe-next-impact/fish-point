import { NextRequest, NextResponse } from 'next/server';
import { decode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';

const MOBILE_JWT_SALT = 'mobile-session-token';

export async function POST(request: NextRequest) {
  try {
    // Extract Bearer token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const secret = process.env.AUTH_SECRET;

    if (!secret) {
      console.error('AUTH_SECRET is not set');
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const payload = await decode({ token, secret, salt: MOBILE_JWT_SALT });

    if (!payload?.sub) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 401 });
    }

    const body = await request.json();
    const { pushToken } = body;

    if (!pushToken || typeof pushToken !== 'string') {
      return NextResponse.json(
        { error: 'pushToken est requis' },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: payload.sub },
      data: { pushToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Push token error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
