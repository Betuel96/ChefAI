
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedPosts, toggleLikePost, isPostLiked, deletePost } from '@/lib/community';
import { useAuth } from '@/hooks/use-auth';
import type { PublishedPost } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, UserCircle, MessageCircle, ChefHat, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useRouter } from 'next/navigation';

const PostCard = ({ post, onPostDeleted }: { post: PublishedPost, onPostDeleted: (postId: string) => void }) => {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(post.likesCount || 0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = user?.uid === post.publisherId;

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
        
        const previouslyLiked = isLiked;
        setIsLiked(!previouslyLiked);
        setLikesCount(prev => previouslyLiked ? prev - 1 : prev + 1);

        try {
            await toggleLikePost(post.id, user.uid);
        } catch (error) {
            setIsLiked(previouslyLiked);
            setLikesCount(prev => previouslyLiked ? prev + 1 : prev - 1);
            toast({
                title: 'Error',
                description: 'No se pudo registrar tu reacción. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await deletePost(post.id);
            toast({
                title: 'Publicación eliminada',
                description: 'Tu publicación ha sido eliminada correctamente.',
            });
            onPostDeleted(post.id);
        } catch (error) {
            toast({
                title: 'Error al eliminar',
                description: 'No se pudo eliminar la publicación. Inténtalo de nuevo.',
                variant: 'destructive',
            });
            setIsDeleting(false);
        }
    };
    
    return (
        <>
        <Card className="shadow-lg flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${post.publisherId}`} onClick={(e) => e.stopPropagation()}>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src={post.publisherPhotoURL || undefined} />
                            <AvatarFallback><UserCircle /></AvatarFallback>
                        </Avatar>
                    </Link>
                    <div className="flex-grow">
                        <Link href={`/profile/${post.publisherId}`} onClick={(e) => e.stopPropagation()} className="font-semibold cursor-pointer hover:underline">{post.publisherName}</Link>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                     {isOwner && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => router.push(`/edit-post/${post.id}`)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Eliminar
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
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
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta publicación?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Esto eliminará permanentemente tu publicación.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className={cn(buttonVariants({ variant: 'destructive' }))}
                    >
                        {isDeleting ? 'Eliminando...' : 'Eliminar'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
};

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
                        posts.map(post => <PostCard key={post.id} post={post} onPostDeleted={handlePostDeleted} />)
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
