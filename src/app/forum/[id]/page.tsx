'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, MessageSquare, ThumbsUp, Send } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

// Mocked topics data (should match the forum page)
const topicsData: Record<number, {
    id: number;
    title: string;
    author: string;
    authorAvatar: string;
    tag: string;
    content: string;
    createdAt: string;
    likes: number;
    replies: Reply[];
}> = {
    1: {
        id: 1,
        title: '¿Ideas para nuevos proyectos ecológicos?',
        author: 'Alice García',
        authorAvatar: 'https://placehold.co/40x40.png',
        tag: 'EcoUide',
        content: 'Estoy buscando inspiración para mi próximo proyecto ecológico. ¿Alguien tiene ideas innovadoras que podamos desarrollar juntos? Me interesa especialmente trabajar con energías renovables o reciclaje inteligente.',
        createdAt: 'hace 2 horas',
        likes: 15,
        replies: [
            { id: 1, author: 'Bob Martínez', authorAvatar: 'https://placehold.co/40x40.png', content: '¡Qué tal un sistema de compostaje inteligente con sensores IoT!', createdAt: 'hace 1 hora', likes: 5 },
            { id: 2, author: 'Charlie López', authorAvatar: 'https://placehold.co/40x40.png', content: 'Podrías hacer una app para trackear el consumo de agua en hogares.', createdAt: 'hace 45 minutos', likes: 8 },
            { id: 3, author: 'Diana Rodríguez', authorAvatar: 'https://placehold.co/40x40.png', content: 'Me encanta la idea del compostaje. Yo tengo experiencia con Arduino si necesitas ayuda.', createdAt: 'hace 30 minutos', likes: 3 },
        ],
    },
    2: {
        id: 2,
        title: 'Ayuda con la gestión de estado en React',
        author: 'Bob Martínez',
        authorAvatar: 'https://placehold.co/40x40.png',
        tag: 'React',
        content: '¿Cuál es la mejor manera de manejar el estado global en una aplicación React? Estoy entre Redux, Context API o Zustand. ¿Cuál recomiendan para un proyecto de tamaño mediano?',
        createdAt: 'hace 5 horas',
        likes: 10,
        replies: [
            { id: 1, author: 'Alice García', authorAvatar: 'https://placehold.co/40x40.png', content: 'Para proyectos medianos, Zustand es excelente. Es más simple que Redux.', createdAt: 'hace 4 horas', likes: 12 },
            { id: 2, author: 'Eva Torres', authorAvatar: 'https://placehold.co/40x40.png', content: 'Context API es suficiente si no tienes actualizaciones muy frecuentes.', createdAt: 'hace 3 horas', likes: 6 },
        ],
    },
    3: {
        id: 3,
        title: 'Presentación: Mi nueva estación meteorológica IoT',
        author: 'Charlie López',
        authorAvatar: 'https://placehold.co/40x40.png',
        tag: 'Presentación',
        content: 'Quiero compartir mi proyecto de estación meteorológica usando Arduino y sensores DHT22. Mide temperatura, humedad y presión atmosférica. Todos los datos se envían a una base de datos en la nube y se visualizan en un dashboard web.',
        createdAt: 'hace 1 día',
        likes: 25,
        replies: [
            { id: 1, author: 'Diana Rodríguez', authorAvatar: 'https://placehold.co/40x40.png', content: '¡Increíble proyecto! ¿Podrías compartir el código del dashboard?', createdAt: 'hace 20 horas', likes: 8 },
            { id: 2, author: 'Frank Pérez', authorAvatar: 'https://placehold.co/40x40.png', content: '¿Qué base de datos usas? Me interesa hacer algo similar.', createdAt: 'hace 18 horas', likes: 4 },
            { id: 3, author: 'Charlie López', authorAvatar: 'https://placehold.co/40x40.png', content: 'Uso Firebase Realtime Database. El código está en mi GitHub, les paso el link por DM.', createdAt: 'hace 15 horas', likes: 10 },
        ],
    },
    4: {
        id: 4,
        title: 'Mejores prácticas para el diseño de API REST',
        author: 'Diana Rodríguez',
        authorAvatar: 'https://placehold.co/40x40.png',
        tag: 'Discusión',
        content: 'Abramos un debate sobre las mejores prácticas para diseñar APIs REST. Me gustaría discutir: versionado, naming conventions, autenticación, paginación y manejo de errores.',
        createdAt: 'hace 3 días',
        likes: 42,
        replies: [
            { id: 1, author: 'Alice García', authorAvatar: 'https://placehold.co/40x40.png', content: 'Para versionado prefiero usar /v1/ en la URL. Es más explícito.', createdAt: 'hace 2 días', likes: 15 },
            { id: 2, author: 'Bob Martínez', authorAvatar: 'https://placehold.co/40x40.png', content: 'Los nombres de recursos siempre en plural: /users, /projects, etc.', createdAt: 'hace 2 días', likes: 20 },
            { id: 3, author: 'Eva Torres', authorAvatar: 'https://placehold.co/40x40.png', content: 'JWT para autenticación es el estándar actualmente.', createdAt: 'hace 1 día', likes: 12 },
            { id: 4, author: 'Frank Pérez', authorAvatar: 'https://placehold.co/40x40.png', content: 'No olviden implementar rate limiting y documentar con Swagger/OpenAPI.', createdAt: 'hace 1 día', likes: 18 },
        ],
    },
};

