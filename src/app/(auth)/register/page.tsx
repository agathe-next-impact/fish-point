'use client';

import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Fish } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegisterPage() {
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
          Continuer avec Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <form className="space-y-3">
          <Input type="text" placeholder="Nom complet" />
          <Input type="email" placeholder="Email" />
          <Input type="password" placeholder="Mot de passe (min. 8 caractères)" />
          <Button className="w-full">Créer mon compte</Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary hover:underline">Connexion</Link>
        </p>
      </CardContent>
    </Card>
  );
}
