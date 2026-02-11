'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { Project, User, ForumTopic } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Search, Trash2, Shield, UserPlus, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminDashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [allProjects, setAllProjects] = useState<Project[]>([]);
    const [allForums, setAllForums] = useState<ForumTopic[]>([]);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<User | null>(null);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [searchAdminResult, setSearchAdminResult] = useState<any>(null);

    // Project Rejection State
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionComment, setRejectionComment] = useState('');

    // Forum Rejection State
    const [rejectForumDialogOpen, setRejectForumDialogOpen] = useState(false);
    const [selectedForum, setSelectedForum] = useState<ForumTopic | null>(null);
    const [forumRejectionReason, setForumRejectionReason] = useState('');
    const [forumRejectionComment, setForumRejectionComment] = useState('');

    useEffect(() => {
        if (!user) {
            return;
        }

        const checkAdmin = async () => {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const data = userDoc.data() as User;
                setUserData(data);
                if (data.role !== 'admin' && data.role !== 'superadmin') {
                    router.push('/');
                    toast({ title: 'Access Denied', description: 'You do not have permission to view this page.', variant: 'destructive' });
                } else {
                    fetchProjects();
                    fetchForums();
                }
            } else {
                router.push('/');
            }
        };

        checkAdmin();
    }, [user, router, toast]);

    const fetchProjects = async () => {
        try {
            const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setAllProjects(projects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        }
    };

    const fetchForums = async () => {
        try {
            const q = query(collection(db, 'forum_topics'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const forums = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ForumTopic));
            setAllForums(forums);
        } catch (error) {
            console.error("Error fetching forums:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Projects Logic ---

    const handleApprove = async (project: Project) => {
        try {
            await updateDoc(doc(db, 'projects', project.id), { status: 'approved' });

            let recipientId = project.authorId;
            const authorEmail = project.author || (project.authors && project.authors.length > 0 ? project.authors[0] : null);

            if (!recipientId && authorEmail) {
                try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('email', '==', authorEmail));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        recipientId = querySnapshot.docs[0].id;
                    }
                } catch (err) {
                    console.error("Error looking up user by email:", err);
                }
            }

            if (recipientId) {
                await addDoc(collection(db, 'notifications'), {
                    recipientId: recipientId,
                    type: 'badge',
                    title: 'Proyecto Aprobado',
                    message: `Tu proyecto "${project.title}" ha sido aprobado y ya es público.`,
                    read: false,
                    createdAt: new Date(),
                    topicId: project.id
                });
            }

            toast({ title: 'Project Approved' });
            fetchProjects();
        } catch (error) {
            console.error("Error approving project:", error);
            toast({ title: 'Error approving project', variant: 'destructive' });
        }
    };

    const openRejectDialog = (project: Project) => {
        setSelectedProject(project);
        setRejectionReason('');
        setRejectionComment('');
        setRejectDialogOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedProject || !rejectionReason) return;

        try {
            await updateDoc(doc(db, 'projects', selectedProject.id), {
                status: 'rejected',
                rejectionReason,
                rejectionMessage: rejectionComment
            });

            let recipientId = selectedProject.authorId;
            const authorEmail = selectedProject.author || (selectedProject.authors && selectedProject.authors.length > 0 ? selectedProject.authors[0] : null);

            if (!recipientId && authorEmail) {
                try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('email', '==', authorEmail));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        recipientId = querySnapshot.docs[0].id;
                    }
                } catch (err) {
                    console.error("Error looking up user by email:", err);
                }
            }

            if (recipientId) {
                await addDoc(collection(db, 'notifications'), {
                    recipientId: recipientId,
                    type: 'badge',
                    title: 'Proyecto Rechazado',
                    message: `Tu proyecto "${selectedProject.title}" no fue aprobado. Motivo: ${rejectionReason}. ${rejectionComment}`,
                    read: false,
                    createdAt: new Date(),
                    topicId: selectedProject.id
                });
            }

            toast({ title: 'Project Rejected' });
            setRejectDialogOpen(false);
            fetchProjects();
        } catch (error) {
            console.error("Error rejecting project:", error);
            toast({ title: 'Error rejecting project', variant: 'destructive' });
        }
    };

    // --- Forum Logic ---

    const handleApproveForum = async (forum: ForumTopic) => {
        try {
            await updateDoc(doc(db, 'forum_topics', forum.id), { status: 'approved' });

            if (forum.authorId) {
                await addDoc(collection(db, 'notifications'), {
                    recipientId: forum.authorId,
                    type: 'badge',
                    title: 'Tema del Foro Aprobado',
                    message: `Tu tema "${forum.title}" ha sido aprobado y es visible para la comunidad.`,
                    read: false,
                    createdAt: new Date(),
                    topicId: forum.id,
                    link: `/forum/${forum.id}`
                });
            }

            toast({ title: 'Forum Topic Approved' });
            fetchForums();
        } catch (error) {
            console.error("Error approving forum:", error);
            toast({ title: 'Error approving forum', variant: 'destructive' });
        }
    };

    const openRejectForumDialog = (forum: ForumTopic) => {
        setSelectedForum(forum);
        setForumRejectionReason('');
        setForumRejectionComment('');
        setRejectForumDialogOpen(true);
    };

    const handleConfirmRejectForum = async () => {
        if (!selectedForum || !forumRejectionReason) return;

        try {
            await updateDoc(doc(db, 'forum_topics', selectedForum.id), {
                status: 'rejected',
                rejectionReason: forumRejectionReason,
                rejectionMessage: forumRejectionComment
            });

            if (selectedForum.authorId) {
                await addDoc(collection(db, 'notifications'), {
                    recipientId: selectedForum.authorId,
                    type: 'badge',
                    title: 'Tema del Foro Rechazado',
                    message: `Tu tema "${selectedForum.title}" ha sido rechazado. Motivo: ${forumRejectionReason}. ${forumRejectionComment}`,
                    read: false,
                    createdAt: new Date(),
                    topicId: selectedForum.id
                });
            }

            toast({ title: 'Forum Topic Rejected' });
            setRejectForumDialogOpen(false);
            fetchForums();
        } catch (error) {
            console.error("Error rejecting forum:", error);
            toast({ title: 'Error rejecting forum', variant: 'destructive' });
        }
    };

    // --- Admin Management ---

    const handleSearchUserForAdmin = async (email: string) => {
        if (!email) return;
        try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                setSearchAdminResult({ uid: doc.id, ...doc.data() });
            } else {
                toast({ title: 'User not found', variant: 'destructive' });
                setSearchAdminResult(null);
            }
        } catch (error) {
            console.error("Error searching user:", error);
        }
    };

    const grantAdminRole = async (uid: string) => {
        try {
            await updateDoc(doc(db, 'users', uid), { role: 'admin' });
            toast({ title: 'Admin role granted' });
            setSearchAdminResult(null);
            setNewAdminEmail('');
        } catch (error) {
            console.error("Error granting admin role:", error);
            toast({ title: 'Error granting role', variant: 'destructive' });
        }
    };

    const filteredProjects = {
        pending: allProjects.filter(p => p.status === 'pending' || !p.status),
        approved: allProjects.filter(p => p.status === 'approved'),
        rejected: allProjects.filter(p => p.status === 'rejected'),
    };

    const filteredForums = {
        pending: allForums.filter(f => f.status === 'pending' || !f.status),
        approved: allForums.filter(f => f.status === 'approved'),
        rejected: allForums.filter(f => f.status === 'rejected'),
    };

    return (
        <div className="container mx-auto pb-8 pt-48">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                {userData?.role === 'superadmin' && (
                    <Badge variant="outline" className="text-purple-600 border-purple-600">SUPERADMIN</Badge>
                )}
            </div>

            <Tabs defaultValue="projects" className="w-full">
                <TabsList className="mb-8 w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                    <TabsTrigger value="projects" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2">
                        Projects
                    </TabsTrigger>
                    <TabsTrigger value="forums" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2">
                        Forums
                    </TabsTrigger>
                    {userData?.role === 'superadmin' && (
                        <TabsTrigger value="admins" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2">
                            Manage Admins
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="projects">
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="pending">Pending ({filteredProjects.pending.length})</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.pending.length === 0 ? <p className="col-span-full py-8 text-center text-muted-foreground">No pending projects.</p> :
                                    filteredProjects.pending.map(p => <ProjectAdminCard key={p.id} project={p} onApprove={() => handleApprove(p)} onReject={() => openRejectDialog(p)} />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="approved">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.approved.map(p => <ProjectAdminCard key={p.id} project={p} onReject={() => openRejectDialog(p)} isApproved />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="rejected">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredProjects.rejected.map(p => <ProjectAdminCard key={p.id} project={p} onApprove={() => handleApprove(p)} isRejected />)}
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="forums">
                    <Tabs defaultValue="pending" className="w-full">
                        <TabsList className="mb-4">
                            <TabsTrigger value="pending">Pending ({filteredForums.pending.length})</TabsTrigger>
                            <TabsTrigger value="approved">Approved</TabsTrigger>
                            <TabsTrigger value="rejected">Rejected</TabsTrigger>
                        </TabsList>

                        <TabsContent value="pending">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredForums.pending.length === 0 ? <p className="col-span-full py-8 text-center text-muted-foreground">No pending topics.</p> :
                                    filteredForums.pending.map(f => <ForumAdminCard key={f.id} forum={f} onApprove={() => handleApproveForum(f)} onReject={() => openRejectForumDialog(f)} />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="approved">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredForums.approved.map(f => <ForumAdminCard key={f.id} forum={f} onReject={() => openRejectForumDialog(f)} isApproved />)}
                            </div>
                        </TabsContent>
                        <TabsContent value="rejected">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {filteredForums.rejected.map(f => <ForumAdminCard key={f.id} forum={f} onApprove={() => handleApproveForum(f)} isRejected />)}
                            </div>
                        </TabsContent>
                    </Tabs>
                </TabsContent>

                <TabsContent value="admins">
                    <div className="max-w-md mx-auto mt-8">
                        <Card>
                            <CardHeader>
                                <CardTitle>Add New Admin</CardTitle>
                                <CardDescription>Grant admin privileges to a user by email.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="User Email"
                                        value={newAdminEmail}
                                        onChange={(e) => setNewAdminEmail(e.target.value)}
                                    />
                                    <Button onClick={() => handleSearchUserForAdmin(newAdminEmail)}>
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>
                                {searchAdminResult && (
                                    <div className="bg-muted p-4 rounded-lg flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                <span className="text-lg font-bold">{searchAdminResult.displayName?.[0] || 'U'}</span>
                                            </div>
                                            <div>
                                                <p className="font-medium">{searchAdminResult.displayName || 'No Name'}</p>
                                                <p className="text-xs text-muted-foreground">{searchAdminResult.email}</p>
                                            </div>
                                        </div>
                                        <Button size="sm" onClick={() => grantAdminRole(searchAdminResult.uid)}>
                                            Promote
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Project Reject Dialog */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Proyecto</DialogTitle>
                        <DialogDescription>Motivo del rechazo.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Select value={rejectionReason} onValueChange={setRejectionReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Contenido inapropiado">Contenido inapropiado</SelectItem>
                                <SelectItem value="Falta de información">Falta de información</SelectItem>
                                <SelectItem value="Archivos corruptos">Archivos corruptos</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Comentarios adicionales..."
                            value={rejectionComment}
                            onChange={(e) => setRejectionComment(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmReject}>Rechazar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Forum Reject Dialog */}
            <Dialog open={rejectForumDialogOpen} onOpenChange={setRejectForumDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Tema del Foro</DialogTitle>
                        <DialogDescription>Motivo del rechazo de este tema.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <Select value={forumRejectionReason} onValueChange={setForumRejectionReason}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un motivo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Spam">Spam</SelectItem>
                                <SelectItem value="Lenguaje ofensivo">Lenguaje ofensivo</SelectItem>
                                <SelectItem value="Tema irrelevante">Tema irrelevante</SelectItem>
                                <SelectItem value="Otro">Otro</SelectItem>
                            </SelectContent>
                        </Select>
                        <Textarea
                            placeholder="Comentarios adicionales..."
                            value={forumRejectionComment}
                            onChange={(e) => setForumRejectionComment(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectForumDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmRejectForum}>Rechazar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function ProjectAdminCard({ project, onApprove, onReject, isApproved, isRejected }: { project: Project, onApprove?: () => void, onReject?: () => void, isApproved?: boolean, isRejected?: boolean }) {
    return (
        <Card className="overflow-hidden">
            <div className="relative h-48 w-full bg-muted">
                {project.imageUrls?.[0] ? (
                    <img src={project.imageUrls[0]} alt={project.title} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full items-center justify-center text-muted-foreground">No Image</div>
                )}
                <div className="absolute top-2 right-2">
                    <Badge variant={project.status === 'approved' ? "default" : project.status === 'rejected' ? "destructive" : "secondary"}>
                        {project.status || 'pending'}
                    </Badge>
                </div>
            </div>
            <CardHeader className="p-4">
                <CardTitle className="line-clamp-1 text-lg">{project.title}</CardTitle>
                <CardDescription className="line-clamp-1">{project.category} • {project.authorNames?.[0] || 'Unknown'}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 my-2">{project.description}</p>
                {project.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs text-red-600 dark:text-red-400 mb-2">
                        <strong>Motivo:</strong> {project.rejectionReason}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2 p-4">
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/projects/${project.id}`}>View</Link>
                </Button>
                {onReject && !isRejected && <Button variant="destructive" onClick={onReject}>Reject</Button>}
                {onApprove && !isApproved && <Button className="bg-green-600 hover:bg-green-700" onClick={onApprove}>Approve</Button>}
            </CardFooter>
        </Card>
    )
}

function ForumAdminCard({ forum, onApprove, onReject, isApproved, isRejected }: { forum: ForumTopic, onApprove?: () => void, onReject?: () => void, isApproved?: boolean, isRejected?: boolean }) {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="line-clamp-1 text-lg">{forum.title}</CardTitle>
                        <CardDescription className="line-clamp-1">{forum.tag} • {forum.author}</CardDescription>
                    </div>
                    <Badge variant={forum.status === 'approved' ? "default" : forum.status === 'rejected' ? "destructive" : "secondary"}>
                        {forum.status || 'pending'}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-3 my-2">{forum.content}</p>
                {forum.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs text-red-600 dark:text-red-400 mb-2">
                        <strong>Motivo:</strong> {forum.rejectionReason}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2 p-4">
                {/* Link to Forum Detail logic? Usually /forum/[id] */}
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/forum/${forum.id}`}>View</Link>
                </Button>
                {onReject && !isRejected && <Button variant="destructive" onClick={onReject}>Reject</Button>}
                {onApprove && !isApproved && <Button className="bg-green-600 hover:bg-green-700" onClick={onApprove}>Approve</Button>}
            </CardFooter>
        </Card>
    )
}
