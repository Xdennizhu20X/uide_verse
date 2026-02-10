import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Collaboration, CollaborationRequest } from "@/lib/types";
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ManageCollaborationDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    collaboration: Collaboration;
}

export function ManageCollaborationDialog({ isOpen, onOpenChange, collaboration }: ManageCollaborationDialogProps) {
    const { toast } = useToast();
    const [requests, setRequests] = useState<CollaborationRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'open' | 'closed'>(collaboration.status);

    useEffect(() => {
        if (isOpen && collaboration.id) {
            setLoading(true);
            const q = query(
                collection(db, 'collaboration_requests'),
                where('collaborationId', '==', collaboration.id),
                orderBy('createdAt', 'desc')
            );

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const reqs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as CollaborationRequest));
                setRequests(reqs);
                setLoading(false);
            });

            return () => unsubscribe();
        }
    }, [isOpen, collaboration.id]);

    const handleStatusChange = async (newStatus: 'open' | 'closed') => {
        try {
            setStatus(newStatus); // Optimistic update
            const collabRef = doc(db, 'collaborations', collaboration.id);
            await updateDoc(collabRef, { status: newStatus });
            toast({ title: `Colaboración marcada como ${newStatus === 'open' ? 'Abierta' : 'Cerrada'}` });
        } catch (error) {
            setStatus(collaboration.status); // Revert
            toast({ title: "Error al actualizar el estado", variant: "destructive" });
        }
    };

    const handleRequestAction = async (requestId: string, action: 'accepted' | 'rejected') => {
        try {
            // Find request details first
            const request = requests.find(r => r.id === requestId);
            if (!request) return;

            const reqRef = doc(db, 'collaboration_requests', requestId);
            await updateDoc(reqRef, { status: action });

            // Create notification for the requester
            await addDoc(collection(db, 'notifications'), {
                type: 'collaboration',
                title: action === 'accepted' ? 'Solicitud Aceptada' : 'Solicitud Rechazada',
                message: action === 'accepted'
                    ? `Tu solicitud para colaborar en "${collaboration.title}" ha sido aceptada.`
                    : `Tu solicitud para colaborar en "${collaboration.title}" ha sido rechazada.`,
                recipientId: request.senderId,
                senderId: collaboration.authorId,
                collaborationId: collaboration.id,
                read: false,
                createdAt: serverTimestamp(),
                avatar: collaboration.authorAvatar
            });

            toast({ title: `Solicitud ${action === 'accepted' ? 'aceptada' : 'rechazada'}` });
        } catch (error) {
            toast({ title: "Error al procesar la solicitud", variant: "destructive" });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Gestionar Colaboración</DialogTitle>
                    <DialogDescription>
                        Administra el estado de tu colaboración y revisa las solicitudes.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h4 className="text-sm font-medium leading-none">Estado del Proyecto</h4>
                            <p className="text-sm text-muted-foreground">
                                Los proyectos cerrados no reciben nuevas solicitudes.
                            </p>
                        </div>
                        <Select value={status} onValueChange={(val: 'open' | 'closed') => handleStatusChange(val)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Abierto</SelectItem>
                                <SelectItem value="closed">Cerrado</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium leading-none">Solicitudes Recibidas ({requests.length})</h4>
                        <ScrollArea className="h-[300px] rounded-md border p-4">
                            {loading ? (
                                <div className="flex justify-center py-4">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : requests.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm">
                                    No hay solicitudes pendientes por el momento.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {requests.map((req) => (
                                        <div key={req.id} className="flex items-start justify-between space-x-4 border-b pb-4 last:border-0 last:pb-0">
                                            <div className="flex items-start space-x-3">
                                                <Avatar>
                                                    <AvatarImage src={req.senderAvatar} />
                                                    <AvatarFallback>{req.senderName.slice(0, 2).toUpperCase()}</AvatarFallback>
                                                </Avatar>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{req.senderName}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {formatDistanceToNow(req.createdAt?.toDate ? req.createdAt.toDate() : new Date(), { addSuffix: true, locale: es })}
                                                    </p>
                                                    {req.message && (
                                                        <p className="text-sm text-muted-foreground mt-1 bg-muted/50 p-2 rounded-md">
                                                            "{req.message}"
                                                        </p>
                                                    )}
                                                    {req.contactInfo && (
                                                        <div className="flex items-center text-xs text-blue-500 mt-1">
                                                            <Mail className="h-3 w-3 mr-1" />
                                                            {req.contactInfo}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex flex-col space-y-2">
                                                {req.status === 'pending' ? (
                                                    <>
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 border-green-200 hover:bg-green-50 dark:hover:bg-green-900" onClick={() => handleRequestAction(req.id, 'accepted')}>
                                                            <CheckCircle className="h-4 w-4" />
                                                        </Button>
                                                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-900" onClick={() => handleRequestAction(req.id, 'rejected')}>
                                                            <XCircle className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <Badge variant={req.status === 'accepted' ? 'default' : 'destructive'}>
                                                        {req.status === 'accepted' ? 'Aceptada' : 'Rechazada'}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
