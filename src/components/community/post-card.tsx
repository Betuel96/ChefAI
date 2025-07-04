'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { toggleLikePost, isPostLiked, deletePost } from '@/lib/community';
import type { PublishedPost } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
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
import { UtensilsCrossed, UserCircle, MessageCircle, ChefHat, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { PostMedia } from './post-media';

export const PostCard = ({ post, onPostDeleted }: { post: PublishedPost, onPostDeleted: (postId: string) => void }) => {
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
        e.stopPropagation();
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

                {post.mediaUrl && post.mediaType ? (
                    <div className="aspect-video relative overflow-hidden">
                        <PostMedia
                            mediaUrl={post.mediaUrl}
                            mediaType={post.mediaType}
                            altText={`Media for ${post.content}`}
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
