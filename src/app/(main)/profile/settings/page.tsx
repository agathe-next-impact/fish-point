'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Metadata } from 'next';

export default function SettingsPage() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Profil</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Nom" />
          <Input placeholder="Pseudo" />
          <textarea
            placeholder="Bio"
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button>Enregistrer</Button>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="text-lg">Préférences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Notifications</span>
            <input type="checkbox" defaultChecked className="rounded" />
          </label>
          <label className="flex items-center justify-between">
            <span className="text-sm">Mode sombre</span>
            <input type="checkbox" className="rounded" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg text-destructive">Zone dangereuse</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive">Supprimer mon compte</Button>
        </CardContent>
      </Card>
    </div>
  );
}
