
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getFollowRequests, acceptFollowRequest, declineFollowRequest } from '@/lib/community';
import type { FollowRequest } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Bell, Check, X } from 'lucide-react';
import { UserList } from '@/components/profile/UserList';

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
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setIsLoading(false);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const requestsData = await getFollowRequests(currentUser.uid);
                setRequests(requestsData);
            } catch (error) {
                console.error("Error fetching follow requests:", error);
                toast({ title: 'Error', description: 'No se pudieron cargar las solicitudes.', variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [currentUser, toast]);
    
    const handleRequest = async (requestingUserId: string, action: 'accept' | 'decline') => {
        if (!currentUser) return;
        
        const originalRequests = [...requests];
        // Optimistic update
        setRequests(requests.filter(r => r.id !== requestingUserId));
        
        try {
            if (action === 'accept') {
                await acceptFollowRequest(currentUser.uid, requestingUserId);
                toast({ title: 'Solicitud aceptada' });
            } else {
                await declineFollowRequest(currentUser.uid, requestingUserId);
                toast({ title: 'Solicitud rechazada' });
            }
        } catch (error) {
            setRequests(originalRequests);
            toast({ title: "Error", description: "No se pudo procesar la solicitud.", variant: "destructive" });
        }
    };

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
                <p className="text-muted-foreground">Gestiona tus solicitudes de seguimiento pendientes.</p>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>Solicitudes de Seguimiento</CardTitle>
                    <CardDescription>
                        {requests.length > 0
                            ? `Tienes ${requests.length} solicitud(es) pendiente(s).`
                            : 'No tienes solicitudes de seguimiento pendientes.'
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <UserList
                        users={requests}
                        emptyMessage="Tu bandeja de entrada está vacía."
                        actionSlot={(userItem) => (
                            <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleRequest(userItem.id, 'accept')}>
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleRequest(userItem.id, 'decline')}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
