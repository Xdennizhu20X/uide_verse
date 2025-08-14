'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ThumbsUp, MessageCircle, Leaf, Link } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy, doc, updateDoc, increment, arrayUnion } from 'firebase/firestore';
import type { Project, Comment } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

interface ProjectDetailsProps {
  project: Project;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(project.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);

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

    if (user) {
      const projectRef = doc(db, "projects", project.id);
      const unsub = onSnapshot(projectRef, (doc) => {
        const data = doc.data();
        if (data && data.likedBy && data.likedBy.includes(user.uid)) {
          setHasLiked(true);
        }
        setLikes(data?.likes || 0);
      });
      return () => unsub();
    }

    return () => unsubscribe();
  }, [project.id, user]);

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

  const handleLike = async () => {
    if (!user) return;

    const projectRef = doc(db, "projects", project.id);
    await updateDoc(projectRef, {
      likes: increment(1),
      likedBy: arrayUnion(user.uid),
    });
  };

  return (
    <div className="container py-12 md:py-16">
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnimatedWrapper>
            <Card className="mb-8">
                <Image
                  src={project.imageUrls[0]}
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
                <Separator className="my-6" />
                <h3 className="font-semibold mb-4">Galería de Imágenes</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {project.imageUrls.slice(1).map((url, index) => (
                    <Image
                      key={index}
                      src={url}
                      alt={`${project.title} - Imagen ${index + 2}`}
                      width={400}
                      height={300}
                      className="rounded-lg object-cover w-full aspect-video"
                    />
                  ))}
                </div>
                {project.developmentPdfUrl && (
                  <>
                    <Separator className="my-6" />
                    <h3 className="font-semibold mb-4">Informe de Desarrollo</h3>
                    <div className="w-full h-[800px]">
                      <iframe src={project.developmentPdfUrl} width="100%" height="100%" className="rounded-md border" />
                    </div>
                  </>
                )}
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
          {(project.website || project.githubRepo) && (
          <AnimatedWrapper delay={300}>
            <Card>
              <CardHeader>
                <CardTitle>Recursos Adicionales</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                {project.website && (
                  <a href={project.website} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <Link className="mr-2 h-4 w-4" />
                      Página Web
                    </Button>
                  </a>
                )}
                {project.githubRepo && (
                  <a href={project.githubRepo} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <svg className="mr-2 h-4 w-4" viewBox="0 0 16 16" version="1.1" aria-hidden="true"><path fill-rule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path></svg>
                      Repositorio de GitHub
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>
          )}

          <AnimatedWrapper delay={300}>
            <Card>
              <CardHeader>
                <CardTitle>Dar Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">¿Te ha resultado útil este proyecto?</p>
                <Button className="w-full" onClick={handleLike} disabled={hasLiked}>
                  <ThumbsUp className="mr-2 h-4 w-4" /> {likes} Me gusta el Proyecto
                </Button>
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
      </div>
    </div>
  );
}
