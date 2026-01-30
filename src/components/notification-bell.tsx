'use client';

import { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Heart, MessageSquare, Award, CheckCircle } from 'lucide-react';

import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Notification {
    id: string;
    type: 'collaboration' | 'like' | 'comment' | 'badge';
    title: string;
    message: string;
    avatar?: string;
    read: boolean;
    createdAt: any;
    collaborationId?: string;
}

const getIcon = (type: string) => {
    switch (type) {
        case 'collaboration':
            return <Users className="h-4 w-4 text-primary" />;
        case 'like':
            return <Heart className="h-4 w-4 text-red-500" />;
        case 'comment':
            return <MessageSquare className="h-4 w-4 text-blue-500" />;
        case 'badge':
            return <Award className="h-4 w-4 text-yellow-500" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

export function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (!user) {
            setNotifications([]);
            return;
        }

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            setNotifications(notifs);
        });

        return () => unsubscribe();
    }, [user]);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: string, redirectUrl?: string) => {
        try {
            const notifRef = doc(db, 'notifications', id);
            await updateDoc(notifRef, { read: true });

            if (redirectUrl) {
                router.push(redirectUrl);
                setOpen(false);
            }
        } catch (error) {
            console.error("Error updating notification:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            const unread = notifications.filter(n => !n.read);

            unread.forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.update(ref, { read: true });
            });

            await batch.commit();
        } catch (error) {
            console.error("Error marking all read:", error);
        }
    };

    const handleNotificationClick = (notification: Notification) => {
        let url = '';
        if (notification.type === 'collaboration' && notification.collaborationId) {
            url = '/colaboracion';
        }
        // Add other types redirects if needed
        markAsRead(notification.id, url);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 text-xs text-primary hover:text-primary/80"
                            onClick={markAllAsRead}
                        >
                            Marcar todo como leído
                        </Button>
                    )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                {notifications.length === 0 ? (
                    <div className="py-6 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No tienes notificaciones</p>
                    </div>
                ) : (
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex items-start gap-3 p-3 cursor-pointer ${!notification.read ? 'bg-primary/5' : ''}`}
                                onClick={() => handleNotificationClick(notification)}
                            >
                                <div className="flex-shrink-0 mt-0.5">
                                    {notification.avatar ? (
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={notification.avatar} />
                                            <AvatarFallback>{notification.title[0]}</AvatarFallback>
                                        </Avatar>
                                    ) : (
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            {getIcon(notification.type)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        {getIcon(notification.type)}
                                        <span className="font-medium text-sm truncate">{notification.title}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <p className="text-xs text-secondary mt-1">
                                        {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: es }) : 'Reciente'}
                                    </p>
                                </div>
                                {!notification.read && (
                                    <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-2" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}

                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-center text-sm text-primary justify-center">
                    Ver todas las notificaciones
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
