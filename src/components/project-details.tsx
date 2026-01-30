'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ThumbsUp, MessageCircle, Leaf, Link, Edit, Trash2, Calendar, Eye, Share2, ArrowLeft, Bot, Sparkles } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy, doc, updateDoc, increment, arrayUnion, setDoc, deleteDoc } from 'firebase/firestore';
import type { Project, Comment } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { summarizeProject } from '@/app/actions/summarize';
import { useToast } from '@/hooks/use-toast';

interface ProjectDetailsProps {
  project: Project;
}

export function ProjectDetails({ project }: ProjectDetailsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [likes, setLikes] = useState(project.likes || 0);
  const [hasLiked, setHasLiked] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [aiSummary, setAiSummary] = useState('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // Check if current user is the author
  const isAuthor = user?.email && project.author?.includes(user.email);

  useEffect(() => {
    // Comments listener
    const commentsQuery = query(
      collection(db, 'comments'),
      where('projectId', '==', project.id),
      orderBy('createdAt', 'asc')
    );

    const unsubscribeComments = onSnapshot(commentsQuery, (querySnapshot) => {
      const fetchedComments: Comment[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedComments.push({
          id: docSnap.id,
          author: data.author,
          text: data.text,
          createdAt: data.createdAt?.toDate(),
          authorPhotoURL: data.authorPhotoURL,
          parentId: data.parentId || null,
        });
      });
      setComments(fetchedComments);
    }, (error) => {
      console.error("Error fetching comments:", error);
    });

    return () => unsubscribeComments();
  }, [project.id]);

  // Separate useEffect for likes
  useEffect(() => {
    if (!user) return;

    const projectRef = doc(db, "projects", project.id);
    const unsubscribeLikes = onSnapshot(projectRef, (docSnap) => {
      const data = docSnap.data();
      if (data && data.likedBy && data.likedBy.includes(user.uid)) {
        setHasLiked(true);
      }
      setLikes(data?.likes || 0);
    }, (error) => {
      console.error("Error fetching project likes:", error);
    });

    return () => unsubscribeLikes();
    return () => unsubscribeLikes();
  }, [project.id, user]);

  // View Counter
  useEffect(() => {
    const incrementView = async () => {
      // Simple check to prevent counting same session multiple times could be added here
      // For now, just increment on load
      try {
        const projectRef = doc(db, 'projects', project.id);
        await updateDoc(projectRef, {
          views: increment(1)
        });
      } catch (error) {
        console.error("Error incrementing views:", error);
      }
    };

    incrementView();
  }, [project.id]);

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !user) return;

    await addDoc(collection(db, 'comments'), {
      projectId: project.id,
      text: newComment,
      author: user.displayName || 'Anónimo',
      authorPhotoURL: user.photoURL || 'https://placehold.co/40x40.png',
      createdAt: serverTimestamp(),
      parentId: null,
    });

    setNewComment('');
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    if (!replyText.trim() || !user) return;

    await addDoc(collection(db, 'comments'), {
      projectId: project.id,
      text: replyText,
      author: user.displayName || 'Anónimo',
      authorPhotoURL: user.photoURL || 'https://placehold.co/40x40.png',
      createdAt: serverTimestamp(),
      parentId: parentCommentId,
    });

    setReplyText('');
    setReplyingTo(null);
  };

  const handleLike = async () => {
    if (!user || !project.authorId) return;

    const projectRef = doc(db, "projects", project.id);
    await updateDoc(projectRef, {
      likes: increment(1),
      likedBy: arrayUnion(user.uid),
    });

    const authorProjectsQuery = query(collection(db, "projects"), where("authors", "array-contains", project.author));
    const authorProjectsSnapshot = await getDocs(authorProjectsQuery);

    let totalLikes = 0;
    authorProjectsSnapshot.forEach(doc => {
      totalLikes += doc.data().likes || 0;
    });

    if (totalLikes >= 10) {
      await setDoc(doc(db, "users", project.authorId, "badges", "10-likes"), { unlockedAt: new Date() });
    }
  };

  const handleGenerateSummary = async () => {
    setIsGeneratingSummary(true);
    try {
      const summary = await summarizeProject({
        title: project.title,
        description: project.description,
        technologies: project.technologies,
        category: project.category,
        author: project.author || 'Desconocido'
      });
      setAiSummary(summary);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo generar el resumen.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleEdit = () => {
    router.push(`/submit-project?edit=${project.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Delete the project
      await deleteDoc(doc(db, 'projects', project.id));

      // Delete associated comments
      const commentsQuery = query(collection(db, 'comments'), where('projectId', '==', project.id));
      const commentsSnapshot = await getDocs(commentsQuery);
      commentsSnapshot.forEach(async (commentDoc) => {
        await deleteDoc(doc(db, 'comments', commentDoc.id));
      });

      toast({
        title: "Proyecto eliminado",
        description: "El proyecto ha sido eliminado correctamente.",
      });

      router.push('/projects');
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el proyecto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-EC', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="container py-8 md:py-12">
      {/* Back Button */}
      <AnimatedWrapper>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </AnimatedWrapper>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatedWrapper>
            <Card className="overflow-hidden">
              {/* Hero Image */}
              <div className="relative">
                <Image
                  src={project.imageUrls[0] || 'https://placehold.co/1200x675.png'}
                  alt={project.title}
                  width={1200}
                  height={675}
                  className="w-full aspect-video object-cover"
                />
                {/* Overlay badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  <Badge className="bg-card/90 backdrop-blur-sm text-foreground shadow-md">
                    {project.category}
                  </Badge>
                  {project.isEco && (
                    <Badge className="bg-green-600/90 backdrop-blur-sm text-white shadow-md">
                      <Leaf className="mr-1 h-3 w-3" />
                      Ecológico
                    </Badge>
                  )}
                </div>
              </div>

              <CardHeader className="pb-4">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="space-y-2">
                    <CardTitle className="text-3xl md:text-4xl font-headline leading-tight">
                      {project.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(project.date || project.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {likes} likes
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-4 w-4" />
                        {comments.length} comentarios
                      </span>
                    </div>

                    {/* AI Summary Section */}
                    {!aiSummary ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 text-primary hover:bg-primary/10 border border-primary/20 w-fit"
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                      >
                        {isGeneratingSummary ? (
                          <>Generando resumen...</>
                        ) : (
                          <><Sparkles className="mr-2 h-4 w-4" /> Generar Resumen con IA</>
                        )}
                      </Button>
                    ) : (
                      <div className="mt-2 p-3 bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 mb-1 text-primary font-semibold text-sm">
                          <Bot className="h-4 w-4" /> Resumen Inteligente
                        </div>
                        <p className="text-sm italic text-foreground/90 leading-relaxed">{aiSummary}</p>
                      </div>
                    )}
                  </div>

                  {/* Author Actions */}
                  {isAuthor && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeleteDialogOpen(true)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Descripción del Proyecto</h3>
                  <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                    {project.description}
                  </p>
                </div>

                <Separator />

                {/* Technologies */}
                <div>
                  <h3 className="font-semibold text-lg mb-3">Tecnologías Utilizadas</h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge
                        key={tech}
                        className="bg-secondary text-white border-secondary"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Gallery */}
                {project.imageUrls.length > 1 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Galería de Imágenes</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {project.imageUrls.slice(1).map((url, index) => (
                          <Image
                            key={index}
                            src={url}
                            alt={`${project.title} - Imagen ${index + 2}`}
                            width={400}
                            height={300}
                            className="rounded-lg object-cover w-full aspect-video hover:scale-105 transition-transform cursor-pointer"
                          />
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* PDF Report */}
                {project.developmentPdfUrl && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Informe de Desarrollo</h3>
                      <div className="w-full h-[600px] rounded-lg overflow-hidden border">
                        <iframe
                          src={project.developmentPdfUrl}
                          width="100%"
                          height="100%"
                          className="bg-white"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Comments Section */}
          <AnimatedWrapper delay={200}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  Comentarios ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comment Form */}
                {user ? (
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.photoURL || 'https://placehold.co/40x40.png'} />
                        <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Añade tu comentario o sugerencia..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button onClick={handleCommentSubmit} disabled={!newComment.trim()}>
                        Publicar Comentario
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-muted/50 rounded-lg p-4 text-center">
                    <p className='text-muted-foreground'>
                      <Button variant="link" onClick={() => router.push('/login')}>
                        Inicia sesión
                      </Button>
                      para dejar un comentario.
                    </p>
                  </div>
                )}

                <Separator />

                {/* Comments List */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <p className="text-center text-muted-foreground py-6">
                      Aún no hay comentarios. ¡Sé el primero en comentar!
                    </p>
                  ) : (
                    <>
                      {/* Parent comments (no parentId) */}
                      {comments.filter(c => !c.parentId).map(comment => (
                        <div key={comment.id} className="space-y-3">
                          {/* Parent comment */}
                          <div className="flex gap-4 p-4 bg-muted/30 rounded-lg">
                            <Avatar className="h-10 w-10">
                              <AvatarImage src={comment.authorPhotoURL || 'https://placehold.co/40x40.png'} alt={comment.author} />
                              <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold">{comment.author}</p>
                                <span className="text-xs text-muted-foreground">
                                  {comment.createdAt?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                              </div>
                              <p className="text-foreground/80">{comment.text}</p>
                              {user && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-xs h-7 px-2"
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1" />
                                  Responder
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Reply form */}
                          {replyingTo === comment.id && user && (
                            <div className="ml-12 flex gap-3 items-start">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.photoURL || 'https://placehold.co/40x40.png'} />
                                <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <Textarea
                                  placeholder={`Responder a ${comment.author}...`}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReplySubmit(comment.id)}
                                    disabled={!replyText.trim()}
                                  >
                                    Responder
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Replies to this comment */}
                          {comments.filter(reply => reply.parentId === comment.id).map(reply => (
                            <div key={reply.id} className="ml-12 flex gap-3 p-3 bg-muted/20 rounded-lg border-l-2 border-primary/30">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={reply.authorPhotoURL || 'https://placehold.co/40x40.png'} alt={reply.author} />
                                <AvatarFallback>{reply.author.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="font-semibold text-sm">{reply.author}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {reply.createdAt?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </span>
                                </div>
                                <p className="text-foreground/80 text-sm">{reply.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Card */}
          <AnimatedWrapper delay={100}>
            <Card>
              <CardHeader>
                <CardTitle>Autor</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-primary">
                    <AvatarImage src={project.avatar} alt={project.author} />
                    <AvatarFallback>{project.author?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{project.author}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Publication Date */}
          <AnimatedWrapper delay={150}>
            <Card>
              <CardHeader>
                <CardTitle>Fecha de Publicación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 text-lg">
                  <Calendar className="h-5 w-5 text-secondary" />
                  <span className="font-medium text-secondary">{formatDate(project.date || project.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Like Button */}
          <AnimatedWrapper delay={200}>
            <Card>
              <CardHeader>
                <CardTitle>¿Te gustó este proyecto?</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={handleLike}
                  disabled={hasLiked || !user}
                  variant={hasLiked ? "secondary" : "default"}
                >
                  <ThumbsUp className={`mr-2 h-4 w-4 ${hasLiked ? 'fill-current' : ''}`} />
                  {hasLiked ? 'Ya te gusta' : `${likes} Me gusta`}
                </Button>
                {!user && (
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Inicia sesión para dar like
                  </p>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Resources */}
          {(project.website || project.githubRepo) && (
            <AnimatedWrapper delay={300}>
              <Card>
                <CardHeader>
                  <CardTitle>Recursos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.website && (
                    <a href={project.website} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full justify-start">
                        <Link className="mr-2 h-4 w-4" />
                        Ver Página Web
                      </Button>
                    </a>
                  )}
                  {project.githubRepo && (
                    <a href={project.githubRepo} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" className="w-full justify-start">
                        <svg className="mr-2 h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                          <path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
                        </svg>
                        Ver en GitHub
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            </AnimatedWrapper>
          )}

          {/* Share */}
          <AnimatedWrapper delay={400}>
            <Card>
              <CardHeader>
                <CardTitle>Compartir</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({
                      title: "Enlace copiado",
                      description: "El enlace del proyecto se ha copiado al portapapeles.",
                    });
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Copiar enlace
                </Button>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>¿Eliminar proyecto?</DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. El proyecto "{project.title}" y todos sus comentarios serán eliminados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar proyecto'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
