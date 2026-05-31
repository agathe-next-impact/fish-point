'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AccentPicker } from '@/components/profile/AccentPicker';
import { useTheme } from '@/components/providers/ThemeProvider';

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="container mx-auto max-w-2xl px-4 py-7">
      <h1 className="fs-dsp mb-6 text-[2rem] font-extrabold text-ink">Paramètres</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle className="fs-dsp text-lg">Profil</CardTitle></CardHeader>
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
        <CardHeader><CardTitle className="fs-dsp text-lg">Apparence</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Mode sombre</span>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                theme === 'dark' ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </label>

          <div>
            <p className="mb-2 text-sm font-medium">Couleur d&apos;accent</p>
            <AccentPicker />
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader><CardTitle className="fs-dsp text-lg">Préférences</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <label className="flex items-center justify-between">
            <span className="text-sm">Notifications</span>
            <input type="checkbox" defaultChecked className="rounded accent-[var(--fs-accent)]" />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="fs-dsp text-lg text-destructive">Zone dangereuse</CardTitle></CardHeader>
        <CardContent>
          <Button variant="destructive">Supprimer mon compte</Button>
        </CardContent>
      </Card>
    </div>
  );
}
