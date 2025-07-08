
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, ChefHat, Save, Loader2, Info, Beef, Gem, Tv } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useParams } from 'next/navigation';
import { generateRecipe, GenerateRecipeOutput } from '@/ai/flows/generate-recipe';
import { generateRecipeImage } from '@/ai/flows/generate-recipe-image';
import { addRecipe } from '@/lib/recipes';
import { PostMedia } from '@/components/community/post-media';
import { NutritionalInfo } from '@/types';
import { getDictionary } from '@/lib/get-dictionary';
import { Locale, localeToAILanguage } from '@/i18n.config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  servings: z.coerce.number().int().min(1, 'Debe servir al menos para 1 persona.').max(20, 'No puede servir para más de 20 personas.'),
  cuisineSelection: z.string().optional(),
  customCuisine: z.string().optional(),
});

type GeneratedRecipeWithImage = GenerateRecipeOutput & { 
  imageUrl: string; 
  mediaType: 'image' | 'video';
  benefits: string;
};

export default function RecipeGeneratorPage() {
  const params = useParams();
  const locale = params.locale as Locale;
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState<GeneratedRecipeWithImage | null>(null);
  const [dict, setDict] = useState<any>(null);

  useEffect(() => {
    if (locale) {
      getDictionary(locale).then(setDict);
    }
  }, [locale]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      servings: 2,
      cuisineSelection: 'aleatoria',
      customCuisine: '',
    },
  });

  const cuisineSelection = form.watch('cuisineSelection');

  const runGeneration = async (values: { ingredients: string; servings: number; cuisine?: string }) => {
    setIsLoading(true);
    setGeneratedRecipe(null);
    try {
      const recipeNameGuess = 'un plato delicioso basado en ' + values.ingredients.split(',').slice(0, 2).join(', ');
      
      const language = localeToAILanguage[locale] || 'Spanish';

      const [recipeResult, imageResult] = await Promise.all([
        generateRecipe({...values, language }),
        generateRecipeImage({ recipeName: recipeNameGuess }),
      ]);

      if (!recipeResult || !imageResult || !imageResult.imageUrl) {
        throw new Error(dict.error_messages.generation_error_description);
      }
      
      recipeResult.name = recipeResult.name || "Receta Creativa";

      setGeneratedRecipe({ 
        ...recipeResult, 
        imageUrl: imageResult.imageUrl,
        mediaType: 'image',
      });

    } catch (error: any) {
      let description = dict.error_messages.generation_error_description;
      if (error.message && (error.message.includes('API key not valid') || error.message.includes('API key is invalid') || error.message.includes('PERMISSION_DENIED'))) {
        description = dict.error_messages.api_key_error;
      } else if (error.message && error.message.includes('billing')) {
        description = dict.error_messages.billing_error;
      }
      toast({
        title: dict.error_messages.generation_error_title,
        description: description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const cuisine = values.cuisineSelection === 'otra' ? values.customCuisine : (values.cuisineSelection === 'aleatoria' ? '' : values.cuisineSelection);
    await runGeneration({
      ingredients: values.ingredients,
      servings: values.servings,
      cuisine: cuisine || undefined,
    });
  }

  const runSave = async () => {
    if (!user) {
        toast({ title: dict.error_messages.login_to_save, variant: 'destructive'});
        router.push(`/${locale}/login`);
        return;
    }
    if (!generatedRecipe) return;

    setIsSaving(true);
    try {
        const { imageUrl, mediaType, ...recipeData } = generatedRecipe;
        await addRecipe(user.uid, recipeData, imageUrl, mediaType);
        toast({
            title: dict.success_messages.recipe_saved_title,
            description: `"${recipeData.name}" ${dict.success_messages.recipe_saved_description}`,
        });
        router.push(`/${locale}/my-recipes`);
    } catch(error: any) {
        toast({
            title: dict.error_messages.save_error_title,
            description: error.message || dict.error_messages.save_error_description,
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  }

  const handleSaveClick = () => {
    if (!user) {
        toast({ title: dict.error_messages.login_to_save, variant: 'destructive'});
        router.push(`/${locale}/login`);
        return;
    }
    if (!generatedRecipe) return;
    
    runSave();
  };

  const NutritionalTable = ({ table }: { table: NutritionalInfo }) => (
    <div className="p-4 bg-muted/50 rounded-lg">
      <h3 className="font-headline text-lg font-semibold text-accent/80 flex items-center gap-2"><Beef className="w-5 h-5" /> {dict.generator_page.nutritional_info}</h3>
      <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span>{dict.generator_page.calories}: {table.calories}</span>
        <span>{dict.generator_page.protein}: {table.protein}</span>
        <span>{dict.generator_page.carbs}: {table.carbs}</span>
        <span>{dict.generator_page.fats}: {table.fats}</span>
      </div>
    </div>
  );

  if (!dict) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    )
  }

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <header>
          <h1 className="font-headline text-4xl font-bold text-primary">{dict.generator_page.title}</h1>
          <p className="text-muted-foreground mt-2 text-lg">{dict.generator_page.description}</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">{dict.generator_page.form_title}</CardTitle>
            <CardDescription>{dict.generator_page.form_description}</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{dict.generator_page.ingredients_label}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={dict.generator_page.ingredients_placeholder} {...field} rows={4} disabled={isLoading} />
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
                      <FormLabel>{dict.generator_page.servings_label}</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="20" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cuisineSelection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de Cocina (opcional)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo de cocina" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="aleatoria">Aleatoria</SelectItem>
                          <SelectItem value="mexicana">Mexicana</SelectItem>
                          <SelectItem value="italiana">Italiana</SelectItem>
                          <SelectItem value="asiatica">Asiática</SelectItem>
                          <SelectItem value="mediterranea">Mediterránea</SelectItem>
                          <SelectItem value="india">India</SelectItem>
                          <SelectItem value="espanola">Española</SelectItem>
                          <SelectItem value="otra">Otra...</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {cuisineSelection === 'otra' && (
                  <FormField
                    control={form.control}
                    name="customCuisine"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifica la cocina</FormLabel>
                        <FormControl>
                          <Input placeholder="ej., Fusión Peruana, Tailandesa" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isLoading ? dict.generator_page.button_generating : dict.generator_page.button_generate}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24">
        <h2 className="font-headline text-3xl font-bold text-primary text-center">{dict.generator_page.generated_recipe_title}</h2>
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
                    <h3 className="font-headline text-lg font-semibold text-primary/80 flex items-center gap-2"><Sparkles className="w-5 h-5" /> {dict.generator_page.benefits}</h3>
                    <p className="mt-2 text-primary/70 text-sm">{generatedRecipe.benefits}</p>
                </div>
              )}
              {generatedRecipe.nutritionalTable && <NutritionalTable table={generatedRecipe.nutritionalTable} />}
              <div>
                <h3 className="font-headline text-lg font-semibold text-accent">{dict.generator_page.ingredients_heading}</h3>
                <ul className="list-disc list-inside mt-2 text-muted-foreground">
                    {generatedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                </ul>
              </div>
              <div>
                <h3 className="font-headline text-lg font-semibold text-accent">{dict.generator_page.instructions_heading}</h3>
                <ol className="list-decimal list-inside mt-2 text-muted-foreground">
                    {generatedRecipe.instructions.map((step, i) => <li key={i}>{step}</li>)}
                </ol>
              </div>
               <div>
                <h3 className="font-headline text-lg font-semibold text-accent">{dict.generator_page.equipment_heading}</h3>
                <ul className="list-disc list-inside mt-2 text-muted-foreground">
                    {generatedRecipe.equipment.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSaveClick} disabled={isSaving} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? dict.generator_page.save_button_saving : dict.generator_page.save_button}
                </Button>
            </CardFooter>
            </>
          ) : (
            <div className="text-center text-muted-foreground flex flex-col items-center justify-center min-h-[400px] p-6">
                <ChefHat className="w-16 h-16 mb-4" />
              <p className="font-semibold">{dict.generator_page.generated_recipe_placeholder_title}</p>
              <p className="text-sm">{dict.generator_page.generated_recipe_placeholder_description}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
    </>
  );
}
