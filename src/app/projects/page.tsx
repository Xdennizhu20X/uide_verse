'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { BentoProjectCard } from "@/components/bento-project-card";
import { ProjectCardSkeleton } from "@/components/project-card-skeleton";
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FolderOpen, Sparkles, Loader2 } from "lucide-react";
import { db } from "@/lib/firebase";
import { getDocs, collection } from "firebase/firestore";
import type { Project } from "@/lib/types";
import { analyzeSearchIntent } from "@/app/actions/search";
import { motion } from "framer-motion";


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
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1A3C] relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[600px] h-[600px] bg-sky-200/30 dark:bg-sky-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-[60%] right-[15%] w-[400px] h-[400px] bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container py-24 md:py-28 relative z-10">
        {/* UNIFIED BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

          {/* === HEADER CELL - Spans 2 cols === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-2 rounded-3xl bg-gradient-to-br from-[#0A1A3C] to-[#152a58] dark:from-[#152a58] dark:to-[#0A1A3C] p-8 md:p-10 flex flex-col justify-center shadow-2xl border border-[#1e3a6d]/50 min-h-[200px]"
          >
            <div className="inline-flex items-center gap-2 bg-[#F0A800]/20 px-4 py-2 rounded-full mb-4 w-fit">
              <Sparkles className="h-5 w-5 text-[#F0A800]" />
              <span className="text-sm font-semibold text-white">Powered by AI</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-headline text-white leading-tight mb-3">
              Galería de <span className="text-[#F0A800]">Proyectos</span>
            </h1>
            <p className="text-base md:text-lg text-slate-300 leading-relaxed">
              Describe tu idea y nuestra IA encontrará los proyectos perfectos.
            </p>
          </motion.div>

          {/* === SEARCH + STATS CELL === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl bg-white dark:bg-[#152a58] p-6 shadow-xl border-2 border-slate-100 dark:border-[#1e3a6d] flex flex-col justify-between min-h-[200px]"
          >
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F0A800]/20 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-[#F0A800]" />
                </div>
                <span className="font-bold text-[#0A1A3C] dark:text-white">Búsqueda Inteligente</span>
              </div>
              <div className="relative">
                <Input
                  placeholder="Describe lo que buscas..."
                  className="w-full h-12 pr-14 text-base border-2 border-slate-200 dark:border-[#1e3a6d] bg-slate-50 dark:bg-[#0A1A3C]/50 rounded-xl focus-visible:ring-[#F0A800]"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value === '') setAiKeywords([]);
                  }}
                  onKeyDown={handleKeyDown}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isAnalyzing ? (
                    <Loader2 className="h-5 w-5 animate-spin text-[#F0A800]" />
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg bg-[#F0A800] hover:bg-[#d99700] text-[#0A1A3C]"
                      onClick={handleSmartSearch}
                    >
                      <Sparkles className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-[#1e3a6d]">
              <div>
                <p className="text-2xl font-bold text-[#0A1A3C] dark:text-white">{filteredProjects.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">proyectos</p>
              </div>
              {(searchQuery || aiKeywords.length > 0) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSearchQuery('');
                    setAiKeywords([]);
                  }}
                  className="text-[#910048] hover:text-[#910048] hover:bg-[#910048]/10 rounded-xl"
                >
                  Limpiar
                </Button>
              )}
            </div>
          </motion.div>

          {/* === PROJECT CARDS === */}
          {loading ? (
            // Loading skeletons
            [...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                className={`rounded-3xl bg-white dark:bg-[#152a58] border-2 border-slate-100 dark:border-[#1e3a6d] overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2' : ''}`}
              >
                <ProjectCardSkeleton />
              </motion.div>
            ))
          ) : filteredProjects.length === 0 ? (
            // Empty state
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="md:col-span-4 rounded-3xl bg-white dark:bg-[#152a58] p-12 shadow-xl border-2 border-slate-100 dark:border-[#1e3a6d] text-center"
            >
              <FolderOpen className="h-20 w-20 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
              <h3 className="text-2xl font-bold text-[#0A1A3C] dark:text-white mb-2">No se encontraron proyectos</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                {searchQuery || selectedCategory || selectedTechnology
                  ? 'Intenta con otros filtros de búsqueda.'
                  : 'Aún no hay proyectos publicados.'}
              </p>
              {(searchQuery || selectedCategory || selectedTechnology) && (
                <Button onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                  setSelectedTechnology('');
                }} className="bg-[#F0A800] hover:bg-[#d99700] text-[#0A1A3C] rounded-xl">
                  Limpiar filtros
                </Button>
              )}
            </motion.div>
          ) : (
            // Project cards
            currentProjects.map((project, index) => {
              const getSizeForIndex = (i: number): 'small' | 'medium' | 'large' | 'wide' | 'tall' => {
                const pattern = i % 8;
                if (pattern === 0) return 'large';
                if (pattern === 3) return 'wide';
                if (pattern === 5) return 'tall';
                return 'medium';
              };

              return (
                <BentoProjectCard
                  key={project.id}
                  project={project}
                  size={getSizeForIndex(index)}
                  index={index}
                />
              );
            })
          )}
        </div>

        {/* Pagination */}
        {!loading && filteredProjects.length > 0 && totalPages > 1 && (
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
      </div>
    </div>
  );
}
