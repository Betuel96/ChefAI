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

import { publishRecipe } from '@/lib/community';
import type { Recipe } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PlusSquare, Send, VenetianMask, Mail } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

const formSchema = z.object({
  name: z.string().min(5, 'El nombre debe tener al menos 5 caracteres.'),
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
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-10 w-full" />
                </div>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-20 w-full" />
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

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      instructions: '',
      additionalIngredients: '',
      equipment: '',
    },
  });
  
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue('image', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!user) {
      toast({
        title: 'Debes iniciar sesión',
        description: 'No puedes publicar una receta sin haber iniciado sesión.',
        variant: 'destructive',
      });
      return;
    }

    if (!user.emailVerified) {
      toast({
        title: 'Correo no verificado',
        description: 'Por favor, verifica tu correo electrónico antes de publicar.',
        variant: 'destructive',
      });
      return;
    }

    setIsPublishing(true);

    try {
      const recipeToPublish: Recipe = {
        name: values.name,
        instructions: values.instructions,
        additionalIngredients: values.additionalIngredients,
        equipment: values.equipment,
      };

      await publishRecipe(
          user.uid,
          user.displayName || 'Usuario Anónimo',
          user.photoURL,
          recipeToPublish,
          imagePreview
      );
      
      toast({
        title: '¡Receta Publicada!',
        description: `"${values.name}" ahora es visible para la comunidad.`,
      });
      router.push('/community');

    } catch (error: any) {
      console.error("Error publishing recipe:", error);
      toast({
        title: 'Error al Publicar',
        description: error.message || 'No se pudo publicar la receta. Revisa los permisos de Firestore o inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsPublishing(false);
    }
  }

  const handleResend = async () => {
    setIsSending(true);
    const result = await resendVerificationEmail();
    if (result.success) {
      toast({
        title: 'Correo Enviado',
        description: result.message,
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSending(false);
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
         <Alert variant="destructive" className="max-w-lg">
                <AlertTitle>Acceso Denegado</AlertTitle>
                <AlertDescription>
                   Debes <a href="/login" className='underline font-bold'>iniciar sesión</a> para poder publicar una receta en la comunidad.
                </AlertDescription>
         </Alert>
        </div>
    )
  }

  if (!user.emailVerified) {
     return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
         <Alert variant="destructive" className="max-w-lg">
                <VenetianMask className='h-4 w-4' />
                <AlertTitle>Verificación de Correo Requerida</AlertTitle>
                <AlertDescription>
                   <p className="mb-4">Para publicar una receta, primero debes verificar tu correo electrónico. Por favor, revisa la bandeja de entrada del correo con el que te registraste y haz clic en el enlace de verificación.</p>
                   <Button
                      onClick={handleResend}
                      disabled={isSending}
                      variant="secondary"
                      className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90 w-full"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      {isSending ? 'Enviando...' : 'Reenviar Correo de Verificación'}
                    </Button>
                </AlertDescription>
         </Alert>
        </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Crear una Publicación</h1>
        <p className="text-muted-foreground mt-2 text-lg">Comparte tu propia receta con la comunidad de ChefAI.</p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">Detalles de la Receta</CardTitle>
          <CardDescription>Rellena el formulario para compartir tu creación.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Receta</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Lasaña de la abuela" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

               <FormField
                  control={form.control}
                  name="image"
                  render={() => (
                    <FormItem>
                      <FormLabel>Imagen de la Receta</FormLabel>
                      <FormControl>
                         <Input type="file" accept="image/png, image/jpeg" onChange={handleImageChange} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {imagePreview && (
                  <div className="mt-4">
                    <img src={imagePreview} alt="Vista previa de la imagen" className="w-full max-h-64 object-cover rounded-md" />
                  </div>
                )}

              <FormField
                control={form.control}
                name="additionalIngredients"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ingredientes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="200g de harina\n1 huevo\n..." {...field} rows={5} />
                    </FormControl>
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
                    <FormControl>
                      <Textarea placeholder="1. Mezclar los ingredientes secos.\n2. Añadir los huevos..." {...field} rows={8} />
                    </FormControl>
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
                    <FormControl>
                      <Textarea placeholder="Bol, batidora, horno..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button type="submit" disabled={isPublishing || !user?.emailVerified} className="w-full">
                {isPublishing ? 'Publicando...' : 'Publicar en la Comunidad'}
                <Send className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
