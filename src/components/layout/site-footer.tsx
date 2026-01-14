'use client';

import Link from "next/link";
import Image from "next/image";
import { Globe, Share2, Mail } from "lucide-react";

const footerLinks = {
  platform: {
    title: "Plataforma",
    links: [
      { href: "/projects", label: "Ver Proyectos" },
      { href: "/colaboracion", label: "Colaboración" },
      { href: "/forum", label: "Foro" },
      { href: "/submit-project", label: "Subir Proyecto" },
    ],
  },
  resources: {
    title: "Recursos",
    links: [
      { href: "#", label: "Centro de Ayuda" },
      { href: "#", label: "Guía de Proyectos" },
      { href: "#", label: "FAQ" },
    ],
  },
  company: {
    title: "Compañía",
    links: [
      { href: "#", label: "Sobre Nosotros" },
      { href: "#", label: "Contacto" },
      { href: "#", label: "Política de Privacidad" },
      { href: "#", label: "Términos de Servicio" },
    ],
  },
};

export function SiteFooter() {
  return (
    <footer className="bg-card dark:bg-dark-navy border-t border-border">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/uideverse-logo-ligth.png"
                alt="Uideverse Hub Logo"
                width={147}
                height={32}
                className="dark:brightness-0 dark:invert"
              />
            </Link>
            <p className="text-muted-foreground text-sm max-w-sm mb-6">
              Plataforma para compartir, descubrir y colaborar en proyectos universitarios que generan impacto en la comunidad.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="text-muted-foreground hover:text-primary dark:hover:text-accent-gold transition"
                aria-label="Website"
              >
                <Globe className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary dark:hover:text-accent-gold transition"
                aria-label="Compartir"
              >
                <Share2 className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="text-muted-foreground hover:text-primary dark:hover:text-accent-gold transition"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">{footerLinks.platform.title}</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.platform.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary dark:hover:text-accent-gold transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">{footerLinks.resources.title}</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.resources.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary dark:hover:text-accent-gold transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-foreground mb-4">{footerLinks.company.title}</h4>
            <ul className="space-y-2 text-sm">
              {footerLinks.company.links.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-primary dark:hover:text-accent-gold transition"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} Uideverse Hub. Todos los derechos reservados.
          </p>
          <div className="text-muted-foreground text-sm flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
            <span>Sistema Operativo</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
