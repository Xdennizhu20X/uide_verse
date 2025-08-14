'use client';

import { useState, useEffect } from 'react';
import { ProjectCard } from "@/components/project-card";
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import type { Project } from "@/lib/types";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      const projectsCollection = collection(db, 'projects');
      const projectsSnapshot = await getDocs(projectsCollection);
      const firebaseProjects: Project[] = projectsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
            id: doc.id,
            title: data.title,
            author: data.authors ? data.authors.join(', ') : 'Unknown',
            avatar: data.avatar || 'https://placehold.co/40x40.png',
            date: new Date().toISOString().split('T')[0], // Current date
            category: data.category === 'Otro' ? data.otherCategory : data.category,
            technologies: Array.isArray(data.technologies) ? data.technologies : (data.technologies || '').split(',').map((t: string) => t.trim()),
            description: data.description,
            imageUrls: data.imageUrls || [],
            comments: [],
            isEco: data.isEcological || false,
        };
      });
      setProjects(firebaseProjects);
      setFilteredProjects(firebaseProjects);
    };

    fetchProjects();
  }, []);

  useEffect(() => {
    let tempProjects = [...projects];

    if (searchQuery) {
      tempProjects = tempProjects.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory) {
      tempProjects = tempProjects.filter(project => project.category === selectedCategory);
    }

    if (selectedTechnology) {
      tempProjects = tempProjects.filter(project => project.technologies.includes(selectedTechnology));
    }

    setFilteredProjects(tempProjects);
  }, [searchQuery, selectedCategory, selectedTechnology, projects]);

  const categories = [...new Set(projects.map(p => p.category))].filter(Boolean);
  const technologies = [...new Set(projects.flatMap(p => p.technologies))].filter(Boolean);

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
          <Input
            placeholder="Buscar proyectos..."
            className="flex-grow"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Select onValueChange={(value) => setSelectedCategory(value === 'all' ? '' : value)} value={selectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select onValueChange={(value) => setSelectedTechnology(value === 'all' ? '' : value)} value={selectedTechnology}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Tecnología" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {technologies.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => {
            setSearchQuery('');
            setSelectedCategory('');
            setSelectedTechnology('');
          }}>
            <Filter className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </AnimatedWrapper>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProjects.map((project, index) => (
          <AnimatedWrapper key={project.id} delay={100 * (index % 3)}>
            <ProjectCard project={project} />
          </AnimatedWrapper>
        ))}
      </div>
    </div>
  );
}
