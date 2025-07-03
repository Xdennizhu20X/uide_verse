import { ProjectCard } from "@/components/project-card";
import { projects } from "@/lib/data";
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";

export default function ProjectsPage() {
  const categories = [...new Set(projects.map(p => p.category))];
  const technologies = [...new Set(projects.flatMap(p => p.technologies))];

  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Galería de Proyectos</h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Explora los proyectos innovadores creados por nuestra talentosa comunidad. Filtra por categoría o tecnología para encontrar lo que te inspira.
          </p>
        </div>
      </AnimatedWrapper>

      <AnimatedWrapper delay={200}>
        <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 border rounded-lg bg-card">
          <Input placeholder="Buscar proyectos..." className="flex-grow" />
          <Select>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tecnología" />
            </SelectTrigger>
            <SelectContent>
              {technologies.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button>
            <Filter className="mr-2 h-4 w-4" />
            Filtrar
          </Button>
        </div>
      </AnimatedWrapper>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <AnimatedWrapper key={project.id} delay={100 * (index % 3)}>
            <ProjectCard project={project} />
          </AnimatedWrapper>
        ))}
      </div>
    </div>
  );
}
