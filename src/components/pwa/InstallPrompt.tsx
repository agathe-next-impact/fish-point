'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Download, Share, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Bannière d'installation PWA.
 * - Android / Chromium : capte `beforeinstallprompt` et déclenche le prompt natif.
 * - iOS Safari : pas d'événement → affiche les instructions « Partager → Sur l'écran d'accueil ».
 * - Masquée si l'app est déjà installée (mode standalone) ou récemment rejetée.
 */

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
  prompt: () => Promise<void>;
}

const DISMISS_KEY = 'fishspot-install-dismissed';
const DISMISS_DAYS = 30;

function recentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return true; // valeur héritée non datée → considérée rejetée
    return Date.now() - ts < DISMISS_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function rememberDismissal(): void {
  try {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* localStorage indisponible (mode privé) — on ignore */
  }
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  const iOS =
    /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const webkit = /webkit/i.test(ua);
  const otherBrowser = /crios|fxios|edgios|opt\//i.test(ua); // Chrome/Firefox/Edge/Opera iOS
  return iOS && webkit && !otherBrowser;
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || recentlyDismissed()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
      rememberDismissal();
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
    window.addEventListener('appinstalled', onInstalled);

    // iOS Safari : aucun événement natif — on propose un rappel manuel après un court délai.
    let iosTimer: number | undefined;
    if (isIosSafari()) {
      iosTimer = window.setTimeout(() => {
        setShowIosHint(true);
        setVisible(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
      window.removeEventListener('appinstalled', onInstalled);
      if (iosTimer) window.clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    rememberDismissal();
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    setVisible(false);
    if (choice.outcome === 'dismissed') rememberDismissal();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application FishSpot"
      className={cn(
        'fixed left-1/2 z-[55] w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2',
        'bottom-24 lg:bottom-6',
        'rounded-2xl border border-line bg-card/95 p-4 shadow-xl backdrop-blur-xl',
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer"
        className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <Image
          src="/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">Installer FishSpot</p>

          {showIosHint ? (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Appuyez sur{' '}
              <Share className="inline h-3.5 w-3.5 -translate-y-px" aria-label="Partager" /> puis
              «&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;» pour l&apos;ajouter à votre téléphone.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Accès rapide, plein écran et consultation hors-ligne de vos spots.
            </p>
          )}

          {!showIosHint && (
            <div className="mt-3 flex items-center gap-2">
              <Button size="sm" onClick={install}>
                <Download className="mr-1.5 h-4 w-4" />
                Installer
              </Button>
              <Button size="sm" variant="ghost" onClick={dismiss}>
                Plus tard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
