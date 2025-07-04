'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getFollowingPosts } from '@/lib/community';
import type { PublishedPost } from '@/types';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { PostCard } from '@/components/community/post-card';
import { LogIn, Users } from 'lucide-react';

export default function FollowingFeed() {
    const { user, loading: authLoading } = useAuth();
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handlePostDeleted = (deletedPostId: string) => {
        setPosts(currentPosts => currentPosts.filter(p => p.id !== deletedPostId));
    };

    useEffect(() => {
        if (authLoading) return;

        if (user) {
            const fetchPosts = async () => {
                setIsLoading(true);
                try {
                    const fetchedPosts = await getFollowingPosts(user.uid);
                    setPosts(fetchedPosts);
                } catch (error) {
                    console.error("Error fetching following posts:", error);
                } finally {
                    setIsLoading(false);
                }
            };
            fetchPosts();
        } else {
            setIsLoading(false);
        }
    }, [user, authLoading]);

    if (isLoading || authLoading) {
        return (
            <div className="space-y-8">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="flex flex-row items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-7 w-3/4 mb-4" />
                            <Skeleton className="aspect-video w-full" />
                        </CardContent>
                        <CardFooter className='border-t pt-4'>
                            <Skeleton className="h-8 w-24" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        );
    }
    
    if (!user) {
        return (
             <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                <LogIn className="w-16 h-16 mb-4" />
                <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Inicia Sesión para ver tu Feed</h3>
                <p className="mb-6">Sigue a otros usuarios para ver sus publicaciones aquí.</p>
                <Button asChild>
                    <Link href="/login">Acceder / Registrarse</Link>
                </Button>
            </div>
        );
    }

    if (posts.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                <Users className="w-16 h-16 mb-4" />
                <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Tu Feed de Siguiendo está Vacío</h3>
                <p className="mb-6 max-w-sm">
                    Cuando sigas a otros usuarios, sus publicaciones aparecerán aquí.
                </p>
                <Button asChild variant="secondary">
                    <Link href="/community">Descubre Publicaciones</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {posts.map(post => <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />)}
        </div>
    );
}
