"use client";

import { useState, useCallback, useEffect } from "react";
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
import { UploadCloud, X, FileText, CheckCircle, Loader2, AlertCircle, Sparkles, Film, Search, Trash2, ArrowLeft } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDoc, getDocs, query, setDoc, where, updateDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useParams } from "next/navigation";

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

export default function EditProjectPage() {
  const params = useParams();
  const id = params.id as string;

  const [projectFiles, setProjectFiles] = useState<FileWithPreview[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  const [pdfFile, setPdfFile] = useState<FileWithPreview | null>(null);
  const [existingPdf, setExistingPdf] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<FileWithPreview | null>(null);
  const [existingVideo, setExistingVideo] = useState<string | null>(null);

  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loadingProject, setLoadingProject] = useState(true);

  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Author Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize form
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

  // Fetch Project Data
  useEffect(() => {
    const fetchProject = async () => {
      if (!user || !id) return;

      try {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();

          // Verify ownership
          if (!data.authors?.includes(user.email)) {
            alert("No tienes permiso para editar este proyecto.");
            router.push('/profile');
            return;
          }

          // Populate form
          form.reset({
            title: data.title || '',
            description: data.description || '',
            category: data.category || '',
            technologies: Array.isArray(data.technologies) ? data.technologies.join(', ') : data.technologies || '',
            website: data.website || '',
            githubRepo: data.githubRepo || '',
            isEcological: data.isEcological || false,
            otherCategory: data.otherCategory || '',
          });

          // Set existing media
          if (data.imageUrls && Array.isArray(data.imageUrls)) {
            setExistingImages(data.imageUrls);
          }
          if (data.developmentPdfUrl) {
            setExistingPdf(data.developmentPdfUrl);
          }
          if (data.videoUrl) {
            setExistingVideo(data.videoUrl);
          }

          // Fetch Co-authors logic could be added here if we store their UIDs
          // For now, simpler implementation for authors
        } else {
          alert("Proyecto no encontrado");
          router.push('/profile');
        }
      } catch (error) {
        console.error("Error fetching project:", error);
      } finally {
        setLoadingProject(false);
      }
    };

    if (user && !authLoading) {
      fetchProject();
    }
  }, [user, id, authLoading, form, router]);


  const handleSearchUsers = async (queryText: string) => {
    setSearchQuery(queryText);
    if (queryText.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const usersRef = collection(db, "users");
      const q = query(
        usersRef,
        where("email", ">=", queryText),
        where("email", "<=", queryText + '\uf8ff'),
      );

      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data() as User;
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

  // Remove image
  const removeImage = (index: number) => {
    setProjectFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const removeExistingImage = (url: string) => {
    setExistingImages(existingImages.filter(img => img !== url));
  };

  // Remove PDF
  const removePdf = () => {
    setPdfFile(null);
  };

  const removeExistingPdf = () => {
    setExistingPdf(null);
  };

  const removeVideo = () => {
    setVideoFile(null);
  };

  const removeExistingVideo = () => {
    setExistingVideo(null);
  };

  // Upload file with progress
  const uploadFileWithProgress = async (fileWithPreview: FileWithPreview, updateProgress: (progress: number) => void): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileWithPreview.file);

      // Simulate progress
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

  const handlePreSubmit = async () => {
    const isValid = await form.trigger();
    if (isValid) {
      setIsConfirmDialogOpen(true);
    }
  };

  async function onSubmit() {
    if (!user) return;

    setIsConfirmDialogOpen(false);
    setIsSubmitting(true);

    try {
      const data = form.getValues();

      // Upload new images
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
          console.error("Upload failed", error);
        }
      }

      // Combine existing and new images
      const finalImageUrls = [...existingImages, ...uploadedImageUrls];

      // Upload Video
      let videoFileUrl = existingVideo || '';
      if (videoFile) {
        try {
          videoFileUrl = await uploadFileWithProgress(videoFile, (progress) => {
            setVideoFile(prev => prev ? { ...prev, progress } : null);
          });
          setVideoFile(prev => prev ? { ...prev, uploaded: true } : null);
        } catch (error) {
          console.error("Video upload failed", error);
        }
      }

      // Upload PDF
      let pdfFileUrl = existingPdf || '';
      if (pdfFile) {
        try {
          pdfFileUrl = await uploadFileWithProgress(pdfFile, (progress) => {
            setPdfFile(prev => prev ? { ...prev, progress } : null);
          });
          setPdfFile(prev => prev ? { ...prev, uploaded: true } : null);
        } catch (error) {
          console.error("PDF upload failed", error);
        }
      }

      // We don't change authors on edit for now to avoid complexity, or just Append new ones?
      // For editing, let's keep existing authors logic simple (updates not supported in this quick edit)
      // Or just re-save current user email? 
      // Safe bet: Fetch current authors again to ensure we don't overwrite co-authors
      const docRef = doc(db, 'projects', id);
      const docSnap = await getDoc(docRef);
      const currentAuthors = docSnap.exists() ? docSnap.data().authors || [user.email] : [user.email];

      const projectData = {
        title: data.title,
        description: data.description,
        category: data.category,
        technologies: data.technologies.split(',').map((tech) => tech.trim()),
        ...(data.website && { website: data.website }),
        ...(data.githubRepo && { githubRepo: data.githubRepo }),
        isEcological: data.isEcological || false,
        ...(data.otherCategory && { otherCategory: data.otherCategory }),
        imageUrls: finalImageUrls,
        videoUrl: videoFileUrl || null,
        developmentPdfUrl: pdfFileUrl || null,
        authors: currentAuthors, // Preserve authors
        status: 'pending', // Re-trigger review
      };

      await updateDoc(docRef, projectData);

      setSubmitSuccess(true);

      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (error) {
      console.error("Error submitting project: ", error);
      setIsSubmitting(false);
    }
  }

  if (authLoading || loadingProject) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="container py-12 md:py-16 pt-32">
      <AnimatedWrapper>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 hover:bg-accent group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver
        </Button>
        <Card className={`max-w-4xl mx-auto ${isEcological ? 'ecouide-theme' : ''}`}>
          <CardHeader>
            <CardTitle className="text-3xl font-headline">Editar Proyecto</CardTitle>
            <CardDescription>Actualiza los detalles de tu proyecto. Volverá a estado "Pendiente" para revisión.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => { e.preventDefault(); handlePreSubmit(); }} className="space-y-8">
                {/* Same Fields as Submit */}
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título del Proyecto</FormLabel>
                      <FormControl>
                        <Input {...field} />
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
                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Proyecto Ecológico</FormLabel>
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
                      <Button type="button" variant="outline" size="sm" onClick={handleGenerateDescription} disabled={isGeneratingDescription} className="ml-2 mb-2">
                        {isGeneratingDescription ? "Generando..." : "Mejorar con IA"}
                      </Button>
                      <FormControl>
                        <Textarea {...field} className="min-h-[120px]" />
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
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona una categoría" />
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tecnologías</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
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
                          <Input {...field} />
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
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="githubRepo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repositorio de GitHub (opcional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Media Uploads */}
                <div className="space-y-4">
                  <FormLabel className="text-base">Imágenes del Proyecto</FormLabel>

                  {/* Existing Images */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {existingImages.map((url) => (
                      <div key={url} className="relative aspect-video rounded-lg overflow-hidden group">
                        <Image src={url} alt="Project image" fill className="object-cover" />
                        <button type="button" onClick={() => removeExistingImage(url)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* New Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors">
                      <Input type="file" accept="image/*" multiple onChange={handleImageSelect} className="hidden" id="images-upload" />
                      <label htmlFor="images-upload" className="cursor-pointer w-full h-full flex flex-col items-center">
                        <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm font-medium">Subir nuevas imágenes</span>
                      </label>
                    </div>
                  </div>
                  {/* Previews of new files */}
                  <div className="grid grid-cols-2 gap-4">
                    {projectFiles.map((file, i) => (
                      <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                        <Image src={file.preview} alt="preview" fill className="object-cover" />
                        <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* PDF and Video sections similar to logic above but skipping for brevity of this artifact. */}

                {/* Video Upload */}
                <div className="space-y-4">
                  <FormLabel className="text-base">Video Demo (opcional)</FormLabel>
                  {existingVideo ? (
                    <div className="relative aspect-video rounded-lg overflow-hidden group bg-black/5 border">
                      <video src={existingVideo} controls className="w-full h-full object-contain" />
                      <button type="button" onClick={removeExistingVideo} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 z-10">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <p className="absolute bottom-2 left-2 text-white text-xs bg-black/70 px-2 py-1 rounded backdrop-blur-sm">Video actual</p>
                    </div>
                  ) : (
                    !videoFile && (
                      <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/50">
                        <Input type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" id="video-upload" />
                        <label htmlFor="video-upload" className="cursor-pointer w-full h-full flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <Film className="h-6 w-6 text-slate-500" />
                          </div>
                          <span className="font-medium">Subir video demo</span>
                          <span className="text-xs text-muted-foreground mt-1">MP4, WebM (máx. 50MB)</span>
                        </label>
                      </div>
                    )
                  )}
                  {videoFile && (
                    <div className="relative bg-slate-50 dark:bg-slate-900 border rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                          <Film className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{videoFile.file.name}</p>
                          <p className="text-xs text-muted-foreground">{(videoFile.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={removeVideo} className="text-slate-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* PDF Upload */}
                <div className="space-y-4">
                  <FormLabel className="text-base">Documentación (PDF)</FormLabel>
                  {existingPdf ? (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Informe de desarrollo actual</p>
                          <a href={existingPdf} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-500 hover:text-indigo-600 underline">Ver documento</a>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={removeExistingPdf} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20">
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar
                      </Button>
                    </div>
                  ) : (
                    !pdfFile && (
                      <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors hover:bg-muted/50">
                        <Input type="file" accept="application/pdf" onChange={handlePdfSelect} className="hidden" id="pdf-upload" />
                        <label htmlFor="pdf-upload" className="cursor-pointer w-full h-full flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                            <FileText className="h-6 w-6 text-slate-500" />
                          </div>
                          <span className="font-medium">Subir Informe PDF</span>
                          <span className="text-xs text-muted-foreground mt-1">Para documentación técnica</span>
                        </label>
                      </div>
                    )
                  )}
                  {pdfFile && (
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-slate-900">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{pdfFile.file.name}</p>
                          <p className="text-xs text-muted-foreground">{(pdfFile.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={removePdf} className="text-slate-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    "Guardar Cambios"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </AnimatedWrapper>
      {/* Confirm Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Confirmar cambios?</DialogTitle>
            <DialogDescription>
              Tu proyecto volverá a estado "Pendiente" para ser revisado por un administrador.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancelar</Button>
            <Button onClick={onSubmit}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Success/Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card className="max-w-md w-full mx-4">
            <CardContent className="pt-8 pb-8 text-center">
              {submitSuccess ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold mb-2">¡Proyecto Actualizado!</h2>
                </>
              ) : (
                <>
                  <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
                  <h2 className="text-2xl font-bold mb-2">Guardando...</h2>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
