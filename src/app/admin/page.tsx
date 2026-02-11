'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { Project, User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Search, Trash2, Shield, UserPlus } from 'lucide-react';
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
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<User | null>(null);
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [searchAdminResult, setSearchAdminResult] = useState<any>(null);

    // Rejection State
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionComment, setRejectionComment] = useState('');

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
                }
            } else {
                router.push('/');
            }
        };

        checkAdmin();
    }, [user, router, toast]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            // Fetch all projects to filter client-side for tabs
            const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);
            const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
            setAllProjects(projects);
        } catch (error) {
            console.error("Error fetching projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (project: Project) => {
        try {
            await updateDoc(doc(db, 'projects', project.id), { status: 'approved' });

            let recipientId = project.authorId;
            const authorEmail = project.author || (project.authors && project.authors.length > 0 ? project.authors[0] : null);

            // Fallback: Try to find author by email if ID is missing
            if (!recipientId && authorEmail) {
                console.log("Searching for author UID by email:", authorEmail);
                try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('email', '==', authorEmail));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        recipientId = querySnapshot.docs[0].id;
                        console.log("Found author UID:", recipientId);
                    }
                } catch (err) {
                    console.error("Error looking up user by email:", err);
                }
            }

            if (recipientId) {
                // Notify Author
                console.log("Sending approval notification to:", recipientId);
                await addDoc(collection(db, 'notifications'), {
                    recipientId: recipientId,
                    type: 'badge',
                    title: 'Proyecto Aprobado',
                    message: `Tu proyecto "${project.title}" ha sido aprobado y ya es público.`,
                    read: false,
                    createdAt: new Date(),
                    topicId: project.id
                });
            } else {
                console.warn("No recipientId found for project, skipping notification", project);
            }

            toast({ title: 'Project Approved' });
            fetchProjects();
        } catch (error) {
            console.error("Error approving project:", error);
            toast({ title: 'Error approving project', description: 'Check console for details', variant: 'destructive' });
        }
    };

    const openRejectDialog = (project: Project) => {
        setSelectedProject(project);
        setRejectionReason('');
        setRejectionComment('');
        setRejectDialogOpen(true);
    };

    const handleConfirmReject = async () => {
        if (!selectedProject || !rejectionReason) {
            toast({ title: 'Missing Information', description: 'Please select a reason.', variant: 'destructive' });
            return;
        }

        try {
            await updateDoc(doc(db, 'projects', selectedProject.id), {
                status: 'rejected',
                rejectionReason,
                rejectionMessage: rejectionComment
            });

            let recipientId = selectedProject.authorId;
            const authorEmail = selectedProject.author || (selectedProject.authors && selectedProject.authors.length > 0 ? selectedProject.authors[0] : null);

            // Fallback: Try to find author by email if ID is missing
            if (!recipientId && authorEmail) {
                console.log("Searching for author UID by email:", authorEmail);
                try {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('email', '==', authorEmail));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        recipientId = querySnapshot.docs[0].id;
                        console.log("Found author UID:", recipientId);
                    }
                } catch (err) {
                    console.error("Error looking up user by email:", err);
                }
            }

            if (recipientId) {
                // Notify Author
                console.log("Sending rejection notification to:", recipientId);
                await addDoc(collection(db, 'notifications'), {
                    recipientId: recipientId,
                    type: 'badge',
                    title: 'Proyecto Rechazado',
                    message: `Tu proyecto "${selectedProject.title}" no fue aprobado. Motivo: ${rejectionReason}. ${rejectionComment ? `Comentario: ${rejectionComment}` : ''}`,
                    read: false,
                    createdAt: new Date(),
                    topicId: selectedProject.id
                });
            } else {
                console.warn("No recipientId found for project, skipping notification", selectedProject);
            }

            toast({ title: 'Project Rejected' });
            setRejectDialogOpen(false);
            fetchProjects();
        } catch (error) {
            console.error("Error rejecting project:", error);
            toast({ title: 'Error rejecting project', description: 'Check console for details', variant: 'destructive' });
        }
    };

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

    return (
        <div className="container mx-auto pb-8 pt-48">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                {userData?.role === 'superadmin' && (
                    <Badge variant="outline" className="text-purple-600 border-purple-600">SUPERADMIN</Badge>
                )}
            </div>

            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="pending">Pending ({filteredProjects.pending.length})</TabsTrigger>
                    <TabsTrigger value="approved">Approved ({filteredProjects.approved.length})</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected ({filteredProjects.rejected.length})</TabsTrigger>
                    {userData?.role === 'superadmin' && (
                        <TabsTrigger value="admins">Manage Admins</TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="pending">
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredProjects.pending.length === 0 ? (
                                <p className="text-muted-foreground col-span-full text-center py-12">No pending projects.</p>
                            ) : (
                                filteredProjects.pending.map((project) => (
                                    <ProjectAdminCard
                                        key={project.id}
                                        project={project}
                                        onApprove={() => handleApprove(project)}
                                        onReject={() => openRejectDialog(project)}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="approved">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.approved.map((project) => (
                            <ProjectAdminCard
                                key={project.id}
                                project={project}
                                onReject={() => openRejectDialog(project)}
                                isApproved
                            />
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="rejected">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProjects.rejected.map((project) => (
                            <ProjectAdminCard
                                key={project.id}
                                project={project}
                                onApprove={() => handleApprove(project)}
                                isRejected
                            />
                        ))}
                    </div>
                </TabsContent>

                {userData?.role === 'superadmin' && (
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
                                                    {searchAdminResult.photoURL ? (
                                                        <img src={searchAdminResult.photoURL} alt={searchAdminResult.displayName} className="h-full w-full rounded-full object-cover" />
                                                    ) : (
                                                        <span className="text-lg font-bold">{searchAdminResult.displayName?.[0] || searchAdminResult.email[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{searchAdminResult.displayName || 'No Name'}</p>
                                                    <p className="text-xs text-muted-foreground">{searchAdminResult.email}</p>
                                                    <p className="text-xs font-semibold mt-1">{searchAdminResult.role || 'User'}</p>
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
                )}
            </Tabs>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Rechazar Proyecto</DialogTitle>
                        <DialogDescription>
                            Por favor, selecciona el motivo por el cual estás rechazando este proyecto. Esta información será enviada al autor.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Motivo</Label>
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
                        </div>

                        <div className="space-y-2">
                            <Label>Comentarios adicionales (Opcional)</Label>
                            <Textarea
                                placeholder="Explica detalladamente por qué se rechaza..."
                                value={rejectionComment}
                                onChange={(e) => setRejectionComment(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancelar</Button>
                        <Button variant="destructive" onClick={handleConfirmReject}>Rechazar Proyecto</Button>
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
                    {project.status === 'approved' && <Badge className="bg-green-500">Approved</Badge>}
                    {project.status === 'rejected' && <Badge variant="destructive">Rejected</Badge>}
                    {(project.status === 'pending' || !project.status) && <Badge variant="secondary">Pending</Badge>}
                </div>
            </div>
            <CardHeader className="p-4">
                <CardTitle className="line-clamp-1 text-lg">{project.title}</CardTitle>
                <CardDescription className="line-clamp-1">{project.category} • {project.authorNames?.[0] || 'Unknown'}</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 my-2">{project.description}</p>
                <div className="text-xs text-muted-foreground mb-4">
                    Submitted: {new Date(project.createdAt).toLocaleDateString()}
                </div>
                {project.rejectionReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs text-red-600 dark:text-red-400 mb-2">
                        <strong>Motivo:</strong> {project.rejectionReason}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between gap-2 p-4">
                <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/projects/${project.id}`}>View Details</Link>
                </Button>

                {onReject && !isRejected && (
                    <Button variant="destructive" onClick={onReject}>
                        Reject
                    </Button>
                )}
                {onApprove && !isApproved && (
                    <Button className="bg-green-600 hover:bg-green-700" onClick={onApprove}>
                        Approve
                    </Button>
                )}
            </CardFooter>
        </Card>
    )
}
