import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { registerSchema } from '@/validators/user.schema';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Un compte avec cet email existe déjà' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    // Generate username from name
    const base = data.name
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 20);
    const username = `${base}-${Date.now().toString(36)}`;

    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash,
        username,
      },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
