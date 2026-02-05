import type { Metadata } from 'next';
import { NavbarWrapper } from '@/components/layout/navbar-wrapper';
import { FooterWrapper } from '@/components/layout/footer-wrapper';
import { ThemeProvider } from '@/components/layout/theme-provider';
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
    <html lang="es" suppressHydrationWarning>
      <head />
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          fontPoppins.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="relative flex min-h-screen flex-col">
            <NavbarWrapper />
            <main className="flex-1">{children}</main>
            <FooterWrapper />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
