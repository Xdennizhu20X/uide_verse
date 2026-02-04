import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { ArrowRight, Calendar, Heart, Leaf, MessageSquare, Eye, Sparkles } from 'lucide-react';
import { ClientAvatar } from './client-avatar';

interface ProjectCardProps {
   project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
   // Format date for better readability
   const formatDate = (dateString: string) => {
      try {
         const date = new Date(dateString);
         return date.toLocaleDateString('es-EC', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
         });
      } catch {
         return dateString;
      }
   };

   // Count total authors
   const authorCount = project.author ? project.author.split(',').length : 1;
   const firstAuthor = project.author ? project.author.split(',')[0].trim() : 'Autor desconocido';
   const displayAuthor = firstAuthor.split('@')[0]; // Extract username from email

   return (
      <Link
         href={`/projects/${project.id}`}
         className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
         aria-label={`Ver proyecto: ${project.title}`}
      >
         <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-primary border-2">
            {/* Image Section */}
            <CardHeader className="p-0 relative">
               <div className="relative overflow-hidden aspect-video">
                  <Image
                     src={project.imageUrls?.[0] || 'https://placehold.co/400x250.png'}
                     alt={`Imagen del proyecto ${project.title}`}
                     width={400}
                     height={250}
                     className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                     priority={false}
                  />
                  {/* Overlay gradient for better contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start gap-2">
                     <Badge className="bg-card backdrop-blur-sm text-foreground shadow-lg border font-medium">
                        {project.category}
                     </Badge>
                     {project.isEco && (
                        <Badge className="bg-green-600 backdrop-blur-sm text-white shadow-lg border-green-500 font-medium">
                           <Leaf className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                           <span>Ecológico</span>
                        </Badge>
                     )}
                  </div>

                  {/* Stats overlay - Appears on hover */}
                  <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                     {typeof project.views === 'number' && project.views > 0 && (
                        <Badge className="bg-card backdrop-blur-sm text-foreground shadow-lg border">
                           <Eye className="mr-1 h-3 w-3" aria-hidden="true" />
                           {project.views}
                        </Badge>
                     )}
                  </div>
               </div>
            </CardHeader>

            {/* Content Section */}
            <CardContent className="flex-grow p-5 space-y-3">
               {/* Title with better line height */}
               <CardTitle className="text-xl font-bold font-headline leading-tight line-clamp-2 group-hover:text-primary transition-colors]">
                  {project.title}
               </CardTitle>

               {/* Description with better contrast */}
               <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                  {project.description}
               </p>

               {/* Technologies */}
               <div className="flex flex-wrap gap-2 pt-1" aria-label="Tecnologías utilizadas">
                  {project.technologies.slice(0, 3).map((tech) => (
                     <Badge
                        key={tech}
                        className="text-xs px-2.5 py-1 font-medium bg-secondary text-white border-secondary"
                     >
                        {tech}
                     </Badge>
                  ))}
                  {project.technologies.length > 3 && (
                     <Badge className="text-xs px-2.5 py-1 font-medium bg-primary text-primary-foreground border-primary">
                        <Sparkles className="mr-1 h-3 w-3" />
                        +{project.technologies.length - 3}
                     </Badge>
                  )}
               </div>
            </CardContent>

            {/* Footer Section */}
            <CardFooter className="p-5 pt-0 mt-auto">
               <div className="w-full space-y-3">
                  {/* Divider */}
                  <div className="h-px bg-border" aria-hidden="true" />

                  {/* Author Row */}
                  <div className="flex items-center gap-3">
                     <ClientAvatar
                        src={project.avatar}
                        alt={`Avatar de ${displayAuthor}`}
                        fallback={displayAuthor?.charAt(0)?.toUpperCase() || 'U'}
                     />
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate text-foreground" title={firstAuthor}>
                           {displayAuthor}
                        </p>
                        {authorCount > 1 && (
                           <p className="text-xs text-muted-foreground">
                              +{authorCount - 1} {authorCount === 2 ? 'colaborador' : 'colaboradores'}
                           </p>
                        )}
                     </div>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex items-center justify-between text-xs">
                     {/* Date */}
                     <div className="flex items-center gap-1.5 text-muted-foreground" aria-label={`Publicado el ${formatDate(project.date)}`}>
                        <Calendar className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                        <time dateTime={project.date} className="font-medium">{formatDate(project.date)}</time>
                     </div>

                     {/* Stats */}
                     <div className="flex items-center gap-3">
                        {/* Likes */}
                        {typeof project.likes === 'number' && (
                           <div
                              className="flex items-center gap-1 text-muted-foreground"
                              aria-label={`${project.likes} me gusta`}
                           >
                              <Heart className={`h-3.5 w-3.5 ${project.likes > 0 ? 'text-red-500 fill-red-500' : ''}`} aria-hidden="true" />
                              <span className="font-medium">{project.likes}</span>
                           </div>
                        )}

                        {/* Comments */}
                        {project.comments && project.comments.length > 0 && (
                           <div
                              className="flex items-center gap-1 text-muted-foreground"
                              aria-label={`${project.comments.length} comentarios`}
                           >
                              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                              <span className="font-medium">{project.comments.length}</span>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* View More */}
                  <div className="flex items-center justify-end">
                     <div className="flex items-center text-primary text-sm font-semibold opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 gap-1 group-hover:gap-2">
                        <span>Ver proyecto</span>
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                     </div>
                  </div>
               </div>
            </CardFooter>
         </Card>
      </Link>
   );
}