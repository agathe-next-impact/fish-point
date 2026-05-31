import type { Metadata } from 'next';
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google';
import { DEFAULT_METADATA } from '@/config/seo';
import { AuthProvider } from '@/components/providers/AuthProvider';
import { QueryProvider } from '@/components/providers/QueryProvider';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { GeolocationProvider } from '@/components/providers/GeolocationProvider';
import { ServiceWorkerProvider } from '@/components/providers/ServiceWorkerProvider';
import { ToastContainer } from '@/components/ui/toast';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-bricolage',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = DEFAULT_METADATA;

// Apply persisted theme + accent before first paint to avoid a flash.
const themeInitScript = `(function(){try{var s=localStorage.getItem('fishspot-user-preferences');var p=s?JSON.parse(s).state.preferences:null;var d=document.documentElement;var t=p&&p.theme?p.theme:'system';if(t==='system'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}d.classList.remove('light','dark');d.classList.add(t);d.dataset.accent=(p&&p.accent)||'lac';}catch(e){document.documentElement.dataset.accent='lac';}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Hanken+Grotesque:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${bricolage.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <AuthProvider>
          <QueryProvider>
            <ThemeProvider>
              <ServiceWorkerProvider>
                <GeolocationProvider>
                  {children}
                  <ToastContainer />
                </GeolocationProvider>
              </ServiceWorkerProvider>
            </ThemeProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
