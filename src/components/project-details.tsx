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
import {
  ThumbsUp,
  MessageCircle,
  Leaf,
  Link,
  Edit,
  Trash2,
  Calendar,
  Eye,
  Share2,
  ArrowLeft,
  Bot,
  Sparkles,
  Send,
  User,
  Github,
  Globe,
  FileText,
  AlertCircle,
  CheckCircle2,
  Copy,
  Heart,
  GraduationCap
} from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot, orderBy, doc, updateDoc, increment, arrayUnion, arrayRemove, setDoc, deleteDoc } from 'firebase/firestore';
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
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Check if current user is the author
  const isAuthor = user && (
    (project.authors && project.authors.includes(user.email!)) ||
    (project.authorId && project.authorId === user.uid)
  );

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
  }, [project.id, user]);

  // View Counter
  useEffect(() => {
    const incrementView = async () => {
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

    setIsSubmittingComment(true);
    try {
      await addDoc(collection(db, 'comments'), {
        projectId: project.id,
        text: newComment,
        author: user.displayName || 'Anónimo',
        authorPhotoURL: user.photoURL || 'https://placehold.co/40x40.png',
        createdAt: serverTimestamp(),
        parentId: null,
      });

      setNewComment('');
      toast({
        title: "Comentario publicado",
        description: "Tu comentario se ha publicado correctamente.",
      });
    } catch (error) {
      console.error("Error posting comment:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleReplySubmit = async (parentCommentId: string) => {
    if (!replyText.trim() || !user) return;

    setIsSubmittingReply(true);
    try {
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
      toast({
        title: "Respuesta publicada",
        description: "Tu respuesta se ha publicado correctamente.",
      });
    } catch (error) {
      console.error("Error posting reply:", error);
      toast({
        title: "Error",
        description: "No se pudo publicar la respuesta. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleLike = async () => {
    if (!user || !project.authorId) return;

    try {
      const projectRef = doc(db, "projects", project.id);

      if (hasLiked) {
        // Unlike
        await updateDoc(projectRef, {
          likes: increment(-1),
          likedBy: arrayRemove(user.uid),
        });
        setHasLiked(false);
        setLikes(prev => prev - 1);
        toast({
          title: "Ya no te gusta",
          description: "Has quitado tu like de este proyecto.",
        });
      } else {
        // Like
        await updateDoc(projectRef, {
          likes: increment(1),
          likedBy: arrayUnion(user.uid),
        });
        setHasLiked(true);
        setLikes(prev => prev + 1);

        // Badge logic (only on like)
        const authorProjectsQuery = query(collection(db, "projects"), where("authors", "array-contains", project.author));
        const authorProjectsSnapshot = await getDocs(authorProjectsQuery);

        let totalLikes = 0;
        authorProjectsSnapshot.forEach(doc => {
          totalLikes += doc.data().likes || 0;
        });

        if (totalLikes >= 10) {
          await setDoc(doc(db, "users", project.authorId, "badges", "10-likes"), { unlockedAt: new Date() });
        }

        // Send Notification if not self-like
        if (project.authorId && project.authorId !== user.uid) {
          await addDoc(collection(db, 'notifications'), {
            recipientId: project.authorId,
            type: 'like',
            title: 'Nuevo Me gusta',
            message: `${user.displayName || 'Alguien'} le dio me gusta a tu proyecto "${project.title}"`,
            avatar: user.photoURL || 'https://placehold.co/40x40.png',
            read: false,
            createdAt: serverTimestamp(),
            topicId: project.id // Link to project
          });
        }

        toast({
          title: "¡Me gusta!",
          description: "Has dado like a este proyecto.",
        });
      }
    } catch (error) {
      console.error("Error liking project:", error);
      toast({
        title: "Error",
        description: "No se pudo dar like. Inténtalo de nuevo.",
        variant: "destructive",
      });
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
      toast({
        title: "Resumen generado",
        description: "El resumen con IA se ha generado correctamente.",
      });
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
    router.push(`/projects/edit/${project.id}`);
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "¡Enlace copiado!",
      description: "El enlace del proyecto se ha copiado al portapapeles.",
      duration: 3000,
    });
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

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'hace un momento';
    if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`;
    if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`;
    if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;

    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="container pt-24 pb-10 px-4">
      {/* Back Button with better visibility */}
      <AnimatedWrapper>
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6 hover:bg-accent group"
        >
          <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Volver a proyectos
        </Button>
      </AnimatedWrapper>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <AnimatedWrapper>
            <Card className="overflow-hidden shadow-lg">
              {/* Hero Image with better interaction */}
              <div className="relative group">
                <Image
                  src={project.imageUrls[0] || 'https://placehold.co/1200x675.png'}
                  alt={project.title}
                  width={1200}
                  height={675}
                  className="w-full aspect-video object-cover cursor-pointer transition-transform group-hover:scale-[1.02]"
                  onClick={() => setSelectedImage(project.imageUrls[0])}
                  priority
                />
                {/* Overlay gradient for better badge readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

                {/* Badges with better contrast */}
                <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                  <Badge className="bg-background/95 backdrop-blur-md text-foreground shadow-lg border border-border/50 font-medium">
                    {project.category}
                  </Badge>
                  {project.isEco && (
                    <Badge className="bg-green-600/95 backdrop-blur-md text-white shadow-lg border border-green-500/30 font-medium">
                      <Leaf className="mr-1.5 h-3.5 w-3.5" />
                      Ecológico
                    </Badge>
                  )}
                </div>

                {/* View counter badge */}
                <div className="absolute bottom-4 right-4">
                  <Badge className="bg-background/95 backdrop-blur-md text-foreground shadow-lg border border-border/50">
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    {project.views || 0} vistas
                  </Badge>
                </div>
              </div>

              <CardHeader className="space-y-4 pb-4">
                <div className="flex flex-col gap-4">
                  {/* Title and metadata */}
                  <div className="space-y-3">
                    <CardTitle className="text-3xl md:text-4xl font-headline leading-tight">
                      {project.title}
                    </CardTitle>

                    {/* Stats bar with icons */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-4 w-4 text-primary" />
                        {formatDate(project.date || project.createdAt)}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Heart className={`h-4 w-4 ${hasLiked ? 'text-red-500 fill-red-500' : 'text-primary'}`} />
                        {likes} {likes === 1 ? 'like' : 'likes'}
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <MessageCircle className="h-4 w-4 text-primary" />
                        {comments.length} {comments.length === 1 ? 'comentario' : 'comentarios'}
                      </span>
                    </div>

                    {/* AI Summary Section with better UX */}
                    {!aiSummary ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 text-primary hover:bg-primary/10 border-primary/30 hover:border-primary/50 w-fit group transition-all"
                        onClick={handleGenerateSummary}
                        disabled={isGeneratingSummary}
                      >
                        {isGeneratingSummary ? (
                          <>
                            <Bot className="mr-2 h-4 w-4 animate-pulse" />
                            Generando resumen...
                          </>
                        ) : (
                          <>
                            <Sparkles className="mr-2 h-4 w-4 transition-transform group-hover:rotate-12" />
                            Generar resumen con IA
                          </>
                        )}
                      </Button>
                    ) : (
                      <div className="mt-2 p-4 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-2 border-primary/20 rounded-xl animate-in fade-in slide-in-from-top-3 duration-500 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-primary font-semibold text-sm">Resumen Inteligente</p>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed pl-10">{aiSummary}</p>
                      </div>
                    )}
                  </div>

                  {/* Author Actions - Better positioned */}
                  {isAuthor && (
                    <div className="flex gap-2 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleEdit}
                        className="hover:bg-primary/10 hover:text-primary hover:border-primary/50"
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Description with better typography */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Descripción del Proyecto
                  </h3>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-foreground/80 leading-relaxed whitespace-pre-line">
                      {project.description}
                    </p>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Technologies with better visual hierarchy */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Tecnologías Utilizadas
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.map((tech) => (
                      <Badge
                        key={tech}
                        className="transition-colors px-3 py-1.5 font-medium"
                      >
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Gallery with lightbox */}
                {project.imageUrls.length > 1 && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <Eye className="h-5 w-5 text-primary" />
                        Galería de Imágenes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {project.imageUrls.slice(1).map((url, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-transparent hover:border-primary/30 transition-all"
                            onClick={() => setSelectedImage(url)}
                          >
                            <Image
                              src={url}
                              alt={`${project.title} - Imagen ${index + 2}`}
                              width={400}
                              height={300}
                              className="rounded-lg object-cover w-full aspect-video group-hover:scale-110 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Eye className="h-8 w-8 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* PDF Report with better presentation */}
                {project.developmentPdfUrl && (
                  <>
                    <Separator className="my-6" />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-primary" />
                          Informe de Desarrollo
                        </h3>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <a href={project.developmentPdfUrl} target="_blank" rel="noopener noreferrer">
                            Abrir en nueva pestaña
                          </a>
                        </Button>
                      </div>
                      <div className="w-full h-[600px] rounded-lg overflow-hidden border-2 shadow-inner bg-muted/30">
                        <iframe
                          src={project.developmentPdfUrl}
                          width="100%"
                          height="100%"
                          className="bg-white"
                          title="Informe de desarrollo"
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Comments Section with improved UX */}
          <AnimatedWrapper delay={200}>
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <MessageCircle className="h-6 w-6 text-primary" />
                  Comentarios
                  <span className="text-lg text-muted-foreground font-normal">
                    ({comments.length})
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Comment Form with better visual feedback */}
                {user ? (
                  <div className="space-y-4 p-4 rounded-lg border-2 border-dashed border-muted-foreground/20 bg-muted/30">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 border-2 border-primary/20">
                        <AvatarImage src={user.photoURL || 'https://placehold.co/40x40.png'} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {user.displayName?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <Textarea
                          placeholder="Comparte tu opinión, sugerencias o preguntas sobre este proyecto..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                          disabled={isSubmittingComment}
                          className="resize-none focus-visible:ring-primary"
                        />
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground">
                            {newComment.length > 0 && `${newComment.length} caracteres`}
                          </p>
                          <Button
                            onClick={handleCommentSubmit}
                            disabled={!newComment.trim() || isSubmittingComment}
                            size="sm"
                            className="gap-2"
                          >
                            {isSubmittingComment ? (
                              <>Publicando...</>
                            ) : (
                              <>
                                <Send className="h-4 w-4" />
                                Publicar comentario
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg p-6 text-center border-2 border-dashed border-muted-foreground/20">
                    <MessageCircle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground mb-3">
                      Inicia sesión para participar en la conversación
                    </p>
                    <Button
                      variant="default"
                      onClick={() => router.push('/login')}
                      className="gap-2"
                    >
                      <User className="h-4 w-4" />
                      Iniciar sesión
                    </Button>
                  </div>
                )}

                <Separator />

                {/* Comments List with better styling */}
                <div className="space-y-4">
                  {comments.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg font-medium mb-2">
                        Aún no hay comentarios
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ¡Sé el primero en compartir tu opinión!
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Parent comments */}
                      {comments.filter(c => !c.parentId).map(comment => (
                        <div key={comment.id} className="space-y-3 animate-in fade-in slide-in-from-left-2">
                          {/* Parent comment with better visual hierarchy */}
                          <div className="flex gap-4 p-4 bg-muted/40 rounded-lg border border-border/50 hover:border-primary/30 transition-colors">
                            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                              <AvatarImage src={comment.authorPhotoURL || 'https://placehold.co/40x40.png'} alt={comment.author} />
                              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                {comment.author.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-semibold text-foreground">{comment.author}</p>
                                <span className="text-xs text-muted-foreground">
                                  {comment.createdAt && formatRelativeTime(comment.createdAt)}
                                </span>
                              </div>
                              <p className="text-foreground/90 leading-relaxed">{comment.text}</p>
                              {user && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-xs hover:bg-primary/10 hover:text-primary"
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                >
                                  <MessageCircle className="h-3 w-3 mr-1.5" />
                                  {replyingTo === comment.id ? 'Cancelar' : 'Responder'}
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Reply form with better UX */}
                          {replyingTo === comment.id && user && (
                            <div className="ml-12 flex gap-3 items-start p-4 bg-primary/5 rounded-lg border-2 border-primary/20 animate-in fade-in slide-in-from-top-2">
                              <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                                <AvatarImage src={user.photoURL || 'https://placehold.co/40x40.png'} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {user.displayName?.charAt(0) || 'U'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-2">
                                <Textarea
                                  placeholder={`Responder a ${comment.author}...`}
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  rows={2}
                                  className="text-sm resize-none focus-visible:ring-primary"
                                  disabled={isSubmittingReply}
                                  autoFocus
                                />
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                    disabled={isSubmittingReply}
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleReplySubmit(comment.id)}
                                    disabled={!replyText.trim() || isSubmittingReply}
                                    className="gap-2"
                                  >
                                    {isSubmittingReply ? (
                                      <>Enviando...</>
                                    ) : (
                                      <>
                                        <Send className="h-3 w-3" />
                                        Responder
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Replies with better visual connection */}
                          {comments.filter(reply => reply.parentId === comment.id).map(reply => (
                            <div key={reply.id} className="ml-12 flex gap-3 p-3 bg-muted/30 rounded-lg border-l-4 border-primary/40 animate-in fade-in slide-in-from-left-2">
                              <Avatar className="h-8 w-8 border-2 border-background shadow-sm">
                                <AvatarImage src={reply.authorPhotoURL || 'https://placehold.co/40x40.png'} alt={reply.author} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                  {reply.author.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-semibold text-sm">{reply.author}</p>
                                  <span className="text-xs text-muted-foreground">
                                    {reply.createdAt && formatRelativeTime(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-foreground/90 text-sm leading-relaxed">{reply.text}</p>
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

        {/* Sidebar with improved card designs */}
        <div className="space-y-6">
          {/* Author Card with better presentation */}
          <AnimatedWrapper delay={100}>
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  {project.author && project.author.includes(',') ? 'Creadores del Proyecto' : 'Creador del Proyecto'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 p-3 bg-gradient-to-br from-primary/5 to-transparent rounded-lg">
                  {/* Avatar único */}
                  <Avatar className="h-16 w-16 border-4 border-primary/20 shadow-md shrink-0">
                    <AvatarImage src={project.avatar} alt={project.author} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                      {project.author?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>

                  {/* Lista de emails */}
                  <div className="flex-1 min-w-0 space-y-2">
                    {project.author && project.author.includes(',') ? (
                      // Múltiples autores
                      project.author.split(',').map((email, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          <p className="text-sm text-foreground font-medium truncate" title={email.trim()}>
                            {email.trim()}
                          </p>
                        </div>
                      ))
                    ) : (
                      // Un solo autor
                      <>
                        <p className="text-base font-semibold text-foreground truncate" title={project.author}>
                          {project.author}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <GraduationCap className="h-3.5 w-3.5" />
                          Estudiante UIDE
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Stats Card */}
          <AnimatedWrapper delay={150}>
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Información
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Publicado</span>
                  <span className="font-semibold text-foreground">{formatDate(project.date || project.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Visualizaciones
                  </span>
                  <span className="font-semibold text-foreground">{project.views || 0}</span>
                </div>
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Like Button Card with better interaction */}
          <AnimatedWrapper delay={200}>
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  ¿Te gustó?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className={`w-full h-12 gap-2 font-semibold transition-all ${hasLiked
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'hover:scale-105'
                    }`}
                  onClick={handleLike}
                  disabled={!user}
                  variant={hasLiked ? "default" : "default"}
                >
                  <Heart className={`h-5 w-5 ${hasLiked ? 'fill-current animate-pulse' : ''}`} />
                  {hasLiked ? '¡Ya te gusta!' : `${Math.max(0, likes)} Me gusta`}
                </Button>
                {!user && (
                  <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg border border-dashed">
                    <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-xs text-muted-foreground">
                      Inicia sesión para dar like a este proyecto
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedWrapper>

          {/* Resources Card with better icons */}
          {(project.website || project.githubRepo) && (
            <AnimatedWrapper delay={300}>
              <Card className="shadow-lg border-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Link className="h-5 w-5 text-primary" />
                    Enlaces
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.website && (
                    <a href={project.website} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all group">
                        <Globe className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                        Ver sitio web
                      </Button>
                    </a>
                  )}
                  {project.githubRepo && (
                    <a href={project.githubRepo} target="_blank" rel="noopener noreferrer" className="block">
                      <Button variant="outline" className="w-full justify-start h-11 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all group">
                        <Github className="mr-2 h-5 w-5 transition-transform group-hover:rotate-12" />
                        Ver en GitHub
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            </AnimatedWrapper>
          )}

          {/* Share Card with better feedback */}
          <AnimatedWrapper delay={400}>
            <Card className="shadow-lg border-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Compartir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  className="w-full h-11 hover:bg-primary/10 hover:text-primary hover:border-primary/50 transition-all group gap-2"
                  onClick={handleShare}
                >
                  <Copy className="h-4 w-4 transition-transform group-hover:scale-110" />
                  Copiar enlace
                </Button>
              </CardContent>
            </Card>
          </AnimatedWrapper>
        </div>
      </div>

      {/* Image Lightbox */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden">
            <div className="relative w-full h-[80vh]">
              <Image
                src={selectedImage}
                alt="Vista ampliada"
                fill
                className="object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog with better UX */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <DialogTitle className="text-xl">¿Eliminar proyecto?</DialogTitle>
            </div>
            <DialogDescription className="text-base leading-relaxed pt-2">
              Esta acción <span className="font-semibold text-foreground">no se puede deshacer</span>.
              El proyecto <span className="font-semibold text-foreground">"{project.title}"</span> y
              todos sus comentarios serán eliminados permanentemente.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 gap-2"
            >
              {isDeleting ? (
                <>Eliminando...</>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Eliminar proyecto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}