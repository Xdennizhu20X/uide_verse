'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
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
import {
    Users,
    Plus,
    Search,
    Clock,
    CheckCircle,
    XCircle,
    Send,
    User as UserIcon,
    Settings,
    AlertCircle,
    Sparkles,
    FileText,
    Loader2,
    Filter
} from 'lucide-react';
import { ManageCollaborationDialog } from '@/components/manage-collaboration-dialog';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
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

// Skeleton component for loading state
function CollaborationSkeleton() {
    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex gap-4">
                    <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                    <div className="flex-1 space-y-3">
                        <div className="space-y-2">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-16 w-full" />
                        <div className="flex gap-2">
                            <Skeleton className="h-6 w-20" />
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-6 w-20" />
                        </div>
                        <div className="flex justify-between items-center pt-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-9 w-32" />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function CollaborationPage() {
    const { toast } = useToast();
    const { user, userData } = useAuth();
    const [collaborations, setCollaborations] = useState<Collaboration[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSkill, setFilterSkill] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [activeTab, setActiveTab] = useState("explore");
    const [isCreating, setIsCreating] = useState(false);
    const [isSendingRequest, setIsSendingRequest] = useState(false);

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

        if (activeTab === "mine" && user) {
            filtered = filtered.filter(c => c.authorId === user.uid);
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
            return;
        }

        setIsCreating(true);
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
            setActiveTab("mine");
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
        } finally {
            setIsCreating(false);
        }
    };

    const handleSendRequest = async () => {
        if (!requestMessage.trim() || !selectedCollab || !user) return;

        setIsSendingRequest(true);
        try {
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

            const collabRef = doc(db, 'collaborations', selectedCollab.id);
            await updateDoc(collabRef, {
                requests: (selectedCollab.requests || 0) + 1
            });

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
                title: "¡Solicitud enviada!",
                description: "Tu solicitud ha sido notificada al autor.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "No se pudo enviar la solicitud.",
                variant: "destructive"
            });
        } finally {
            setIsSendingRequest(false);
        }
    };

    const openRequestDialog = (collab: Collaboration) => {
        setSelectedCollab(collab);
        setIsRequestDialogOpen(true);
    };

    return (
        <div className="container py-10 md:py-14 px-4">
            {/* Header */}
            <AnimatedWrapper>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10">
                                <Users className="h-7 w-7 text-primary" />
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold font-headline">Colaboración</h1>
                        </div>
                        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed">
                            Conecta con estudiantes de todas las facultades: Derecho, Arquitectura, Psicología, Ingeniería y más.
                        </p>
                    </div>
                    <Button
                        size="lg"
                        onClick={() => setIsNewDialogOpen(true)}
                        className="w-full md:w-auto gap-2 h-12 px-6 shadow-lg hover:shadow-xl transition-shadow"
                    >
                        <Plus className="h-5 w-5" />
                        Publicar Llamado
                    </Button>
                </div>
            </AnimatedWrapper>

            {/* Tabs & Filters */}
            <AnimatedWrapper delay={100}>
                <Tabs defaultValue="explore" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                    <TabsList className="grid w-full max-w-md grid-cols-2 h-12">
                        <TabsTrigger value="explore" className="gap-2">
                            <Search className="h-4 w-4" />
                            Explorar Todos
                        </TabsTrigger>
                        <TabsTrigger value="mine" disabled={!user} className="gap-2">
                            <UserIcon className="h-4 w-4" />
                            Mis Llamados
                        </TabsTrigger>
                    </TabsList>

                    {/* Filters Card */}
                    <Card className="shadow-lg border-2">
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                                    <Filter className="h-4 w-4" />
                                    Filtros
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* Search */}
                                    <div className="md:col-span-1">
                                        <Label htmlFor="search" className="text-sm font-medium mb-2 block">
                                            Buscar
                                        </Label>
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="search"
                                                placeholder="Buscar colaboraciones..."
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                className="pl-10 h-11"
                                            />
                                        </div>
                                    </div>

                                    {/* Skill Filter */}
                                    <div>
                                        <Label htmlFor="skill-filter" className="text-sm font-medium mb-2 block">
                                            Habilidad
                                        </Label>
                                        <Select value={filterSkill} onValueChange={setFilterSkill}>
                                            <SelectTrigger id="skill-filter" className="h-11">
                                                <SelectValue placeholder="Todas las habilidades" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todas las habilidades</SelectItem>
                                                {skillOptions.map(skill => (
                                                    <SelectItem key={skill} value={skill}>{skill}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Status Filter */}
                                    <div>
                                        <Label htmlFor="status-filter" className="text-sm font-medium mb-2 block">
                                            Estado
                                        </Label>
                                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                                            <SelectTrigger id="status-filter" className="h-11">
                                                <SelectValue placeholder="Todos" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Todos</SelectItem>
                                                <SelectItem value="open">Abiertos</SelectItem>
                                                <SelectItem value="closed">Cerrados</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Active filters indicator */}
                                {(searchTerm || filterSkill !== 'all' || filterStatus !== 'all') && (
                                    <div className="flex items-center gap-2 pt-2">
                                        <Badge variant="outline" className="gap-1">
                                            {filteredCollaborations.length} resultado{filteredCollaborations.length !== 1 ? 's' : ''}
                                        </Badge>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSearchTerm('');
                                                setFilterSkill('all');
                                                setFilterStatus('all');
                                            }}
                                            className="h-7 px-2 text-xs"
                                        >
                                            Limpiar filtros
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </Tabs>
            </AnimatedWrapper>

            {/* Collaboration List */}
            <div className="space-y-4 mt-8">
                {loading ? (
                    // Loading skeletons
                    <>
                        <AnimatedWrapper delay={200}>
                            <CollaborationSkeleton />
                        </AnimatedWrapper>
                        <AnimatedWrapper delay={300}>
                            <CollaborationSkeleton />
                        </AnimatedWrapper>
                        <AnimatedWrapper delay={400}>
                            <CollaborationSkeleton />
                        </AnimatedWrapper>
                    </>
                ) : filteredCollaborations.length === 0 ? (
                    // Empty state
                    <AnimatedWrapper delay={200}>
                        <Card className="text-center py-16 shadow-lg border-2 border-dashed">
                            <CardContent className="space-y-4">
                                <div className="flex justify-center">
                                    <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted">
                                        <Users className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-semibold">
                                        {activeTab === 'mine' ? 'No tienes llamados publicados' : 'No se encontraron colaboraciones'}
                                    </h3>
                                    <p className="text-muted-foreground max-w-md mx-auto">
                                        {activeTab === 'mine'
                                            ? "Publica tu primer llamado y empieza a conectar con colaboradores."
                                            : "No hay resultados que coincidan con tus filtros. Intenta ajustar los criterios de búsqueda."}
                                    </p>
                                </div>
                                <Button
                                    onClick={() => setIsNewDialogOpen(true)}
                                    size="lg"
                                    className="gap-2"
                                >
                                    <Plus className="h-5 w-5" />
                                    {activeTab === 'mine' ? "Crear mi primer llamado" : "Publicar llamado"}
                                </Button>
                            </CardContent>
                        </Card>
                    </AnimatedWrapper>
                ) : (
                    // Collaboration cards
                    filteredCollaborations.map((collab, index) => {
                        const isMyCollab = user && collab.authorId === user.uid;
                        return (
                            <AnimatedWrapper key={collab.id} delay={100 * Math.min(index + 1, 5)}>
                                <Card className={`
                                    transition-all duration-300 hover:shadow-xl border-2
                                    ${collab.status === 'closed' ? 'opacity-60' : 'hover:-translate-y-1'} 
                                    ${isMyCollab ? 'border-primary bg-primary/5' : 'hover:border-primary/30'}
                                `}>
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col md:flex-row gap-4">
                                            {/* Avatar - Desktop only */}
                                            <Avatar className="h-14 w-14 hidden md:flex border-2 border-border shadow-sm shrink-0">
                                                <AvatarImage src={collab.authorAvatar} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-lg">
                                                    {collab.author ? collab.author[0] : '?'}
                                                </AvatarFallback>
                                            </Avatar>

                                            {/* Content */}
                                            <div className="flex-1 space-y-4">
                                                {/* Header */}
                                                <div className="space-y-3">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <h3 className="text-xl font-bold text-foreground">
                                                                    {collab.title}
                                                                </h3>
                                                                {isMyCollab && (
                                                                    <Badge className="bg-primary text-primary-foreground border-primary">
                                                                        <UserIcon className="h-3 w-3 mr-1" /> Tuyo
                                                                    </Badge>
                                                                )}
                                                                <Badge variant={collab.status === 'open' ? 'default' : 'secondary'} className="gap-1">
                                                                    {collab.status === 'open' ? (
                                                                        <>
                                                                            <CheckCircle className="h-3 w-3" /> Abierto
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <XCircle className="h-3 w-3" /> Cerrado
                                                                        </>
                                                                    )}
                                                                </Badge>
                                                            </div>

                                                            {/* Meta info */}
                                                            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                                                <span className="flex items-center gap-1.5">
                                                                    <Avatar className="h-5 w-5 md:hidden border">
                                                                        <AvatarImage src={collab.authorAvatar} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {collab.author ? collab.author[0] : '?'}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <span className="font-medium">{collab.author}</span>
                                                                </span>
                                                                <span className="flex items-center gap-1.5">
                                                                    <Clock className="h-3.5 w-3.5 text-primary" />
                                                                    {collab.createdAt?.seconds
                                                                        ? formatDistanceToNow(new Date(collab.createdAt.seconds * 1000), { addSuffix: true, locale: es })
                                                                        : 'Reciente'}
                                                                </span>
                                                                {collab.projectName && (
                                                                    <Badge variant="outline" className="gap-1 bg-muted">
                                                                        <FileText className="h-3 w-3" />
                                                                        {collab.projectName}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Description */}
                                                    <p className="text-foreground leading-relaxed">
                                                        {collab.description}
                                                    </p>
                                                </div>

                                                {/* Skills */}
                                                <div className="flex flex-wrap gap-2">
                                                    {collab.skills.length > 0 ? (
                                                        collab.skills.map(skill => (
                                                            <Badge
                                                                key={skill}
                                                                className="bg-secondary text-white border-secondary font-medium"
                                                            >
                                                                {skill}
                                                            </Badge>
                                                        ))
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground italic">
                                                            Sin habilidades específicas
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Footer */}
                                                <div className="flex items-center justify-between pt-3 border-t">
                                                    <div className="flex items-center gap-2">
                                                        <Send className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm font-medium text-muted-foreground">
                                                            {collab.requests || 0} solicitud{collab.requests !== 1 ? 'es' : ''}
                                                        </span>
                                                    </div>

                                                    {isMyCollab ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setCollabToManage(collab);
                                                                setIsManageDialogOpen(true);
                                                            }}
                                                            className="gap-2 hover:bg-primary/10 hover:text-primary hover:border-primary"
                                                        >
                                                            <Settings className="h-4 w-4" />
                                                            Gestionar
                                                        </Button>
                                                    ) : (
                                                        collab.status === 'open' && (
                                                            <Button
                                                                onClick={() => openRequestDialog(collab)}
                                                                className="gap-2"
                                                            >
                                                                <Send className="h-4 w-4" />
                                                                Enviar Solicitud
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
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">Publicar Llamado a Colaboradores</DialogTitle>
                                <DialogDescription className="text-base mt-1">
                                    Describe qué tipo de colaborador buscas y qué habilidades necesitas.
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {!user && (
                        <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-950/20 border-2 border-yellow-200 dark:border-yellow-900 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
                            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="font-semibold">Inicia sesión para continuar</p>
                                <p className="text-sm">Debes estar autenticado para poder publicar un llamado.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-5 py-4">
                        {/* Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium flex items-center gap-2">
                                Título del llamado
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="title"
                                placeholder="Ej: Busco estudiante de Derecho para asesoría legal"
                                value={newCollab.title}
                                onChange={(e) => setNewCollab({ ...newCollab, title: e.target.value })}
                                className="h-11"
                                disabled={isCreating}
                            />
                        </div>

                        {/* Project Name */}
                        <div className="space-y-2">
                            <Label htmlFor="projectName" className="text-sm font-medium">
                                Nombre del proyecto (opcional)
                            </Label>
                            <Input
                                id="projectName"
                                placeholder="Ej: EcoApp, Sistema de Gestión, etc."
                                value={newCollab.projectName}
                                onChange={(e) => setNewCollab({ ...newCollab, projectName: e.target.value })}
                                className="h-11"
                                disabled={isCreating}
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-sm font-medium flex items-center gap-2">
                                Descripción
                                <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Describe el proyecto, qué tareas realizaría el colaborador, tiempo estimado, etc."
                                value={newCollab.description}
                                onChange={(e) => setNewCollab({ ...newCollab, description: e.target.value })}
                                rows={5}
                                className="resize-none"
                                disabled={isCreating}
                            />
                            <p className="text-xs text-muted-foreground">
                                {newCollab.description.length}/500 caracteres
                            </p>
                        </div>

                        {/* Skills */}
                        <div className="space-y-2">
                            <Label htmlFor="skills" className="text-sm font-medium">
                                Habilidades requeridas
                            </Label>
                            <Input
                                id="skills"
                                placeholder="Ej: Investigación, Leyes, AutoCAD, Marketing"
                                value={newCollab.skills}
                                onChange={(e) => setNewCollab({ ...newCollab, skills: e.target.value })}
                                className="h-11"
                                disabled={isCreating}
                            />
                            <p className="text-xs text-muted-foreground">
                                Separa las habilidades con comas (,)
                            </p>
                        </div>

                        {/* Validation message */}
                        {user && (!newCollab.title.trim() || !newCollab.description.trim()) && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                <p>Completa los campos obligatorios (*) para publicar</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsNewDialogOpen(false)}
                            disabled={isCreating}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateCollab}
                            disabled={!user || !newCollab.title.trim() || !newCollab.description.trim() || isCreating}
                            className="gap-2"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Publicando...
                                </>
                            ) : (
                                <>
                                    <Plus className="h-4 w-4" />
                                    Publicar Llamado
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Send Request Dialog */}
            <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
                <DialogContent className="sm:max-w-xl">
                    <DialogHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
                                <Send className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl">Enviar Solicitud</DialogTitle>
                                {selectedCollab && (
                                    <DialogDescription className="text-base mt-1">
                                        Solicitud para: <span className="font-semibold text-foreground">{selectedCollab.title}</span>
                                    </DialogDescription>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-sm font-medium">
                                Mensaje para el autor
                            </Label>
                            <Textarea
                                id="message"
                                placeholder="Preséntate brevemente, explica tu experiencia y por qué te interesa colaborar en este proyecto..."
                                value={requestMessage}
                                onChange={(e) => setRequestMessage(e.target.value)}
                                rows={6}
                                className="resize-none"
                                disabled={isSendingRequest}
                            />
                            <p className="text-xs text-muted-foreground">
                                {requestMessage.length}/500 caracteres
                            </p>
                        </div>

                        {!requestMessage.trim() && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                                <AlertCircle className="h-4 w-4" />
                                <p>Escribe un mensaje para enviar tu solicitud</p>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setIsRequestDialogOpen(false)}
                            disabled={isSendingRequest}
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSendRequest}
                            disabled={!requestMessage.trim() || isSendingRequest}
                            className="gap-2"
                        >
                            {isSendingRequest ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Enviar Solicitud
                                </>
                            )}
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