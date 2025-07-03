
// src/app/edit-post/[postId]/page.tsx
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
import { ArrowLeft, Save, Image as ImageIcon, Trash2, Terminal } from 'lucide-react';
import Link from 'next/link';

// Schema for the text post form
const textPostSchema = z.object({
  content: z.string().min(1, 'La publicación no puede estar vacía.').max(500, 'La publicación no puede exceder los 500 caracteres.'),
});

// Schema for the recipe post form
const recipeFormSchema = z.object({
  content: z.string().min(5, 'El nombre debe tener al menos 5 caracteres.'),
  instructions: z.string().min(20, 'Las instrucciones deben tener al menos 20 caracteres.'),
  additionalIngredients: z.string().min(10, 'Por favor, enumera algunos ingredientes.'),
  equipment: z.string().min(3, 'Enumera al menos un equipo.'),
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
  const params = useParams<{ postId: string }>();
  const { toast } = useToast();

  const [post, setPost] = useState<PublishedPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [removeCurrentImage, setRemoveCurrentImage] = useState(false);

  const textForm = useForm<z.infer<typeof textPostSchema>>({
    resolver: zodResolver(textPostSchema),
  });
  const recipeForm = useForm<z.infer<typeof recipeFormSchema>>({
    resolver: zodResolver(recipeFormSchema),
  });

  useEffect(() => {
    if (params.postId) {
      getPost(params.postId).then(postData => {
        if (postData) {
          setPost(postData);
          setImagePreview(postData.imageUrl || null);
          if (postData.type === 'text') {
            textForm.reset({ content: postData.content });
          } else if (postData.type === 'recipe') {
            recipeForm.reset({
              content: postData.content,
              instructions: postData.instructions || '',
              additionalIngredients: postData.additionalIngredients || '',
              equipment: postData.equipment || '',
            });
          }
        }
        setLoading(false);
      });
    }
  }, [params.postId, textForm, recipeForm]);


  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      setRemoveCurrentImage(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const onRemoveImageToggle = (checked: boolean) => {
    setRemoveCurrentImage(checked);
    if (checked) {
      setNewImageFile(null);
      setImagePreview(null);
      // Reset the file input
      const fileInput = document.getElementById('image-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } else {
        // If unchecking, restore the original image if it exists
        setImagePreview(post?.imageUrl || null);
    }
  };

  const submitUpdate = async (updateData: Partial<PublishedPost>) => {
    if (!post || !user) return;
    setIsUpdating(true);

    let imageAction: string | null | 'DELETE' = null;
    if (removeCurrentImage) {
        imageAction = 'DELETE';
    } else if (newImageFile && imagePreview) {
        imageAction = imagePreview;
    }

    try {
        await updatePost(post.id, user.uid, updateData, imageAction);
        toast({
            title: '¡Publicación Actualizada!',
            description: 'Tus cambios han sido guardados.',
        });
        router.push(`/post/${post.id}`);
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
  
  const handleTextSubmit = async (values: z.infer<typeof textPostSchema>) => {
    await submitUpdate({ content: values.content });
  }
  const handleRecipeSubmit = async (values: z.infer<typeof recipeFormSchema>) => {
     await submitUpdate(values);
  }

  if (loading || authLoading) return <LoadingSkeleton />;

  if (!post) {
    return (
        <div className="max-w-2xl mx-auto space-y-4 text-center">
            <h1 className="font-headline text-2xl">Publicación no Encontrada</h1>
            <p className="text-muted-foreground">La publicación que intentas editar no existe o fue eliminada.</p>
            <Button asChild>
                <Link href="/community">Volver a la Comunidad</Link>
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

  const activeForm = post.type === 'text' ? textForm : recipeForm;
  const activeSubmitHandler = post.type === 'text' ? handleTextSubmit : handleRecipeSubmit;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link href={`/post/${post.id}`}>
        <Button variant="ghost">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Cancelar y Volver
        </Button>
      </Link>
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Editar Publicación</h1>
        <p className="text-muted-foreground mt-2 text-lg">Realiza cambios en tu publicación y guárdalos.</p>
      </header>

      <Form {...activeForm}>
        <form onSubmit={activeForm.handleSubmit(activeSubmitHandler as any)} className="space-y-6">
            <Card className="shadow-lg">
                <CardHeader>
                <CardTitle className="font-headline">Contenido de la Publicación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                 {post.type === 'text' ? (
                     <FormField
                        control={textForm.control}
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
                        control={recipeForm.control}
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
                        control={recipeForm.control}
                        name="additionalIngredients"
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ingredientes</FormLabel>
                            <FormControl><Textarea {...field} rows={5} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                    <FormField
                        control={recipeForm.control}
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
                        control={recipeForm.control}
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
                    <CardTitle className="font-headline">Imagen de la Publicación</CardTitle>
                    <CardDescription>Cambia o elimina la imagen asociada a tu publicación.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {imagePreview ? (
                        <div className="mt-4 relative">
                            <img src={imagePreview} alt="Vista previa" className="w-full h-auto max-h-72 object-cover rounded-md" />
                        </div>
                     ) : (
                        <div className="flex flex-col justify-center items-center h-40 bg-muted rounded-lg">
                            <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                            <p className="text-muted-foreground">Esta publicación no tiene imagen.</p>
                        </div>
                     )}

                    <FormItem>
                        <FormLabel>Subir una nueva imagen</FormLabel>
                        <FormControl>
                           <Input id="image-upload" type="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                   
                    {post.imageUrl && (
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remove-image"
                                checked={removeCurrentImage}
                                onCheckedChange={onRemoveImageToggle}
                            />
                            <label
                                htmlFor="remove-image"
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive"
                            >
                                Eliminar la imagen actual
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
