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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, X } from "lucide-react";

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
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showLogoutSuccess, setShowLogoutSuccess] = useState(false);
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

  // Auto-hide success alert and redirect
  useEffect(() => {
    if (showLogoutSuccess) {
      const timer = setTimeout(() => {
        setShowLogoutSuccess(false);
        window.location.href = '/'; // Recargar y redirigir al home
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [showLogoutSuccess]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setShowLogoutDialog(false);
      setShowLogoutSuccess(true);
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <>
      {/* Alerta de éxito de cierre de sesión */}
      {showLogoutSuccess && (
        <div className="fixed top-4 right-4 z-[100] animate-in slide-in-from-top-5 fade-in duration-300">
          <div
            className="flex items-center gap-3 rounded-lg p-4 pr-12 shadow-2xl border-2 min-w-[320px]"
            style={{
              backgroundColor: '#f0a800',
              borderColor: '#d89500',
            }}
          >
            <CheckCircle className="h-6 w-6 shrink-0" style={{ color: '#1a1a1a' }} />
            <div>
              <p className="font-bold text-base" style={{ color: '#1a1a1a' }}>
                ¡Hasta pronto!
              </p>
              <p className="text-sm font-medium" style={{ color: '#1a1a1a' }}>
                Has cerrado sesión exitosamente
              </p>
            </div>
            <button
              onClick={() => setShowLogoutSuccess(false)}
              className="absolute right-2 top-2 rounded-md p-1 hover:bg-black/10 transition-colors"
              style={{ color: '#1a1a1a' }}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Diálogo de confirmación de cierre de sesión */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas cerrar tu sesión? Tendrás que iniciar sesión nuevamente para acceder a tu cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header className="fixed top-4 left-0 right-0 z-50 mx-auto max-w-6xl rounded-full border border-slate-200/50 dark:border-slate-700/50 bg-white/80 dark:bg-[#0A1A3C]/80 backdrop-blur-xl shadow-lg transition-colors duration-300">
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
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setOpen(false);
                              setShowLogoutDialog(true);
                            }}
                            className="text-slate-600 dark:text-slate-300"
                          >
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
                  <Button
                    variant="outline"
                    onClick={() => setShowLogoutDialog(true)}
                    className="border-red-300 text-red-500 dark:text-white hover:bg-red-100 dark:hover:bg-red-400"
                  >
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
    </>
  );
}