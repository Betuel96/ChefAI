// src/app/pro/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getProfileData, getUserPublishedPosts } from '@/lib/community';
import type { ProfileData, PublishedPost } from '@/types';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostGrid } from '@/components/profile/PostGrid';
import { LogIn } from 'lucide-react';


const MyProfilePageSkeleton = () => (
     <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
            <div className="space-y-3 flex-grow text-center sm:text-left">
                <Skeleton className="h-10 w-1/2 mx-auto sm:mx-0" />
                <Skeleton className="h-5 w-1/3 mx-auto sm:mx-0" />
                <div className="flex justify-center sm:justify-start gap-6">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-1/4 mx-auto sm:mx-0" />
            </div>
        </div>
         <Skeleton className="h-px w-full" />
         <Skeleton className="aspect-square w-full" />
    </div>
);

export default function MyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        try {
             const [profileData, publishedPosts] = await Promise.all([
                getProfileData(user.uid),
                getUserPublishedPosts(user.uid),
            ]);
            setProfile(profileData);
            setPosts(publishedPosts);
        } catch (error) {
             console.error("Error fetching my profile data:", error);
        } finally {
             setIsLoading(false);
        }
    };

    fetchData();
  }, [user, authLoading]);


  if (authLoading || isLoading) {
    return <MyProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Card className="max-w-md w-full shadow-lg p-8 text-center">
            <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className='font-headline text-2xl'>Inicia sesión para ver tu perfil</CardTitle>
            <CardDescription className='mt-2 mb-6'>No has iniciado sesión. Accede a tu cuenta para ver tu perfil y gestionar tu cuenta.</CardDescription>
            <Button asChild>
                <Link href="/login">Acceder / Registrarse</Link>
            </Button>
        </Card>
      </div>
    );
  }
  
  if (!profile) {
    return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
            Cargando perfil...
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ProfileHeader 
        profile={profile} 
        isFollowing={false} // Not applicable for own profile
        onFollowToggle={() => {}} 
        isCurrentUser={true} 
      />

      <Separator />

      <h2 className="font-headline text-2xl font-bold text-center">Mis Publicaciones</h2>
      <PostGrid posts={posts} />
    </div>
  );
}