interface Reply {
    id: number;
    author: string;
    authorAvatar: string;
    content: string;
    createdAt: string;
    likes: number;
}

export default function TopicDetailPage() {
    const params = useParams();
    const router = useRouter();
    const topicId = Number(params.id);

    const [topic, setTopic] = useState(topicsData[topicId] || null);
    const [newReply, setNewReply] = useState('');
    const [liked, setLiked] = useState(false);

    if (!topic) {
        return (
            <div className="container py-12 md:py-16 text-center">
                <h1 className="text-2xl font-bold mb-4">Tema no encontrado</h1>
                <Button onClick={() => router.push('/forum')}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Foro
                </Button>
            </div>
        );
    }

    const handleAddReply = () => {
        if (!newReply.trim()) return;

        const reply: Reply = {
            id: Date.now(),
            author: 'Usuario Actual',
            authorAvatar: 'https://placehold.co/40x40.png',
            content: newReply,
            createdAt: 'ahora mismo',
            likes: 0,
        };

        setTopic({
            ...topic,
            replies: [...topic.replies, reply],
        });
        setNewReply('');
    };

    const handleLikeTopic = () => {
        setLiked(!liked);
        setTopic({
            ...topic,
            likes: liked ? topic.likes - 1 : topic.likes + 1,
        });
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
                                    <p className="text-sm text-muted-foreground">{topic.createdAt}</p>
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
                                variant={liked ? "default" : "outline"}
                                size="sm"
                                onClick={handleLikeTopic}
                            >
                                <ThumbsUp className="mr-2 h-4 w-4" />
                                {topic.likes} Me gusta
                            </Button>
                            <span className="text-sm text-muted-foreground flex items-center">
                                <MessageSquare className="mr-1 h-4 w-4" />
                                {topic.replies.length} respuestas
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </AnimatedWrapper>

            {/* Replies Section */}
            <AnimatedWrapper delay={200}>
                <h2 className="text-xl font-bold mb-4">Respuestas ({topic.replies.length})</h2>
                <div className="space-y-4 mb-8">
                    {topic.replies.map((reply, index) => (
                        <AnimatedWrapper key={reply.id} delay={100 * index}>
                            <Card>
                                <CardContent className="pt-4">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={reply.authorAvatar} />
                                            <AvatarFallback>{reply.author[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{reply.author}</span>
                                                <span className="text-xs text-muted-foreground">{reply.createdAt}</span>
                                            </div>
                                            <p className="text-sm text-foreground/90">{reply.content}</p>
                                            <div className="flex items-center gap-2 mt-2">
                                                <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                                                    <ThumbsUp className="mr-1 h-3 w-3" />
                                                    {reply.likes}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </AnimatedWrapper>
                    ))}
                </div>
            </AnimatedWrapper>

            {/* Reply Form */}
            <AnimatedWrapper delay={400}>
                <Card>
                    <CardContent className="pt-4">
                        <h3 className="font-medium mb-3">Añadir una respuesta</h3>
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
