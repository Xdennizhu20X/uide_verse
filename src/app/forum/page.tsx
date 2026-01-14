'use client';

import { useState } from 'react';
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

// Mocked forum topics data
const initialTopics = [
  { id: 1, title: '¿Ideas para nuevos proyectos ecológicos?', author: 'Alice García', replies: 12, lastReply: 'hace 2 horas', tag: 'EcoUide', content: 'Estoy buscando inspiración para mi próximo proyecto ecológico. ¿Alguien tiene ideas innovadoras que podamos desarrollar juntos?' },
  { id: 2, title: 'Ayuda con la gestión de estado en React', author: 'Bob Martínez', replies: 5, lastReply: 'hace 5 horas', tag: 'React', content: '¿Cuál es la mejor manera de manejar el estado global en una aplicación React? ¿Redux, Context API o Zustand?' },
  { id: 3, title: 'Presentación: Mi nueva estación meteorológica IoT', author: 'Charlie López', replies: 8, lastReply: 'hace 1 día', tag: 'Presentación', content: 'Quiero compartir mi proyecto de estación meteorológica usando Arduino y sensores DHT22. ¡Pueden ver las fotos adjuntas!' },
  { id: 4, title: 'Mejores prácticas para el diseño de API REST', author: 'Diana Rodríguez', replies: 25, lastReply: 'hace 3 días', tag: 'Discusión', content: 'Abramos un debate sobre las mejores prácticas para diseñar APIs REST. Versionado, naming conventions, autenticación, etc.' },
];

const tagOptions = ['EcoUide', 'React', 'Presentación', 'Discusión', 'Ayuda', 'General'];

export default function ForumPage() {
  const router = useRouter();
  const [topics, setTopics] = useState(initialTopics);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTopic, setNewTopic] = useState({ title: '', content: '', tag: '' });

  const handleCreateTopic = () => {
    if (!newTopic.title.trim() || !newTopic.content.trim() || !newTopic.tag) {
      return;
    }

    const topic = {
      id: Date.now(),
      title: newTopic.title,
      author: 'Usuario Actual',
      replies: 0,
      lastReply: 'ahora mismo',
      tag: newTopic.tag,
      content: newTopic.content,
    };

    setTopics([topic, ...topics]);
    setNewTopic({ title: '', content: '', tag: '' });
    setIsDialogOpen(false);
  };

  const handleTopicClick = (topicId: number) => {
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
                  onClick={() => handleTopicClick(topic.id)}
                >
                  <TableCell>
                    <div className="font-medium hover:text-primary transition-colors">{topic.title}</div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Badge variant="secondary">{topic.tag}</Badge>
                      <span>por {topic.author}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{topic.replies}</TableCell>
                  <TableCell>{topic.lastReply}</TableCell>
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
