'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // New Import
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
import { Users, Plus, Search, Clock, CheckCircle, XCircle, Send, User as UserIcon, Settings } from 'lucide-react';
import { ManageCollaborationDialog } from '@/components/manage-collaboration-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc, where } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import type { Collaboration } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const skillOptions = [
    // Tecnología
    'React', 'Python', 'IoT', 'Análisis de Datos',
    // Derecho & Ciencias Sociales
    'Derecho Penal', 'Investigación Legal', 'Psicología', 'Sociología', 'Redacción Académica',
    // Arquitectura & Diseño
    'Arquitectura', 'AutoCAD', 'Diseño de Interiores', 'Urbanismo', 'Modelado 3D',
    // Negocios
    'Marketing Digital', 'Finanzas', 'Gestión de Proyectos', 'Recursos Humanos', 'Contabilidad',
    // Salud
    'Nutrición', 'Primeros Auxilios', 'Investigación Médica',
    // Comunicación
    'Periodismo', 'Fotografía', 'Edición de Video', 'Relaciones Públicas'
];

export default function CollaborationPage() {
    const { toast } = useToast();
    const { user, userData } = useAuth();
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSkill, setFilterSkill] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [activeTab, setActiveTab] = useState("explore"); // "explore" | "mine"

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

    // Management dialog
    const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
    const [collabToManage, setCollabToManage] = useState<Collaboration | null>(null);

    useEffect(() => {
        const q = query(collection(db, 'collaborations'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedCollabs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Collaboration[];
            setCollaborations(fetchedCollabs);
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Filter collaborations logic
    const getFilteredCollaborations = () => {
        let filtered = collaborations;

        // Tab Filter
        if (activeTab === "mine" && user) {
            filtered = filtered.filter(c => c.authorId === user.uid);
        } else if (activeTab === "explore") {
            // Optional: exclude my own from explore? or show all? 
            // Usually explore shows everything, but maybe we want to hide mine?
            // Let's keep showing everything in explore for now.
        }

        return filtered.filter(collab => {
            const matchesSearch = collab.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                collab.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSkill = filterSkill === 'all' || collab.skills.includes(filterSkill);
            const matchesStatus = filterStatus === 'all' || collab.status === filterStatus;
            return matchesSearch && matchesSkill && matchesStatus;
        });
    };

    const filteredCollaborations = getFilteredCollaborations();

    const handleCreateCollab = async () => {
        if (!user) {
            toast({
                title: "Inicia sesión",
                description: "Debes estar autenticado para publicar.",
                variant: "destructive"
            });
            return;
        }
        if (!newCollab.title.trim() || !newCollab.description.trim()) {
            return; // Handled by UI validation state
        }

        const skills = newCollab.skills.split(',').map(s => s.trim()).filter(s => s);

        try {
            await addDoc(collection(db, 'collaborations'), {
                title: newCollab.title,
                description: newCollab.description,
                author: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (user.displayName || 'Usuario'),
                authorId: user.uid,
                authorAvatar: userData?.photoURL || user.photoURL || 'https://placehold.co/40x40.png',
                skills: skills,
                projectName: newCollab.projectName || '',
                status: 'open',
                requests: 0,
                createdAt: serverTimestamp(),
            });

            setNewCollab({ title: '', description: '', skills: '', projectName: '' });
            setIsNewDialogOpen(false);
            setActiveTab("mine"); // Switch to my posts to see the new one
            toast({
                title: "¡Llamado publicado!",
                description: "Tu llamado a colaboradores ha sido guardado.",
            });
        } catch (error) {
            console.error("Error creating collab:", error);
            toast({
                title: "Error",
                description: "No se pudo publicar la colaboración.",
                variant: "destructive",
            });
        }
    };

    const handleSendRequest = async () => {
        if (!requestMessage.trim() || !selectedCollab || !user) return;

        try {
            // 1. Create Request Document in sub-collection or separate collection
            const requestRef = await addDoc(collection(db, 'collaboration_requests'), {
                collaborationId: selectedCollab.id,
                senderId: user.uid,
                senderName: userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (user.displayName || 'Usuario'),
                senderAvatar: userData?.photoURL || user.photoURL,
                message: requestMessage,
                status: 'pending',
                createdAt: serverTimestamp(),
                contactInfo: user.email
            });

            // 2. Update request count on parent doc
            const collabRef = doc(db, 'collaborations', selectedCollab.id);
            await updateDoc(collabRef, {
                requests: (selectedCollab.requests || 0) + 1
            });

            // 3. Create Notification for the author
            if (selectedCollab.authorId !== user.uid) {
                await addDoc(collection(db, 'notifications'), {
                    type: 'collaboration',
                    title: 'Nueva solicitud de colaboración',
                    message: `${userData?.firstName ? `${userData.firstName} ${userData.lastName || ''}`.trim() : (user.displayName || 'Un usuario')} quiere colaborar en "${selectedCollab.title}"`,
                    recipientId: selectedCollab.authorId,
                    senderId: user.uid,
                    avatar: userData?.photoURL || user.photoURL,
                    read: false,
                    createdAt: new Date().toISOString(),
                    collaborationId: selectedCollab.id,
                    requestId: requestRef.id
                });
            }

            setRequestMessage('');
            setIsRequestDialogOpen(false);
            setSelectedCollab(null);

            toast({
                title: "Solicitud enviada",
                description: "Tu solicitud ha sido notificada al autor.",
            });
        } catch (error) {
            console.error(error);
            toast({ title: "Error", description: "Falló el envío.", variant: "destructive" });
        }
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
                            Encuentra colaboradores de todas las facultades: Derecho, Arquitectura, Psicología, Ingeniería y más.
                        </p>
                    </div>
                    <Button size="lg" onClick={() => setIsNewDialogOpen(true)}>
                        <Plus className="mr-2 h-5 w-5" /> Publicar Llamado
                    </Button>
                </div>
            </AnimatedWrapper>

            {/* Filters & Tabs */}
            <AnimatedWrapper delay={100}>

                <Tabs defaultValue="explore" value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="mb-4">
                        <TabsTrigger value="explore">Explorar Todos</TabsTrigger>
                        <TabsTrigger value="mine" disabled={!user}>Mis Llamados</TabsTrigger>
                    </TabsList>

                    <Card>
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
                </Tabs>
            </AnimatedWrapper>

            {/* Collaboration List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">Cargando colaboraciones...</div>
                ) : filteredCollaborations.length === 0 ? (
                    <AnimatedWrapper delay={200}>
                        <Card className="text-center py-12">
                            <CardContent>
                                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-semibold mb-2">No hay colaboraciones</h3>
                                <p className="text-muted-foreground mb-4">
                                    {activeTab === 'mine' ? "No has publicado ningún llamado aún." : "No se encontraron resultados con tus filtros."}
                                </p>
                                <Button onClick={() => setIsNewDialogOpen(true)}>
                                    <Plus className="mr-2 h-4 w-4" /> {activeTab === 'mine' ? "Crear mi primer llamado" : "Publicar llamado"}
                                </Button>
                            </CardContent>
                        </Card>
                    </AnimatedWrapper>
                ) : (
                    filteredCollaborations.map((collab, index) => {
                        const isMyCollab = user && collab.authorId === user.uid;
                        return (
                            <AnimatedWrapper key={collab.id} delay={100 * (index + 1)}>
                                <Card className={`transition-all hover:shadow-lg ${collab.status === 'closed' ? 'opacity-60' : ''} ${isMyCollab ? 'border-primary/20 bg-primary/5' : ''}`}>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            <Avatar className="h-12 w-12 hidden md:flex">
                                                <AvatarImage src={collab.authorAvatar} />
                                                <AvatarFallback>{collab.author ? collab.author[0] : '?'}</AvatarFallback>
                                            </Avatar>

                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-lg font-semibold">{collab.title}</h3>
                                                            {isMyCollab && (
                                                                <Badge variant="outline" className="border-primary text-primary">
                                                                    <UserIcon className="h-3 w-3 mr-1" /> Tú
                                                                </Badge>
                                                            )}
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
                                                                    <AvatarFallback>{collab.author ? collab.author[0] : '?'}</AvatarFallback>
                                                                </Avatar>
                                                                {collab.author}
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {collab.createdAt?.seconds ? formatDistanceToNow(new Date(collab.createdAt.seconds * 1000), { addSuffix: true, locale: es }) : 'Reciente'}
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
                                                        {collab.requests || 0} solicitudes recibidas
                                                    </span>
                                                    {isMyCollab ? (
                                                        <Button variant="outline" size="sm" onClick={() => { setCollabToManage(collab); setIsManageDialogOpen(true); }}>
                                                            <Settings className="mr-2 h-4 w-4" /> Gestionar
                                                        </Button>
                                                    ) : (
                                                        collab.status === 'open' && (
                                                            <Button onClick={() => openRequestDialog(collab)}>
                                                                <Send className="mr-2 h-4 w-4" /> Enviar Solicitud
                                                            </Button>
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </AnimatedWrapper>
                        );
                    })
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

                    {!user && (
                        <div className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-600 dark:text-yellow-400 p-3 rounded-md flex items-center gap-2 mb-2 text-sm">
                            <Users className="h-4 w-4" />
                            <span>Debes <strong>iniciar sesión</strong> para poder publicar un llamado.</span>
                        </div>
                    )}

                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className={!newCollab.title.trim() ? "text-muted-foreground" : ""}>Título del llamado *</Label>
                            <Input
                                id="title"
                                placeholder="Ej: Busco estudiante de Derecho para asesoría legal"
                                value={newCollab.title}
                                onChange={(e) => setNewCollab({ ...newCollab, title: e.target.value })}
                                className={!newCollab.title.trim() ? "border-muted" : ""}
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
                                placeholder="Ej: Investigación, Leyes, AutoCAD, Marketing"
                                value={newCollab.skills}
                                onChange={(e) => setNewCollab({ ...newCollab, skills: e.target.value })}
                            />
                        </div>

                        {/* Validation Hint */}
                        {user && (!newCollab.title.trim() || !newCollab.description.trim()) && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-2">
                                * Completa los campos obligatorios para publicar.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateCollab}
                            disabled={!user || !newCollab.title.trim() || !newCollab.description.trim()}
                            title={!user ? "Inicia sesión para publicar" : "Completa el formulario"}
                        >
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

            {/* Management Dialog */}
            {collabToManage && (
                <ManageCollaborationDialog
                    isOpen={isManageDialogOpen}
                    onOpenChange={setIsManageDialogOpen}
                    collaboration={collabToManage}
                />
            )}
        </div>
    );
}
