
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedPosts, toggleLikePost, isPostLiked } from '@/lib/community';
import { useAuth } from '@/hooks/use-auth';
import type { PublishedPost } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, UserCircle, MessageCircle, ChefHat } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const PostCard = ({ post }: { post: PublishedPost }) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);

    const createdAtDate = post.createdAt ? new Date(post.createdAt) : null;
    const timeAgo = createdAtDate ? formatDistanceToNow(createdAtDate, { addSuffix: true, locale: es }) : '';

    useEffect(() => {
        if (user?.uid) {
            isPostLiked(post.id, user.uid).then(setIsLiked);
        }
    }, [user, post.id]);

    const handleLikeClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Evita que el clic en el botón active el enlace de la tarjeta
        if (!user) {
            toast({
                title: 'Inicia Sesión para Reaccionar',
                description: 'Debes iniciar sesión para dar "me gusta" a las publicaciones.',
                variant: 'destructive',
            });
            return;
        }
        
        // Optimistic update
        const previouslyLiked = isLiked;
        setIsLiked(!previouslyLiked);
        setLikesCount(prev => previouslyLiked ? prev - 1 : prev + 1);

        try {
            await toggleLikePost(post.id, user.uid);
        } catch (error) {
            // Revert on error
            setIsLiked(previouslyLiked);
            setLikesCount(prev => previouslyLiked ? prev + 1 : prev - 1);
            toast({
                title: 'Error',
                description: 'No se pudo registrar tu reacción. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        }
    };
    
    return (
        <Card className="shadow-lg flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.publisherId}`} onClick={(e) => e.stopPropagation()}>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src={post.publisherPhotoURL || undefined} />
                            <AvatarFallback><UserCircle /></AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${post.publisherId}`} onClick={(e) => e.stopPropagation()} className="font-semibold cursor-pointer hover:underline">{post.publisherName}</Link>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                </div>
            </CardHeader>
            <Link href={`/post/${post.id}`} className="flex-grow">
                <div className="px-6 pb-4 flex-grow">
                    {post.type === 'recipe' ? (
                        <CardTitle className="font-headline text-2xl">{post.content}</CardTitle>
                    ) : (
                        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
                    )}
                </div>

                {post.imageUrl ? (
                    <div className="aspect-video relative overflow-hidden">
                        <Image
                            src={post.imageUrl}
                            alt={`Imagen de ${post.content}`}
                            fill
                            className="object-cover"
                        />
                    </div>
                ) : (
                    post.type === 'recipe' && (
                        <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                            <UtensilsCrossed className="w-12 h-12" />
                        </div>
                    )
                )}
            </Link>
            <CardFooter className="flex items-center gap-4 pt-4 border-t">
                 <Button variant="ghost" size="sm" onClick={handleLikeClick} className="flex items-center gap-2 text-muted-foreground">
                    <ChefHat className={cn("w-5 h-5 transition-colors", isLiked && "fill-primary text-primary")} />
                    <span>{likesCount}</span>
                </Button>
                <Link href={`/post/${post.id}`} className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="w-5 h-5" />
                        <span>{post.commentsCount || 0}</span>
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
};

export default function CommunityPage() {
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
        <div className="max-w-2xl mx-auto space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold text-primary">Comunidad ChefAI</h1>
                <p className="text-muted-foreground mt-2 text-lg">Descubre qué están cocinando otros usuarios.</p>
            </header>

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
                        posts.map(post => <PostCard key={post.id} post={post} />)
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p className="font-semibold">¡La comunidad está tranquila!</p>
                            <p>Sé el primero en publicar una receta desde el Generador.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
