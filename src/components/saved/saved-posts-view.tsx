// src/components/saved/saved-posts-view.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSavedPosts } from '@/lib/community';
import type { PublishedPost } from '@/types';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { PostGrid } from '@/components/profile/PostGrid';
import { LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const SavedPostsSkeleton = () => (
     <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="aspect-square w-full" />
    </div>
);

export function SavedPostsView() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  
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
             const savedPosts = await getSavedPosts(user.uid);
             setPosts(savedPosts);
        } catch (error) {
             console.error("Error fetching saved posts:", error);
        } finally {
             setIsLoading(false);
        }
    };

    fetchData();
  }, [user, authLoading]);

  if (authLoading || isLoading) {
    return <SavedPostsSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Card className="max-w-md w-full shadow-lg p-8 text-center">
            <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className='font-headline text-2xl'>Inicia sesión para ver tus publicaciones guardadas</CardTitle>
            <CardDescription className='mt-2 mb-6'>No has iniciado sesión. Accede a tu cuenta para ver tu contenido guardado.</CardDescription>
            <Button asChild>
                <Link href={`/${params.locale}/login`}>Acceder / Registrarse</Link>
            </Button>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Publicaciones Guardadas</CardTitle>
        <CardDescription>Tu colección personal de recetas y menús favoritos.</CardDescription>
      </CardHeader>
      <CardContent>
         {posts.length > 0 ? (
            <PostGrid posts={posts} />
        ) : (
            <p className="text-center text-muted-foreground pt-10">
                Aún no has guardado ninguna publicación. ¡Explora la comunidad y guarda lo que te inspire!
            </p>
        )}
      </CardContent>
    </Card>
  );
}