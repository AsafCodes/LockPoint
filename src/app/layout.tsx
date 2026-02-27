import type { Metadata, Viewport } from 'next';
import '@/styles/globals.css';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthProvider } from '@/providers/AuthProvider';
import { DisplayProvider } from '@/providers/DisplayProvider';

export const metadata: Metadata = {
  title: 'לוקפוינט — מערכת נוכחות צבאית',
  description: 'מעקב נוכחות אוטומטי מבוסס גדר גיאוגרפית עם דשבורדים פיקודיים בזמן אמת.',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: '#0a0e17',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-midnight text-text-primary antialiased">
        <QueryProvider>
          <AuthProvider>
            <DisplayProvider>
              {children}
            </DisplayProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
