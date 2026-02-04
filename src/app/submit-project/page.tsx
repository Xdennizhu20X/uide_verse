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
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { UploadCloud, X, FileText, CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { db } from "@/lib/firebase";
import { addDoc, collection, doc, getDocs, query, setDoc, where } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";

const projectFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  category: z.string({ required_error: "Por favor, selecciona una categoría." }),
  technologies: z.string().min(3, "Por favor, enumera al menos una tecnología."),
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

export default function SubmitProjectPage() {
  const [projectFiles, setProjectFiles] = useState<FileWithPreview[]>([]);
  const [pdfFile, setPdfFile] = useState<FileWithPreview | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const { user, loading, canUploadProjects, isStudent } = useAuth();
  const router = useRouter();

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
      if (data.otherAuthors) {
        const otherAuthorsList = data.otherAuthors.split(',').map(author => author.trim());
        authors.push(...otherAuthorsList);
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
        developmentPdfUrl: pdfFileUrl || null,
        authors: authors,
        avatar: user.photoURL,
        createdAt: new Date().toISOString(),
        likes: 0,
        likedBy: [],
      };

      await addDoc(collection(db, "projects"), projectData);

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
                <h2 className="text-2xl font-bold mb-2">¡Proyecto Publicado!</h2>
                <p className="text-muted-foreground">Tu proyecto ha sido publicado correctamente. Redirigiendo...</p>
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
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-12 md:py-16">
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
                            <SelectItem value="Desarrollo Web">Desarrollo Web</SelectItem>
                            <SelectItem value="App Móvil">App Móvil</SelectItem>
                            <SelectItem value="IA/ML">IA/ML</SelectItem>
                            <SelectItem value="IoT">IoT</SelectItem>
                            <SelectItem value="Hardware">Hardware</SelectItem>
                            <SelectItem value="Robótica">Robótica</SelectItem>
                            <SelectItem value="Arte Digital">Arte Digital</SelectItem>
                            <SelectItem value="Educación">Educación</SelectItem>
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
                          <Input placeholder="React, Node.js, Arduino" {...field} />
                        </FormControl>
                        <FormDescription>
                          Introduce valores separados por comas.
                        </FormDescription>
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repositorio de GitHub (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://github.com/usuario/repo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="otherAuthors"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correos Electrónicos de Otros Autores</FormLabel>
                      <FormControl>
                        <Input placeholder="p. ej., juan.perez@uide.edu.ec, maria.garcia@uide.edu.ec" {...field} />
                      </FormControl>
                      <FormDescription>
                        Introduce los correos electrónicos de otros autores, separados por comas.
                      </FormDescription>
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

                {/* PDF Upload with Preview */}
                <FormItem>
                  <FormLabel>Informe de Desarrollo del Proyecto (PDF)</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      {!pdfFile ? (
                        <div className="flex items-center justify-center w-full">
                          <label htmlFor="pdf-dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80 transition-colors">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                              <p className="text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                              <p className="text-xs text-muted-foreground">PDF (MAX. 10MB)</p>
                            </div>
                            <input
                              id="pdf-dropzone-file"
                              type="file"
                              className="hidden"
                              accept="application/pdf"
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
              <p><strong>PDF:</strong> {pdfFile ? 'Sí' : 'No'}</p>
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
