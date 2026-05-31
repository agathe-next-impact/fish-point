import type { Metadata } from 'next';
import { JetBrains_Mono, Geist } from 'next/font/google';
import { DEFAULT_METADATA } from '@/config/seo';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { GeolocationProvider } from '@/components/providers/GeolocationProvider';
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider';
import { ToastContainer } from '@/components/ui/toast';
import './globals.css';
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = DEFAULT_METADATA;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body className={`${geist.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <GeolocationProvider>
                <ServiceWorkerProvider>
                  {children}
                  <ToastContainer />
                </ServiceWorkerProvider>
              </GeolocationProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
