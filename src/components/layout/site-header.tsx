'use client';

import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

const navLinks = [
  { href: "/", label: "Inicio" },
  { href: "/projects", label: "Proyectos" },
  { href: "/ecouide", label: "EcoUide" },
  // { href: "/forum", label: "Foro" },
];

const logoUrl = "/uideverse-logo.png";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
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
                className="group font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
                <span className="block h-0.5 max-w-0 bg-primary transition-all duration-300 group-hover:max-w-full"></span>
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
                                className="px-3 py-2 text-lg font-medium text-muted-foreground transition-colors hover:text-primary rounded-md hover:bg-muted"
                            >
                                {link.label}
                            </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex flex-col gap-2 px-4 pt-4 border-t">
                        {user ? (
                          <>
                            <Button asChild onClick={() => setOpen(false)}>
                                <Link href="/submit-project">Enviar Proyecto</Link>
                            </Button>
                            <Button variant="outline" asChild onClick={() => setOpen(false)}>
                                <Link href="/profile">Perfil</Link>
                            </Button>
                            <div className="h-px w-full bg-border my-2" />
                            <Button variant="ghost" onClick={() => {handleLogout(); setOpen(false);}}>Cerrar Sesión</Button>
                          </>
                        ) : (
                          <>
                            <Button variant="ghost" asChild onClick={() => setOpen(false)}>
                                <Link href="/login">Iniciar Sesión</Link>
                            </Button>
                            <Button asChild onClick={() => setOpen(false)}>
                                <Link href="/register">Registrarse</Link>
                            </Button>
                          </>
                        )}
                    </div>
                </div>
            </SheetContent>
            </Sheet>
        </div>


        <div className="hidden flex-1 items-center justify-end space-x-4 md:flex">
           <nav className="flex items-center space-x-2">
            {user ? (
              <>
                <Button asChild>
                  <Link href="/submit-project">Enviar Proyecto</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/profile">Perfil</Link>
                </Button>
                <div className="h-6 w-px bg-border mx-2" />
                <Button variant="ghost" onClick={handleLogout}>Cerrar Sesión</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Registrarse</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}