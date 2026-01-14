'use client';

import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/notification-bell";
import Image from "next/image";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useTheme } from "next-themes";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/projects", label: "Proyectos" },
  { href: "/colaboracion", label: "Colaboración" },
  { href: "/forum", label: "Foro" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const { theme } = useTheme();

  // Wait for mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const logoUrl = mounted && theme === 'light' ? "/uideverse-logo-ligth.png" : "/uideverse-logo.png";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1A3C]/95 backdrop-blur-md transition-colors duration-300">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Image
              src={logoUrl}
              alt="Uideverse Hub Logo"
              width={147}
              height={32}
              priority
            />
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="group font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-deep-blue dark:hover:text-accent-gold"
              >
                {link.label}
                <span className="block h-0.5 max-w-0 bg-deep-blue dark:bg-accent-gold transition-all duration-300 group-hover:max-w-full"></span>
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Header */}
        <div className="flex w-full items-center justify-between md:hidden">
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src={logoUrl}
              alt="Uideverse Hub Logo"
              width={147}
              height={32}
              priority
            />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left">
                <div className="flex h-full flex-col justify-between py-6">
                  <div>
                    <Link href="/" className="flex items-center space-x-2 px-4">
                      <Image
                        src={logoUrl}
                        alt="Uideverse Hub Logo"
                        width={147}
                        height={32}
                      />
                    </Link>
                    <nav className="grid gap-2 px-4 mt-8">
                      {navLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="px-3 py-2 text-lg font-medium text-slate-600 dark:text-slate-300 transition-colors hover:text-deep-blue dark:hover:text-accent-gold rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {link.label}
                        </Link>
                      ))}
                    </nav>
                  </div>
                  <div className="flex flex-col gap-2 px-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    {user ? (
                      <>
                        <Button asChild onClick={() => setOpen(false)} className="bg-deep-blue hover:bg-blue-800 dark:bg-accent-gold dark:hover:bg-amber-400 dark:text-dark-navy">
                          <Link href="/submit-project">Enviar Proyecto</Link>
                        </Button>
                        <Button variant="outline" asChild onClick={() => setOpen(false)} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white">
                          <Link href="/profile">Perfil</Link>
                        </Button>
                        <div className="h-px w-full bg-slate-200 dark:bg-slate-700 my-2" />
                        <Button variant="ghost" onClick={() => { handleLogout(); setOpen(false); }} className="text-slate-600 dark:text-slate-300">
                          Cerrar Sesión
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button variant="ghost" asChild onClick={() => setOpen(false)} className="font-semibold text-deep-blue dark:text-white">
                          <Link href="/login">Iniciar Sesión</Link>
                        </Button>
                        <Button asChild onClick={() => setOpen(false)} className="bg-accent-gold hover:bg-amber-400 text-dark-navy font-bold rounded-full">
                          <Link href="/register">Registrarse</Link>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>


        <div className="hidden flex-1 items-center justify-end space-x-4 md:flex">
          <nav className="flex items-center space-x-2">
            {user ? (
              <>
                <NotificationBell />
                <Button asChild className="bg-deep-blue hover:bg-blue-800 dark:bg-accent-gold dark:hover:bg-amber-400 dark:text-dark-navy">
                  <Link href="/submit-project">Enviar Proyecto</Link>
                </Button>
                <Button variant="outline" asChild className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Link href="/profile">Perfil</Link>
                </Button>
                <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2" />
                <Button variant="ghost" onClick={handleLogout} className="text-slate-600 dark:text-slate-300 hover:text-deep-blue dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild className="font-semibold text-deep-blue dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800">
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild className="bg-accent-gold hover:bg-amber-400 text-dark-navy font-bold rounded-full shadow-lg shadow-amber-500/20">
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
            <div className="h-6 w-px bg-slate-300 dark:bg-slate-600 mx-2" />
            <ThemeToggle />
          </nav>
        </div>
      </div>
    </header>
  );
}