'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, ThumbsUp, Send } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

import { db } from '@/lib/firebase';
import { doc, getDoc, collection, addDoc, onSnapshot, query, where, orderBy, updateDoc, serverTimestamp, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { ForumTopic, ForumReply } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';




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
        });

        // Fetch Replies
        const repliesQ = query(collection(db, 'forum_replies'), where('topicId', '==', topicId), orderBy('createdAt', 'asc'));
        const unsubscribeReplies = onSnapshot(repliesQ, (snapshot) => {
            const fetchedReplies = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as ForumReply[];
            setReplies(fetchedReplies);
        });

        return () => {
            unsubscribeTopic();
            unsubscribeReplies();
        };
    }, [topicId]);

    if (!topic && !notFound) {
        return (
            <div className="container py-12 md:py-16 text-center">
                <p>Cargando tema...</p>
            </div>
        );
    }

    if (notFound || !topic) {
        return (
            <div className="container py-12 md:py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Tema no encontrado</h1>
                <Button onClick={() => router.push('/forum')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Foro
                </Button>
            </div>
        );
    }

    const handleAddReply = async () => {
        if (!newReply.trim() || !user || !topic) return;

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
            // 3. Notify Author (if not self)
            // If replying to a component
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
                // If top level reply, notify topic owner
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
            toast({ title: "Respuesta publicada" });
        } catch (error) {
            console.error(error);
            toast({ title: "Error al publicar respuesta", variant: "destructive" });
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
                    className="mb-6"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Foro
                </Button>

                {/* Main Topic */}
                <Card className="mb-8">
                    <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar>
                                    <AvatarImage src={topic.authorAvatar} />
                                    <AvatarFallback>{topic.author[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium">{topic.author}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {topic.createdAt?.seconds ? formatDistanceToNow(new Date(topic.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                                    </p>
                                </div>
                            </div>
                            <Badge variant="secondary">{topic.tag}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <h1 className="text-2xl font-bold mb-4">{topic.title}</h1>
                        <p className="text-foreground/90 leading-relaxed mb-6">{topic.content}</p>
                        <div className="flex items-center gap-4 pt-4 border-t">
                            <Button
                                variant={topic.likedBy?.includes(user?.uid || '') ? "default" : "outline"}
                                size="sm"
                                onClick={handleLikeTopic}
                                disabled={!user}
                            >
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                {topic.likes || 0} Me gusta
                            </Button>
                            <span className="text-sm text-muted-foreground flex items-center">
                                <MessageSquare className="mr-1 h-4 w-4" />
                                {replies.length} respuestas
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </AnimatedWrapper>

            {/* Replies Section */}
            <AnimatedWrapper delay={200}>
                <h2 className="text-xl font-bold mb-4">Respuestas ({replies.length})</h2>
                <div className="space-y-4 mb-8">
                    {replies.filter(r => !r.parentId).map((reply, index) => (
                        <div key={reply.id}>
                            <AnimatedWrapper delay={100 * index}>
                                <Card className="border-l-4 border-l-transparent hover:border-l-primary/20 transition-all">
                                    <CardContent className="pt-4">
                                        <div className="flex items-start gap-3">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={reply.authorAvatar} />
                                                <AvatarFallback>{reply.author[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-sm">{reply.author}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {reply.createdAt?.seconds ? formatDistanceToNow(new Date(reply.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-foreground/90">{reply.content}</p>
                                                <div className="flex items-center gap-2 mt-2">
                                                    <Button
                                                        variant={reply.likedBy?.includes(user?.uid || '') ? "default" : "ghost"}
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => handleLikeReply(reply)}
                                                        disabled={!user}
                                                    >
                                                        <ThumbsUp className="mr-1 h-3 w-3" />
                                                        {reply.likes || 0}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 px-2 text-xs"
                                                        onClick={() => {
                                                            setReplyingTo(reply);
                                                            const form = document.getElementById('reply-form');
                                                            form?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                    >
                                                        Responder
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </AnimatedWrapper>

                            {/* Render Child Replies */}
                            {replies.filter(r => r.parentId === reply.id).map((childReply) => (
                                <AnimatedWrapper key={childReply.id} className="ml-8 mt-2">
                                    <Card className="bg-muted/30">
                                        <CardContent className="pt-3 pb-3">
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={childReply.authorAvatar} />
                                                    <AvatarFallback>{childReply.author[0]}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-medium text-xs">{childReply.author}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            respondió a {childReply.replyToAuthor} • {childReply.createdAt?.seconds ? formatDistanceToNow(new Date(childReply.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-foreground/90">{childReply.content}</p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <Button
                                                            variant={childReply.likedBy?.includes(user?.uid || '') ? "default" : "ghost"}
                                                            size="sm"
                                                            className="h-6 px-2 text-[10px]"
                                                            onClick={() => handleLikeReply(childReply)}
                                                            disabled={!user}
                                                        >
                                                            <ThumbsUp className="mr-1 h-3 w-3" />
                                                            {childReply.likes || 0}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </AnimatedWrapper>
                            ))}
                        </div>
                    ))}
                </div>
            </AnimatedWrapper>

            {/* Reply Form */}
            <AnimatedWrapper delay={400}>
                <Card id="reply-form">
                    <CardContent className="pt-4">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="font-medium">
                                {replyingTo ? `Respondiendo a ${replyingTo.author}` : 'Añadir una respuesta'}
                            </h3>
                            {replyingTo && (
                                <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
                                    Cancelar respuesta
                                </Button>
                            )}
                        </div>
                        <Textarea
                            placeholder="Escribe tu respuesta..."
                            value={newReply}
                            onChange={(e) => setNewReply(e.target.value)}
                            rows={4}
                            className="mb-3"
                        />
                        <Button onClick={handleAddReply} disabled={!newReply.trim()}>
                            <Send className="mr-2 h-4 w-4" />
                            Publicar Respuesta
                        </Button>
                    </CardContent>
                </Card>
            </AnimatedWrapper>
        </div>
    );
}
