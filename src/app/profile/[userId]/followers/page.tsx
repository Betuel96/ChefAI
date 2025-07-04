// src/app/profile/[userId]/followers/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getFollowersList, getProfileData } from '@/lib/community';
import type { ProfileListItem, ProfileData } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserList } from '@/components/profile/UserList';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

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
    const [followers, setFollowers] = useState<ProfileListItem[]>([]);
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                    <UserList users={followers} emptyMessage="Este usuario todavía no tiene seguidores." />
                </CardContent>
            </Card>
        </div>
    );
}
