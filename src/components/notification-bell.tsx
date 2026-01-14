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

interface Notification {
    id: number;
    type: 'collaboration' | 'like' | 'comment' | 'badge';
    title: string;
    message: string;
    avatar?: string;
    read: boolean;
    createdAt: string;
}

// Mocked notifications
const initialNotifications: Notification[] = [
    {
        id: 1,
        type: 'collaboration',
        title: 'Nueva solicitud de colaboración',
        message: 'Carlos López quiere colaborar en tu proyecto "EcoMonitor App"',
        avatar: 'https://placehold.co/40x40.png',
        read: false,
        createdAt: 'Hace 5 min',
    },
    {
        id: 2,
        type: 'like',
        title: 'Nuevo like',
        message: 'A María García le gustó tu proyecto "SmartGarden"',
        avatar: 'https://placehold.co/40x40.png',
        read: false,
        createdAt: 'Hace 1 hora',
    },
    {
        id: 3,
        type: 'comment',
        title: 'Nuevo comentario',
        message: 'Ana Martínez comentó: "Excelente trabajo..."',
        avatar: 'https://placehold.co/40x40.png',
        read: true,
        createdAt: 'Hace 3 horas',
    },
    {
        id: 4,
        type: 'collaboration',
        title: 'Solicitud aceptada',
        message: 'Pedro Sánchez aceptó tu solicitud de colaboración',
        avatar: 'https://placehold.co/40x40.png',
        read: true,
        createdAt: 'Hace 1 día',
    },
    {
        id: 5,
        type: 'badge',
        title: '¡Nueva insignia!',
        message: 'Desbloqueaste la insignia "Eco-Guerrero"',
        read: true,
        createdAt: 'Hace 2 días',
    },
];

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
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
    const [open, setOpen] = useState(false);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = (id: number) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
        ));
    };

    const markAllAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, read: true })));
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
                                onClick={() => markAsRead(notification.id)}
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
                                    <p className="text-xs text-secondary mt-1">{notification.createdAt}</p>
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
