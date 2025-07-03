"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Leaf, MessageSquare } from 'lucide-react';
import { ProjectCard } from '@/components/project-card';
import { projects } from '@/lib/data';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { ParticleBackground } from '@/components/ui/particle-background';
import { useState } from 'react';
import type { MouseEvent } from 'react';

export default function Home() {
  const featuredProjects = projects.slice(0, 3);
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);

  const handleMouseMove = (event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMousePosition({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  };
  
  const handleMouseLeave = () => {
    setMousePosition(null);
  }

  return (
    <>
      <div className="flex flex-col min-h-screen">
        <section
          className="group/hero relative w-full py-24 md:py-40 lg:py-56 text-center overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          <ParticleBackground mousePosition={mousePosition} />
          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              <AnimatedWrapper>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl xl:text-7xl/none font-headline text-primary [text-shadow:0_0_15px_hsl(var(--primary)/0.5)]">
                    Bienvenido a Uideverse Hub
                  </h1>
                  <p className="max-w-[700px] text-muted-foreground md:text-xl mx-auto">
                    Un universo para mostrar, descubrir y colaborar en los proyectos TIC más innovadores de la UIDE.
                  </p>
                </div>
              </AnimatedWrapper>
              <AnimatedWrapper delay={200}>
                <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
                  <Button asChild size="lg">
                    <Link href="/projects">
                      Explorar Proyectos <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/forum">
                      Únete al Foro <MessageSquare className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </AnimatedWrapper>
            </div>
          </div>
        </section>

        <section id="benefits" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <AnimatedWrapper>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm text-secondary-foreground">¿Por qué unirte?</div>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Un Universo de Oportunidades</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Uideverse Hub es más que una galería. Es una comunidad para aprender, compartir y crecer.
                  </p>
                </div>
              </div>
            </AnimatedWrapper>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 pt-12">
              <AnimatedWrapper delay={200}>
                <Card className="h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="h-8 w-8 text-primary" />
                      Muestra tu Talento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Gana visibilidad por tu arduo trabajo. Deja que empresas y compañeros vean de lo que eres capaz.
                    </p>
                  </CardContent>
                </Card>
              </AnimatedWrapper>
              <AnimatedWrapper delay={400}>
                <Card className="h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl hover:shadow-secondary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-8 w-8 text-secondary" />
                      Colabora e Innova
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Encuentra colaboradores, recibe feedback y lleva tus proyectos al siguiente nivel con el apoyo de la comunidad.
                    </p>
                  </CardContent>
                </Card>
              </AnimatedWrapper>
              <AnimatedWrapper delay={600}>
                <Card className="h-full transition-transform duration-300 hover:scale-105 hover:shadow-xl hover:shadow-accent/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Leaf className="h-8 w-8 text-accent" />
                      Genera un Impacto
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Participa en desafíos, especialmente en nuestra sección EcoUide, y contribuye a un mundo mejor.
                    </p>
                  </CardContent>
                </Card>
              </AnimatedWrapper>
            </div>
          </div>
        </section>

        <section id="featured-projects" className="w-full py-12 md:py-24 lg:py-32 bg-primary/5">
          <div className="container px-4 md:px-6">
            <AnimatedWrapper>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl font-headline">Proyectos Destacados</h2>
                  <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                    Echa un vistazo a algunos de los proyectos más innovadores e inspiradores de nuestra comunidad.
                  </p>
                </div>
              </div>
            </AnimatedWrapper>
            <div className="grid gap-8 pt-12 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project, index) => (
                <AnimatedWrapper key={project.id} delay={index * 200}>
                  <ProjectCard project={project} />
                </AnimatedWrapper>
              ))}
            </div>
            <div className="mt-12 text-center">
              <Button asChild size="lg">
                  <Link href="/projects">
                    Ver Todos los Proyectos <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <AnimatedWrapper>
              <div className="space-y-3">
                <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight font-headline">
                  ¿Listo para Unirte a la Conversación?
                </h2>
                <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Sumérgete en nuestro foro para discutir ideas, hacer preguntas y conectar con otros creadores.
                </p>
              </div>
            </AnimatedWrapper>
            <AnimatedWrapper delay={200}>
              <div className="mx-auto w-full max-w-sm space-y-2">
                <Button asChild size="lg" className="w-full">
                  <Link href="/forum">
                    Ir al Foro
                  </Link>
                </Button>
              </div>
            </AnimatedWrapper>
          </div>
        </section>
      </div>
    </>
  );
}
