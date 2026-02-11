"use client";

import { useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { UploadCloud, X, FileText, CheckCircle, Loader2, AlertCircle, Sparkles, Film, Search } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const CATEGORY_CONFIG: Record<string, { techLabel: string; techPlaceholder: string; repoLabel: string; repoPlaceholder: string }> = {
  "Ingeniería en TICs": {
    techLabel: "Tecnologías",
    techPlaceholder: "React, Node.js, Arduino, Python...",
    repoLabel: "Repositorio de GitHub (opcional)",
    repoPlaceholder: "https://github.com/usuario/repo"
  },
  "Arquitectura": {
    techLabel: "Software de Diseño / Herramientas",
    techPlaceholder: "AutoCAD, Revit, SketchUp, Lumion, V-Ray...",
    repoLabel: "Enlace al Portafolio / Renders (Drive/Behance)",
    repoPlaceholder: "https://drive.google.com/..."
  },
  "Psicología": {
    techLabel: "Enfoques / Metodologías",
    techPlaceholder: "Cognitivo-Conductual, Psicoanálisis, Entrevistas...",
    repoLabel: "Enlace a Documentación / Recursos",
    repoPlaceholder: "https://drive.google.com/..."
  },
  "Psicología Clínica": {
    techLabel: "Enfoques / Herramientas Clínicas",
    techPlaceholder: "Test Psicométricos, Terapia Breve, DSM-5...",
    repoLabel: "Enlace a Protocolos / Casos",
    repoPlaceholder: "https://..."
  },
  "Derecho": {
    techLabel: "Rama Legal / Normativas",
    techPlaceholder: "Derecho Penal, COIP, Constitución, Arbitraje...",
    repoLabel: "Enlace al Expediente / Análisis",
    repoPlaceholder: "https://..."
  },
  "Marketing": {
    techLabel: "Herramientas / Canales",
    techPlaceholder: "Google Ads, SEO, Canva, Redes Sociales...",
    repoLabel: "Enlace a Campaña / Portafolio",
    repoPlaceholder: "https://..."
  },
  "Negocios Internacionales": {
    techLabel: "Estrategias / Herramientas",
    techPlaceholder: "Plan de Exportación, Incoterms, Análisis de Mercado...",
    repoLabel: "Enlace al Plan de Negocios",
    repoPlaceholder: "https://..."
  },
  "default": {
    techLabel: "Tecnologías / Herramientas",
    techPlaceholder: "Herramientas utilizadas en el proyecto...",
    repoLabel: "Enlace al Repositorio o Documentación (opcional)",
    repoPlaceholder: "https://..."
  }
};

const projectFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  category: z.string({ required_error: "Por favor, selecciona una categoría." }),
  technologies: z.string({ required_error: "Por favor, enumera las tecnologías." }),
  website: z.string().url({ message: "Por favor, introduce una URL válida." }).optional().or(z.literal('')),
  githubRepo: z.string().url({ message: "Por favor, introduce una URL válida de GitHub." }).optional().or(z.literal('')),
  isEcological: z.boolean().default(false).optional(),
  otherCategory: z.string().optional(),
  otherAuthors: z.string().optional(),
}).refine(data => {
  if (data.category === 'Otro') {
    return !!data.otherCategory;
  }
  return true;
}, {
  message: 'Por favor, especifica la categoría.',
  path: ['otherCategory'],
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

interface FileWithPreview {
  file: File;
  preview: string;
  progress: number;
  uploaded: boolean;
  error?: string;
}

interface User {
  uid: string;
  email: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string;
}

export default function SubmitProjectPage() {
  const [projectFiles, setProjectFiles] = useState<FileWithPreview[]>([]);
  const [pdfFile, setPdfFile] = useState<FileWithPreview | null>(null);
  const [videoFile, setVideoFile] = useState<FileWithPreview | null>(null);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { user, loading, canUploadProjects, isStudent } = useAuth();
  const router = useRouter();

  // Author Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearchUsers = async (queryText: string) => {
    setSearchQuery(queryText);
    if (queryText.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Simple search by email prefix
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", ">=", queryText),
        where("email", "<=", queryText + '\uf8ff'),
        // limit(5) // Limit is optional but good for performance
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User;
        // Exclude current user and already selected authors
        if (userData.email !== user?.email && !selectedAuthors.some(a => a.email === userData.email)) {
          users.push({ ...userData, uid: doc.id });
        }
      });
      setSearchResults(users.slice(0, 5));
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const addAuthor = (author: User) => {
    setSelectedAuthors([...selectedAuthors, author]);
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeAuthor = (email: string) => {
    setSelectedAuthors(selectedAuthors.filter(a => a.email !== email));
  };

  // 1. All Hooks must be called unconditionally at the top level
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      technologies: "",
      otherAuthors: "",
      website: "",
      githubRepo: "",
      isEcological: false,
    },
  });

  const isEcological = form.watch("isEcological");
  const selectedCategory = form.watch("category");

  // Handle image file selection
  const handleImageSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: FileWithPreview[] = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      uploaded: false,
    }));

    setProjectFiles(prev => [...prev, ...newFiles]);
  }, []);

  // Handle PDF file selection
  const handlePdfSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPdfFile({
      file,
      preview: file.name,
      progress: 0,
      uploaded: false,
    });
  }, []);

  // Handle Video file selection
  const handleVideoSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("El video no puede superar los 50MB");
      return;
    }

    setVideoFile({
      file,
      preview: file.name,
      progress: 0,
      uploaded: false,
    });
  }, []);

  const handleGenerateDescription = async () => {
    const { title, category, technologies, description } = form.getValues();

    if (!title || !category || !technologies) {
      alert("Por favor completa el Título, Categoría y Tecnologías para generar una descripción.");
      return;
    }

    setIsGeneratingDescription(true);
    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          technologies,
          currentDescription: description
        }),
      });

      const data = await response.json();

      if (data.description) {
        form.setValue('description', data.description);
      }
    } catch (error) {
      console.error("Error generating description:", error);
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  // 2. Conditional returns come AFTER all hooks
  // Access control - show loading or redirect if not authorized
  if (loading) {
    return (
      <div className="container py-12 md:py-16 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-12 md:py-16">
        <AnimatedWrapper>
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Inicia Sesión</h2>
              <p className="text-muted-foreground mb-6">
                Debes iniciar sesión para subir un proyecto.
              </p>
              <Button onClick={() => router.push('/login')}>
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>
    );
  }

  if (!canUploadProjects) {
    return (
      <div className="container py-12 md:py-16">
        <AnimatedWrapper>
          <Card className="max-w-md mx-auto text-center">
            <CardContent className="pt-8 pb-8">
              <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Acceso Restringido</h2>
              <p className="text-muted-foreground mb-6">
                Solo los estudiantes de la UIDE pueden subir proyectos a la plataforma.
                Si eres estudiante, actualiza tu perfil o contacta con soporte.
              </p>
              <div className="flex gap-4 justify-center">
                <Button variant="outline" onClick={() => router.push('/projects')}>
                  Ver Proyectos
                </Button>
                <Button onClick={() => router.push('/profile')}>
                  Mi Perfil
                </Button>
              </div>
            </CardContent>
          </Card>
        </AnimatedWrapper>
      </div>
    );
  }



  // Remove image
  const removeImage = (index: number) => {
    setProjectFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  // Remove PDF
  const removePdf = () => {
    setPdfFile(null);
  };

  const removeVideo = () => {
    setVideoFile(null);
  };

  // Upload file with progress
  const uploadFileWithProgress = async (fileWithPreview: FileWithPreview, updateProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileWithPreview.file);

      // Simulate progress during file reading
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        if (progress <= 50) {
          updateProgress(progress);
        }
      }, 100);

      reader.onloadend = async () => {
        clearInterval(progressInterval);
        updateProgress(60);

        try {
          const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ file: reader.result }),
          });

          updateProgress(90);

          if (!response.ok) {
            throw new Error('Upload failed');
          }

          const { url } = await response.json();
          updateProgress(100);
          resolve(url);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = (error) => {
        clearInterval(progressInterval);
        reject(error);
      };
    });
  };

  // Handle form validation and show confirmation
  const handlePreSubmit = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setIsConfirmDialogOpen(true);
    }
  };

  // Final submission
  async function onSubmit() {
    if (!user) {
      console.error("No user is logged in.");
      return;
    }

    setIsConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const data = form.getValues();

      // Upload images with progress
      const uploadedImageUrls: string[] = [];
      for (let i = 0; i < projectFiles.length; i++) {
        const file = projectFiles[i];
        try {
          const url = await uploadFileWithProgress(file, (progress) => {
            setProjectFiles(prev => {
              const newFiles = [...prev];
              newFiles[i] = { ...newFiles[i], progress };
              return newFiles;
            });
          });
          uploadedImageUrls.push(url);
          setProjectFiles(prev => {
            const newFiles = [...prev];
            newFiles[i] = { ...newFiles[i], uploaded: true };
            return newFiles;
          });
        } catch (error) {
          setProjectFiles(prev => {
            const newFiles = [...prev];
            newFiles[i] = { ...newFiles[i], error: 'Error al subir' };
            return newFiles;
          });
        }
      }

      // Upload Video with progress
      let videoFileUrl = '';
      if (videoFile) {
        try {
          videoFileUrl = await uploadFileWithProgress(videoFile, (progress) => {
            setVideoFile(prev => prev ? { ...prev, progress } : null);
          });
          setVideoFile(prev => prev ? { ...prev, uploaded: true } : null);
        } catch (error) {
          setVideoFile(prev => prev ? { ...prev, error: 'Error al subir' } : null);
        }
      }

      // Upload PDF with progress
      let pdfFileUrl = '';
      if (pdfFile) {
        try {
          pdfFileUrl = await uploadFileWithProgress(pdfFile, (progress) => {
            setPdfFile(prev => prev ? { ...prev, progress } : null);
          });
          setPdfFile(prev => prev ? { ...prev, uploaded: true } : null);
        } catch (error) {
          setPdfFile(prev => prev ? { ...prev, error: 'Error al subir' } : null);
        }
      }

      const authors = [user.email];
      const authorNames = [];

      // 1. Get Current User Name
      // Try to get from Firestore profile first for most up-to-date name
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          authorNames.push(fullName || user.displayName || user.email!.split('@')[0]);
        } else {
          authorNames.push(user.displayName || user.email!.split('@')[0]);
        }
      } catch (e) {
        console.error("Error fetching user profile for name:", e);
        authorNames.push(user.displayName || user.email!.split('@')[0]);
      }

      // Add selected authors from state
      if (selectedAuthors.length > 0) {
        authors.push(...selectedAuthors.map(a => a.email));
        authorNames.push(...selectedAuthors.map(a =>
          a.displayName || `${a.firstName || ''} ${a.lastName || ''}`.trim() || a.email.split('@')[0]
        ));
      }

      // Keep legacy support for manual entry if needed, or remove it. 
      // User requested "debe dejar agregar a autores que esten registrados" implying ONLY registered.
      // But let's keep manual entry as fallback if desired, or just rely on search.
      // Assuming search is the primary way now.
      if (data.otherAuthors) {
        // Optional: Merge manual entry if user typed something but didn't select?
        // For now, let's prioritize selectedAuthors. 
        // If data.otherAuthors is used as a search box, we ignore its form value for submission 
        // and use selectedAuthors state.
      }

      const projectData = {
        title: data.title,
        description: data.description,
        category: data.category,
        technologies: data.technologies.split(',').map((tech) => tech.trim()),
        ...(data.website && { website: data.website }),
        ...(data.githubRepo && { githubRepo: data.githubRepo }),
        isEcological: data.isEcological || false,
        ...(data.otherCategory && { otherCategory: data.otherCategory }),
        imageUrls: uploadedImageUrls,
        videoUrl: videoFileUrl || null,
        developmentPdfUrl: pdfFileUrl || null,
        authors: authors,
        authorNames: authorNames, // Save names for display
        avatar: user.photoURL,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
        status: 'pending', // Default status
      };

      const docRef = await addDoc(collection(db, "projects"), projectData);

      // Send notifications to selected co-authors
      if (selectedAuthors.length > 0) {
        for (const author of selectedAuthors) {
          if (author.uid && author.uid !== user.uid) {
            await addDoc(collection(db, 'notifications'), {
              recipientId: author.uid,
              type: 'project_invite',
              title: 'Nuevo Proyecto Colaborativo',
              message: `${user.displayName || 'Un usuario'} te ha añadido como co-autor en el proyecto "${data.title}"`,
              avatar: user.photoURL,
              read: false,
              createdAt: new Date(),
              topicId: docRef.id // Link to project page instead of collaboration page
            });
          }
        }
      }

      // Check and award badges
      const userProjectsQuery = query(collection(db, "projects"), where("authors", "array-contains", user.email));
      const userProjectsSnapshot = await getDocs(userProjectsQuery);
      const numProjects = userProjectsSnapshot.size;

      if (numProjects === 1) {
        await setDoc(doc(db, "users", user.uid, "badges", "first-project"), { unlockedAt: new Date() });
      }

      if (numProjects >= 10) {
        await setDoc(doc(db, "users", user.uid, "badges", "10-projects"), { unlockedAt: new Date() });
      }

      if (projectData.isEcological) {
        await setDoc(doc(db, "users", user.uid, "badges", "eco-warrior"), { unlockedAt: new Date() });
      }

      setSubmitSuccess(true);

      // Redirect after showing success
      setTimeout(() => {
        router.push('/projects');
      }, 2000);

    } catch (error) {
      console.error("Error submitting project: ", error);
      setIsSubmitting(false);
    }
  }

  // Loading/Success overlay
  if (isSubmitting) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            {submitSuccess ? (
              <>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">¡Proyecto Enviado a Revisión!</h2>
                <p className="text-muted-foreground">Tu proyecto ha sido enviado a revisión. Pronto un Admin lo aprobará.</p>
              </>
            ) : (
              <>
                <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                <h2 className="text-2xl font-bold mb-2">Publicando Proyecto...</h2>
                <p className="text-muted-foreground mb-6">Por favor, espera mientras subimos los archivos.</p>

                {/* Upload progress */}
                <div className="space-y-4 text-left">
                  {projectFiles.map((file, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">{file.file.name}</span>
                        {file.uploaded ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : file.error ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <span>{file.progress}%</span>
                        )}
                      </div>
                      <Progress value={file.progress} className="h-2" />
                    </div>
                  ))}

                  {pdfFile && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">{pdfFile.file.name}</span>
                        {pdfFile.uploaded ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : pdfFile.error ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <span>{pdfFile.progress}%</span>
                        )}
                      </div>
                      <Progress value={pdfFile.progress} className="h-2" />
                    </div>
                  )}

                  {videoFile && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="truncate max-w-[200px]">{videoFile.file.name}</span>
                        {videoFile.uploaded ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : videoFile.error ? (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        ) : (
                          <span>{videoFile.progress}%</span>
                        )}
                      </div>
                      <Progress value={videoFile.progress} className="h-2" />
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16 pt-24">
      <AnimatedWrapper>
        <Card className={`max-w-4xl mx-auto ${isEcological ? 'ecouide-theme' : ''}`}>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Envía tu Proyecto</CardTitle>
            <CardDescription>Comparte tu trabajo con la comunidad de Uideverse. Rellena el siguiente formulario para empezar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); handlePreSubmit(); }} className="space-y-8">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Proyecto</FormLabel>
                      <FormControl>
                        <Input placeholder="p. ej., Sistema de Riego Inteligente" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isEcological"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Proyecto Ecológico
                        </FormLabel>
                        <FormDescription>
                          Marca esta casilla si tu proyecto tiene un enfoque ecológico o de sostenibilidad.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleGenerateDescription}
                          disabled={isGeneratingDescription}
                          className="bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800"
                        >
                          {isGeneratingDescription ? (
                            <>
                              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <Sparkles className="mr-2 h-3 w-3" />
                              Mejorar con IA
                            </>
                          )}
                        </Button>
                      </div>
                      {isGeneratingDescription && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 mb-3 flex items-start">
                          <Loader2 className="h-4 w-4 text-yellow-600 dark:text-yellow-400 mt-0.5 mr-2 animate-spin flex-shrink-0" />
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            La IA está analizando tu proyecto para generar una descripción profesional. Por favor, espera unos segundos...
                          </p>
                        </div>
                      )}
                      <FormControl>
                        <Textarea placeholder="Describe tu proyecto en detalle..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría de proyecto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Ingeniería en TICs">Ingeniería en TICs</SelectItem>
                            <SelectItem value="Psicología">Psicología</SelectItem>
                            <SelectItem value="Psicología Clínica">Psicología Clínica</SelectItem>
                            <SelectItem value="Negocios Internacionales">Negocios Internacionales</SelectItem>
                            <SelectItem value="Marketing">Marketing</SelectItem>
                            <SelectItem value="Derecho">Derecho</SelectItem>
                            <SelectItem value="Arquitectura">Arquitectura</SelectItem>
                            <SelectItem value="Otro">Otro</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="technologies"
                    render={({ field }) => {
                      const config = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG["default"];
                      return (
                        <FormItem>
                          <FormLabel>{config.techLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder={config.techPlaceholder} {...field} />
                          </FormControl>
                          <FormDescription>
                            Introduce valores separados por comas.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
                {selectedCategory === 'Otro' && (
                  <FormField
                    control={form.control}
                    name="otherCategory"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifica la Categoría</FormLabel>
                        <FormControl>
                          <Input placeholder="p. ej., Videojuego" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid md:grid-cols-2 gap-8">
                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://mi-proyecto.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="githubRepo"
                    render={({ field }) => {
                      const config = CATEGORY_CONFIG[selectedCategory] || CATEGORY_CONFIG["default"];
                      return (
                        <FormItem>
                          <FormLabel>{config.repoLabel}</FormLabel>
                          <FormControl>
                            <Input placeholder={config.repoPlaceholder} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="otherAuthors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Colaboradores (Otros Autores)</FormLabel>
                      <FormDescription>
                        Busca y añade a otros usuarios registrados por su correo electrónico.
                      </FormDescription>
                      <FormControl>
                        <div className="relative">
                          <div className="flex items-center border rounded-md px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:border-primary">
                            <Search className="h-4 w-4 text-muted-foreground mr-2" />
                            <input
                              type="text"
                              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
                              placeholder="Buscar por correo electrónico (ej. juan@uide.edu.ec)..."
                              value={searchQuery}
                              onChange={(e) => handleSearchUsers(e.target.value)}
                            />
                            {isSearching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                          </div>

                          {/* Search Results Dropdown */}
                          {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-10 max-h-60 overflow-y-auto">
                              {searchResults.map((user) => (
                                <div
                                  key={user.uid}
                                  className="flex items-center p-2 hover:bg-accent cursor-pointer transition-colors"
                                  onClick={() => addAuthor(user)}
                                >
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage src={user.photoURL} />
                                    <AvatarFallback>{user.displayName?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                      {user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Usuario"}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>

                      {/* Selected Authors List */}
                      {selectedAuthors.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {selectedAuthors.map((author) => (
                            <div key={author.email} className="flex items-center bg-secondary text-secondary-foreground rounded-full pl-1 pr-3 py-1 text-sm">
                              <Avatar className="h-6 w-6 mr-2">
                                <AvatarImage src={author.photoURL} />
                                <AvatarFallback className="text-[10px]">
                                  {(author.displayName || author.firstName || "U").substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span>
                                {author.displayName || `${author.firstName || ''} ${author.lastName || ''}`.trim() || author.email}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeAuthor(author.email)}
                                className="ml-2 hover:text-destructive focus:outline-none"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Image Upload with Preview */}
                <FormItem>
                  <FormLabel>Imágenes del Proyecto</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {/* Dropzone */}
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                            <p className="text-xs text-muted-foreground">PNG, JPG o GIF (múltiples archivos permitidos)</p>
                          </div>
                          <input
                            id="dropzone-file"
                            type="file"
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={handleImageSelect}
                          />
                        </label>
                      </div>

                      {/* Image Previews */}
                      {projectFiles.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {projectFiles.map((file, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                                <Image
                                  src={file.preview}
                                  alt={`Preview ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="absolute -top-2 -right-2 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-4 w-4" />
                              </button>
                              <p className="text-xs text-muted-foreground truncate mt-1">{file.file.name}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Sube imágenes de tu proyecto. La primera imagen será la portada.
                  </FormDescription>
                </FormItem>

                {/* Video Upload */}
                <FormItem>
                  <FormLabel>Video Demo (Opcional)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {!videoFile ? (
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="video-dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Film className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir video</span></p>
                              <p className="text-xs text-muted-foreground">MP4, MOV (MAX. 50MB)</p>
                            </div>
                            <input
                              id="video-dropzone-file"
                              type="file"
                              className="hidden"
                              accept="video/mp4,video/quicktime,video/webm"
                              onChange={handleVideoSelect}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                          <Film className="h-10 w-10 text-blue-500" />
                          <div className="flex-1">
                            <p className="font-medium truncate">{videoFile.file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(videoFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removeVideo}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                </FormItem>

                {/* Document Upload */}
                <FormItem>
                  <FormLabel>Archivos del proyecto (ej. informe, marco teórico)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {!pdfFile ? (
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="pdf-dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                              <p className="text-xs text-muted-foreground">PDF, Word, Excel, PowerPoint (MAX. 10MB)</p>
                            </div>
                            <input
                              id="pdf-dropzone-file"
                              type="file"
                              className="hidden"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                              onChange={handlePdfSelect}
                            />
                          </label>
                        </div>
                      ) : (
                        <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                          <FileText className="h-10 w-10 text-red-500" />
                          <div className="flex-1">
                            <p className="font-medium truncate">{pdfFile.file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(pdfFile.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={removePdf}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Sube un archivo PDF con los detalles del desarrollo de tu proyecto.
                  </FormDescription>
                </FormItem>

                <Button type="submit" size="lg" className="w-full md:w-auto">
                  Enviar Proyecto
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </AnimatedWrapper>

      {/* Confirmation Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar publicación?</DialogTitle>
            <DialogDescription>
              Estás a punto de publicar el proyecto "<strong>{form.getValues('title')}</strong>". Esta acción publicará tu proyecto en la plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2 text-sm">
              <p><strong>Categoría:</strong> {form.getValues('category')}</p>
              <p><strong>Tecnologías:</strong> {form.getValues('technologies')}</p>
              <p><strong>Imágenes:</strong> {projectFiles.length} archivo(s)</p>
              <p><strong>Imágenes:</strong> {projectFiles.length} archivo(s)</p>
              <p><strong>Video:</strong> {videoFile ? 'Sí' : 'No'}</p>
              <p><strong>Documentos:</strong> {pdfFile ? 'Sí' : 'No'}</p>
              {form.getValues('isEcological') && (
                <p className="text-green-600 font-medium">🌱 Proyecto Ecológico</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={onSubmit}>
              Confirmar y Publicar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
