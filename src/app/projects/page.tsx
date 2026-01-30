'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProjectCard } from "@/components/project-card";
import { ProjectCardSkeleton } from "@/components/project-card-skeleton";
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Filter, FolderOpen, Sparkles, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import type { Project } from "@/lib/types";
import { analyzeSearchIntent } from "@/app/actions/search";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // AI Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiKeywords, setAiKeywords] = useState<string[]>([]);

  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      try {
        const projectsCollection = collection(db, 'projects');
        const projectsSnapshot = await getDocs(projectsCollection);
        const firebaseProjects: Project[] = projectsSnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            title: data.title,
            author: data.authors ? data.authors.join(', ') : 'Unknown',
            avatar: data.avatar || 'https://placehold.co/40x40.png',
            date: data.createdAt || new Date().toISOString().split('T')[0],
            category: data.category === 'Otro' ? data.otherCategory : data.category,
            technologies: Array.isArray(data.technologies) ? data.technologies : (data.technologies || '').split(',').map((t: string) => t.trim()),
            description: data.description,
            imageUrls: data.imageUrls || [],
            comments: [],
            isEco: data.isEcological || false,
            likes: data.likes || 0,
            views: data.views || 0,
            createdAt: data.createdAt || new Date().toISOString(),
            likedBy: data.likedBy || [],
          };
        });
        setProjects(firebaseProjects);
        setFilteredProjects(firebaseProjects);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle AI Search
  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsAnalyzing(true);
    try {
      const intent = await analyzeSearchIntent(searchQuery);
      console.log("AI Intent:", intent);

      // 1. Apply Categorization if high confidence
      if (intent.categories && intent.categories.length > 0) {
        // Try to match returned category with existing ones
        const availableCategories = [...new Set(projects.map(p => p.category))];
        const matchedCategory = availableCategories.find(c =>
          intent.categories.some(ic => c.toLowerCase().includes(ic.toLowerCase()) || ic.toLowerCase().includes(c.toLowerCase()))
        );
        if (matchedCategory) setSelectedCategory(matchedCategory);
      }

      // 2. Apply Technology filtering
      if (intent.technologies && intent.technologies.length > 0) {
        // You might want to set selectedTechnology if it's a single strong match, 
        // or just use it for keyword filtering if multiple.
        // For now let's prioritize keywords filtering for broader match 
        // unless user specifically asked for one technology which we cover below via keywords.
      }

      // 3. Set keywords for filtered view
      setAiKeywords([...intent.keywords, ...intent.technologies]);

    } catch (error) {
      console.error("AI Search failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    let tempProjects = [...projects];

    // Filter by AI Keywords (Concept Search) OR Standard Text Search
    if (aiKeywords.length > 0) {
      const normalizeText = (text: string) => text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

      // Helper to check contains with plural tolerance (naive Spanish singularization)
      const flexibleContains = (content: string, term: string) => {
        const normContent = normalizeText(content);
        const normTerm = normalizeText(term);

        if (normContent.includes(normTerm)) return true;
        // Try removing trailing 's' (e.g., 'ecologicos' -> 'ecologico')
        if (normTerm.endsWith('s') && normContent.includes(normTerm.slice(0, -1))) return true;
        // Try adding trailing 's' (e.g., 'app' -> 'apps')
        if (!normTerm.endsWith('s') && normContent.includes(normTerm + 's')) return true;

        return false;
      };

      tempProjects = tempProjects.filter(project => {
        // Construct a rich search string including metadata
        const ecoTerm = project.isEco ? "ecologico sostenible ambiente" : "";
        const textContent = `
          ${project.title} 
          ${project.description} 
          ${project.technologies.join(' ')} 
          ${project.category} 
          ${project.author}
          ${ecoTerm}
        `;

        // Check if AT LEAST ONE keyword matches strongly
        return aiKeywords.some(keyword => flexibleContains(textContent, keyword));
      });
    } else {
      // Do nothing based on text alone. Wait for AI keywords.
      // If standard search text exists but no AI keywords yet, we show all (or filtered by cat/tech)
      // until the user presses Enter to trigger AI analysis.
    }

    if (selectedCategory) {
      tempProjects = tempProjects.filter(project => project.category === selectedCategory);
    }

    if (selectedTechnology) {
      tempProjects = tempProjects.filter(project => project.technologies.includes(selectedTechnology));
    }

    setFilteredProjects(tempProjects);
    setCurrentPage(1);
  }, [searchQuery, aiKeywords, selectedCategory, selectedTechnology, projects, isAnalyzing]);

  const categories = useMemo(() =>
    [...new Set(projects.map(p => p.category))].filter(Boolean).sort(),
    [projects]);

  const availableTechnologies = useMemo(() => {
    const relevantProjects = selectedCategory
      ? projects.filter(p => p.category === selectedCategory)
      : projects;

    return [...new Set(relevantProjects.flatMap(p => p.technologies))]
      .filter(Boolean)
      .sort();
  }, [projects, selectedCategory]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSmartSearch();
    }
  }

  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary flex items-center justify-center gap-3">
            Galería de Proyectos <Sparkles className="h-8 w-8 text-yellow-500" />
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Describe tu idea (ej. "apps de salud con react") y nuestra IA encontrará los proyectos perfectos para ti.
          </p>
        </div>
      </AnimatedWrapper>

      <AnimatedWrapper delay={200}>
        <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 border rounded-lg bg-card items-start md:items-center">
          <div className="flex-grow w-full relative">
            <Input
              placeholder="Describe lo que buscas... (Enter para IA)"
              className="w-full pr-12 border-primary/20 focus-visible:ring-primary/40"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value === '') setAiKeywords([]); // Clear AI context on clear
              }}
              onKeyDown={handleKeyDown}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isAnalyzing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-transparent text-primary/60 hover:text-primary"
                  onClick={handleSmartSearch}
                >
                  <Sparkles className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          <Select
            onValueChange={(value) => {
              setSelectedCategory(value === 'all' ? '' : value);
              setSelectedTechnology('');
            }}
            value={selectedCategory}
          >
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
              {availableTechnologies.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Button onClick={() => {
            setSearchQuery('');
            setAiKeywords([]);
            setSelectedCategory('');
            setSelectedTechnology('');
          }}>
            <Filter className="mr-2 h-4 w-4" />
            Limpiar
          </Button>
        </div>
      </AnimatedWrapper>

      {/* Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <AnimatedWrapper key={i} delay={100 * (i % 3)}>
              <ProjectCardSkeleton />
            </AnimatedWrapper>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        /* Empty State */
        <AnimatedWrapper delay={300}>
          <div className="text-center py-16">
            <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron proyectos</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory || selectedTechnology
                ? 'Intenta con otros filtros de búsqueda.'
                : 'Aún no hay proyectos publicados.'}
            </p>
            {(searchQuery || selectedCategory || selectedTechnology) && (
              <Button onClick={() => {
                setSearchQuery('');
                setSelectedCategory('');
                setSelectedTechnology('');
              }}>
                Limpiar filtros
              </Button>
            )}
          </div>
        </AnimatedWrapper>
      ) : (
        <>
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentProjects.map((project, index) => (
              <AnimatedWrapper key={project.id} delay={100 * (index % 3)}>
                <ProjectCard project={project} />
              </AnimatedWrapper>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <AnimatedWrapper delay={200}>
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>

                <span className="text-sm font-medium text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>

                <Button
                  variant="outline"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </AnimatedWrapper>
          )}
        </>
      )}
    </div>
  );
}
