import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Project } from '@/lib/types';
import { ArrowRight, Leaf } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <Link href={`/projects/${project.id}`} className="group block h-full">
        <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:shadow-2xl group-hover:-translate-y-2">
          <CardHeader className="p-0">
             <div className="relative">
                <Image
                    src={project.images[0]}
                    alt={project.title}
                    width={400}
                    height={250}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                    data-ai-hint="project screenshot technology"
                />
                {project.isEco && (
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-accent/90 text-accent-foreground">
                        <Leaf className="mr-2 h-4 w-4" />
                        Ecológico
                    </Badge>
                )}
             </div>
             <div className="p-6 pb-0">
                <Badge variant="outline" className="mb-2">{project.category}</Badge>
                <CardTitle className="text-xl font-headline leading-tight">{project.title}</CardTitle>
             </div>
          </CardHeader>
          <CardContent className="pt-4 text-sm text-muted-foreground flex-grow">
             <p className="line-clamp-3">{project.description}</p>
             <div className="mt-4 flex flex-wrap gap-2">
                {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary">{tech}</Badge>
                ))}
             </div>
          </CardContent>
          <CardFooter className="flex justify-between items-center mt-auto">
             <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={project.avatar} alt={project.author} />
                    <AvatarFallback>{project.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="text-sm font-medium">{project.author}</p>
                    <p className="text-xs text-muted-foreground">{project.date}</p>
                </div>
             </div>
             <div className="flex items-center text-primary opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                Ver <ArrowRight className="ml-1 h-4 w-4" />
             </div>
          </CardFooter>
        </Card>
    </Link>
  );
}
