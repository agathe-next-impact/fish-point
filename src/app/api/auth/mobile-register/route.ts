import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { encode } from 'next-auth/jwt';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const MOBILE_JWT_SALT = 'mobile-session-token';

const mobileRegisterSchema = z.object({
  email: z.string().email('Email invalide'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caracteres').max(50),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caracteres'),
  username: z
    .string()
    .min(3, 'Le pseudo doit contenir au moins 3 caracteres')
    .max(30)
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores',
    )
    .optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = mobileRegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Donnees invalides', details: validation.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { email, name, password, username: providedUsername } = validation.data;

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe deja' },
        { status: 409 },
      );
    }

    // Check if username already exists (when provided)
    if (providedUsername) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: providedUsername },
        select: { id: true },
      });

      if (existingUsername) {
        return NextResponse.json(
          { error: 'Ce pseudo est deja pris' },
          { status: 409 },
        );
      }
    }

    // Generate username from name if not provided
    const username = providedUsername ?? (() => {
      const base = name
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 20);
      return `${base}-${Date.now().toString(36)}`;
    })();

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        username,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        isPremium: true,
        level: true,
        xp: true,
      },
    });

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

    return NextResponse.json({ token, user }, { status: 201 });
  } catch (error) {
    console.error('Mobile register error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
