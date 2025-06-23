'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateRecipe } from '@/ai/flows/generate-recipe';
import { addRecipe } from '@/lib/recipes';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BookHeart, ChefHat, Sparkles, Gem, LogIn } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  servings: z.coerce.number().int().min(1, 'Debe servir al menos para 1 persona.').max(20, 'No puede servir para más de 20 personas.'),
});

const FREE_GENERATIONS_LIMIT = 2;

export default function RecipeGeneratorPage() {
  const { user } = useAuth();
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  
  const [generationCount, setGenerationCount] = useLocalStorage<number>('recipeGenerationCount', 0);
  const [isPremium, setIsPremium] = useLocalStorage<boolean>('isPremium', false);
  
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
    try {
      const recipe = await generateRecipe(values);
      setGeneratedRecipe(recipe);
      if (!isPremium) {
        setGenerationCount(generationCount + 1);
      }
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error al Generar la Receta',
        description: 'Algo salió mal. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (isPremium || generationCount < FREE_GENERATIONS_LIMIT) {
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
    }, 2000); // Simulate 2 second ad watch
  };

  async function handleSaveRecipe() {
    if (!generatedRecipe) return;

    if (!user) {
      toast({
        title: 'Inicia Sesión para Guardar',
        description: 'Crea una cuenta o inicia sesión para guardar tus recetas en la nube.',
        variant: 'default',
      });
      return;
    }
    
    setIsSaving(true);
    try {
      await addRecipe(user.uid, generatedRecipe);
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

  const generationsLeft = FREE_GENERATIONS_LIMIT - generationCount;
  const anyLoading = isLoading || isSimulatingAd || isSaving;

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
                    {isLoading ? 'Generando...' : isSimulatingAd ? 'Viendo Anuncio...' : 'Generar Receta'}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
            {!isPremium && (
              <CardFooter className='justify-center'>
                 <p className="text-sm text-muted-foreground">
                    Te queda{generationsLeft === 1 ? '' : 'n'} {generationsLeft > 0 ? generationsLeft : 0} generaci{generationsLeft === 1 ? 'ón' : 'ones'} gratuita{generationsLeft === 1 ? '' : 's'}.
                  </p>
              </CardFooter>
            )}
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Simulación de Plan</CardTitle>
              <CardDescription>Activa para simular que eres un usuario Pro y saltarte los límites.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Switch id="premium-mode" checked={isPremium} onCheckedChange={setIsPremium} />
                <Label htmlFor="premium-mode" className='flex items-center'>
                  <Gem className="mr-2 h-4 w-4 text-primary" />
                  Modo ChefAI Pro {isPremium ? "Activado" : "Desactivado"}
                </Label>
              </div>
            </CardContent>
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
              {isLoading && (
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
              )}
              {!anyLoading && !generatedRecipe && (
                <div className="text-center text-muted-foreground py-10">
                  <p>Completa el formulario y haz clic en "Generar Receta" para comenzar.</p>
                </div>
              )}
            </CardContent>
            {generatedRecipe && (
              <CardFooter>
                <Button onClick={handleSaveRecipe} className="w-full" variant="secondary" disabled={isSaving}>
                  {isSaving ? (
                    <>Guardando...</>
                  ) : (
                    <>
                      <BookHeart className="mr-2 h-4 w-4" />
                      Guardar Receta
                    </>
                  )}
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
              Has utilizado tus {FREE_GENERATIONS_LIMIT} generaciones de recetas gratuitas. Para generar otra, por favor mira un anuncio corto.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleWatchAd}>Ver Anuncio y Continuar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
