import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';
import { AnimatedWrapper } from '@/components/animated-wrapper';

const forumTopics = [
  { id: 1, title: '¿Ideas para nuevos proyectos ecológicos?', author: 'Alice', replies: 12, lastReply: 'hace 2 horas', tag: 'EcoUide' },
  { id: 2, title: 'Ayuda con la gestión de estado en React', author: 'Bob', replies: 5, lastReply: 'hace 5 horas', tag: 'React' },
  { id: 3, title: 'Presentación: Mi nueva estación meteorológica IoT', author: 'Charlie', replies: 8, lastReply: 'hace 1 día', tag: 'Presentación' },
  { id: 4, title: 'Mejores prácticas para el diseño de API REST', author: 'Diana', replies: 25, lastReply: 'hace 3 días', tag: 'Discusión' },
];

export default function ForumPage() {
  return (
    <div className="container py-12 md:py-16">
      <AnimatedWrapper>
        <div className="flex justify-between items-center mb-12">
            <div className="text-left">
                <MessageSquare className="h-16 w-16 text-primary mb-4"/>
                <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Foro Comunitario</h1>
                <p className="mt-4 text-lg text-muted-foreground max-w-3xl">
                  Discute ideas, comparte conocimiento y conecta con otros desarrolladores e innovadores.
                </p>
            </div>
            <Button size="lg"><Plus className="mr-2 h-5 w-5"/> Nuevo Tema</Button>
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
                    {forumTopics.map((topic) => (
                        <TableRow key={topic.id} className="cursor-pointer hover:bg-muted/50">
                            <TableCell>
                                <div className="font-medium">{topic.title}</div>
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
    </div>
  );
}
