
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getPost, updatePost } from '@/lib/community';
import type { PublishedPost } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Film, Image as ImageIcon, Trash2, Terminal } from 'lucide-react';
import Link from 'next/link';
import { PostMedia } from '@/components/community/post-media';

const formSchema = z.object({
  content: z.string().min(1, 'El contenido no puede estar vacío.'),
  // Other fields are dynamically added based on post type
});

const LoadingSkeleton = () => (
    <div className="max-w-2xl mx-auto space-y-8">
        <header>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
        </header>
        <Card>
            <CardHeader>
                <Skeleton className="h-8 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                <Skeleton className="h-12 w-full" />
            </CardContent>
        </Card>
    </div>
);


export default function EditPostPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams<{ postId: string; locale: string; }>();
  const { toast } = useToast();

  const [post, setPost] = useState<PublishedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [removeCurrentMedia, setRemoveCurrentMedia] = useState(false);

  const form = useForm({
    // We'll set the resolver and default values dynamically
  });

  useEffect(() => {
    if (params.postId) {
      getPost(params.postId).then(postData => {
        if (postData) {
          setPost(postData);
          setMediaPreview(postData.mediaUrl || null);
          setMediaType(postData.mediaType || null);

          let schema, defaultValues;
          if (postData.type === 'text') {
            schema = z.object({ content: z.string().min(1, 'La publicación no puede estar vacía.').max(500, 'La publicación no puede exceder los 500 caracteres.') });
            defaultValues = { content: postData.content };
          } else { // 'recipe'
            schema = z.object({
              content: z.string().min(5, 'El nombre debe tener al menos 5 caracteres.'),
              instructions: z.string().min(20, 'Las instrucciones deben tener al menos 20 caracteres.'),
              ingredients: z.string().min(10, 'Por favor, enumera algunos ingredientes.'),
              equipment: z.string().min(3, 'Enumera al menos un equipo.'),
            });
            defaultValues = {
              content: postData.content,
              instructions: Array.isArray(postData.instructions) ? postData.instructions.join('\n') : '',
              ingredients: Array.isArray(postData.ingredients) ? postData.ingredients.join('\n') : '',
              equipment: Array.isArray(postData.equipment) ? postData.equipment.join('\n') : '',
            };
          }
          form.reset(defaultValues, {
            resolver: zodResolver(schema),
          } as any);

        }
        setLoading(false);
      });
    }
  }, [params.postId, form]);


  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewMediaFile(file);
      setRemoveCurrentMedia(false);
      setMediaType(file.type.startsWith('video') ? 'video' : 'image');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setMediaPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onRemoveMediaToggle = (checked: boolean) => {
    setRemoveCurrentMedia(checked);
    if (checked) {
      setNewMediaFile(null);
      setMediaPreview(null);
      setMediaType(null);
      const fileInput = document.getElementById('media-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
        setMediaPreview(post?.mediaUrl || null);
        setMediaType(post?.mediaType || null);
    }
  };

  const submitUpdate = async (updateData: Partial<PublishedPost> & { ingredients?: string; }) => {
    if (!post || !user) return;
    setIsUpdating(true);

    let mediaAction: string | null | 'DELETE' = null;
    if (removeCurrentMedia) {
        mediaAction = 'DELETE';
    } else if (newMediaFile && mediaPreview) {
        mediaAction = mediaPreview;
        updateData.mediaType = mediaType;
    }
    
    // For recipe, convert textareas back to arrays
    if (post.type === 'recipe') {
      updateData.instructions = (updateData.instructions as any as string).split('\n').filter(Boolean);
      updateData.ingredients = (updateData.ingredients as string).split('\n').filter(Boolean);
      updateData.equipment = (updateData.equipment as any as string).split('\n').filter(Boolean);
    }

    try {
        await updatePost(post.id, user.uid, updateData, mediaAction);
        toast({
            title: '¡Publicación Actualizada!',
            description: 'Tus cambios han sido guardados.',
        });
        router.push(`/${params.locale}/post/${post.id}`);
    } catch (error: any) {
        toast({
            title: 'Error al Actualizar',
            description: error.message || 'No se pudieron guardar tus cambios. Inténtalo de nuevo.',
            variant: 'destructive',
        });
    } finally {
        setIsUpdating(false);
    }
  };
  
  if (loading || authLoading) return <LoadingSkeleton />;

  if (!post) {
    return (
        <div className="max-w-2xl mx-auto space-y-4 text-center">
            <h1 className="font-headline text-2xl">Publicación no Encontrada</h1>
            <p className="text-muted-foreground">La publicación que intentas editar no existe o fue eliminada.</p>
            <Button asChild>
                <Link href={`/${params.locale}/community`}>Volver a la Comunidad</Link>
            </Button>
        </div>
    );
  }
  
  if (user?.uid !== post.publisherId) {
     return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
         <Alert variant="destructive" className="max-w-lg">
                <Terminal className='h-4 w-4' />
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>
                   No tienes permiso para editar esta publicación.
                </AlertDescription>
         </Alert>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href={`/${params.locale}/post/${post.id}`}>
        <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar y Volver
        </Button>
      </Link>
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Editar Publicación</h1>
        <p className="text-muted-foreground mt-2 text-lg">Realiza cambios en tu publicación y guárdalos.</p>
      </header>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(submitUpdate)} className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="font-headline">Contenido de la Publicación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                 {post.type === 'text' ? (
                     <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contenido</FormLabel>
                            <FormControl>
                            <Textarea {...field} rows={4} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                 ) : (
                    <>
                    <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de la Receta</FormLabel>
                            <FormControl><Input {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ingredients"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ingredientes</FormLabel>
                            <FormControl><Textarea {...field} rows={5} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="instructions"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Instrucciones</FormLabel>
                            <FormControl><Textarea {...field} rows={8} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="equipment"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Equipo Necesario</FormLabel>
                            <FormControl><Textarea {...field} rows={3} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    </>
                 )}
                </CardContent>
            </Card>

            <Card className="shadow-lg">
                <CardHeader>
                    <CardTitle className="font-headline">Medio de la Publicación</CardTitle>
                    <CardDescription>Cambia o elimina la imagen o video asociado a tu publicación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {mediaPreview ? (
                        <div className="mt-4 relative rounded-md overflow-hidden">
                            <PostMedia mediaUrl={mediaPreview} mediaType={mediaType!} altText="Vista previa" className="w-full h-auto max-h-72 object-cover" />
                        </div>
                     ) : (
                        <div className="flex flex-col justify-center items-center h-40 bg-muted rounded-lg">
                            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Esta publicación no tiene medio.</p>
                        </div>
                     )}

                    <FormItem>
                        <FormLabel>Subir un nuevo medio</FormLabel>
                        <FormControl>
                           <Input id="media-upload" type="file" accept="image/png, image/jpeg, video/mp4, video/webm" onChange={handleMediaChange} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                   
                    {post.mediaUrl && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remove-media"
                                checked={removeCurrentMedia}
                                onCheckedChange={onRemoveMediaToggle}
                            />
                            <label
                                htmlFor="remove-media"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive"
                            >
                                Eliminar el medio actual
                            </label>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button type="submit" disabled={isUpdating} className="w-full">
                {isUpdating ? 'Guardando Cambios...' : 'Guardar Cambios'}
                <Save className="ml-2 h-4 w-4" />
            </Button>
        </form>
      </Form>
    </div>
  );
}
