'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Plus, Clock, MessageCircle, User, Sparkles, Search } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { ForumTopic } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const tagOptions = ['EcoUide', 'React', 'Presentación', 'Discusión', 'Ayuda', 'General'];

// Colores por categoría para mejor affordance visual
const tagColors: Record<string, string> = {
  'EcoUide': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'React': 'bg-blue-100 text-blue-700 border-blue-200',
  'Presentación': 'bg-purple-100 text-purple-700 border-purple-200',
  'Discusión': 'bg-primary text-white border-primary',
  'Ayuda': 'bg-rose-100 text-rose-700 border-rose-200',
  'General': 'bg-gray-100 text-gray-700 border-gray-200',
};

// Skeleton loader para feedback visual
function TopicSkeleton() {
  return (
    <TableRow>
      <TableCell>
        <div className="space-y-2">
          <div className="h-5 bg-muted animate-pulse rounded w-3/4" />
          <div className="flex items-center gap-2">
            <div className="h-5 w-20 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded w-32" />
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="h-8 bg-muted animate-pulse rounded mx-auto w-12" />
      </TableCell>
      <TableCell>
        <div className="h-4 bg-muted animate-pulse rounded w-32" />
      </TableCell>
    </TableRow>
  );
}

export default function ForumPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', tag: '' });
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    const q = query(collection(db, 'forum_topics'), orderBy('lastReplyAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTopics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumTopic[];
      setTopics(fetchedTopics);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Filter topics based on active tab
  const getFilteredTopics = () => {
    if (activeTab === "mine" && user) {
      return topics.filter(t => t.authorId === user.uid);
    }
    return topics;
  };

  const filteredTopics = getFilteredTopics();

  const handleCreateTopic = async () => {
    if (!user) {
      toast({ title: "Debes iniciar sesión", variant: "destructive" });
      return;
    }
    if (!newTopic.title.trim() || !newTopic.content.trim() || !newTopic.tag) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'forum_topics'), {
        title: newTopic.title,
        content: newTopic.content,
        tag: newTopic.tag,
        author: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (user.displayName || 'Usuario'),
        authorId: user.uid,
        authorAvatar: userData?.photoURL || user.photoURL,
        createdAt: serverTimestamp(),
        repliesCount: 0,
        lastReplyAt: serverTimestamp(),
        likes: 0,
        likedBy: []
      });

      setNewTopic({ title: '', content: '', tag: '' });
      setIsDialogOpen(false);
      setActiveTab("mine"); // Switch to "my forums" after creating
      toast({
        title: "¡Tema publicado!",
        description: "Tu tema ha sido creado exitosamente"
      });
    } catch (error) {
      console.error("Error creating topic:", error);
      toast({ title: "Error al publicar", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTopicClick = (topicId: string) => {
    router.push(`/forum/${topicId}`);
  };

  return (
    <div className="container pt-24 pb-12 md:pt-28 md:pb-16">
      <AnimatedWrapper>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-12">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-3 bg-primary/10 px-4 py-2 rounded-full">
              <MessageSquare className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-primary">Comunidad Activa</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-headline text-primary">
              Foro Comunitario
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl leading-relaxed">
              Discute ideas, comparte conocimiento y conecta con otros desarrolladores e innovadores.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
              >
                <Plus className="h-5 w-5" />
                <span>Nuevo Tema</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <DialogTitle className="text-2xl">Crear Nuevo Tema</DialogTitle>
                </div>
                <DialogDescription className="text-base">
                  Inicia una nueva discusión en el foro comunitario. Sé claro y específico para obtener mejores respuestas.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-6 py-6">
                <div className="grid gap-3">
                  <Label htmlFor="title" className="text-base font-medium">
                    Título del tema
                  </Label>
                  <Input
                    id="title"
                    placeholder="¿Cuál es tu pregunta o tema?"
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                    className="text-base"
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="tag" className="text-base font-medium">
                    Categoría
                  </Label>
                  <Select
                    value={newTopic.tag}
                    onValueChange={(value) => setNewTopic({ ...newTopic, tag: value })}
                  >
                    <SelectTrigger className="text-base">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {tagOptions.map((tag) => (
                        <SelectItem key={tag} value={tag} className="text-base">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${tagColors[tag]?.split(' ')[0] || 'bg-gray-400'}`} />
                            {tag}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="content" className="text-base font-medium">
                    Contenido
                  </Label>
                  <Textarea
                    id="content"
                    placeholder="Describe tu tema o pregunta con detalle..."
                    rows={6}
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                    className="text-base resize-none"
                  />
                  <p className="text-sm text-muted-foreground">
                    Tip: Incluye contexto y detalles relevantes para obtener mejores respuestas
                  </p>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateTopic}
                  disabled={isSubmitting || !newTopic.title.trim() || !newTopic.content.trim() || !newTopic.tag}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      Publicando...
                    </>
                  ) : (
                    'Publicar Tema'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedWrapper>

      {/* Tabs for All Forums / My Forums */}
      <AnimatedWrapper delay={100}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
            <TabsTrigger value="all" className="gap-2">
              <Search className="h-4 w-4" />
              Todos los Foros
            </TabsTrigger>
            <TabsTrigger value="mine" disabled={!user} className="gap-2">
              <User className="h-4 w-4" />
              Mis Foros Publicados
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </AnimatedWrapper>

      <AnimatedWrapper delay={200}>
        <Card className="overflow-hidden shadow-md border-2">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[60%] font-semibold text-base">Tema</TableHead>
                  <TableHead className="text-center font-semibold text-base">
                    <div className="flex items-center justify-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      <span>Respuestas</span>
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-base">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Última Actividad</span>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <>
                    <TopicSkeleton />
                    <TopicSkeleton />
                    <TopicSkeleton />
                  </>
                ) : filteredTopics.length > 0 ? (
                  filteredTopics.map((topic) => (
                    <TableRow
                      key={topic.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors group"
                      onClick={() => handleTopicClick(topic.id)}
                    >
                      <TableCell className="py-4">
                        <div className="space-y-2">
                          <div className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-2">
                            {topic.title}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                            <Badge
                              variant="secondary"
                              className={`${tagColors[topic.tag] || 'bg-gray-100 text-gray-700'} border font-medium`}
                            >
                              {topic.tag}
                            </Badge>
                            <div className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5" />
                              <span>{topic.author}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-muted rounded-full">
                          <MessageCircle className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">{topic.repliesCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {topic.lastReplyAt?.seconds
                              ? formatDistanceToNow(new Date(topic.lastReplyAt.seconds * 1000), {
                                addSuffix: true,
                                locale: es
                              })
                              : 'Reciente'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : null}
              </TableBody>
            </Table>
          </div>
        </Card>
      </AnimatedWrapper>

      {!isLoading && topics.length === 0 && (
        <AnimatedWrapper delay={300}>
          <div className="text-center py-16">
            <div className="inline-flex p-4 bg-muted rounded-full mb-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No hay temas aún</h3>
            <p className="text-muted-foreground text-lg mb-6">
              Sé el primero en iniciar una discusión en la comunidad
            </p>
            <Button
              size="lg"
              onClick={() => setIsDialogOpen(true)}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Crear Primer Tema
            </Button>
          </div>
        </AnimatedWrapper>
      )}
    </div>
  );
}