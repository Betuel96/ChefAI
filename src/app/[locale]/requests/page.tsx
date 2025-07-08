'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getNotifications, acceptFollowRequest, declineFollowRequest, markNotificationsAsRead } from '@/lib/community';
import type { Notification, Locale } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Bell, Check, X, MessageSquare, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications } from '@/hooks/use-notifications';
import { useParams } from 'next/navigation';

const RequestsPageSkeleton = () => (
    <div className="max-w-md mx-auto space-y-6">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-9 w-20" />
                            <Skeleton className="h-9 w-20" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
);

export default function RequestsPage() {
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { unreadCount } = useNotifications();
    const params = useParams();
    const locale = params.locale as Locale;


    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const notificationsData = await getNotifications(currentUser.uid);
                setNotifications(notificationsData);
                // Mark notifications as read after fetching them
                if (unreadCount > 0) {
                  await markNotificationsAsRead(currentUser.uid);
                }
            } catch (error) {
                console.error("Error fetching notifications:", error);
                toast({ title: 'Error', description: 'No se pudieron cargar las notificaciones.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, toast, unreadCount]);

    const handleRequest = async (notification: Notification, action: 'accept' | 'decline') => {
        if (!currentUser) return;
        
        const originalNotifications = [...notifications];
        // Optimistic update
        setNotifications(notifications.filter(n => n.id !== notification.id));
        
        try {
            if (action === 'accept') {
                await acceptFollowRequest(currentUser.uid, notification.fromUser.id);
                toast({ title: 'Solicitud aceptada' });
            } else {
                await declineFollowRequest(currentUser.uid, notification.fromUser.id);
                toast({ title: 'Solicitud rechazada' });
            }
        } catch (error) {
            setNotifications(originalNotifications);
            toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
        }
    };
    
    const renderNotificationItem = (notification: Notification) => {
        const timeAgo = formatDistanceToNow(new Date(notification.createdAt), { locale: es, addSuffix: true });
        const from = notification.fromUser;

        switch (notification.type) {
            case 'follow_request':
                return (
                    <div className="flex items-center justify-between gap-4 p-2">
                        <Link href={`/${locale}/profile/${from.id}`} className="flex items-center gap-3 flex-grow min-w-0">
                            <UserPlus className="h-6 w-6 text-primary flex-shrink-0" />
                            <Avatar>
                                <AvatarImage src={from.photoURL || undefined} />
                                <AvatarFallback><UserCircle /></AvatarFallback>
                            </Avatar>
                            <div className="truncate">
                                <p className="text-sm">
                                    <span className="font-bold">{from.name}</span> quiere seguirte.
                                </p>
                                <p className="text-xs text-muted-foreground">{timeAgo}</p>
                            </div>
                        </Link>
                        <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" onClick={() => handleRequest(notification, 'accept')}>
                                <Check className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleRequest(notification, 'decline')}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                );
            case 'mention_post':
            case 'mention_comment':
                 const postPath = notification.commentId 
                    ? `/${locale}/post/${notification.postId}?comment=${notification.commentId}` 
                    : `/${locale}/post/${notification.postId}`;

                return (
                    <Link href={postPath} className="block hover:bg-muted/50 rounded-lg p-2 transition-colors">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="h-6 w-6 text-primary flex-shrink-0" />
                            <Avatar>
                                <AvatarImage src={from.photoURL || undefined} />
                                <AvatarFallback><UserCircle /></AvatarFallback>
                            </Avatar>
                            <div className="flex-grow">
                                <p className="text-sm">
                                    <span className="font-bold">{from.name}</span> te mencionó en {notification.type === 'mention_comment' ? 'un comentario' : 'una publicación'}.
                                </p>
                                <p className="text-sm text-muted-foreground italic truncate">
                                    "{notification.contentSnippet}"
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">{timeAgo}</p>
                            </div>
                        </div>
                    </Link>
                );
            default:
                return null;
        }
    }

    if (isLoading) {
        return <RequestsPageSkeleton />;
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <header className="space-y-2">
                <h1 className="font-headline text-3xl font-bold flex items-center gap-2">
                    <Bell className="w-7 h-7" />
                    Notificaciones
                </h1>
                <p className="text-muted-foreground">Gestiona tus solicitudes de seguimiento y menciones.</p>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Bandeja de Entrada</CardTitle>
                    <CardDescription>
                        {notifications.length > 0
                            ? `Tienes ${notifications.length} notificación(es).`
                            : 'No tienes notificaciones nuevas.'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                   {notifications.length > 0 ? (
                    <div className="space-y-2">
                        {notifications.map(n => (
                            <div key={n.id} className={cn('border-b last:border-b-0 py-2')}>
                                {renderNotificationItem(n)}
                            </div>
                        ))}
                    </div>
                   ) : (
                    <p className="text-center text-muted-foreground pt-10">Tu bandeja de entrada está vacía.</p>
                   )}
                </CardContent>
            </Card>
        </div>
    );
}
