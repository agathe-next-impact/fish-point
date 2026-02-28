'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Fish } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useNotificationStore } from '@/store/notification.store';
import { registerSchema, type RegisterInput } from '@/validators/user.schema';
import { useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();
  const addToast = useNotificationStore((s) => s.addToast);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      setIsSubmitting(true);

      // Create account
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        addToast({ type: 'error', title: error.error || 'Erreur lors de l\'inscription' });
        return;
      }

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        addToast({ type: 'error', title: 'Compte créé, mais erreur de connexion. Essayez de vous connecter.' });
        router.push('/login');
        return;
      }

      addToast({ type: 'success', title: 'Bienvenue sur FishSpot !' });
      router.push('/map');
      router.refresh();
    } catch {
      addToast({ type: 'error', title: 'Erreur serveur' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="text-center">
        <Fish className="h-10 w-10 mx-auto text-primary mb-2" />
        <CardTitle>Inscription</CardTitle>
        <CardDescription>Créez votre compte FishSpot</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => signIn('google', { callbackUrl: '/map' })}
        >
          <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuer avec Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <Input
            type="text"
            placeholder="Nom complet"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            type="email"
            placeholder="Email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            type="password"
            placeholder="Mot de passe (min. 8 caractères)"
            {...register('password')}
            error={errors.password?.message}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline">Connexion</Link>
        </p>
      </CardContent>
    </Card>
  );
}
