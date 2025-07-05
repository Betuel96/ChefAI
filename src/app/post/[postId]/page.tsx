
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
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
    isCommentLiked,
    isPostSaved,
    savePost,
    unsavePost
} from '@/lib/community';
import type { PublishedPost, Comment, Mention } from '@/types';
import { useToast } from '@/hooks/use-toast';

import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { UserCircle, MessageCircle, Send, ArrowLeft, ChefHat, MoreVertical, Trash2, Pencil, Reply, Share2, Bookmark, HeartHandshake, Loader2 } from 'lucide-react';
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
import { CommentInput } from '@/components/community/comment-input';
import { PostMedia } from '@/components/community/post-media';
import { PostContentViewer } from '@/components/community/post-content-viewer';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

type CommentWithReplies = Comment & { replies: CommentWithReplies[] };

const renderWithMentions = (text: string, mentions: Mention[] = []) => {
    if (!mentions || mentions.length === 0) {
        return <p className="text-sm mt-1 whitespace-pre-wrap">{text}</p>;
    }

    const mentionMap = new Map(mentions.map(m => [`@${m.displayName}`, m.userId]));
    const names = mentions.map(m => m.displayName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`@(${names})`, 'g');
    
    const parts = text.split(regex);

    return (
        <p className="text-sm mt-1 whitespace-pre-wrap">
            {parts.map((part, i) => {
                const mentionKey = `@${part}`;
                if (i % 2 === 1 && mentionMap.has(mentionKey)) {
                    return (
                        <Link key={i} href={`/profile/${mentionMap.get(mentionKey)}`} className="font-semibold text-primary hover:underline">
                            {mentionKey}
                        </Link>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );
};


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

    const handleReplySubmit = async (text: string, mentions: Mention[]) => {
        if (!user) return;
        try {
            await addComment(postId, user.uid, user.displayName || 'Anónimo', user.photoURL, text, comment.id, mentions);
            setIsReplying(false);
            onCommentAdded();
        } catch (error) {
            toast({ title: "Error al añadir tu respuesta.", variant: "destructive" });
        }
    };

    return (
        <div className="flex items-start gap-4">
            <Link href={`/profile/${comment.userId}`}>
                <Avatar className="h-10 w-10 cursor-pointer">
                    <AvatarImage src={comment.userPhotoURL || undefined} />
                    <AvatarFallback><UserCircle /></AvatarFallback>
                </Avatar>
            </Link>
            <div className="flex-grow">
                <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center justify-between">
                        <Link href={`/profile/${comment.userId}`} className="font-bold hover:underline">{comment.userName}</Link>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(comment.createdAt), { locale: es, addSuffix: true })}
                        </p>
                    </div>
                     {renderWithMentions(comment.text, comment.mentions)}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                     <button onClick={handleToggleLike} className="flex items-center gap-1 hover:text-primary p-1 rounded">
                        <ChefHat className={cn("w-4 h-4", isLiked && "fill-primary text-primary")} />
                        <span>{likesCount}</span>
                    </button>
                    ·
                    <button onClick={() => setIsReplying(!isReplying)} className="hover:underline p-1 rounded">Responder</button>
                </div>

                {isReplying && user && (
                    <div className="mt-2">
                         <CommentInput
                            user={user}
                            onSubmit={handleReplySubmit}
                            placeholder={`Respondiendo a ${comment.userName}...`}
                            autoFocus={true}
                         />
                    </div>
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

const PostContentRenderer = ({ content, mentions }: { content: string, mentions?: Mention[] }) => {
    if (!mentions || mentions.length === 0) {
        return <p className="text-foreground text-lg whitespace-pre-wrap">{content}</p>;
    }

    const mentionMap = new Map(mentions.map(m => [`@${m.displayName}`, m.userId]));
    const names = mentions.map(m => m.displayName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|');
    const regex = new RegExp(`@(${names})`, 'g');
    
    const parts = content.split(regex);

    return (
        <p className="text-foreground text-lg whitespace-pre-wrap">
            {parts.map((part, i) => {
                const mentionKey = `@${part}`;
                if (i % 2 === 1 && mentionMap.has(mentionKey)) {
                    return (
                        <Link key={i} href={`/profile/${mentionMap.get(mentionKey)}`} className="font-semibold text-primary hover:underline">
                            {mentionKey}
                        </Link>
                    );
                }
                return <span key={i}>{part}</span>;
            })}
        </p>
    );
}


export default function PostDetailPage() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useParams<{ postId: string }>();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    const [post, setPost] = useState<PublishedPost | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);
    const [isSaved, setIsSaved] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showTipDialog, setShowTipDialog] = useState(false);
    const [isTipAgreed, setIsTipAgreed] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isTipping, setIsTipping] = useState(false);

    const isOwner = user?.uid === post?.publisherId;

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
                    isPostSaved(user.uid, postData.id).then(setIsSaved);
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

    useEffect(() => {
        if (searchParams.get('tip_success')) {
            toast({
                title: "¡Gracias por tu apoyo!",
                description: "Tu propina ha sido enviada al creador.",
            });
            // Clean up the URL
            router.replace(`/post/${params.postId}`, undefined);
        }
    }, [searchParams, toast, router, params.postId]);

    const handleAddComment = async (text: string, mentions: Mention[]) => {
        if (!user || !post) return;
        try {
            await addComment(post.id, user.uid, user.displayName || 'Anónimo', user.photoURL, text, null, mentions);
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

    const handleShare = async () => {
        if (!post) return;
        const shareData = {
            title: `Mira esta publicación de ${post.publisherName} en ChefAI`,
            text: post.content,
            url: window.location.href
        };

        try {
            if (!navigator.share) {
                throw new Error("La API para compartir no es compatible con este navegador.");
            }
            await navigator.share(shareData);
        } catch (error) {
            console.error("Error al usar navigator.share:", error);
            try {
                await navigator.clipboard.writeText(shareData.url);
                toast({
                    title: '¡Enlace Copiado!',
                    description: 'No se pudo abrir el menú de compartir. El enlace se ha copiado en su lugar.'
                });
            } catch (err) {
                toast({
                    title: 'Error',
                    description: 'No se pudo compartir ni copiar el enlace.',
                    variant: 'destructive'
                });
            }
        }
    };
    
    const handleTipClick = () => {
        if (!user || !post) {
            toast({ title: 'Debes iniciar sesión para dar una propina.', variant: 'destructive' });
            return;
        }
        setIsTipAgreed(false);
        setShowTipDialog(true);
    };

    const proceedWithTip = async () => {
        if (!user || !post) return;

        setShowTipDialog(false);
        setIsTipping(true);
        try {
             const response = await fetch('/api/create-tip-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipperId: user.uid,
                    creatorId: post.publisherId,
                    postId: post.id,
                    postContent: post.content,
                }),
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'No se pudo iniciar el proceso de pago.');
            }
            const { url } = await response.json();
            if (url) window.location.href = url;
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsTipping(false);
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
    
     const handleSaveClick = async () => {
        if (!user || !post) {
            toast({ title: 'Debes iniciar sesión para guardar.', variant: 'destructive'});
            return;
        }
        
        const previouslySaved = isSaved;
        setIsSaved(!previouslySaved);
        
        try {
            if (previouslySaved) {
                await unsavePost(user.uid, post.id);
                 toast({ title: 'Publicación eliminada de tus guardados.' });
            } else {
                await savePost(user.uid, post.id);
                 toast({ title: '¡Publicación Guardada!' });
            }
        } catch (error) {
            setIsSaved(previouslySaved);
            toast({ title: 'Error al guardar.', variant: 'destructive'});
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
            if (comment.parentId && commentMap[comment.parentId]) {
                commentMap[comment.parentId].replies.push(commentMap[comment.id]);
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
                     {post.type !== 'text' && (
                        <div className="pt-4">
                            <h1 className="font-headline text-3xl font-bold text-primary">{post.content}</h1>
                        </div>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {post.mediaUrl && post.mediaType && (
                        <div className="aspect-video relative overflow-hidden rounded-lg">
                            <PostMedia 
                                mediaUrl={post.mediaUrl}
                                mediaType={post.mediaType}
                                altText={`Media for ${post.content}`}
                                className="object-cover"
                                controls
                            />
                        </div>
                    )}
                    {post.type === 'text' ? (
                        <PostContentRenderer content={post.content} mentions={post.mentions} />
                    ) : (
                        <PostContentViewer post={post} />
                    )}
                </CardContent>
                <CardFooter className="flex items-center gap-4 pt-4 border-t">
                     <Button variant="ghost" onClick={handleLikeClick} className="flex items-center gap-2 text-muted-foreground">
                        <ChefHat className={cn("w-6 h-6 transition-colors", isLiked && "fill-primary text-primary")} />
                        <span className="font-semibold">{likesCount}</span>
                    </Button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <MessageCircle className="w-6 h-6" />
                        <span className="font-semibold">{post.commentsCount || 0}</span>
                    </div>
                     <Button variant="ghost" onClick={handleSaveClick} className="flex items-center gap-2 text-muted-foreground">
                        <Bookmark className={cn("w-6 h-6 transition-colors", isSaved && "fill-primary text-primary")} />
                    </Button>
                    {post.canMonetize && !isOwner && (
                        <Button variant="ghost" onClick={handleTipClick} disabled={isTipping} className="flex items-center gap-2 text-muted-foreground hover:text-green-500">
                             {isTipping ? <Loader2 className="w-6 h-6 animate-spin" /> : <HeartHandshake className="w-6 h-6" />}
                            <span className="font-semibold">Apoyar</span>
                        </Button>
                    )}
                    <Button variant="ghost" onClick={handleShare} className="flex items-center gap-2 text-muted-foreground ml-auto">
                        <Share2 className="w-6 h-6" />
                    </Button>
                </CardFooter>
            </Card>

            <div className="space-y-6">
                <h2 className="font-headline text-2xl font-bold">Comentarios ({post.commentsCount || 0})</h2>

                {user ? (
                    <CommentInput user={user} onSubmit={handleAddComment} placeholder="Escribe un comentario..." />
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

            <AlertDialog open={showTipDialog} onOpenChange={setShowTipDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Apoyar al Creador</AlertDialogTitle>
                        <AlertDialogDescription>
                            Las propinas son una forma de apoyar directamente a los creadores por su trabajo. Esta transacción no es reembolsable.
                            <div className="flex items-center space-x-2 mt-4">
                                <Checkbox id="tip-agreement" checked={isTipAgreed} onCheckedChange={(checked) => setIsTipAgreed(checked as boolean)} />
                                <Label htmlFor="tip-agreement" className="text-sm font-normal text-muted-foreground">
                                    Entiendo y acepto las <Link href="/policies#monetization-policy" className="underline" target="_blank">políticas de monetización</Link>.
                                </Label>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={proceedWithTip} disabled={!isTipAgreed || isTipping}>
                            {isTipping ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Continuar con la Propina ($2.00)
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
