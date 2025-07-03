
// src/app/post/[postId]/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

import { useAuth } from '@/hooks/use-auth';
import { 
    getPost, 
    getComments, 
    addComment, 
    isPostLiked, 
    toggleLikePost, 
    deletePost,
    toggleCommentLike,
    isCommentLiked
} from '@/lib/community';
import type { PublishedPost, Comment } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { UserCircle, MessageCircle, Send, ArrowLeft, ChefHat, MoreVertical, Trash2, Pencil, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const commentSchema = z.object({
  text: z.string().min(1, 'El comentario no puede estar vacío.').max(500, 'El comentario no puede exceder los 500 caracteres.'),
});

type CommentWithReplies = Comment & { replies: CommentWithReplies[] };


const CommentItem = ({ 
    comment, 
    postId,
    onCommentAdded 
}: { 
    comment: CommentWithReplies, 
    postId: string,
    onCommentAdded: () => void 
}) => {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isReplying, setIsReplying] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(comment.likesCount);

    const form = useForm<z.infer<typeof commentSchema>>({
        resolver: zodResolver(commentSchema),
        defaultValues: { text: '' },
    });

    useEffect(() => {
        if (user?.uid) {
            isCommentLiked(postId, comment.id, user.uid).then(setIsLiked);
        }
    }, [user, postId, comment.id]);

    const handleToggleLike = async () => {
        if (!user) {
            toast({ title: "Debes iniciar sesión para reaccionar.", variant: "destructive" });
            return;
        }
        const previouslyLiked = isLiked;
        setIsLiked(!previouslyLiked);
        setLikesCount(prev => previouslyLiked ? prev - 1 : prev + 1);

        try {
            await toggleCommentLike(postId, comment.id, user.uid);
        } catch (error) {
            setIsLiked(previouslyLiked);
            setLikesCount(prev => previouslyLiked ? prev + 1 : prev - 1);
            toast({ title: 'Error al reaccionar al comentario.', variant: 'destructive' });
        }
    };

    const handleReplySubmit = async (values: z.infer<typeof commentSchema>) => {
        if (!user) return;
        try {
            await addComment(postId, user.uid, user.displayName || 'Anónimo', user.photoURL, values.text, comment.id);
            form.reset();
            setIsReplying(false);
            onCommentAdded();
        } catch (error) {
            toast({ title: "Error al añadir tu respuesta.", variant: "destructive" });
        }
    };

    return (
        <div className="flex items-start gap-4">
            <Avatar className="h-10 w-10">
                <AvatarImage src={comment.userPhotoURL || undefined} />
                <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex-grow">
                <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                        <Link href={`/profile/${comment.userId}`} className="font-bold hover:underline">{comment.userName}</Link>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { locale: es, addSuffix: true })}
                        </p>
                    </div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{comment.text}</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                     <button onClick={handleToggleLike} className="flex items-center gap-1 hover:text-primary p-1 rounded">
                        <ChefHat className={cn("w-4 h-4", isLiked && "fill-primary text-primary")} />
                        <span>{likesCount}</span>
                    </button>
                    ·
                    <button onClick={() => setIsReplying(!isReplying)} className="hover:underline p-1 rounded">Responder</button>
                </div>

                {isReplying && (
                    <Card className="mt-2">
                        <CardContent className="p-2">
                           <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleReplySubmit)} className="flex items-start gap-2">
                                     <Avatar className="h-8 w-8 mt-1">
                                        <AvatarImage src={user?.photoURL || undefined} />
                                        <AvatarFallback><UserCircle /></AvatarFallback>
                                    </Avatar>
                                    <FormField
                                        control={form.control}
                                        name="text"
                                        render={({ field }) => (
                                            <FormItem className="flex-grow">
                                                <FormControl>
                                                    <Textarea placeholder={`Respondiendo a ${comment.userName}...`} {...field} rows={1} className="min-h-0"/>
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={form.formState.isSubmitting} size="icon" className='h-9 w-9'>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                )}
                
                {comment.replies && comment.replies.length > 0 && (
                    <div className="mt-4 space-y-4 pl-6 border-l-2">
                        {comment.replies.map(reply => (
                            <CommentItem key={reply.id} comment={reply} postId={postId} onCommentAdded={onCommentAdded} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

const PostDetailSkeleton = () => (
    <div className="max-w-3xl mx-auto space-y-8">
        <Skeleton className="h-8 w-1/4" />
        <Card>
            <CardHeader className="flex flex-row items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <Skeleton className="h-7 w-3/4" />
                    <Skeleton className="aspect-video w-full" />
                </div>
            </CardContent>
        </Card>
    </div>
);


export default function PostDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams<{ postId: string }>();
    const { toast } = useToast();

    const [post, setPost] = useState<PublishedPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isOwner = user?.uid === post?.publisherId;

    const form = useForm<z.infer<typeof commentSchema>>({
        resolver: zodResolver(commentSchema),
        defaultValues: { text: '' },
    });

    const fetchPostData = async () => {
        if (!params.postId) return;
        try {
            const [postData, commentsData] = await Promise.all([
                getPost(params.postId),
                getComments(params.postId),
            ]);

            if (postData) {
                setPost(postData);
                setComments(commentsData);
                setLikesCount(postData.likesCount || 0);
                if (user) {
                    isPostLiked(postData.id, user.uid).then(setIsLiked);
                }
            } else {
                 toast({
                    title: 'Publicación no encontrada',
                    description: 'La publicación que buscas no existe o fue eliminada.',
                    variant: 'destructive',
                });
                router.push('/community');
            }
        } catch (error) {
            console.error("Error fetching post details:", error);
             toast({
                title: 'Error al cargar',
                description: 'No se pudo cargar la publicación.',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        setIsLoading(true);
        fetchPostData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params.postId, user]);

    const handleAddComment = async (values: z.infer<typeof commentSchema>) => {
        if (!user || !post) return;
        try {
            await addComment(post.id, user.uid, user.displayName || 'Anónimo', user.photoURL, values.text, null);
            form.reset();
            const updatedComments = await getComments(post.id);
            setComments(updatedComments);
        } catch (error) {
            toast({
                title: 'Error al comentar',
                description: 'No se pudo añadir tu comentario. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        }
    };
    
    const handleLikeClick = async () => {
        if (!user || !post) {
            toast({ title: 'Debes iniciar sesión para reaccionar.', variant: 'destructive'});
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
            toast({ title: 'Error al reaccionar.', variant: 'destructive'});
        }
    };

    const handleDelete = async () => {
        if (!post) return;
        setIsDeleting(true);
        try {
            await deletePost(post.id);
            toast({
                title: 'Publicación eliminada',
                description: 'Tu publicación ha sido eliminada correctamente.',
            });
            router.push('/community');
        } catch (error) {
            toast({
                title: 'Error al eliminar',
                description: 'No se pudo eliminar la publicación. Inténtalo de nuevo.',
                variant: 'destructive',
            });
            setIsDeleting(false);
        }
    };

    const nestedComments = useMemo((): CommentWithReplies[] => {
        const commentMap: { [key: string]: CommentWithReplies } = {};
        comments.forEach(comment => {
            commentMap[comment.id] = { ...comment, replies: [] };
        });

        const result: CommentWithReplies[] = [];
        comments.forEach(comment => {
            if (comment.parentId) {
                commentMap[comment.parentId]?.replies.push(commentMap[comment.id]);
            } else {
                result.push(commentMap[comment.id]);
            }
        });
        return result;
    }, [comments]);


    if (isLoading) {
        return <PostDetailSkeleton />;
    }

    if (!post) {
        return null;
    }

    const createdAtDate = new Date(post.createdAt);
    const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true, locale: es });

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a la Comunidad
            </Button>

            <Card className="shadow-xl">
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <Link href={`/profile/${post.publisherId}`}>
                            <Avatar className="h-12 w-12 cursor-pointer">
                                <AvatarImage src={post.publisherPhotoURL || undefined} />
                                <AvatarFallback><UserCircle /></AvatarFallback>
                            </Avatar>
                        </Link>
                        <div className="flex-grow">
                            <Link href={`/profile/${post.publisherId}`} className="font-semibold cursor-pointer hover:underline text-lg">{post.publisherName}</Link>
                            <p className="text-sm text-muted-foreground">{timeAgo}</p>
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
                <CardContent className="space-y-6">
                    <div>
                        {post.type === 'recipe' ? (
                            <h1 className="font-headline text-3xl font-bold text-primary">{post.content}</h1>
                        ) : (
                            <p className="text-foreground text-lg whitespace-pre-wrap">{post.content}</p>
                        )}
                    </div>
                     {post.imageUrl && (
                        <div className="aspect-video relative overflow-hidden rounded-lg">
                            <Image src={post.imageUrl} alt={`Imagen de ${post.content}`} fill className="object-cover" />
                        </div>
                    )}
                    {post.type === 'recipe' && (
                        <div className="space-y-6 pt-4">
                            <Separator />
                            <div>
                                <h3 className="font-headline text-2xl font-semibold text-accent">Ingredientes</h3>
                                <p className="whitespace-pre-wrap mt-2">{post.additionalIngredients}</p>
                            </div>
                            <Separator/>
                            <div>
                                <h3 className="font-headline text-2xl font-semibold text-accent">Instrucciones</h3>
                                <p className="whitespace-pre-wrap mt-2">{post.instructions}</p>
                            </div>
                            <Separator/>
                            <div>
                                <h3 className="font-headline text-2xl font-semibold text-accent">Equipo Necesario</h3>
                                <p className="whitespace-pre-wrap mt-2">{post.equipment}</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex items-center gap-6 pt-4 border-t">
                     <Button variant="ghost" onClick={handleLikeClick} className="flex items-center gap-2 text-muted-foreground">
                        <ChefHat className={cn("w-6 h-6 transition-colors", isLiked && "fill-primary text-primary")} />
                        <span className="font-semibold">{likesCount}</span>
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-semibold">{post.commentsCount || 0}</span>
                    </div>
                </CardFooter>
            </Card>

            <div className="space-y-6">
                <h2 className="font-headline text-2xl font-bold">Comentarios ({post.commentsCount || 0})</h2>

                {user ? (
                    <Card>
                        <CardContent className="p-4">
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleAddComment)} className="flex items-start gap-4">
                                     <Avatar className="h-10 w-10 mt-1">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback><UserCircle /></AvatarFallback>
                                    </Avatar>
                                    <FormField
                                        control={form.control}
                                        name="text"
                                        render={({ field }) => (
                                            <FormItem className="flex-grow">
                                                <FormControl>
                                                    <Textarea placeholder="Escribe un comentario..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <Button type="submit" disabled={form.formState.isSubmitting} size="icon">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                ) : (
                    <p className="text-muted-foreground text-center">
                        <Link href="/login" className="underline font-semibold">Inicia sesión</Link> para dejar un comentario.
                    </p>
                )}


                <div className="space-y-4">
                    {nestedComments.length > 0 ? (
                        nestedComments.map(comment => (
                             <CommentItem 
                                key={comment.id} 
                                comment={comment} 
                                postId={post.id} 
                                onCommentAdded={fetchPostData} 
                             />
                        ))
                    ) : (
                        <p className="text-muted-foreground text-center pt-4">No hay comentarios todavía. ¡Sé el primero!</p>
                    )}
                </div>
            </div>

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
        </div>
    );
}
