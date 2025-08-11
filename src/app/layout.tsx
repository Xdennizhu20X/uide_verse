import AuthState from '@/components/auth-state';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/layout/site-header';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/lib/utils';
import { Poppins } from 'next/font/google';
import './globals.css';

const fontPoppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
});

export const metadata: Metadata = {
  title: 'Uideverse Hub',
  description: 'Una plataforma para proyectos TIC universitarios.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          fontPoppins.variable
        )}
      >
        <div className="relative flex min-h-screen flex-col">
          <SiteHeader />
          <AuthState />
          <div className="flex-1">{children}</div>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
