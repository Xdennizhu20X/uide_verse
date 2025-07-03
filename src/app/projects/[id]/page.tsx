import { projects } from '@/lib/data';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, MessageCircle, Leaf } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const project = projects.find(p => p.id === params.id);

  if (!project) {
    notFound();
  }

  return (
    <div className="container py-12 md:py-16">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatedWrapper>
            <Card className="mb-8">
                <Image
                  src={project.images[0]}
                  alt={project.title}
                  width={1200}
                  height={675}
                  className="rounded-t-lg object-cover w-full aspect-video"
                   data-ai-hint="project screenshot technology"
                />
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 mb-2">
                      <Badge>{project.category}</Badge>
                      {project.isEco && (
                        <Badge variant="secondary" className="bg-accent/90 text-accent-foreground">
                          <Leaf className="mr-2 h-4 w-4" />
                          Ecológico
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-4xl font-headline">{project.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{project.description}</p>
                <Separator className="my-6" />
                <h3 className="font-semibold mb-4">Tecnologías Utilizadas</h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech) => (
                    <Badge key={tech} variant="secondary">{tech}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          <AnimatedWrapper delay={200}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-6 w-6" />
                  Comentarios y Sugerencias
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src="https://placehold.co/40x40.png" />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <Textarea placeholder="Añade tu comentario o sugerencia..." />
                  </div>
                  <div className="flex justify-end">
                    <Button>Publicar Comentario</Button>
                  </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-6">
                  {project.comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={`https://placehold.co/40x40.png`} alt={comment.author} />
                        <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{comment.author}</p>
                        <p className="text-sm text-muted-foreground">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </div>

        <div className="lg:col-span-1 space-y-8">
          <AnimatedWrapper delay={100}>
            <Card>
              <CardHeader>
                <CardTitle>Autor</CardTitle>
              </CardHeader>
              <CardContent className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={project.avatar} alt={project.author} />
                  <AvatarFallback>{project.author.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-lg">{project.author}</p>
                  <p className="text-sm text-muted-foreground">Publicado el {project.date}</p>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
          <AnimatedWrapper delay={300}>
            <Card>
              <CardHeader>
                <CardTitle>Dar Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">¿Te ha resultado útil este proyecto?</p>
                <Button className="w-full">
                  <ThumbsUp className="mr-2 h-4 w-4" /> Me gusta el Proyecto
                </Button>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </div>
      </div>
    </div>
  );
}
