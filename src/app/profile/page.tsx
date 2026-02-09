'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Award, Edit, FolderOpen, Heart, Save, Upload, X, Leaf, Star, ArrowRight, Mail, Sparkles } from 'lucide-react';
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, limit, startAfter, setDoc, updateDoc } from "firebase/firestore";
import { updateProfile } from 'firebase/auth';
import type { Project } from "@/lib/types";
import { motion } from "framer-motion";

const PROJECTS_PER_PAGE = 6;

const allBadges = [
  { id: 'first-project', name: 'Primer Proyecto', icon: <Award className="h-8 w-8 text-primary" />, description: 'Publicaste tu primer proyecto', color: 'from-blue-500 to-indigo-600' },
  { id: 'eco-warrior', name: 'Eco-Guerrero', icon: <Leaf className="h-8 w-8 text-green-500" />, description: 'Publicaste un proyecto ecológico', color: 'from-green-400 to-emerald-600' },
  { id: '10-likes', name: '10 Likes', icon: <Star className="h-8 w-8 text-yellow-500" />, description: 'Recibiste 10 likes en total', color: 'from-yellow-400 to-orange-500' },
  { id: '10-projects', name: '10 Proyectos', icon: <Upload className="h-8 w-8 text-purple-500" />, description: 'Publicaste 10 proyectos', color: 'from-purple-400 to-pink-600' },
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
        return earnedBadges.map(b => b.id);
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
        ...(photoURL !== user.photoURL && { photoURL }),
      };

      await updateDoc(doc(db, 'users', user.uid), updatedData);

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
      setSelectedFile(null);
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
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1A3C] pt-24 pb-12">
        <div className="container">
          <div className="animate-pulse grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 md:row-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            <div className="md:col-span-2 h-[200px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            <div className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
            <div className="h-[180px] bg-slate-200 dark:bg-slate-800 rounded-3xl"></div>
          </div>
        </div>
      </div>
    );
  }

  const unlockedBadges = userBadges.filter(b => b.unlocked);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0A1A3C] relative">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[10%] right-[5%] w-[600px] h-[600px] bg-sky-200/30 dark:bg-sky-500/10 rounded-full blur-[150px]" />
        <div className="absolute bottom-[20%] left-[10%] w-[500px] h-[500px] bg-indigo-200/30 dark:bg-indigo-500/10 rounded-full blur-[150px]" />
        <div className="absolute top-[60%] right-[15%] w-[400px] h-[400px] bg-amber-200/20 dark:bg-amber-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="container pt-32 pb-12 md:pt-36 md:pb-16 relative z-10">
        {/* BENTO GRID */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

          {/* === PROFILE CARD (2x2) === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="md:col-span-1 md:row-span-2 rounded-3xl bg-white dark:bg-[#0A1A3C] p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-xl border-2 border-slate-100 dark:border-[#1e3a6d]"
          >
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-[#F0A901]/10 rounded-full scale-110" />
              <Avatar className="h-32 w-32 border-4 border-white dark:border-[#0A1A3C] shadow-lg relative z-10">
                <AvatarImage src={user.photoURL || 'https://placehold.co/128x128.png'} />
                <AvatarFallback className="text-4xl bg-[#F0A901] text-[#0A1A3C]">{userProfile.firstName?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
            </div>

            <Badge className="bg-[#910048]/10 text-[#910048] dark:bg-[#910048]/20 dark:text-[#ff8daf] hover:bg-[#910048]/20 border-0 mb-3 px-3 py-1">
              Estudiante
            </Badge>

            <h1 className="text-2xl md:text-3xl font-bold font-headline text-[#0A1A3C] dark:text-white leading-tight mb-2">
              {userProfile.firstName} {userProfile.lastName}
            </h1>

            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm mb-4">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>

            {userProfile.biography && (
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6 line-clamp-4">{userProfile.biography}</p>
            )}

            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(true)}
              className="mt-auto w-full border-2 border-slate-200 dark:border-[#1e3a6d] hover:bg-slate-50 dark:hover:bg-[#152a58] text-[#0A1A3C] dark:text-white rounded-xl"
            >
              <Edit className="mr-2 h-4 w-4" /> Editar Perfil
            </Button>
          </motion.div>

          {/* === STATS: PROJECTS === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-3xl bg-white dark:bg-[#0A1A3C] p-6 shadow-xl flex flex-col justify-between min-h-[140px] border-2 border-slate-100 dark:border-[#1e3a6d]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#002D72]/10 flex items-center justify-center mb-2">
              <FolderOpen className="h-6 w-6 text-[#002D72] dark:text-[#4dabf7]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0A1A3C] dark:text-white">{totalProjects}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Proyectos</p>
            </div>
          </motion.div>

          {/* === STATS: LIKES === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-3xl bg-white dark:bg-[#0A1A3C] p-6 shadow-xl flex flex-col justify-between min-h-[140px] border-2 border-slate-100 dark:border-[#1e3a6d]"
          >
            <div className="w-12 h-12 rounded-2xl bg-[#910048]/10 flex items-center justify-center mb-2">
              <Heart className="h-6 w-6 text-[#910048] dark:text-[#f06595]" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0A1A3C] dark:text-white">{totalLikes}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Me gusta</p>
            </div>
          </motion.div>

          {/* === STATS: ECO === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
            className="rounded-3xl bg-white dark:bg-[#0A1A3C] p-6 shadow-xl flex flex-col justify-between min-h-[140px] border-2 border-slate-100 dark:border-[#1e3a6d]"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-2">
              <Leaf className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-[#0A1A3C] dark:text-white">{totalEcoProjects}</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Impacto Eco</p>
            </div>
          </motion.div>

          {/* === BADGES GRID (Full Width Row 2) === */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="md:col-span-3 rounded-3xl bg-white dark:bg-[#0A1A3C] p-6 shadow-xl border-2 border-slate-100 dark:border-[#1e3a6d] flex flex-col justify-center"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0A901]/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-[#F0A901]" />
                </div>
                <h3 className="text-xl font-bold text-[#0A1A3C] dark:text-white">Mis Insignias</h3>
              </div>
              <Badge variant="outline" className="border-[#F0A901] text-[#F0A901] bg-[#F0A901]/5">
                {unlockedBadges.length}/{allBadges.length}
              </Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {userBadges.map((badge) => (
                <div
                  key={badge.id}
                  className={`rounded-2xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[120px] ${badge.unlocked
                    ? 'bg-[#F0A901]/10 border-2 border-[#F0A901]/30'
                    : 'bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 opacity-60'
                    }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${badge.unlocked ? 'bg-[#F0A901] text-[#0A1A3C]' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                    }`}>
                    {badge.icon}
                  </div>
                  <p className={`font-bold text-xs mb-0.5 ${badge.unlocked ? 'text-[#0A1A3C] dark:text-[#F0A901]' : 'text-slate-500'}`}>
                    {badge.name}
                  </p>
                  {badge.unlocked && (
                    <span className="text-[9px] uppercase tracking-wider font-bold text-[#F0A901] dark:text-white/80">
                      Obtenida
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* === ALL PROJECTS INTEGRATED === */}
          {userProjects.map((project, index) => {
            // Standard grid mapping - projects simply flow into the grid
            // First project can be featured (2 cols) if desired, or just standard 1 col
            // Let's make the first project span 2 cols to add visual interest if it's the "Featured" one
            // layout:
            // Proj 0 (2cols), Proj 1 (1col), Proj 2 (1col) -> Row 3 Full

            const isFeatured = index === 0;
            const gridClasses = `rounded-3xl overflow-hidden shadow-xl relative min-h-[180px] group border-2 border-slate-100 dark:border-[#1e3a6d] ${isFeatured ? 'md:col-span-2 md:row-span-1 min-h-[220px]' : 'md:col-span-1'
              }`;

            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                className={gridClasses}
              >
                <Image
                  src={project.imageUrls?.[0] || 'https://placehold.co/300x200.png'}
                  alt={project.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1A3C]/90 via-[#0A1A3C]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  {isFeatured && (
                    <Badge className="bg-[#F0A901] hover:bg-[#d99700] text-[#0A1A3C] border-0 mb-2 px-2 py-0.5 text-xs font-semibold w-fit">
                      Destacado
                    </Badge>
                  )}
                  <p className={`text-white font-bold leading-tight group-hover:text-[#F0A901] transition-colors ${isFeatured ? 'text-xl' : 'text-sm line-clamp-2'}`}>
                    {project.title}
                  </p>
                </div>
                <Link href={`/projects/${project.id}`} className="absolute inset-0" />
              </motion.div>
            );
          })}

          {/* Load More Button integrated if needed, strictly as a small pill at bottom if huge list,
              but user said "proyectos son parte del grid", implying just cards.
              We'll leave infinite scroll or auto-load logic for later if pagination is needed,
              but for now ensuring visual density. */}

          {/* Empty state if no projects */}
          {userProjects.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="md:col-span-4 rounded-3xl bg-white dark:bg-[#0A1A3C] p-10 shadow-xl border-2 border-slate-100 dark:border-[#1e3a6d] flex flex-col items-center justify-center text-center mt-4"
            >
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                <FolderOpen className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-[#0A1A3C] dark:text-white mb-1">Tu portafolio está vacío</h3>
              <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm max-w-md">
                Publica tus proyectos para compartir tu trabajo con la comunidad y empezar a ganar insignias.
              </p>
              <Button onClick={() => router.push('/submit-project')} className="bg-[#F0A901] hover:bg-[#d99700] text-[#0A1A3C] rounded-xl px-8">
                <Upload className="mr-2 h-4 w-4" /> Publicar Proyecto
              </Button>
            </motion.div>
          )}
        </div>
      </div>

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
