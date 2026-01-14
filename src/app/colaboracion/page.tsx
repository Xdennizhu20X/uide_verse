'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { AnimatedWrapper } from '@/components/animated-wrapper';
import { Users, Plus, Search, Clock, CheckCircle, XCircle, Send, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Types
interface Collaboration {
    id: number;
    title: string;
    description: string;
    author: string;
    authorAvatar: string;
    skills: string[];
    projectName?: string;
    status: 'open' | 'closed';
    requests: number;
    createdAt: string;
}

interface CollaborationRequest {
    id: number;
    collaborationId: number;
    userName: string;
    userAvatar: string;
    message: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

// Mocked data
const initialCollaborations: Collaboration[] = [
    {
        id: 1,
        title: 'Busco desarrollador frontend para app de monitoreo ambiental',
        description: 'Estoy desarrollando una aplicación para monitorear la calidad del aire en tiempo real. Necesito ayuda con la interfaz de usuario y visualización de datos. El proyecto usa React y Chart.js.',
        author: 'María García',
        authorAvatar: 'https://placehold.co/40x40.png',
        skills: ['React', 'Chart.js', 'CSS', 'UI/UX'],
        projectName: 'EcoMonitor App',
        status: 'open',
        requests: 3,
        createdAt: 'Hace 2 días',
    },
    {
        id: 2,
        title: 'Colaborador para sistema IoT de riego inteligente',
        description: 'Proyecto de automatización de riego para jardines urbanos. Busco alguien con experiencia en Arduino o ESP32 para integrar sensores de humedad.',
        author: 'Carlos López',
        authorAvatar: 'https://placehold.co/40x40.png',
        skills: ['Arduino', 'ESP32', 'IoT', 'Python'],
        projectName: 'SmartGarden',
        status: 'open',
        requests: 5,
        createdAt: 'Hace 3 días',
    },
    {
        id: 3,
        title: 'Diseñador UX para plataforma educativa',
        description: 'Necesito un diseñador UX/UI para mejorar la experiencia de usuario de una plataforma de cursos online. Experiencia con Figma es ideal.',
        author: 'Ana Martínez',
        authorAvatar: 'https://placehold.co/40x40.png',
        skills: ['Figma', 'UI/UX', 'Diseño Web', 'Prototipado'],
        status: 'open',
        requests: 2,
        createdAt: 'Hace 5 días',
    },
    {
        id: 4,
        title: 'Backend developer para API REST',
        description: 'Proyecto de gestión de inventarios. Busco colaborador para desarrollar la API con Node.js y MongoDB.',
        author: 'Pedro Sánchez',
        authorAvatar: 'https://placehold.co/40x40.png',
        skills: ['Node.js', 'MongoDB', 'Express', 'REST API'],
        projectName: 'InventoryPro',
        status: 'closed',
        requests: 8,
        createdAt: 'Hace 1 semana',
    },
];

const skillOptions = [
    'React', 'Angular', 'Vue', 'Node.js', 'Python', 'Java', 'Flutter', 'Swift',
    'Arduino', 'ESP32', 'IoT', 'Machine Learning', 'UI/UX', 'Figma', 'MongoDB',
    'PostgreSQL', 'Firebase', 'AWS', 'Docker', 'Kubernetes'
];

export default function CollaborationPage() {
    const { toast } = useToast();
    const [collaborations, setCollaborations] = useState<Collaboration[]>(initialCollaborations);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSkill, setFilterSkill] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // New collaboration dialog
    const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
    const [newCollab, setNewCollab] = useState({
        title: '',
        description: '',
        skills: '',
        projectName: '',
    });

    // Request dialog
    const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
    const [selectedCollab, setSelectedCollab] = useState<Collaboration | null>(null);
    const [requestMessage, setRequestMessage] = useState('');

    // Filter collaborations
    const filteredCollaborations = collaborations.filter(collab => {
        const matchesSearch = collab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            collab.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSkill = filterSkill === 'all' || collab.skills.includes(filterSkill);
        const matchesStatus = filterStatus === 'all' || collab.status === filterStatus;
        return matchesSearch && matchesSkill && matchesStatus;
    });

    const handleCreateCollab = () => {
        if (!newCollab.title.trim() || !newCollab.description.trim()) {
            toast({
                title: "Error",
                description: "Por favor completa todos los campos obligatorios.",
                variant: "destructive",
            });
            return;
        }

        const skills = newCollab.skills.split(',').map(s => s.trim()).filter(s => s);

        const collaboration: Collaboration = {
            id: Date.now(),
            title: newCollab.title,
            description: newCollab.description,
            author: 'Usuario Actual',
            authorAvatar: 'https://placehold.co/40x40.png',
            skills: skills,
            projectName: newCollab.projectName || undefined,
            status: 'open',
            requests: 0,
            createdAt: 'Ahora mismo',
        };

        setCollaborations([collaboration, ...collaborations]);
        setNewCollab({ title: '', description: '', skills: '', projectName: '' });
        setIsNewDialogOpen(false);

        toast({
            title: "¡Llamado publicado!",
            description: "Tu llamado a colaboradores ha sido publicado exitosamente.",
        });
    };

    const handleSendRequest = () => {
        if (!requestMessage.trim() || !selectedCollab) return;

        // Update the collaboration's request count
        setCollaborations(collaborations.map(c =>
            c.id === selectedCollab.id
                ? { ...c, requests: c.requests + 1 }
                : c
        ));

        setRequestMessage('');
        setIsRequestDialogOpen(false);
        setSelectedCollab(null);

        toast({
            title: "Solicitud enviada",
            description: "Tu solicitud de colaboración ha sido enviada. El autor será notificado.",
        });
    };

    const openRequestDialog = (collab: Collaboration) => {
        setSelectedCollab(collab);
        setIsRequestDialogOpen(true);
    };

    return (
        <div className="container py-12 md:py-16">
            {/* Header */}
            <AnimatedWrapper>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-10 w-10 text-primary" />
                            <h1 className="text-4xl font-bold font-headline">Colaboración</h1>
                        </div>
                        <p className="text-muted-foreground max-w-2xl">
                            Encuentra colaboradores para tus proyectos o únete a proyectos que buscan tu talento.
                        </p>
                    </div>
                    <Button size="lg" onClick={() => setIsNewDialogOpen(true)}>
                        <Plus className="mr-2 h-5 w-5" /> Publicar Llamado
                    </Button>
                </div>
            </AnimatedWrapper>

            {/* Filters */}
            <AnimatedWrapper delay={100}>
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Buscar colaboraciones..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <Select value={filterSkill} onValueChange={setFilterSkill}>
                                <SelectTrigger className="w-full md:w-[200px]">
                                    <SelectValue placeholder="Filtrar por habilidad" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las habilidades</SelectItem>
                                    {skillOptions.map(skill => (
                                        <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Select value={filterStatus} onValueChange={setFilterStatus}>
                                <SelectTrigger className="w-full md:w-[180px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="open">Abiertos</SelectItem>
                                    <SelectItem value="closed">Cerrados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </AnimatedWrapper>

            {/* Collaboration List */}
            <div className="space-y-4">
                {filteredCollaborations.length === 0 ? (
                    <AnimatedWrapper delay={200}>
                        <Card className="text-center py-12">
                            <CardContent>
                                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No hay colaboraciones</h3>
                                <p className="text-muted-foreground mb-4">
                                    No se encontraron colaboraciones con los filtros seleccionados.
                                </p>
                                <Button onClick={() => setIsNewDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> Publicar el primer llamado
                                </Button>
                            </CardContent>
                        </Card>
                    </AnimatedWrapper>
                ) : (
                    filteredCollaborations.map((collab, index) => (
                        <AnimatedWrapper key={collab.id} delay={100 * (index + 1)}>
                            <Card className={`transition-all hover:shadow-lg ${collab.status === 'closed' ? 'opacity-60' : ''}`}>
                                <CardContent className="pt-6">
                                    <div className="flex flex-col md:flex-row gap-4">
                                        {/* Author Avatar */}
                                        <Avatar className="h-12 w-12 hidden md:flex">
                                            <AvatarImage src={collab.authorAvatar} />
                                            <AvatarFallback>{collab.author[0]}</AvatarFallback>
                                        </Avatar>

                                        {/* Content */}
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className="text-lg font-semibold">{collab.title}</h3>
                                                        <Badge variant={collab.status === 'open' ? 'default' : 'secondary'}>
                                                            {collab.status === 'open' ? (
                                                                <><CheckCircle className="mr-1 h-3 w-3" /> Abierto</>
                                                            ) : (
                                                                <><XCircle className="mr-1 h-3 w-3" /> Cerrado</>
                                                            )}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                        <span className="flex items-center gap-1">
                                                            <Avatar className="h-5 w-5 md:hidden">
                                                                <AvatarImage src={collab.authorAvatar} />
                                                                <AvatarFallback>{collab.author[0]}</AvatarFallback>
                                                            </Avatar>
                                                            {collab.author}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {collab.createdAt}
                                                        </span>
                                                        {collab.projectName && (
                                                            <span className="text-primary font-medium">
                                                                📁 {collab.projectName}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <p className="text-foreground/80">{collab.description}</p>

                                            <div className="flex flex-wrap gap-2">
                                                {collab.skills.map(skill => (
                                                    <Badge key={skill} variant="outline" className="bg-secondary/10 text-secondary border-secondary/30">
                                                        {skill}
                                                    </Badge>
                                                ))}
                                            </div>

                                            <div className="flex items-center justify-between pt-2">
                                                <span className="text-sm text-muted-foreground">
                                                    {collab.requests} solicitudes recibidas
                                                </span>
                                                {collab.status === 'open' && (
                                                    <Button onClick={() => openRequestDialog(collab)}>
                                                        <Send className="mr-2 h-4 w-4" /> Enviar Solicitud
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </AnimatedWrapper>
                    ))
                )}
            </div>

            {/* New Collaboration Dialog */}
            <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Publicar Llamado a Colaboradores</DialogTitle>
                        <DialogDescription>
                            Describe qué tipo de colaborador buscas y qué habilidades necesitas.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Título del llamado *</Label>
                            <Input
                                id="title"
                                placeholder="Ej: Busco desarrollador frontend para app móvil"
                                value={newCollab.title}
                                onChange={(e) => setNewCollab({ ...newCollab, title: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="projectName">Nombre del proyecto (opcional)</Label>
                            <Input
                                id="projectName"
                                placeholder="Ej: EcoApp"
                                value={newCollab.projectName}
                                onChange={(e) => setNewCollab({ ...newCollab, projectName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descripción *</Label>
                            <Textarea
                                id="description"
                                placeholder="Describe el proyecto, qué tareas realizaría el colaborador, tiempo estimado, etc."
                                value={newCollab.description}
                                onChange={(e) => setNewCollab({ ...newCollab, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="skills">Habilidades requeridas (separadas por coma)</Label>
                            <Input
                                id="skills"
                                placeholder="Ej: React, Node.js, Firebase"
                                value={newCollab.skills}
                                onChange={(e) => setNewCollab({ ...newCollab, skills: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateCollab}>
                            <Plus className="mr-2 h-4 w-4" /> Publicar Llamado
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Request Dialog */}
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Enviar Solicitud de Colaboración</DialogTitle>
                        <DialogDescription>
                            {selectedCollab && (
                                <span>Solicitud para: <strong>{selectedCollab.title}</strong></span>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="message">Mensaje para el autor</Label>
                            <Textarea
                                id="message"
                                placeholder="Preséntate brevemente y explica por qué te interesa colaborar en este proyecto..."
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                rows={5}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRequestDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSendRequest} disabled={!requestMessage.trim()}>
                            <Send className="mr-2 h-4 w-4" /> Enviar Solicitud
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
