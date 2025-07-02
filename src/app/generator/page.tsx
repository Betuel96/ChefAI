'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateRecipe } from '@/ai/flows/generate-recipe';
import { generateRecipeImage } from '@/ai/flows/generate-recipe-image';
import { addRecipe } from '@/lib/recipes';
import { publishRecipe } from '@/lib/community';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BookHeart, ChefHat, Sparkles, Gem, Image as ImageIcon, RefreshCw, Send } from 'lucide-react';
import type { Recipe } from '@/types';
import { Separator } from '@/components/ui/separator';
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
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  servings: z.coerce.number().int().min(1, 'Debe servir al menos para 1 persona.').max(20, 'No puede servir para más de 20 personas.'),
});

const FREE_GENERATIONS_LIMIT = 2;

export default function RecipeGeneratorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  
  const [generationCount, setGenerationCount] = useLocalStorage<number>('recipeGenerationCount', 0);
  
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      servings: 2,
    },
  });

  const runGeneration = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setGeneratedRecipe(null);
    setImageUrl(null);
    setIsGeneratingImage(false);

    try {
      // 1. Generate recipe text first
      const recipe = await generateRecipe(values);
      setGeneratedRecipe(recipe);
      setIsLoading(false); // UI now shows the text recipe
      setIsGeneratingImage(true); // UI now shows image loading placeholder

      if (!user?.isPremium) {
        setGenerationCount(generationCount + 1);
      }

      // 2. Generate image in the background
      const imageResult = await generateRecipeImage({ recipeName: recipe.name });
      setImageUrl(imageResult.imageUrl);
      setIsGeneratingImage(false); // UI now shows the final image

    } catch (error) {
        console.error(error);
        toast({
            title: 'Error al Generar',
            description: 'No se pudo completar la generación. Por favor, inténtalo de nuevo.',
            variant: 'destructive',
        });
        setIsLoading(false);
        setIsGeneratingImage(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (user?.isPremium || generationCount < FREE_GENERATIONS_LIMIT) {
      runGeneration(values);
    } else {
      setShowAdDialog(true);
    }
  };

  const handleWatchAd = () => {
    setIsSimulatingAd(true);
    setShowAdDialog(false);
    setTimeout(() => {
      setIsSimulatingAd(false);
      runGeneration(form.getValues());
    }, 2000); // Simula un anuncio de 2 segundos
  };

  async function handleSaveRecipe() {
    if (!generatedRecipe || !user) {
      toast({
        title: 'Inicia Sesión para Guardar',
        description: 'Crea una cuenta o inicia sesión para guardar tus recetas en la nube.',
        variant: 'default',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await addRecipe(user.uid, generatedRecipe, imageUrl);
      toast({
        title: '¡Receta Guardada!',
        description: `"${generatedRecipe.name}" se ha guardado en tu cuenta.`,
      });
    } catch (error) {
       toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar la receta. Inténtalo de nuevo.`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePublishRecipe() {
    if (!generatedRecipe || !user) {
        toast({
            title: 'Inicia Sesión para Publicar',
            description: 'Debes iniciar sesión para compartir tus recetas con la comunidad.',
            variant: 'default',
        });
        return;
    }
    setIsPublishing(true);
    try {
        await publishRecipe(user.uid, generatedRecipe, imageUrl);
        toast({
            title: '¡Receta Publicada!',
            description: `"${generatedRecipe.name}" ahora es visible para la comunidad.`,
        });
        router.push('/community');
    } catch (error: any) {
        toast({
            title: 'Error al Publicar',
            description: error.message || 'No se pudo publicar la receta. Inténtalo de nuevo.',
            variant: 'destructive',
        });
    } finally {
        setIsPublishing(false);
    }
  }


  const getButtonText = () => {
    if (isLoading) return 'Generando Receta...';
    if (isSimulatingAd) return 'Viendo Anuncio...';
    if (isGeneratingImage) return 'Generando Imagen...';
    return 'Generar Receta';
  }

  const anyTextLoading = isLoading || isSimulatingAd;
  const anyLoading = anyTextLoading || isGeneratingImage || isSaving || isPublishing;
  const generationsLeft = FREE_GENERATIONS_LIMIT - generationCount;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <header>
            <h1 className="font-headline text-4xl font-bold text-primary">Generador de Recetas</h1>
            <p className="text-muted-foreground mt-2 text-lg">¡Convierte tus ingredientes en una comida deliciosa!</p>
          </header>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Tus Ingredientes</CardTitle>
              <CardDescription>Ingresa lo que tienes y crearemos una receta para ti.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingredientes Disponibles</FormLabel>
                        <FormControl>
                          <Textarea placeholder="ej., pechuga de pollo, arroz, brócoli, salsa de soja" {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="servings"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Número de Porciones</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={anyLoading} className="w-full">
                    {getButtonText()}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
            {!user?.isPremium && (
              <CardFooter className='justify-center'>
                 <p className="text-sm text-muted-foreground">
                    Te queda{generationsLeft === 1 ? '' : 'n'} {generationsLeft > 0 ? generationsLeft : 0} generaci{generationsLeft === 1 ? 'ón' : 'ones'} gratuita{generationsLeft === 1 ? '' : 's'}.
                  </p>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="font-headline text-3xl font-bold text-primary text-center">Receta Generada</h2>
          <Card className="shadow-lg min-h-[400px]">
            <CardHeader>
              {generatedRecipe ? (
                <>
                  <CardTitle className="font-headline text-2xl flex items-center gap-2"><ChefHat /> {generatedRecipe.name}</CardTitle>
                </>
              ) : (
                <CardTitle className="font-headline text-2xl">Tu receta aparecerá aquí</CardTitle>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {anyTextLoading && !generatedRecipe && (
                <div className="space-y-4 p-2">
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}
               {isSimulatingAd && (
                <div className="text-center text-muted-foreground py-10">
                  <p className="font-semibold">Cargando anuncio...</p>
                  <p>Tu receta se generará en un momento.</p>
                </div>
              )}
              {generatedRecipe && (
                <>
                  {isGeneratingImage && (
                    <div className="flex flex-col justify-center items-center h-56 bg-muted rounded-lg animate-pulse mb-4">
                      <ImageIcon className="w-10 h-10 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Generando imagen...</p>
                    </div>
                  )}
                  {imageUrl && (
                    <div className="mb-4 rounded-lg overflow-hidden shadow-inner">
                        <img
                            src={imageUrl}
                            alt={`Imagen de ${generatedRecipe.name}`}
                            className="w-full h-auto object-cover"
                        />
                    </div>
                  )}
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-headline text-xl font-semibold text-accent">Instrucciones</h3>
                      <p className="whitespace-pre-wrap">{generatedRecipe.instructions}</p>
                    </div>
                    <Separator/>
                    <div>
                      <h3 className="font-headline text-xl font-semibold text-accent">Ingredientes Adicionales</h3>
                      <p className="whitespace-pre-wrap">{generatedRecipe.additionalIngredients}</p>
                    </div>
                    <Separator/>
                    <div>
                      <h3 className="font-headline text-xl font-semibold text-accent">Equipo Necesario</h3>
                      <p className="whitespace-pre-wrap">{generatedRecipe.equipment}</p>
                    </div>
                  </div>
                </>
              )}
              {!isLoading && !isSimulatingAd && !generatedRecipe && (
                <div className="text-center text-muted-foreground py-10">
                  <p>Completa el formulario y haz clic en "Generar Receta" para comenzar.</p>
                </div>
              )}
            </CardContent>
            {generatedRecipe && (
              <CardFooter className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    <Button onClick={handleSaveRecipe} className="w-full" variant="secondary" disabled={anyLoading || !user}>
                      {isSaving ? (
                        <>Guardando...</>
                      ) : (
                        <>
                          <BookHeart className="mr-2 h-4 w-4" />
                          Guardar Receta
                        </>
                      )}
                    </Button>
                    <Button onClick={handlePublishRecipe} className="w-full" disabled={anyLoading || !user}>
                        {isPublishing ? (
                            <>Publicando...</>
                        ) : (
                            <>
                            <Send className="mr-2 h-4 w-4" />
                            Publicar en Comunidad
                            </>
                        )}
                    </Button>
                </div>
                 <Button onClick={() => onSubmit(form.getValues())} variant="outline" className="w-full" disabled={anyLoading}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generar Otra
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>

      <AlertDialog open={showAdDialog} onOpenChange={setShowAdDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¡Límite gratuito alcanzado!</AlertDialogTitle>
            <AlertDialogDescription>
              Has utilizado tus {FREE_GENERATIONS_LIMIT} generaciones gratuitas. Para seguir creando, mira un anuncio o actualiza a Pro para tener generaciones ilimitadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className='sm:justify-between gap-2'>
            <Button variant="outline" onClick={() => router.push('/pro')}>
              <Gem className="mr-2 h-4 w-4" />
              Actualizar a Pro
            </Button>
            <div className='flex flex-col-reverse sm:flex-row sm:justify-end gap-2'>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleWatchAd}>Ver Anuncio y Continuar</AlertDialogAction>
            </div>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
