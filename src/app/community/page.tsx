
'use client';

import { useState, useEffect } from 'react';
import { getPublishedPosts } from '@/lib/community';
import type { PublishedPost } from '@/types';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PostCard } from '@/components/community/post-card';


export default function CommunityPage() {
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const handlePostDeleted = (deletedPostId: string) => {
        setPosts(currentPosts => currentPosts.filter(p => p.id !== deletedPostId));
    };

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            try {
                const fetchedPosts = await getPublishedPosts();
                setPosts(fetchedPosts);
            } catch (error) {
                console.error("Error fetching published posts:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPosts();
    }, []);

    return (
        <>
            {isLoading ? (
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
            ) : (
                <div className="space-y-8">
                    {posts.length > 0 ? (
                        posts.map(post => <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />)
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p className="font-semibold">¡La comunidad está tranquila!</p>
                            <p>No hay publicaciones públicas en este momento.</p>
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
