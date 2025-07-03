// src/app/publish/page.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { resendVerificationEmail } from '@/lib/users';
import { createPost } from '@/lib/community';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Send, VenetianMask, Mail, PenSquare, Utensils } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Schema for the text post form
const textPostSchema = z.object({
  content: z.string().min(1, 'La publicación no puede estar vacía.').max(500, 'La publicación no puede exceder los 500 caracteres.'),
  image: z.instanceof(File).optional(),
});

// Schema for the recipe post form
const recipeFormSchema = z.object({
  content: z.string().min(5, 'El nombre debe tener al menos 5 caracteres.'),
  instructions: z.string().min(20, 'Las instrucciones deben tener al menos 20 caracteres.'),
  additionalIngredients: z.string().min(10, 'Por favor, enumera algunos ingredientes.'),
  equipment: z.string().min(3, 'Enumera al menos un equipo.'),
  image: z.instanceof(File).optional(),
});

const LoadingSkeleton = () => (
    <div className="max-w-2xl mx-auto space-y-8">
        <header>
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-2" />
        </header>
        <Skeleton className="h-10 w-full" />
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


export default function PublishPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isPublishing, setIsPublishing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const textForm = useForm<z.infer<typeof textPostSchema>>({
    resolver: zodResolver(textPostSchema),
    defaultValues: { content: '' },
  });

  const recipeForm = useForm<z.infer<typeof recipeFormSchema>>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      content: '',
      instructions: '',
      additionalIngredients: '',
      equipment: '',
    },
  });
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>, formType: 'text' | 'recipe') => {
    const file = event.target.files?.[0];
    if (file) {
      if (formType === 'text') textForm.setValue('image', file);
      else recipeForm.setValue('image', file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = () => {
    // Clear forms and image preview when switching tabs
    textForm.reset();
    recipeForm.reset();
    setImagePreview(null);
  };

  async function handleTextSubmit(values: z.infer<typeof textPostSchema>) {
    await submitPost({
      type: 'text',
      content: values.content,
    });
  }

  async function handleRecipeSubmit(values: z.infer<typeof recipeFormSchema>) {
    await submitPost({
      type: 'recipe',
      content: values.content, // Recipe name
      instructions: values.instructions,
      additionalIngredients: values.additionalIngredients,
      equipment: values.equipment,
    });
  }

  async function submitPost(postData: any) {
    if (!user) return; // Should be covered by page-level checks

    setIsPublishing(true);
    try {
      await createPost(
          user.uid,
          user.displayName || 'Usuario Anónimo',
          user.photoURL,
          postData,
          imagePreview // Pass the base64 preview string for upload
      );
      
      toast({
        title: '¡Publicación Creada!',
        description: `Tu publicación ahora es visible para la comunidad.`,
      });
      router.push('/community');

    } catch (error: any) {
      toast({
        title: 'Error al Publicar',
        description: error.message || 'No se pudo crear la publicación. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  }

  const handleResend = async () => {
    setIsSending(true);
    const result = await resendVerificationEmail();
    toast({
      title: result.success ? 'Correo Enviado' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    setIsSending(false);
  };

  if (loading) return <LoadingSkeleton />;

  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
         <Alert variant="destructive" className="max-w-lg">
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>
                   Debes <a href="/login" className='underline font-bold'>iniciar sesión</a> para poder publicar en la comunidad.
                </AlertDescription>
         </Alert>
        </div>
    );
  }

  if (!user.emailVerified) {
     return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
         <Alert variant="destructive" className="max-w-lg">
                <VenetianMask className='h-4 w-4' />
                <AlertTitle>Verificación de Correo Requerida</AlertTitle>
                <AlertDescription>
                   <p className="mb-4">Para publicar, primero debes verificar tu correo electrónico.</p>
                   <Button onClick={handleResend} disabled={isSending} variant="secondary" className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90 w-full">
                      <Mail className="mr-2 h-4 w-4" />
                      {isSending ? 'Enviando...' : 'Reenviar Correo de Verificación'}
                    </Button>
                </AlertDescription>
         </Alert>
        </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Crear una Publicación</h1>
        <p className="text-muted-foreground mt-2 text-lg">Comparte una receta o un pensamiento con la comunidad.</p>
      </header>

      <Tabs defaultValue="text" className="w-full" onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text"><PenSquare className="mr-2 h-4 w-4" /> Publicación Rápida</TabsTrigger>
          <TabsTrigger value="recipe"><Utensils className="mr-2 h-4 w-4" /> Publicar Receta</TabsTrigger>
        </TabsList>
        
        {/* TEXT POST TAB */}
        <TabsContent value="text">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">¿Qué estás cocinando?</CardTitle>
              <CardDescription>Comparte una actualización rápida o una foto.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...textForm}>
                <form onSubmit={textForm.handleSubmit(handleTextSubmit)} className="space-y-6">
                  <FormField
                    control={textForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contenido</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Ej: ¡Probando una nueva receta de pasta esta noche!" {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={textForm.control}
                    name="image"
                    render={() => (
                      <FormItem>
                        <FormLabel>Añadir Imagen (opcional)</FormLabel>
                        <FormControl>
                           <Input type="file" accept="image/png, image/jpeg" onChange={(e) => handleImageChange(e, 'text')} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {imagePreview && (
                    <div className="mt-4"><img src={imagePreview} alt="Vista previa" className="w-full max-h-64 object-cover rounded-md" /></div>
                  )}
                  <Button type="submit" disabled={isPublishing} className="w-full">
                    {isPublishing ? 'Publicando...' : 'Publicar'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECIPE POST TAB */}
        <TabsContent value="recipe">
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Detalles de la Receta</CardTitle>
              <CardDescription>Rellena el formulario para compartir tu creación.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...recipeForm}>
                <form onSubmit={recipeForm.handleSubmit(handleRecipeSubmit)} className="space-y-6">
                  <FormField
                    control={recipeForm.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre de la Receta</FormLabel>
                        <FormControl><Input placeholder="Ej: Lasaña de la abuela" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                      control={recipeForm.control}
                      name="image"
                      render={() => (
                        <FormItem>
                          <FormLabel>Imagen de la Receta (opcional)</FormLabel>
                          <FormControl><Input type="file" accept="image/png, image/jpeg" onChange={(e) => handleImageChange(e, 'recipe')} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {imagePreview && (
                      <div className="mt-4"><img src={imagePreview} alt="Vista previa" className="w-full max-h-64 object-cover rounded-md" /></div>
                    )}
                  <FormField
                    control={recipeForm.control}
                    name="additionalIngredients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingredientes</FormLabel>
                        <FormControl><Textarea placeholder="200g de harina\n1 huevo\n..." {...field} rows={5} /></FormControl>
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
                        <FormControl><Textarea placeholder="1. Mezclar los ingredientes secos.\n2. Añadir los huevos..." {...field} rows={8} /></FormControl>
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
                        <FormControl><Textarea placeholder="Bol, batidora, horno..." {...field} rows={3} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isPublishing} className="w-full">
                    {isPublishing ? 'Publicando...' : 'Publicar Receta'}
                    <Send className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
