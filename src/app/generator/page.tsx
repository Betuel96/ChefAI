
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ChefHat, Save, Loader2, Info } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { generateRecipe, GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { generateRecipeImage } from '@/ai/flows/generate-recipe-image';
import { addRecipe } from '@/lib/recipes';
import { PostMedia } from '@/components/community/post-media';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  servings: z.coerce.number().int().min(1, 'Debe servir al menos para 1 persona.').max(20, 'No puede servir para más de 20 personas.'),
});

type GeneratedRecipeWithImage = GenerateRecipeOutput & { 
  imageUrl: string; 
  mediaType: 'image' | 'video';
  benefits: string;
};

export default function RecipeGeneratorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipeWithImage | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      servings: 2,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setGeneratedRecipe(null);
    try {
      // For a better user experience, we generate the recipe name first for the image prompt.
      // A more complex implementation might generate the recipe, then the image in a second step.
      const recipeNameGuess = 'un plato delicioso basado en ' + values.ingredients.split(',').slice(0, 2).join(', ');

      const [recipeResult, imageResult] = await Promise.all([
        generateRecipe(values),
        generateRecipeImage({ recipeName: recipeNameGuess }),
      ]);

      if (!recipeResult || !imageResult || !imageResult.imageUrl) {
        throw new Error('No se pudo generar la receta o la imagen.');
      }
      
      // We'll override the AI-generated name if the recipe prompt gives a better one.
      recipeResult.name = recipeResult.name || "Receta Creativa";

      setGeneratedRecipe({ 
        ...recipeResult, 
        imageUrl: imageResult.imageUrl,
        mediaType: 'image',
      });

    } catch (error: any) {
      toast({
        title: 'Error de Generación',
        description: error.message || 'No se pudo generar la receta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleSaveRecipe = async () => {
    if (!user) {
        toast({ title: 'Debes iniciar sesión para guardar recetas.', variant: 'destructive'});
        router.push('/login');
        return;
    }
    if (!generatedRecipe) return;

    setIsSaving(true);
    try {
        const { imageUrl, mediaType, ...recipeData } = generatedRecipe;
        await addRecipe(user.uid, recipeData, imageUrl, mediaType);
        toast({
            title: '¡Receta Guardada!',
            description: `"${recipeData.name}" se ha añadido a tu libro de recetas.`,
        });
        router.push('/my-recipes');
    } catch(error: any) {
        toast({
            title: 'Error al Guardar',
            description: error.message || 'No se pudo guardar la receta.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
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
                        <Textarea placeholder="ej., pechuga de pollo, arroz, brócoli, salsa de soja" {...field} rows={4} disabled={isLoading} />
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
                        <Input type="number" min="1" max="20" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Generando...' : 'Generar Receta'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24">
        <h2 className="font-headline text-3xl font-bold text-primary text-center">Receta Generada</h2>
        <Card className="shadow-lg min-h-[400px]">
          {isLoading ? (
             <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                <p className="text-lg">Creando algo delicioso...</p>
            </div>
          ) : generatedRecipe ? (
            <>
            <CardHeader>
              <CardTitle className="font-headline text-2xl">{generatedRecipe.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="aspect-video relative overflow-hidden rounded-md bg-muted">
                    <PostMedia
                        mediaUrl={generatedRecipe.imageUrl}
                        mediaType={generatedRecipe.mediaType}
                        altText={`Generated image for ${generatedRecipe.name}`}
                        className="object-cover"
                    />
                 </div>
              {generatedRecipe.benefits && (
                <div className="p-4 bg-primary/10 rounded-lg">
                    <h3 className="font-headline text-lg font-semibold text-primary/80 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Beneficios</h3>
                    <p className="mt-2 text-primary/70 text-sm">{generatedRecipe.benefits}</p>
                </div>
              )}
              <div>
                <h3 className="font-headline text-lg font-semibold text-accent">Ingredientes</h3>
                <ul className="list-disc list-inside mt-2 text-muted-foreground">
                    {generatedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-accent">Instrucciones</h3>
                <ol className="list-decimal list-inside mt-2 text-muted-foreground">
                    {generatedRecipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
               <div>
                <h3 className="font-headline text-lg font-semibold text-accent">Equipo Necesario</h3>
                <ul className="list-disc list-inside mt-2 text-muted-foreground">
                    {generatedRecipe.equipment.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveRecipe} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Guardando...' : 'Guardar en mi Libro de Recetas'}
                </Button>
            </CardFooter>
            </>
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px] p-6">
                <ChefHat className="w-16 h-16 mb-4" />
              <p className="font-semibold">Tu receta aparecerá aquí.</p>
              <p className="text-sm">Rellena el formulario de la izquierda y haz clic en "Generar Receta".</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
