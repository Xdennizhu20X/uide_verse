'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowLeft, MessageSquare, ThumbsUp, Send, Reply, Clock, User, CornerDownRight, ChevronDown, ChevronUp, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, serverTimestamp, increment, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { ForumTopic, ForumReply } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

// Colores por categoría (consistente con la página anterior)
const tagColors: Record<string, string> = {
    'EcoUide': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'React': 'bg-blue-100 text-blue-700 border-blue-200',
    'Presentación': 'bg-purple-100 text-purple-700 border-purple-200',
    'Discusión': 'bg-amber-100 text-amber-700 border-amber-200',
    'Ayuda': 'bg-rose-100 text-rose-700 border-rose-200',
    'General': 'bg-gray-100 text-gray-700 border-gray-200',
};

// Skeleton para estados de carga
function TopicSkeleton() {
    return (
        <Card className="mb-8">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-muted animate-pulse rounded-full" />
                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                            <div className="h-3 w-24 bg-muted animate-pulse rounded" />
                        </div>
                    </div>
                    <div className="h-6 w-20 bg-muted animate-pulse rounded" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-8 bg-muted animate-pulse rounded w-3/4 mb-4" />
                <div className="space-y-2 mb-6">
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded" />
                    <div className="h-4 bg-muted animate-pulse rounded w-2/3" />
                </div>
            </CardContent>
        </Card>
    );
}

function ReplySkeleton() {
    return (
        <Card>
            <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                    <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                    <div className="flex-1 space-y-2">
                        <div className="h-4 w-32 bg-muted animate-pulse rounded" />
                        <div className="h-3 bg-muted animate-pulse rounded w-full" />
                        <div className="h-3 bg-muted animate-pulse rounded w-3/4" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Reply Form Component - defined outside to prevent re-creation on every render
interface ReplyFormProps {
    replyingTo: ForumReply | null;
    setReplyingTo: (reply: ForumReply | null) => void;
    user: any;
    userData: any;
    newReply: string;
    setNewReply: (value: string) => void;
    isSubmitting: boolean;
    handleAddReply: () => void;
}

const ReplyFormComponent = ({ replyingTo, setReplyingTo, user, userData, newReply, setNewReply, isSubmitting, handleAddReply }: ReplyFormProps) => (
    <AnimatedWrapper className="my-4">
        <Card id="reply-form" className="shadow-md border-2">
            <CardContent className="pt-5">
                {replyingTo && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-muted">
                        <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Reply className="h-4 w-4 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium truncate">
                                    Respondiendo a <span className="text-primary">{replyingTo.author}</span>
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setReplyingTo(null)}
                                className="h-7 text-xs shrink-0"
                            >
                                Cancelar
                            </Button>
                        </div>
                    </div>
                )}

                <div className="space-y-3">
                    <div className="flex items-center gap-3 mb-2">
                        {user && (
                            <Avatar className="h-9 w-9 border-2 border-muted">
                                <AvatarImage src={userData?.photoURL || user.photoURL || undefined} />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                    {(userData?.firstName?.[0] || user.displayName?.[0] || 'U')}
                                </AvatarFallback>
                            </Avatar>
                        )}
                        <h3 className="font-semibold text-base">
                            {replyingTo ? '' : 'Añadir una respuesta'}
                        </h3>
                    </div>

                    <Textarea
                        placeholder={user ? "Comparte tu perspectiva..." : "Inicia sesión para responder"}
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        rows={4}
                        className="resize-none text-base"
                        disabled={!user}
                    />

                    <div className="flex items-center justify-between pt-2">
                        <p className="text-xs text-muted-foreground">
                            {!user && "Debes iniciar sesión para participar"}
                        </p>
                        <Button
                            onClick={handleAddReply}
                            disabled={!newReply.trim() || !user || isSubmitting}
                            className="gap-2 ml-auto"
                            size="default"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                                    Publicando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Publicar Respuesta
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    </AnimatedWrapper>
);

