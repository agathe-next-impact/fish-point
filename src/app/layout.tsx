import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { DEFAULT_METADATA } from '@/config/seo';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { GeolocationProvider } from '@/components/providers/GeolocationProvider';
import { ToastContainer } from '@/components/ui/toast';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = DEFAULT_METADATA;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <GeolocationProvider>
                {children}
                <ToastContainer />
              </GeolocationProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
