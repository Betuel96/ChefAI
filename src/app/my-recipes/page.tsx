'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import type { Recipe, ShoppingListItem } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookHeart, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';

export default function MyRecipesPage() {
  const [savedRecipes] = useLocalStorage<Recipe[]>('savedRecipes', []);
  const [, setShoppingList] = useLocalStorage<ShoppingListItem[]>('shoppingList', []);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleGenerateList = async (recipe: Recipe) => {
    setLoadingRecipeId(recipe.name);
    try {
      const ingredientsString = `${recipe.name} ingredients:\n- ${recipe.additionalIngredients.split(',').join('\n- ')}`;
      const result = await generateShoppingList({ mealPlan: ingredientsString });
      const items = result.shoppingList.split('\n').filter(item => item.trim() !== '').map(item => ({
        id: crypto.randomUUID(),
        name: item.replace(/^- /g, '').trim(),
        checked: false,
      }));
      setShoppingList(items);

      toast({
        title: 'Shopping List Generated!',
        description: `Based on "${recipe.name}". Redirecting...`,
      });
      router.push('/shopping-list');
    } catch (error) {
      toast({
        title: 'Error Generating List',
        description: 'Could not generate shopping list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecipeId(null);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">My Saved Recipes</h1>
        <p className="text-muted-foreground mt-2 text-lg">All your favorite recipes in one place.</p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><BookHeart /> Your Recipe Book</CardTitle>
          <CardDescription>{savedRecipes.length} recipe(s) saved.</CardDescription>
        </CardHeader>
        <CardContent>
          {savedRecipes.length > 0 ? (
            <Accordion type="multiple" className="w-full space-y-2">
              {savedRecipes.map((recipe) => (
                <AccordionItem value={recipe.name} key={recipe.name} className="border-b-0">
                  <Card>
                    <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                      {recipe.name}
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0 space-y-6">
                      <div>
                        <h3 className="font-headline text-xl font-semibold text-accent">Instructions</h3>
                        <p className="whitespace-pre-wrap">{recipe.instructions}</p>
                      </div>
                      <Separator/>
                      <div>
                        <h3 className="font-headline text-xl font-semibold text-accent">Additional Ingredients</h3>
                        <p className="whitespace-pre-wrap">{recipe.additionalIngredients}</p>
                      </div>
                      <Separator/>
                      <div>
                        <h3 className="font-headline text-xl font-semibold text-accent">Equipment Needed</h3>
                        <p className="whitespace-pre-wrap">{recipe.equipment}</p>
                      </div>
                      <Button 
                        onClick={() => handleGenerateList(recipe)} 
                        className="mt-4 w-full sm:w-auto"
                        disabled={loadingRecipeId === recipe.name}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {loadingRecipeId === recipe.name ? 'Generating...' : 'Create Shopping List'}
                      </Button>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>You haven't saved any recipes yet.</p>
              <p>Go to the Recipe Generator to create and save new recipes.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
