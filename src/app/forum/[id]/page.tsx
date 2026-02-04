'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, ThumbsUp, Send, Reply, Clock, User, CornerDownRight } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, serverTimestamp, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
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
            const topicRef = doc(db, 'forum_topics', topicId);
            await updateDoc(topicRef, {
                repliesCount: increment(1),
                lastReplyAt: serverTimestamp()
            });

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
        } catch (error) {
            console.error(error);
        }
    };

    const handleLikeReply = async (reply: ForumReply) => {
        if (!user) return;
        const isLiked = reply.likedBy?.includes(user.uid);
        const replyRef = doc(db, 'forum_replies', reply.id);

        try {
            await updateDoc(replyRef, {
                likes: isLiked ? increment(-1) : increment(1),
                likedBy: isLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="container py-12 md:py-16 max-w-4xl">
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
                                    {replies.length} {replies.length === 1 ? 'respuesta' : 'respuestas'}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </AnimatedWrapper>

            {/* Replies Section */}
            <AnimatedWrapper delay={200}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <MessageSquare className="h-6 w-6 text-primary" />
                        Respuestas
                        <span className="text-muted-foreground text-xl">({replies.length})</span>
                    </h2>
                </div>

                {isLoadingReplies ? (
                    <div className="space-y-4 mb-8">
                        <ReplySkeleton />
                        <ReplySkeleton />
                    </div>
                ) : replies.length > 0 ? (
                    <div className="space-y-4 mb-8">
                        {replies.filter(r => !r.parentId).map((reply, index) => (
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
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </AnimatedWrapper>

                                {/* Render Child Replies */}
                                {replies.filter(r => r.parentId === reply.id).map((childReply) => (
                                    <AnimatedWrapper key={childReply.id} className="ml-12 mt-3">
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
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-foreground/90 leading-relaxed mb-2 whitespace-pre-wrap">
                                                            {childReply.content}
                                                        </p>
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
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </AnimatedWrapper>
                                ))}
                            </div>
                        ))}
                    </div>
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

            {/* Reply Form */}
            <AnimatedWrapper delay={400}>
                <Card id="reply-form" className="shadow-md border-2 sticky bottom-4">
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
        </div>
    );
}