'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, MessageCircle, Leaf } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy } from 'firebase/firestore';
import type { Project, Comment } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

interface ProjectDetailsProps {
  project: Project;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'comments'), where('projectId', '==', project.id), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedComments: Comment[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedComments.push({
          id: doc.id,
          author: data.author,
          text: data.text,
          createdAt: data.createdAt?.toDate(),
          authorPhotoURL: data.authorPhotoURL,
        });
      });
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [project.id]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user) return;

    await addDoc(collection(db, 'comments'), {
      projectId: project.id,
      text: newComment,
      author: user.displayName || 'Anónimo',
      authorPhotoURL: user.photoURL || 'https://placehold.co/40x40.png',
      createdAt: serverTimestamp(),
    });

    setNewComment('');
  };

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
                {user ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={user.photoURL || 'https://placehold.co/40x40.png'} />
                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <Textarea 
                        placeholder="Añade tu comentario o sugerencia..." 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleCommentSubmit} disabled={!newComment.trim()}>Publicar Comentario</Button>
                    </div>
                  </div>
                ) : (
                  <p className='text-muted-foreground'>Debes iniciar sesión para dejar un comentario.</p>
                )}
                <Separator className="my-6" />
                <div className="space-y-6">
                  {comments.map(comment => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar>
                        <AvatarImage src={comment.authorPhotoURL || `https://placehold.co/40x40.png`} alt={comment.author} />
                        <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-2">
                            <p className="font-semibold">{comment.author}</p>
                            <p className="text-xs text-muted-foreground">
                                {comment.createdAt?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>
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
