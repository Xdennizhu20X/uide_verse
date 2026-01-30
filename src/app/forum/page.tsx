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
import { MessageSquare, Plus } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { ForumTopic } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

const tagOptions = ['EcoUide', 'React', 'Presentación', 'Discusión', 'Ayuda', 'General'];

export default function ForumPage() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [topics, setTopics] = useState<ForumTopic[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', tag: '' });

  useEffect(() => {
    const q = query(collection(db, 'forum_topics'), orderBy('lastReplyAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedTopics = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ForumTopic[];
      setTopics(fetchedTopics);
    });
    return () => unsubscribe();
  }, []);

  const handleCreateTopic = async () => {
    if (!user) {
      toast({ title: "Debes iniciar sesión", variant: "destructive" });
      return;
    }
    if (!newTopic.title.trim() || !newTopic.content.trim() || !newTopic.tag) {
      toast({ title: "Completa todos los campos", variant: "destructive" });
      return;
    }

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
        lastReplyAt: serverTimestamp(), // Initially same as created
        likes: 0,
        likedBy: []
      });

      setNewTopic({ title: '', content: '', tag: '' });
      setIsDialogOpen(false);
      toast({ title: "Tema publicado con éxito" });
    } catch (error) {
      console.error("Error creating topic:", error);
      toast({ title: "Error al publicar", variant: "destructive" });
    }
  };

  const handleTopicClick = (topicId: string) => {
    router.push(`/forum/${topicId}`);
  };

  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
          <div className="text-left">
            <MessageSquare className="h-16 w-16 text-primary mb-4" />
            <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Foro Comunitario</h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
              Discute ideas, comparte conocimiento y conecta con otros desarrolladores e innovadores.
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" /> Nuevo Tema
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[525px]">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Tema</DialogTitle>
                <DialogDescription>
                  Inicia una nueva discusión en el foro comunitario.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Título del tema</Label>
                  <Input
                    id="title"
                    placeholder="Escribe un título descriptivo..."
                    value={newTopic.title}
                    onChange={(e) => setNewTopic({ ...newTopic, title: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tag">Categoría</Label>
                  <Select
                    value={newTopic.tag}
                    onValueChange={(value) => setNewTopic({ ...newTopic, tag: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {tagOptions.map((tag) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="content">Contenido</Label>
                  <Textarea
                    id="content"
                    placeholder="Describe tu tema o pregunta..."
                    rows={5}
                    value={newTopic.content}
                    onChange={(e) => setNewTopic({ ...newTopic, content: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateTopic}>
                  Publicar Tema
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </AnimatedWrapper>

      <AnimatedWrapper delay={200}>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60%]">Tema</TableHead>
                <TableHead className="text-center">Respuestas</TableHead>
                <TableHead>Última Actividad</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topics.map((topic) => (
                <TableRow
                  key={topic.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleTopicClick(topic.id)} // id is string now, verify router handling
                >
                  <TableCell>
                    <div className="font-medium hover:text-primary transition-colors">{topic.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{topic.tag}</Badge>
                      <span>por {topic.author}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{topic.repliesCount || 0}</TableCell>
                  <TableCell>
                    {topic.lastReplyAt?.seconds ? formatDistanceToNow(new Date(topic.lastReplyAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </AnimatedWrapper>

      {topics.length === 0 && (
        <AnimatedWrapper delay={300}>
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No hay temas aún</h3>
            <p className="text-muted-foreground">Sé el primero en iniciar una discusión.</p>
          </div>
        </AnimatedWrapper>
      )}
    </div>
  );
}
