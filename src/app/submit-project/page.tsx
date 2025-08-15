"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { AnimatedWrapper } from "@/components/animated-wrapper";
import { UploadCloud } from "lucide-react";
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
  website: z.string().url({ message: "Por favor, introduce una URL válida." }).optional(),
  githubRepo: z.string().url({ message: "Por favor, introduce una URL válida de GitHub." }).optional(),
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

export default function SubmitProjectPage() {
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const { user } = useAuth();
  const router = useRouter();

  const form = useForm<ProjectFormValues>({
  resolver: zodResolver(projectFormSchema),
  defaultValues: {
    title: "",
    description: "",
    technologies: "",
    otherAuthors: "",
    isEcological: false, // Add default value
  },
});

  const isEcological = form.watch("isEcological");
  const selectedCategory = form.watch("category");

  async function onSubmit(data: ProjectFormValues) {
    if (!user) {
        console.error("No user is logged in.");
        // Handle case where user is not logged in
        return;
    }

    console.log("Submitting project for user:", user.email);

    try {
        const uploadFile = async (file: File) => {
            return new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.readAsDataURL(file);
                reader.onloadend = async () => {
                    try {
                        const response = await fetch('/api/upload', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ file: reader.result }),
                        });
                        const { url } = await response.json();
                        resolve(url);
                    } catch (error) {
                        reject(error);
                    }
                };
                reader.onerror = (error) => {
                    reject(error);
                };
            });
        };

        let projectFileUrl = '';
    if (projectFile) {
      projectFileUrl = await uploadFile(projectFile);
    }

    let pdfFileUrl = '';
    if (pdfFile) {
      pdfFileUrl = await uploadFile(pdfFile);
    }

    const authors = [user.email];
    if (data.otherAuthors) {
      const otherAuthorsList = data.otherAuthors.split(',').map(author => author.trim());
      authors.push(...otherAuthorsList);
    }

    // Clean the data before submission
    const projectData = {
      title: data.title,
      description: data.description,
      category: data.category,
      technologies: data.technologies.split(',').map((tech) => tech.trim()),
      ...(data.website && { website: data.website }),
      ...(data.githubRepo && { githubRepo: data.githubRepo }),
      isEcological: data.isEcological || false, // Ensure boolean value
      ...(data.otherCategory && { otherCategory: data.otherCategory }), // Only include if exists
      imageUrls: projectFileUrl ? [projectFileUrl] : [],
      developmentPdfUrl: pdfFileUrl || null,
      authors: authors,
      avatar: user.photoURL,
      createdAt: new Date().toISOString(),
      likes: 0,
      likedBy: [],
    };

    await addDoc(collection(db, "projects"), projectData);

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


    console.log("Project submitted successfully!");
    // Optionally reset the form after successful submission
    form.reset();
    setProjectFile(null);
    setPdfFile(null);
    router.push('/projects');
  } catch (error) {
    console.error("Error submitting project: ", error);
  }
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                        <FormLabel>Website</FormLabel>
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
                        <FormLabel>Repositorio de GitHub</FormLabel>
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

                

                
                
                <FormItem>
                  <FormLabel>Archivos del Proyecto</FormLabel>
                  <FormControl>
                     <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                <p className="text-xs text-muted-foreground">{projectFile ? projectFile.name : "SVG, PNG, JPG o GIF (MAX. 800x400px)"}</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" onChange={(e) => setProjectFile(e.target.files?.[0] || null)} />
                        </label>
                    </div> 
                  </FormControl>
                   <FormDescription>
                    Sube imágenes o vídeos de tu proyecto.
                  </FormDescription>
                </FormItem>

                <FormItem>
                  <FormLabel>Informe de Desarrollo del Proyecto (PDF)</FormLabel>
                  <FormControl>
                      <div className="flex items-center justify-center w-full">
                          <label htmlFor="pdf-dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                  <p className="text-xs text-muted-foreground">{pdfFile ? pdfFile.name : "PDF (MAX. 5MB)"}</p>
                              </div>
                              <input id="pdf-dropzone-file" type="file" className="hidden" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                          </label>
                      </div>
                  </FormControl>
                  <FormDescription>
                      Sube un archivo PDF con los detalles del desarrollo de tu proyecto.
                  </FormDescription>
                </FormItem>

                <Button type="submit" size="lg">Enviar Proyecto</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </AnimatedWrapper>
    </div>
  );
}
