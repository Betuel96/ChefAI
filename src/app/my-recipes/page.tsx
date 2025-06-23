'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import type { Recipe, ShoppingListCategory } from '@/types';
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
  const [, setShoppingList] = useLocalStorage<ShoppingListCategory[]>('shoppingList', []);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleGenerateList = async (recipe: Recipe) => {
    setLoadingRecipeId(recipe.name);
    try {
      // Combine all known ingredients into a single string for the AI
      const ingredientsString = [
        recipe.additionalIngredients,
        // you could add other ingredient sources from the recipe object here
      ]
        .join('\n')
        .split(/[\n,]/) // split by newline or comma
        .map((s) => s.trim())
        .filter((s) => s)
        .join('\n');

      if (!ingredientsString) {
        toast({
          title: 'No hay Ingredientes',
          description: 'Esta receta no tiene ingredientes para generar una lista.',
          variant: 'destructive',
        });
        return;
      }
      
      const result = await generateShoppingList({ allIngredients: ingredientsString });

      const categorizedList: ShoppingListCategory[] = result.shoppingList.map((category) => ({
        ...category,
        items: category.items.map((itemName) => ({
          id: crypto.randomUUID(),
          name: itemName,
          checked: false,
        })),
      }));
      
      setShoppingList(categorizedList);

      toast({
        title: '¡Lista de Compras Generada!',
        description: `Basada en "${recipe.name}". Redirigiendo...`,
      });
      router.push('/shopping-list');
    } catch (error) {
      toast({
        title: 'Error al Generar la Lista',
        description: 'No se pudo generar la lista de compras. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoadingRecipeId(null);
    }
  };


  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Mis Recetas Guardadas</h1>
        <p className="text-muted-foreground mt-2 text-lg">Todas tus recetas favoritas en un solo lugar.</p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><BookHeart /> Tu Libro de Recetas</CardTitle>
          <CardDescription>{savedRecipes.length} receta(s) guardada(s).</CardDescription>
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
                        <h3 className="font-headline text-xl font-semibold text-accent">Instrucciones</h3>
                        <p className="whitespace-pre-wrap">{recipe.instructions}</p>
                      </div>
                      <Separator/>
                      <div>
                        <h3 className="font-headline text-xl font-semibold text-accent">Ingredientes Adicionales</h3>
                        <p className="whitespace-pre-wrap">{recipe.additionalIngredients}</p>
                      </div>
                      <Separator/>
                      <div>
                        <h3 className="font-headline text-xl font-semibold text-accent">Equipo Necesario</h3>
                        <p className="whitespace-pre-wrap">{recipe.equipment}</p>
                      </div>
                      <Button 
                        onClick={() => handleGenerateList(recipe)} 
                        className="mt-4 w-full sm:w-auto"
                        disabled={loadingRecipeId === recipe.name}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {loadingRecipeId === recipe.name ? 'Generando...' : 'Crear Lista de Compras'}
                      </Button>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>Aún no has guardado ninguna receta.</p>
              <p>Ve al Generador de Recetas para crear y guardar nuevas recetas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
