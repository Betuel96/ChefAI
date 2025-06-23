'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateRecipe } from '@/ai/flows/generate-recipe';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { BookHeart, ChefHat, Sparkles } from 'lucide-react';
import type { Recipe } from '@/types';
import { Separator } from '@/components/ui/separator';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Please list at least a few ingredients.'),
  servings: z.coerce.number().int().min(1, 'Must serve at least 1 person.').max(20, 'Cannot serve more than 20 people.'),
});

export default function RecipeGeneratorPage() {
  const [generatedRecipe, setGeneratedRecipe] = useState<Recipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [savedRecipes, setSavedRecipes] = useLocalStorage<Recipe[]>('savedRecipes', []);

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
      const recipe = await generateRecipe(values);
      setGeneratedRecipe(recipe);
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error Generating Recipe',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }

  function handleSaveRecipe() {
    if (generatedRecipe) {
      // Avoid saving duplicates
      if (!savedRecipes.some(r => r.name === generatedRecipe.name)) {
        setSavedRecipes([...savedRecipes, generatedRecipe]);
        toast({
          title: 'Recipe Saved!',
          description: `"${generatedRecipe.name}" has been added to your recipes.`,
        });
      } else {
         toast({
          title: 'Already Saved',
          description: `A recipe named "${generatedRecipe.name}" is already in your list.`,
          variant: 'default',
        });
      }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <header>
          <h1 className="font-headline text-4xl font-bold text-primary">Recipe Generator</h1>
          <p className="text-muted-foreground mt-2 text-lg">Turn your ingredients into a delicious meal!</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Your Ingredients</CardTitle>
            <CardDescription>Enter what you have, and we'll create a recipe for you.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Available Ingredients</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., chicken breast, rice, broccoli, soy sauce" {...field} rows={4} />
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
                      <FormLabel>Number of Servings</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="20" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Generating...' : 'Generate Recipe'}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="font-headline text-3xl font-bold text-primary text-center">Generated Recipe</h2>
        <Card className="shadow-lg min-h-[400px]">
          <CardHeader>
            {generatedRecipe ? (
              <>
                <CardTitle className="font-headline text-2xl flex items-center gap-2"><ChefHat /> {generatedRecipe.name}</CardTitle>
              </>
            ) : (
              <CardTitle className="font-headline text-2xl">Your recipe will appear here</CardTitle>
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
            {generatedRecipe && (
              <div className="space-y-6">
                <div>
                  <h3 className="font-headline text-xl font-semibold text-accent">Instructions</h3>
                  <p className="whitespace-pre-wrap">{generatedRecipe.instructions}</p>
                </div>
                <Separator/>
                <div>
                  <h3 className="font-headline text-xl font-semibold text-accent">Additional Ingredients</h3>
                  <p className="whitespace-pre-wrap">{generatedRecipe.additionalIngredients}</p>
                </div>
                 <Separator/>
                <div>
                  <h3 className="font-headline text-xl font-semibold text-accent">Equipment Needed</h3>
                  <p className="whitespace-pre-wrap">{generatedRecipe.equipment}</p>
                </div>
              </div>
            )}
            {!isLoading && !generatedRecipe && (
              <div className="text-center text-muted-foreground py-10">
                <p>Fill out the form and click "Generate Recipe" to get started.</p>
              </div>
            )}
          </CardContent>
          {generatedRecipe && (
            <CardFooter>
              <Button onClick={handleSaveRecipe} className="w-full" variant="secondary">
                <BookHeart className="mr-2 h-4 w-4" />
                Save Recipe
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
