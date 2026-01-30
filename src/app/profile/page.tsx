'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProjectCard } from "@/components/project-card";
import { ProjectCardSkeleton } from "@/components/project-card-skeleton";
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { Award, Edit, FolderOpen, Heart, Save, Upload, X, Users, MessageSquare, Leaf, Star, GitMerge } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit, startAfter, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from 'firebase/auth';
import type { Project } from "@/lib/types";

const PROJECTS_PER_PAGE = 6;

const allBadges = [
  { id: 'first-project', name: 'Primer Proyecto', icon: <Award className="h-8 w-8 text-primary" />, description: 'Publicaste tu primer proyecto' },
  { id: 'eco-warrior', name: 'Eco-Guerrero', icon: <Leaf className="h-8 w-8 text-green-500" />, description: 'Publicaste un proyecto ecológico' },
  { id: '10-likes', name: '10 Likes', icon: <Star className="h-8 w-8 text-yellow-500" />, description: 'Recibiste 10 likes en total' },
  { id: '10-projects', name: '10 Proyectos', icon: <Upload className="h-8 w-8 text-blue-500" />, description: 'Publicaste 10 proyectos' },
];

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    biography: '',
    technologies: '',
  });

  const [userCollaborations, setUserCollaborations] = useState<any[]>([]);
  const [userTopics, setUserTopics] = useState<any[]>([]);


  // Calculate stats
  const totalProjects = userProjects.length;
  const totalLikes = userProjects.reduce((sum, p) => sum + (p.likes || 0), 0);
  const totalEcoProjects = userProjects.filter(p => p.isEco).length;

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
          createdAt: data.createdAt || new Date().toISOString(),
          views: data.views || 0,
          likedBy: data.likedBy || [],
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
          const data = userDoc.data();
          setUserProfile(data);
          setEditForm({
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            biography: data.biography || '',
            technologies: data.technologies?.join(', ') || '',
          });
        }
      };

      const fetchUserBadges = async () => {
        const badgesRef = collection(db, 'users', user.uid, 'badges');
        const badgesSnapshot = await getDocs(badgesRef);
        const earnedBadges = badgesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const mergedBadges = allBadges.map(def => {
          const earned = earnedBadges.find(b => b.id === def.id);
          return { ...def, unlocked: !!earned, unlockedAt: earned?.unlockedAt };
        });
        setUserBadges(mergedBadges);
        return earnedBadges.map(b => b.id); // Return IDs of unlocked badges for checkAndAwardBadges
      };

      const fetchUserCollaborations = async () => {
        const collabsQuery = query(collection(db, 'collaborations'), where('authorId', '==', user.uid));
        const collabsSnapshot = await getDocs(collabsQuery);
        const fetchedCollabs = collabsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'collaboration',
          ...doc.data()
        }));
        setUserCollaborations(fetchedCollabs);
      };

      const fetchUserTopics = async () => {
        const topicsQuery = query(collection(db, 'forum_topics'), where('authorId', '==', user.uid));
        const topicsSnapshot = await getDocs(topicsQuery);
        const fetchedTopics = topicsSnapshot.docs.map(doc => ({
          id: doc.id,
          type: 'topic',
          ...doc.data()
        }));
        setUserTopics(fetchedTopics);
      };

      const checkAndAwardBadges = async (unlockedBadges: string[]) => {
        if (userProjects.length > 0 && !unlockedBadges.includes('first-project')) {
          await setDoc(doc(db, "users", user.uid, "badges", "first-project"), { unlockedAt: new Date() });
        }

        const ecoProjectExists = userProjects.some(p => p.isEco);
        if (ecoProjectExists && !unlockedBadges.includes('eco-warrior')) {
          await setDoc(doc(db, "users", user.uid, "badges", "eco-warrior"), { unlockedAt: new Date() });
        }
      };

      const fetchData = async () => {
        await fetchUserProfile();
        await fetchUserProjects(false);
        const unlockedBadges = await fetchUserBadges();
        await checkAndAwardBadges(unlockedBadges);
        await fetchUserBadges();
      };

      fetchData();
    }
  }, [user, userProjects.length]);

  const loadMoreProjects = () => {
    fetchUserProjects(true);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      let photoURL = user.photoURL;

      // Upload image if selected
      if (selectedFile) {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);

        await new Promise<void>((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64data = reader.result;
              const response = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ file: base64data }),
              });

              if (!response.ok) throw new Error('Upload failed');

              const data = await response.json();
              photoURL = data.url;
              resolve();
            } catch (e) {
              reject(e);
            }
          };
          reader.onerror = reject;
        });
      }

      const technologies = editForm.technologies
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const updatedData = {
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        biography: editForm.biography,
        technologies: technologies,
        ...(photoURL !== user.photoURL && { photoURL }), // Only add if changed (though standard Firestore user doc might not use photoURL field directly, usually handled by Auth, but good to sync)
      };

      // Update Firestore User Doc
      await updateDoc(doc(db, 'users', user.uid), updatedData);

      // Update Firebase Auth Profile
      if (photoURL !== user.photoURL || editForm.firstName !== user.displayName?.split(' ')[0]) {
        await updateProfile(user, {
          displayName: `${editForm.firstName} ${editForm.lastName}`,
          photoURL: photoURL
        });
      }

      setUserProfile({
        ...userProfile,
        firstName: editForm.firstName,
        lastName: editForm.lastName,
        biography: editForm.biography,
        technologies: technologies,
      });

      toast({
        title: "Perfil actualizado",
        description: "Tus cambios han sido guardados correctamente.",
      });

      setIsEditDialogOpen(false);
      setSelectedFile(null); // Reset selection
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="container py-12 md:py-16">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-muted rounded-lg"></div>
          <div className="h-64 bg-muted rounded-lg"></div>
        </div>
      </div>
    );
  }

  const unlockedBadgesCount = userBadges.filter(b => b.unlocked).length;

  return (
    <div className="container py-12 md:py-16">
      {/* Profile Header Card */}
      <AnimatedWrapper>
        <Card className="mb-8">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Avatar className="h-28 w-28 border-4 border-primary shadow-lg">
                <AvatarImage src={user.photoURL || 'https://placehold.co/128x128.png'} />
                <AvatarFallback className="text-3xl">{userProfile.firstName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>

              <div className="flex-grow text-center md:text-left md:pb-2">
                <h1 className="text-3xl font-bold font-headline">
                  {userProfile.firstName} {userProfile.lastName}
                </h1>
                <p className="text-muted-foreground">{user.email}</p>
                {userProfile.biography && (
                  <p className="mt-2 text-foreground/80 max-w-2xl">{userProfile.biography}</p>
                )}
                <div className="mt-3 flex flex-wrap gap-2 justify-center md:justify-start">
                  {userProfile.technologies?.map((tech: string) => (
                    <Badge key={tech} className="bg-secondary text-white">{tech}</Badge>
                  ))}
                </div>
              </div>

              <Button variant="outline" onClick={() => setIsEditDialogOpen(true)} className="md:self-start mt-4 md:mt-0">
                <Edit className="mr-2 h-4 w-4" /> Editar Perfil
              </Button>
            </div>
          </CardContent>
        </Card>
      </AnimatedWrapper>

      {/* Stats Cards */}
      <AnimatedWrapper delay={100}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="text-center p-4">
            <div className="flex flex-col items-center">
              <FolderOpen className="h-8 w-8 text-primary mb-2" />
              <p className="text-3xl font-bold">{totalProjects}</p>
              <p className="text-sm text-muted-foreground">Proyectos</p>
            </div>
          </Card>
          <Card className="text-center p-4">
            <div className="flex flex-col items-center">
              <Heart className="h-8 w-8 text-red-500 mb-2" />
              <p className="text-3xl font-bold">{totalLikes}</p>
              <p className="text-sm text-muted-foreground">Likes Totales</p>
            </div>
          </Card>
          <Card className="text-center p-4">
            <div className="flex flex-col items-center">
              <Leaf className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-3xl font-bold">{totalEcoProjects}</p>
              <p className="text-sm text-muted-foreground">Proyectos Eco</p>
            </div>
          </Card>
          <Card className="text-center p-4">
            <div className="flex flex-col items-center">
              <Award className="h-8 w-8 text-yellow-500 mb-2" />
              <p className="text-3xl font-bold">{unlockedBadgesCount}</p>
              <p className="text-sm text-muted-foreground">Insignias</p>
            </div>
          </Card>
        </div>
      </AnimatedWrapper>

      {/* Tabs */}
      <AnimatedWrapper delay={200}>
        <Tabs defaultValue="projects" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="projects" className="gap-2">
              <FolderOpen className="h-4 w-4" /> Mis Proyectos
            </TabsTrigger>
            <TabsTrigger value="badges" className="gap-2">
              <Award className="h-4 w-4" /> Insignias
            </TabsTrigger>
            <TabsTrigger value="activity" className="gap-2">
              <GitMerge className="h-4 w-4" /> Actividad
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                  <ProjectCardSkeleton key={i} />
                ))}
              </div>
            ) : userProjects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No tienes proyectos aún</h3>
                  <p className="text-muted-foreground mb-4">¡Comienza a compartir tu trabajo con la comunidad!</p>
                  <Button onClick={() => router.push('/submit-project')}>
                    <Upload className="mr-2 h-4 w-4" /> Publicar mi primer proyecto
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          <TabsContent value="badges">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {userBadges.map((badge) => (
                <Card
                  key={badge.id}
                  className={`text-center transition-all ${badge.unlocked
                    ? 'border-primary/50 bg-primary/5'
                    : 'opacity-50 grayscale'
                    }`}
                >
                  <CardContent className="pt-6">
                    <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4 ${badge.unlocked ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                      {badge.icon}
                    </div>
                    <h3 className="font-semibold mb-1">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground">{badge.description}</p>
                    {badge.unlocked && (
                      <Badge className="mt-3 bg-green-500 text-white">Desbloqueada</Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
                <CardDescription>Tu actividad en la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {(() => {
                    const allActivity = [
                      ...userProjects.map(p => ({ ...p, type: 'project', date: p.createdAt })),
                      ...userBadges.filter(b => b.unlocked).map(b => ({ ...b, type: 'badge', date: b.unlockedAt?.toDate ? b.unlockedAt.toDate() : b.unlockedAt })), // Handle timestamp conversion
                      ...userCollaborations.map(c => ({ ...c, type: 'collaboration', date: c.createdAt })),
                      ...userTopics.map(t => ({ ...t, type: 'topic', date: t.createdAt }))
                    ].sort((a, b) => {
                      const dateA = new Date(a.date || 0).getTime();
                      const dateB = new Date(b.date || 0).getTime();
                      return dateB - dateA;
                    });

                    if (allActivity.length === 0) {
                      return <p className="text-muted-foreground text-center py-8">No hay actividad reciente.</p>;
                    }

                    return allActivity.slice(0, 10).map((item: any) => (
                      <div key={`${item.type}-${item.id}`} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                        {/* Icon Logic */}
                        <div className={`p-2 rounded-full ${item.type === 'project' ? 'bg-green-500/10' :
                          item.type === 'badge' ? 'bg-yellow-500/10' :
                            item.type === 'collaboration' ? 'bg-blue-500/10' :
                              'bg-purple-500/10'
                          }`}>
                          {item.type === 'project' && <Upload className="h-4 w-4 text-green-500" />}
                          {item.type === 'badge' && <Award className="h-4 w-4 text-yellow-500" />}
                          {item.type === 'collaboration' && <Users className="h-4 w-4 text-blue-500" />}
                          {item.type === 'topic' && <MessageSquare className="h-4 w-4 text-purple-500" />}
                        </div>

                        {/* Content Logic */}
                        <div>
                          <p className="font-medium">
                            {item.type === 'project' && 'Publicaste un nuevo proyecto'}
                            {item.type === 'badge' && '¡Nueva insignia desbloqueada!'}
                            {item.type === 'collaboration' && 'Abriste una colaboración'}
                            {item.type === 'topic' && 'Publicaste en el foro'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {item.type === 'project' && item.title}
                            {item.type === 'badge' && `Obtuviste la insignia "${item.name}"`}
                            {item.type === 'collaboration' && item.title}
                            {item.type === 'topic' && item.title}
                          </p>
                          <p className="text-xs text-secondary mt-1">
                            {item.date ? new Date(item.date).toLocaleDateString() : 'Recientemente'}
                          </p>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </AnimatedWrapper>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Editar Perfil</DialogTitle>
            <DialogDescription>
              Actualiza tu información personal y habilidades.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src={selectedFile ? URL.createObjectURL(selectedFile) : (user?.photoURL || '')} />
                <AvatarFallback>{editForm.firstName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-2">
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  className="w-full max-w-xs cursor-pointer"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      setSelectedFile(e.target.files[0]);
                    }
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={editForm.firstName}
                  onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={editForm.lastName}
                  onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="biography">Biografía</Label>
              <Textarea
                id="biography"
                placeholder="Cuéntanos sobre ti..."
                value={editForm.biography}
                onChange={(e) => setEditForm({ ...editForm, biography: e.target.value })}
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="technologies">Tecnologías (separadas por coma)</Label>
              <Input
                id="technologies"
                placeholder="React, Node.js, Python..."
                value={editForm.technologies}
                onChange={(e) => setEditForm({ ...editForm, technologies: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" /> Cancelar
            </Button>
            <Button onClick={handleSaveProfile} disabled={isSaving}>
              <Save className="mr-2 h-4 w-4" /> {isSaving ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
