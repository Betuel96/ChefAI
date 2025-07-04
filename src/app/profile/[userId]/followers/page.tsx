
// src/app/profile/[userId]/followers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFollowersList, getProfileData, removeFollower } from '@/lib/community';
import type { ProfileListItem, ProfileData } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserList } from '@/components/profile/UserList';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';


const FollowersPageSkeleton = () => (
    <div className="max-w-md mx-auto space-y-6">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-1/2" />
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-1/3" />
            </CardHeader>
            <CardContent className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                ))}
            </CardContent>
        </Card>
    </div>
);


export default function FollowersPage() {
    const params = useParams<{ userId: string }>();
    const router = useRouter();
    const { user: currentUser } = useAuth();
    const { toast } = useToast();
    const [followers, setFollowers] = useState<ProfileListItem[]>([]);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const isOwnProfile = currentUser?.uid === params.userId;

    useEffect(() => {
        if (!params.userId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [followersData, profileData] = await Promise.all([
                    getFollowersList(params.userId as string),
                    getProfileData(params.userId as string),
                ]);
                setFollowers(followersData);
                setProfile(profileData);
            } catch (error) {
                console.error("Error fetching followers list:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [params.userId]);
    
    const handleRemoveFollower = async (followerId: string) => {
        if (!currentUser) return;
        
        const originalFollowers = [...followers];
        // Optimistic update
        setFollowers(followers.filter(f => f.id !== followerId));
        setProfile(p => p ? { ...p, followersCount: p.followersCount - 1 } : null);

        try {
            await removeFollower(currentUser.uid, followerId);
            toast({ title: "Seguidor eliminado" });
        } catch (error) {
            setFollowers(originalFollowers);
            setProfile(p => p ? { ...p, followersCount: p.followersCount + 1 } : null);
            toast({ title: "Error", description: "No se pudo eliminar al seguidor.", variant: "destructive" });
        }
    };

    if (isLoading) {
        return <FollowersPageSkeleton />;
    }
    
    if (!profile) {
        return <div className="text-center py-10">Usuario no encontrado.</div>;
    }

    return (
        <div className="max-w-md mx-auto space-y-6">
            <header className="space-y-2">
                 <Button variant="ghost" onClick={() => router.back()} className="px-0 hover:bg-transparent">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al perfil
                </Button>
                <h1 className="font-headline text-3xl font-bold">
                    Seguidores de <Link href={`/profile/${profile.id}`} className="text-primary hover:underline">@{profile.username}</Link>
                </h1>
            </header>
            <Card>
                <CardHeader>
                    <CardTitle>{profile.followersCount} Seguidor(es)</CardTitle>
                </CardHeader>
                <CardContent>
                    <UserList
                        users={followers}
                        emptyMessage="Este usuario todavía no tiene seguidores."
                        actionSlot={isOwnProfile ? (userItem) => (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" size="sm">Eliminar</Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar a {userItem.name}?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción eliminará a este usuario de tus seguidores. No se les notificará.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveFollower(userItem.id)}>
                                            Eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        ) : undefined}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
