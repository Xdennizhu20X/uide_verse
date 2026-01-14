"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, BrainCircuit, Leaf, MessageSquare } from 'lucide-react';
import { ProjectCard } from '@/components/project-card';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { Project } from '@/lib/types';

export default function Home() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);

  useEffect(() => {
    const fetchFeaturedProjects = async () => {
      const projectsRef = collection(db, 'projects');
      const q = query(projectsRef, orderBy('likes', 'desc'), limit(3));
      const querySnapshot = await getDocs(q);
      const projects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        projects.push({
          id: doc.id,
          title: data.title,
          author: data.authors ? data.authors.join(', ') : 'Unknown',
          avatar: data.avatar || 'https://placehold.co/40x40.png',
          date: new Date().toISOString().split('T')[0],
          category: data.category === 'Otro' ? data.otherCategory : data.category,
          technologies: Array.isArray(data.technologies) ? data.technologies : (data.technologies || '').split(',').map((t: string) => t.trim()),
          description: data.description,
          imageUrls: data.imageUrls || [],
          website: data.website,
          githubRepo: data.githubRepo,
          developmentPdfUrl: data.developmentPdfUrl,
          comments: [],
          isEco: data.isEcological || false,
          likes: data.likes || 0,
        });
      });
      setFeaturedProjects(projects);
    };

    fetchFeaturedProjects();
  }, []);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section - Institutional Style */}
        <section className="relative w-full py-24 md:py-32 lg:py-40 text-center overflow-hidden bg-primary dark:bg-dark-navy">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 opacity-10 dark:opacity-20 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent-gold rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 -left-24 w-72 h-72 bg-accent-maroon rounded-full blur-3xl"></div>
          </div>
          <div className="container relative z-10 px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-6">
              <AnimatedWrapper>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-4 backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-accent-gold"></span>
                  <span className="text-xs font-medium text-white/90 uppercase tracking-wide">Plataforma Universitaria</span>
                </div>
                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none font-headline text-white">
                    Descubre la próxima generación de{' '}
                    <span className="text-accent-gold">innovación académica</span>
                  </h1>
                  <p className="max-w-[700px] text-blue-100 dark:text-slate-300 md:text-xl mx-auto">
                    Muestra tus proyectos universitarios, colabora con compañeros y construye un portafolio que destaque.
                  </p>
                </div>
              </AnimatedWrapper>
              <AnimatedWrapper delay={200}>
                <div className="flex flex-col gap-4 min-[400px]:flex-row justify-center">
                  <Button asChild size="lg" className="bg-accent-gold hover:bg-amber-400 text-primary font-bold rounded-full shadow-lg">
                    <Link href="/projects">
                      Explorar Proyectos <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  {/* <Button asChild variant="outline" size="lg">
                    <Link href="/forum">
                      Únete al Foro <MessageSquare className="ml-2 h-4 w-4" />
                    </Link>
                  </Button> */}
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

        {/* <section className="w-full py-12 md:py-24 lg:py-32">
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
        </section> */}
      </div>
    </>
  );
}