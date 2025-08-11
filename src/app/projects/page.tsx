import { ProjectCard } from "@/components/project-card";
import { projects as hardcodedProjects } from "@/lib/data";
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import type { Project } from "@/lib/types";

export default async function ProjectsPage() {
  const projectsCollection = collection(db, 'projects');
  const projectsSnapshot = await getDocs(projectsCollection);
  const firebaseProjects: Project[] = projectsSnapshot.docs.map(doc => {
    const data = doc.data();
    return {
        id: doc.id,
        title: data.title,
        author: data.authors ? data.authors.join(', ') : 'Unknown',
        avatar: 'https://placehold.co/40x40.png', // Placeholder
        date: new Date().toISOString().split('T')[0], // Current date
        category: data.category === 'Otro' ? data.otherCategory : data.category,
        technologies: Array.isArray(data.technologies) ? data.technologies : (data.technologies || '').split(',').map((t: string) => t.trim()),
        description: data.description,
        images: data.imageUrl ? [data.imageUrl] : [],
        comments: [],
        isEco: data.isEcological || false,
    };
  });

  const allProjects = [...hardcodedProjects, ...firebaseProjects];

  const categories = [...new Set(allProjects.map(p => p.category))];
  const technologies = [...new Set(allProjects.flatMap(p => p.technologies))];

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
        {allProjects.map((project, index) => (
          <AnimatedWrapper key={project.id} delay={100 * (index % 3)}>
            <ProjectCard project={project} />
          </AnimatedWrapper>
        ))}
      </div>
    </div>
  );
}

