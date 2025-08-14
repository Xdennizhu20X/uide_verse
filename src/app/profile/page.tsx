'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectCard } from "@/components/project-card"; // Asegúrate de tener este componente
import {  ProjectCardSkeleton } from "@/components/project-card-skeleton"; // Asegúrate de tener este componente
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { User, Award, GitMerge, Edit, MessageSquare, Leaf } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit, startAfter } from "firebase/firestore";
import type { Project } from "@/lib/types";

const PROJECTS_PER_PAGE = 6;

export default function ProfilePage() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchUserProjects = async (loadMore = false) => {
    if (!user) return;
    
    try {
      if (loadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      let q;
      if (loadMore && lastVisible) {
        q = query(
          collection(db, "projects"),
          where("authors", "array-contains", user.email),
          startAfter(lastVisible),
          limit(PROJECTS_PER_PAGE)
        );
      } else {
        q = query(
          collection(db, "projects"),
          where("authors", "array-contains", user.email),
          limit(PROJECTS_PER_PAGE)
        );
      }

      const querySnapshot = await getDocs(q);
      const newProjects: Project[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        newProjects.push({
          id: doc.id,
          title: data.title || 'Sin título',
          author: data.authors ? data.authors.join(', ') : 'Autor desconocido',
          avatar: 'https://placehold.co/40x40.png',
          date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Fecha desconocida',
          category: data.category === 'Otro' ? (data.otherCategory || 'Otra categoría') : (data.category || 'Sin categoría'),
          technologies: Array.isArray(data.technologies) ? 
            data.technologies : 
            (typeof data.technologies === 'string' ? 
              data.technologies.split(',').map((t: string) => t.trim()) : 
              []),
          description: data.description || 'Sin descripción',
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
          website: data.website || '',
          githubRepo: data.githubRepo || '',
          developmentPdfUrl: data.developmentPdfUrl || '',
          comments: [],
          isEco: data.isEcological || false,
          likes: data.likes || 0,
        });
      });

      if (loadMore) {
        setUserProjects(prev => [...prev, ...newProjects]);
      } else {
        setUserProjects(newProjects);
      }

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === PROJECTS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      if (loadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (user) {
      const fetchUserProfile = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      };
      
      fetchUserProfile();
      fetchUserProjects(false);
    }
  }, [user]);

  const loadMoreProjects = () => {
    fetchUserProjects(true);
  };

  if (!user || !userProfile) {
    return (
      <div className="container py-12 md:py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <Card className="mb-8">
          <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 border-4 border-primary">
              <AvatarImage src={user.photoURL || 'https://placehold.co/100x100.png'} />
              <AvatarFallback>{userProfile.firstName?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-grow text-center md:text-left">
              <h1 className="text-3xl font-bold font-headline">
                {userProfile.firstName} {userProfile.lastName}
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                {userProfile.technologies?.map((tech: string) => (
                  <Badge key={tech}>{tech}</Badge>
                ))}
              </div>
            </div>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" /> Editar Perfil
            </Button>
          </CardContent>
        </Card>
      </AnimatedWrapper>

      <AnimatedWrapper delay={200}>
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="projects"><User className="mr-2 h-4 w-4"/> Mis Proyectos</TabsTrigger>
            <TabsTrigger value="badges"><Award className="mr-2 h-4 w-4"/> Insignias</TabsTrigger>
            <TabsTrigger value="activity"><GitMerge className="mr-2 h-4 w-4"/> Actividad</TabsTrigger>
          </TabsList>
          
          <TabsContent value="projects" className="mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(3)].map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {userProjects.map((project) => (
                    <div key={project.id} className="h-full">
                      <ProjectCard project={project} />
                    </div>
                  ))}
                </div>
                
                {hasMore && (
                  <div className="mt-8 flex justify-center">
                    <Button 
                      onClick={loadMoreProjects} 
                      disabled={loadingMore}
                      variant="outline"
                    >
                      {loadingMore ? 'Cargando...' : 'Cargar más proyectos'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="badges" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Insignias Obtenidas</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="p-4 bg-secondary rounded-full"><Award className="h-8 w-8 text-primary"/></div>
                  <p className="text-sm font-medium">Primer Proyecto</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="p-4 bg-secondary rounded-full"><Leaf className="h-8 w-8 text-accent"/></div>
                  <p className="text-sm font-medium">Eco-Guerrero</p>
                </div>
                <div className="flex flex-col items-center gap-2 opacity-50">
                  <div className="p-4 bg-secondary rounded-full"><MessageSquare className="h-8 w-8"/></div>
                  <p className="text-sm font-medium">Colaborador</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-4">
                  <li className="text-sm text-muted-foreground">Comentaste en 'App de Tutoría con IA'.</li>
                  <li className="text-sm text-muted-foreground">Te gustó 'Controlador de Cultivo Vertical Urbano'.</li>
                  <li className="text-sm text-muted-foreground">Enviaste un nuevo proyecto 'Sistema Inteligente de Gestión de Residuos'.</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedWrapper>
    </div>
  );
}