import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Project } from '@/lib/types';
import { ArrowRight, Calendar, Heart, Leaf, MessageSquare, Users } from 'lucide-react';
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

   return (
      <Link
         href={`/projects/${project.id}`}
         className="group block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
         aria-label={`Ver proyecto: ${project.title}`}
      >
         <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-1 group-hover:border-primary/50">
            {/* Image Section */}
            <CardHeader className="p-0 relative">
               <div className="relative overflow-hidden">
                  <Image
                     src={project.imageUrls?.[0] || 'https://placehold.co/400x250.png'}
                     alt={`Imagen del proyecto ${project.title}`}
                     width={400}
                     height={200}
                     className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  {/* Overlay gradient for better text contrast */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                     <Badge variant="secondary" className="bg-card/90 backdrop-blur-sm text-foreground shadow-sm">
                        {project.category}
                     </Badge>
                     {project.isEco && (
                        <Badge className="bg-green-600/90 backdrop-blur-sm text-white shadow-sm">
                           <Leaf className="mr-1 h-3 w-3" aria-hidden="true" />
                           <span>Ecológico</span>
                        </Badge>
                     )}
                  </div>
               </div>
            </CardHeader>

            {/* Content Section */}
            <CardContent className="flex-grow p-4 space-y-3">
               {/* Title */}
               <CardTitle className="text-lg font-bold font-headline leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                  {project.title}
               </CardTitle>

               {/* Description */}
               <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                  {project.description}
               </p>

               {/* Technologies */}
               <div className="flex flex-wrap gap-1.5" aria-label="Tecnologías utilizadas">
                  {project.technologies.slice(0, 3).map((tech) => (
                     <Badge
                        key={tech}
                        className="text-xs px-2 py-0.5 font-normal bg-secondary text-white border-secondary"
                     >
                        {tech}
                     </Badge>
                  ))}
                  {project.technologies.length > 3 && (
                     <Badge className="text-xs px-2 py-0.5 font-normal bg-secondary text-white border-secondary">
                        +{project.technologies.length - 3}
                     </Badge>
                  )}
               </div>
            </CardContent>

            {/* Footer Section - Improved Structure */}
            <CardFooter className="p-4 pt-0 mt-auto">
               <div className="w-full space-y-3">
                  {/* Divider */}
                  <div className="h-px bg-border" aria-hidden="true" />

                  {/* Author Row */}
                  <div className="flex items-center gap-3">
                     <ClientAvatar
                        src={project.avatar}
                        alt={`Avatar de ${project.author}`}
                        fallback={project.author?.charAt(0)?.toUpperCase() || 'U'}
                     />
                     <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" title={project.author}>
                           {project.author}
                        </p>
                     </div>
                  </div>

                  {/* Metadata Row - Separated for accessibility */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                     {/* Date */}
                     <div className="flex items-center gap-1.5 text-secondary" aria-label={`Publicado el ${formatDate(project.date)}`}>
                        <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
                        <time dateTime={project.date} className="font-medium">{formatDate(project.date)}</time>
                     </div>

                     {/* Stats */}
                     <div className="flex items-center gap-3">
                        {/* Likes */}
                        {typeof project.likes === 'number' && (
                           <div className="flex items-center gap-1" aria-label={`${project.likes} me gusta`}>
                              <Heart className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{project.likes}</span>
                           </div>
                        )}

                        {/* Comments */}
                        {project.comments && project.comments.length > 0 && (
                           <div className="flex items-center gap-1" aria-label={`${project.comments.length} comentarios`}>
                              <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>{project.comments.length}</span>
                           </div>
                        )}
                     </div>
                  </div>

                  {/* View More - Always visible on mobile, hover on desktop */}
                  <div className="flex items-center justify-end text-primary text-sm font-medium md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                     <span>Ver proyecto</span>
                     <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </div>
               </div>
            </CardFooter>
         </Card>
      </Link>
   );
}