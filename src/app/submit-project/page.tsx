"use client";

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

const projectFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(20, "La descripción debe tener al menos 20 caracteres."),
  category: z.string({ required_error: "Por favor, selecciona una categoría." }),
  technologies: z.string().min(3, "Por favor, enumera al menos una tecnología."),
  imageUrl: z.string().url("Por favor, introduce una URL de imagen válida.").optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function SubmitProjectPage() {
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      technologies: "",
    },
  });

  function onSubmit(data: ProjectFormValues) {
    console.log(data);
    // Handle form submission
  }

  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <Card className="max-w-4xl mx-auto">
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
                            <SelectItem value="Ecológico">Ecológico</SelectItem>
                            <SelectItem value="Educación">Educación</SelectItem>
                            <SelectItem value="Desarrollo Web">Desarrollo Web</SelectItem>
                            <SelectItem value="App Móvil">App Móvil</SelectItem>
                            <SelectItem value="IA/ML">IA/ML</SelectItem>
                            <SelectItem value="IoT">IoT</SelectItem>
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
                <FormItem>
                  <FormLabel>Archivos del Proyecto</FormLabel>
                  <FormControl>
                     <div className="flex items-center justify-center w-full">
                        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-secondary/50 hover:bg-secondary/80">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                                <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Haz clic para subir</span> o arrastra y suelta</p>
                                <p className="text-xs text-muted-foreground">SVG, PNG, JPG o GIF (MAX. 800x400px)</p>
                            </div>
                            <input id="dropzone-file" type="file" className="hidden" />
                        </label>
                    </div> 
                  </FormControl>
                   <FormDescription>
                    Sube imágenes o vídeos de tu proyecto.
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