export default function TopicDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userData } = useAuth();
    const { toast } = useToast();
    const topicId = params.id as string;

    const [topic, setTopic] = useState<ForumTopic | null>(null);
    const [replies, setReplies] = useState<ForumReply[]>([]);
    const [newReply, setNewReply] = useState('');
    const [replyingTo, setReplyingTo] = useState<ForumReply | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoadingTopic, setIsLoadingTopic] = useState(true);
    const [isLoadingReplies, setIsLoadingReplies] = useState(true);
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
    const [visibleRepliesCount, setVisibleRepliesCount] = useState(3); // Mostrar solo 3 comentarios inicialmente

    // CRUD states
    const [editingTopic, setEditingTopic] = useState<{ title: string; content: string; tag: string } | null>(null);
    const [editingReply, setEditingReply] = useState<{ id: string; content: string } | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ type: 'topic' | 'reply'; id: string } | null>(null);
    const [isEditingTopic, setIsEditingTopic] = useState(false);
    const [isEditingReply, setIsEditingReply] = useState(false);
    const [isDeletingItem, setIsDeletingItem] = useState(false);

    const tagOptions = ['EcoUide', 'React', 'Presentación', 'Discusión', 'Ayuda', 'General'];

    useEffect(() => {
        if (!topicId) return;

        // Fetch Topic
        const topicRef = doc(db, 'forum_topics', topicId);
        const unsubscribeTopic = onSnapshot(topicRef, (doc) => {
            if (doc.exists()) {
                setTopic({ id: doc.id, ...doc.data() } as ForumTopic);
            } else {
                setNotFound(true);
            }
            setIsLoadingTopic(false);
        });

        // Fetch Replies
        const repliesQ = query(collection(db, 'forum_replies'), where('topicId', '==', topicId), orderBy('createdAt', 'asc'));
        const unsubscribeReplies = onSnapshot(repliesQ, (snapshot) => {
            const fetchedReplies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ForumReply[];
            setReplies(fetchedReplies);
            setIsLoadingReplies(false);
        });

        return () => {
            unsubscribeTopic();
            unsubscribeReplies();
        };
    }, [topicId]);

    if (isLoadingTopic) {
        return (
            <div className="container py-12 md:py-16 max-w-4xl">
                <div className="mb-6">
                    <div className="h-10 w-40 bg-muted animate-pulse rounded" />
                </div>
                <TopicSkeleton />
                <div className="space-y-4">
                    <ReplySkeleton />
                    <ReplySkeleton />
                </div>
            </div>
        );
    }

    if (notFound || !topic) {
        return (
            <div className="container py-12 md:py-16">
                <AnimatedWrapper>
                    <div className="text-center max-w-md mx-auto">
                        <div className="inline-flex p-4 bg-muted rounded-full mb-6">
                            <MessageSquare className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h1 className="text-3xl font-bold mb-3">Tema no encontrado</h1>
                        <p className="text-muted-foreground mb-6">
                            Este tema no existe o ha sido eliminado.
                        </p>
                        <Button onClick={() => router.push('/forum')} size="lg">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Foro
                        </Button>
                    </div>
                </AnimatedWrapper>
            </div>
        );
    }

    const handleAddReply = async () => {
        if (!newReply.trim() || !user || !topic) return;

        setIsSubmitting(true);
        try {
            // 1. Add Reply
            await addDoc(collection(db, 'forum_replies'), {
                topicId: topicId,
                content: newReply,
                author: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (user.displayName || 'Usuario'),
                authorId: user.uid,
                authorAvatar: userData?.photoURL || user.photoURL,
                createdAt: serverTimestamp(),
                likes: 0,
                likedBy: [],
                parentId: replyingTo ? replyingTo.id : null,
                replyToAuthor: replyingTo ? replyingTo.author : null
            });

            // 2. Update Topic Stats
            const updateData: any = {
                lastReplyAt: serverTimestamp()
            };

            // Solo incrementar contador si es una respuesta directa
            if (!replyingTo) {
                updateData.repliesCount = increment(1);
            }

            const topicRef = doc(db, 'forum_topics', topicId);
            await updateDoc(topicRef, updateData);

            // 3. Notify Author (if not self)
            if (replyingTo && replyingTo.authorId !== user.uid) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'comment',
                    title: 'Nueva respuesta a tu comentario',
                    message: `${userData?.firstName || 'Alguien'} respondió a tu comentario en "${topic.title}"`,
                    recipientId: replyingTo.authorId,
                    senderId: user.uid,
                    avatar: userData?.photoURL || user.photoURL,
                    read: false,
                    createdAt: serverTimestamp(),
                    topicId: topicId
                });
            } else if (!replyingTo && topic.authorId !== user.uid) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'comment',
                    title: 'Nueva respuesta en el foro',
                    message: `${userData?.firstName || 'Alguien'} respondió a tu tema "${topic.title}"`,
                    recipientId: topic.authorId,
                    senderId: user.uid,
                    avatar: userData?.photoURL || user.photoURL,
                    read: false,
                    createdAt: serverTimestamp(),
                    topicId: topicId
                });
            }

            setNewReply('');
            setReplyingTo(null);
            toast({
                title: "¡Respuesta publicada!",
                description: "Tu respuesta ha sido añadida exitosamente"
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al publicar respuesta", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLikeTopic = async () => {
        if (!user || !topic) return;

        const isLiked = topic.likedBy?.includes(user.uid);
        const topicRef = doc(db, 'forum_topics', topicId);

        try {
            await updateDoc(topicRef, {
                likes: isLiked ? increment(-1) : increment(1),
                likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });

            // Crear notificación solo cuando se agrega el like (no al quitar) y si no es el autor
            if (!isLiked && topic.authorId !== user.uid) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'like',
                    title: 'Le gustó tu tema',
                    message: `A ${userData?.firstName || 'Alguien'} le gustó tu tema "${topic.title}"`,
                    recipientId: topic.authorId,
                    senderId: user.uid,
                    avatar: userData?.photoURL || user.photoURL,
                    read: false,
                    createdAt: serverTimestamp(),
                    topicId: topicId
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleLikeReply = async (reply: ForumReply) => {
        if (!user || !topic) return;
        const isLiked = reply.likedBy?.includes(user.uid);
        const replyRef = doc(db, 'forum_replies', reply.id);

        try {
            await updateDoc(replyRef, {
                likes: isLiked ? increment(-1) : increment(1),
                likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });

            // Crear notificación solo cuando se agrega el like (no al quitar) y si no es el autor
            if (!isLiked && reply.authorId !== user.uid) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'like',
                    title: 'Le gustó tu respuesta',
                    message: `A ${userData?.firstName || 'Alguien'} le gustó tu respuesta en "${topic.title}"`,
                    recipientId: reply.authorId,
                    senderId: user.uid,
                    avatar: userData?.photoURL || user.photoURL,
                    read: false,
                    createdAt: serverTimestamp(),
                    topicId: topicId
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    // Función helper para contar respuestas anidadas
    const getChildRepliesCount = (parentId: string) => {
        return replies.filter(r => r.parentId === parentId).length;
    };

    // Función para toggle de expansión de respuestas
    const toggleReplyExpansion = (replyId: string) => {
        setExpandedReplies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(replyId)) {
                newSet.delete(replyId);
            } else {
                newSet.add(replyId);
            }
            return newSet;
        });
    };

    // Función para cargar más comentarios
    const loadMoreReplies = () => {
        setVisibleRepliesCount(prev => prev + 5); // Cargar 5 más cada vez
    };

    // ==================== CRUD FUNCTIONS ====================

    const handleEditTopic = async () => {
        if (!topic || !user || !editingTopic || topic.authorId !== user.uid) return;
        setIsEditingTopic(true);
        try {
            await updateDoc(doc(db, 'forum_topics', topicId), {
                title: editingTopic.title,
                content: editingTopic.content,
                tag: editingTopic.tag,
                editedAt: serverTimestamp(),
                isEdited: true
            });
            setEditingTopic(null);
            toast({ title: "Tema actualizado", description: "Los cambios han sido guardados" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "No se pudo actualizar", variant: "destructive" });
        } finally {
            setIsEditingTopic(false);
        }
    };

    const handleDeleteTopic = async () => {
        if (!topic || !user || topic.authorId !== user.uid) return;
        setIsDeletingItem(true);
        try {
            // Delete all replies associated with this topic
            const allReplies = replies; // We already have all replies in state
            for (const reply of allReplies) {
                await deleteDoc(doc(db, 'forum_replies', reply.id));
            }

            // Delete the topic itself
            await deleteDoc(doc(db, 'forum_topics', topicId));

            toast({ title: "Tema eliminado", description: "El tema y todas sus respuestas han sido eliminados" });
            router.push('/forum');
        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsDeletingItem(false);
            setDeletingItem(null);
        }
    };

    const handleEditReply = async () => {
        if (!user || !editingReply) return;
        setIsEditingReply(true);
        try {
            await updateDoc(doc(db, 'forum_replies', editingReply.id), {
                content: editingReply.content,
                editedAt: serverTimestamp(),
                isEdited: true
            });
            setEditingReply(null);
            toast({ title: "Respuesta actualizada" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsEditingReply(false);
        }
    };

    const handleDeleteReply = async () => {
        if (!user || !deletingItem || deletingItem.type !== 'reply') return;

        // Verificar permisos: soy el autor de la respuesta O soy el dueño del tema
        const replyToDelete = replies.find(r => r.id === deletingItem.id);
        if (!replyToDelete) return;

        if (replyToDelete.authorId !== user.uid && topic.authorId !== user.uid) {
            toast({ title: "No tienes permiso", description: "Solo el autor o el creador del tema pueden eliminar esto", variant: "destructive" });
            return;
        }

        setIsDeletingItem(true);
        try {
            // Function to recursively delete a reply and all its children
            const deleteReplyRecursively = async (replyId: string) => {
                // Find all children of this reply
                const children = replies.filter(r => r.parentId === replyId);

                // Recursively delete all children first
                for (const child of children) {
                    await deleteReplyRecursively(child.id);
                }

                // Delete the reply itself
                await deleteDoc(doc(db, 'forum_replies', replyId));
            };

            // Start recursive deletion from the target reply
            await deleteReplyRecursively(deletingItem.id);

            // Update topic replies count (only if it was a main reply)
            const reply = replies.find(r => r.id === deletingItem.id);
            if (reply && !reply.parentId) {
                await updateDoc(doc(db, 'forum_topics', topicId), {
                    repliesCount: increment(-1)
                });
            }

            setDeletingItem(null);
            toast({ title: "Respuesta eliminada", description: "La respuesta y sus sub-respuestas han sido eliminadas" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", variant: "destructive" });
        } finally {
            setIsDeletingItem(false);
        }
    };

    // Obtener respuestas principales (sin parentId)
    const mainReplies = replies.filter(r => !r.parentId);
    const visibleMainReplies = mainReplies.slice(0, visibleRepliesCount);
    const hasMoreReplies = mainReplies.length > visibleRepliesCount;

    // Función recursiva para renderizar respuestas anidadas de cualquier profundidad
    const renderNestedReplies = (parentReply: ForumReply, depth: number = 0): JSX.Element | null => {
        const childReplies = replies.filter(r => r.parentId === parentReply.id);
        const isExpanded = expandedReplies.has(parentReply.id);
        // Usar píxeles para indentación progresiva (24px por nivel, máximo 120px)
        const marginLeftPx = depth > 0 ? Math.min(depth * 24, 120) : 0;

        if (!isExpanded || childReplies.length === 0) return null;

        return (
            <>
                {childReplies.map((childReply) => (
                    <div key={childReply.id} style={{ marginLeft: `${marginLeftPx}px` }}>
                        <AnimatedWrapper className="mt-3">
                            <Card className="bg-muted/40 border-l-4 border-l-muted-foreground/30">
                                <CardContent className="pt-4 pb-3">
                                    <div className="flex items-start gap-3">
                                        <div className="relative">
                                            <CornerDownRight className="absolute -left-8 top-1 h-4 w-4 text-muted-foreground/40" />
                                            <Avatar className="h-8 w-8 border-2 border-background">
                                                <AvatarImage src={childReply.authorAvatar} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                                                    {childReply.author[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                                <span className="font-semibold text-xs">{childReply.author}</span>
                                                <span className="text-xs text-muted-foreground">→</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {childReply.replyToAuthor}
                                                </span>
                                                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {childReply.createdAt?.seconds
                                                        ? formatDistanceToNow(new Date(childReply.createdAt.seconds * 1000), {
                                                            addSuffix: true,
                                                            locale: es
                                                        })
                                                        : 'Reciente'}
                                                    {childReply.isEdited && childReply.editedAt && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <span className="text-[10px] text-muted-foreground/70 cursor-help ml-1">(editado)</span>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Editado {formatDistanceToNow(new Date(childReply.editedAt.seconds * 1000), { addSuffix: true, locale: es })}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-sm text-foreground/90 leading-relaxed mb-2 whitespace-pre-wrap">
                                                {childReply.content}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant={childReply.likedBy?.includes(user?.uid || '') ? "default" : "ghost"}
                                                    size="sm"
                                                    className="h-7 gap-1.5"
                                                    onClick={() => handleLikeReply(childReply)}
                                                    disabled={!user}
                                                >
                                                    <ThumbsUp className="h-3 w-3" />
                                                    <span className="text-xs">{childReply.likes || 0}</span>
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 gap-1.5"
                                                    onClick={() => {
                                                        setReplyingTo(childReply);
                                                        const form = document.getElementById('reply-form');
                                                        form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                >
                                                    <Reply className="h-3.5 w-3.5" />
                                                    <span className="text-xs">Responder</span>
                                                </Button>

                                                {/* Edit/Delete Dropdown - Author or Topic Creator */}
                                                {user && (childReply.authorId === user.uid || topic.authorId === user.uid) && (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                <MoreVertical className="h-3.5 w-3.5" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            {childReply.authorId === user.uid && (
                                                                <DropdownMenuItem onClick={() => setEditingReply({ id: childReply.id, content: childReply.content })}>
                                                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                                                    Editar
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuItem
                                                                onClick={() => setDeletingItem({ type: 'reply', id: childReply.id })}
                                                                className="text-destructive focus:text-destructive"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                Eliminar
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                )}

                                                {/* Botón para expandir/colapsar en cualquier nivel */}
                                                {getChildRepliesCount(childReply.id) > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 gap-1.5 text-primary"
                                                        onClick={() => toggleReplyExpansion(childReply.id)}
                                                    >
                                                        {expandedReplies.has(childReply.id) ? (
                                                            <>
                                                                <ChevronUp className="h-3 w-3" />
                                                                <span className="text-xs">Ocultar</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <ChevronDown className="h-3 w-3" />
                                                                <span className="text-xs">Ver {getChildRepliesCount(childReply.id)}</span>
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </AnimatedWrapper>

                        {/* Formulario contextual: aparece aquí si se está respondiendo a ESTA respuesta */}
                        {replyingTo?.id === childReply.id && (
                            <ReplyFormComponent
                                replyingTo={replyingTo}
                                setReplyingTo={setReplyingTo}
                                user={user}
                                userData={userData}
                                newReply={newReply}
                                setNewReply={setNewReply}
                                isSubmitting={isSubmitting}
                                handleAddReply={handleAddReply}
                            />
                        )}

                        {/* Renderizar respuestas anidadas recursivamente */}
                        {renderNestedReplies(childReply, depth + 1)}
                    </div>
                ))}
            </>
        );
    };

    return (
        <div className="container pt-24 pb-12 md:pt-28 md:pb-16 max-w-4xl">
            <AnimatedWrapper>
                <Button
                    variant="ghost"
                    onClick={() => router.push('/forum')}
                    className="mb-8 hover:bg-muted/80 transition-colors group"
                >
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Volver al Foro
                </Button>

                {/* Main Topic */}
                <Card className="mb-8 shadow-md border-2">
                    <CardHeader className="pb-4 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <Avatar className="h-12 w-12 border-2 border-muted">
                                    <AvatarImage src={topic.authorAvatar} />
                                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                        {topic.author[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-base">{topic.author}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                        <Clock className="h-3.5 w-3.5" />
                                        <span>
                                            {topic.createdAt?.seconds
                                                ? formatDistanceToNow(new Date(topic.createdAt.seconds * 1000), {
                                                    addSuffix: true,
                                                    locale: es
                                                })
                                                : 'Reciente'}
                                        </span>
                                        {topic.isEdited && topic.editedAt && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <span className="text-xs text-muted-foreground/70 cursor-help">(editado)</span>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Editado {formatDistanceToNow(new Date(topic.editedAt.seconds * 1000), { addSuffix: true, locale: es })}</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <Badge
                                variant="secondary"
                                className={`${tagColors[topic.tag] || 'bg-gray-100 text-gray-700'} border font-medium shrink-0`}
                            >
                                {topic.tag}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold mb-4 leading-tight">{topic.title}</h1>
                            <p className="text-foreground/90 leading-relaxed text-base whitespace-pre-wrap">
                                {topic.content}
                            </p>
                        </div>

                        <div className="flex items-center gap-3 pt-4 border-t">
                            <Button
                                variant={topic.likedBy?.includes(user?.uid || '') ? "default" : "outline"}
                                size="default"
                                onClick={handleLikeTopic}
                                disabled={!user}
                                className="gap-2"
                            >
                                <ThumbsUp className="h-4 w-4" />
                                <span>{topic.likes || 0}</span>
                            </Button>
                            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {mainReplies.length} {mainReplies.length === 1 ? 'respuesta' : 'respuestas'}
                                </span>
                            </div>

                            {/* Edit/Delete Buttons - Only visible to author */}
                            {user && topic.authorId === user.uid && (
                                <div className="flex items-center gap-2 ml-auto">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setEditingTopic({ title: topic.title, content: topic.content, tag: topic.tag })}
                                        className="gap-2"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={() => setDeletingItem({ type: 'topic', id: topicId })}
                                        className="gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Eliminar
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </AnimatedWrapper>

            {/* Formulario contextual: aparece aquí cuando NO se está respondiendo a un comentario específico */}
            {!replyingTo && (
                <ReplyFormComponent
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    user={user}
                    userData={userData}
                    newReply={newReply}
                    setNewReply={setNewReply}
                    isSubmitting={isSubmitting}
                    handleAddReply={handleAddReply}
                />
            )}

            {/* Replies Section */}
            <AnimatedWrapper delay={200}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        Respuestas
                        <span className="text-muted-foreground text-xl">({mainReplies.length})</span>
                    </h2>
                </div>

                {isLoadingReplies ? (
                    <div className="space-y-4 mb-8">
                        <ReplySkeleton />
                        <ReplySkeleton />
                    </div>
                ) : replies.length > 0 ? (
                    <>
                        <div className="space-y-4 mb-6">
                            {visibleMainReplies.map((reply, index) => (
                                <div key={reply.id}>
                                    <AnimatedWrapper delay={100 * index}>
                                        <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
                                            <CardContent className="pt-5 pb-4">
                                                <div className="flex items-start gap-4">
                                                    <Avatar className="h-10 w-10 border-2 border-muted">
                                                        <AvatarImage src={reply.authorAvatar} />
                                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                                            {reply.author[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <span className="font-semibold text-sm">{reply.author}</span>
                                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {reply.createdAt?.seconds
                                                                    ? formatDistanceToNow(new Date(reply.createdAt.seconds * 1000), {
                                                                        addSuffix: true,
                                                                        locale: es
                                                                    })
                                                                    : 'Reciente'}
                                                                {reply.isEdited && reply.editedAt && (
                                                                    <TooltipProvider>
                                                                        <Tooltip>
                                                                            <TooltipTrigger asChild>
                                                                                <span className="text-[11px] text-muted-foreground/70 cursor-help ml-1">(editado)</span>
                                                                            </TooltipTrigger>
                                                                            <TooltipContent>
                                                                                <p>Editado {formatDistanceToNow(new Date(reply.editedAt.seconds * 1000), { addSuffix: true, locale: es })}</p>
                                                                            </TooltipContent>
                                                                        </Tooltip>
                                                                    </TooltipProvider>
                                                                )}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground/90 leading-relaxed mb-3 whitespace-pre-wrap">
                                                            {reply.content}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant={reply.likedBy?.includes(user?.uid || '') ? "default" : "ghost"}
                                                                size="sm"
                                                                className="h-8 gap-1.5"
                                                                onClick={() => handleLikeReply(reply)}
                                                                disabled={!user}
                                                            >
                                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                                <span className="text-xs">{reply.likes || 0}</span>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 gap-1.5"
                                                                onClick={() => {
                                                                    setReplyingTo(reply);
                                                                    const form = document.getElementById('reply-form');
                                                                    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                                }}
                                                            >
                                                                <Reply className="h-3.5 w-3.5" />
                                                                <span className="text-xs">Responder</span>
                                                            </Button>

                                                            {/* Edit/Delete Dropdown - Only for author */}
                                                            {user && (reply.authorId === user.uid || topic.authorId === user.uid) && (
                                                                <DropdownMenu>
                                                                    <DropdownMenuTrigger asChild>
                                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                            <MoreVertical className="h-4 w-4" />
                                                                        </Button>
                                                                    </DropdownMenuTrigger>
                                                                    <DropdownMenuContent align="end">
                                                                        {reply.authorId === user.uid && (
                                                                            <DropdownMenuItem onClick={() => setEditingReply({ id: reply.id, content: reply.content })}>
                                                                                <Edit2 className="h-4 w-4 mr-2" />
                                                                                Editar
                                                                            </DropdownMenuItem>
                                                                        )}
                                                                        <DropdownMenuItem
                                                                            onClick={() => setDeletingItem({ type: 'reply', id: reply.id })}
                                                                            className="text-destructive focus:text-destructive"
                                                                        >
                                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                                            Eliminar
                                                                        </DropdownMenuItem>
                                                                    </DropdownMenuContent>
                                                                </DropdownMenu>
                                                            )}

                                                            {/* Botón para expandir/colapsar respuestas anidadas */}
                                                            {getChildRepliesCount(reply.id) > 0 && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="h-8 gap-1.5 text-primary"
                                                                    onClick={() => toggleReplyExpansion(reply.id)}
                                                                >
                                                                    {expandedReplies.has(reply.id) ? (
                                                                        <>
                                                                            <ChevronUp className="h-3.5 w-3.5" />
                                                                            <span className="text-xs">Ocultar respuestas</span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <ChevronDown className="h-3.5 w-3.5" />
                                                                            <span className="text-xs">Ver {getChildRepliesCount(reply.id)} {getChildRepliesCount(reply.id) === 1 ? 'respuesta' : 'respuestas'}</span>
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </AnimatedWrapper>

                                    {/* Formulario contextual: aparece aquí si se está respondiendo a ESTE comentario */}
                                    {replyingTo?.id === reply.id && (
                                        <ReplyFormComponent
                                            replyingTo={replyingTo}
                                            setReplyingTo={setReplyingTo}
                                            user={user}
                                            userData={userData}
                                            newReply={newReply}
                                            setNewReply={setNewReply}
                                            isSubmitting={isSubmitting}
                                            handleAddReply={handleAddReply}
                                        />
                                    )}

                                    {/* Renderizar respuestas anidadas recursivamente */}
                                    {renderNestedReplies(reply, 1)}
                                </div>
                            ))}
                        </div>

                        {/* Botones de paginación */}
                        <div className="flex justify-center gap-4 mb-8">
                            {hasMoreReplies && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={loadMoreReplies}
                                    className="gap-2 min-w-[200px]"
                                >
                                    <ChevronDown className="h-4 w-4" />
                                    Ver más comentarios ({mainReplies.length - visibleRepliesCount} restantes)
                                </Button>
                            )}
                            {visibleRepliesCount > 3 && (
                                <Button
                                    variant="outline"
                                    size="lg"
                                    onClick={() => setVisibleRepliesCount(3)}
                                    className="gap-2 min-w-[200px]"
                                >
                                    <ChevronUp className="h-4 w-4" />
                                    Mostrar menos comentarios
                                </Button>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 mb-8">
                        <div className="inline-flex p-4 bg-muted rounded-full mb-4">
                            <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">No hay respuestas aún</h3>
                        <p className="text-muted-foreground">
                            Sé el primero en responder a este tema
                        </p>
                    </div>
                )}
            </AnimatedWrapper>

            {/* Edit Topic Dialog */}
            <Dialog open={!!editingTopic} onOpenChange={(open) => !open && setEditingTopic(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Editar Tema</DialogTitle>
                        <DialogDescription>Actualiza el título, contenido o categoría de tu tema.</DialogDescription>
                    </DialogHeader>
                    {editingTopic && (
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="edit-title">Título</Label>
                                <Input
                                    id="edit-title"
                                    value={editingTopic.title}
                                    onChange={(e) => setEditingTopic({ ...editingTopic, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-tag">Categoría</Label>
                                <Select
                                    value={editingTopic.tag}
                                    onValueChange={(value) => setEditingTopic({ ...editingTopic, tag: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tagOptions.map((tag) => (
                                            <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="edit-content">Contenido</Label>
                                <Textarea
                                    id="edit-content"
                                    value={editingTopic.content}
                                    onChange={(e) => setEditingTopic({ ...editingTopic, content: e.target.value })}
                                    rows={6}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingTopic(null)}>Cancelar</Button>
                        <Button onClick={handleEditTopic} disabled={isEditingTopic}>
                            {isEditingTopic ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Reply Dialog */}
            <Dialog open={!!editingReply} onOpenChange={(open) => !open && setEditingReply(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Respuesta</DialogTitle>
                        <DialogDescription>Modifica el contenido de tu respuesta.</DialogDescription>
                    </DialogHeader>
                    {editingReply && (
                        <div className="space-y-4 py-4">
                            <Textarea
                                value={editingReply.content}
                                onChange={(e) => setEditingReply({ ...editingReply, content: e.target.value })}
                                rows={4}
                            />
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingReply(null)}>Cancelar</Button>
                        <Button onClick={handleEditReply} disabled={isEditingReply}>
                            {isEditingReply ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation AlertDialog */}
            <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {deletingItem?.type === 'topic'
                                ? 'Esta acción eliminará el tema permanentemente. Esta acción no se puede deshacer.'
                                : 'Esta acción marcará el comentario como eliminado. Si tiene respuestas, se mostrará como "[Comentario eliminado]".'}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingItem(null)}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (deletingItem?.type === 'topic') {
                                    handleDeleteTopic();
                                } else {
                                    handleDeleteReply();
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeletingItem ? 'Eliminando...' : 'Eliminar'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}