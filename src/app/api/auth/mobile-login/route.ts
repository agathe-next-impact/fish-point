import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/validators/user.schema';

const MOBILE_JWT_SALT = 'mobile-session-token';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, password } = validation.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        isPremium: true,
        level: true,
        xp: true,
        passwordHash: true,
      },
    });

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 },
      );
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 },
      );
    }

    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error('AUTH_SECRET is not set');
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        isPremium: user.isPremium,
        username: user.username,
      },
      secret,
      salt: MOBILE_JWT_SALT,
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    const { passwordHash: _, ...userData } = user;

    return NextResponse.json({
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Mobile login error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
