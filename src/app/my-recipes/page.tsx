
'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import type { Recipe, SavedRecipe, ShoppingListCategory } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookHeart, LogIn, ShoppingCart, Trash2, UtensilsCrossed, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { getRecipes, deleteRecipe } from '@/lib/recipes';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

export default function MyRecipesPage() {
  const { user, loading: authLoading } = useAuth();
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [, setShoppingList] = useLocalStorage<ShoppingListCategory[]>('shoppingList', []);
  const [loadingRecipeId, setLoadingRecipeId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (authLoading) {
      setPageLoading(true);
      return;
    }
    if (user) {
      setPageLoading(true);
      getRecipes(user.uid)
        .then(setSavedRecipes)
        .catch(() => {
          toast({
            title: 'Error al Cargar Recetas',
            description: 'No se pudieron obtener tus recetas guardadas. Inténtalo de nuevo.',
            variant: 'destructive',
          });
        })
        .finally(() => setPageLoading(false));
    } else {
      setSavedRecipes([]);
      setPageLoading(false);
    }
  }, [user, authLoading, toast]);


  const handleGenerateList = async (recipe: Recipe) => {
    setLoadingRecipeId(recipe.name);
    try {
      const ingredientsString = [
        recipe.additionalIngredients,
      ]
        .join('\n')
        .split(/[\n,]/)
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

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return;
    
    // Optimistic UI update
    const originalRecipes = [...savedRecipes];
    const recipeToDelete = savedRecipes.find(r => r.id === recipeId);
    setSavedRecipes(savedRecipes.filter((recipe) => recipe.id !== recipeId));

    try {
      await deleteRecipe(user.uid, recipeId);
      toast({
        title: 'Receta Eliminada',
        description: `"${recipeToDelete?.name}" ha sido eliminada de tu cuenta.`,
      });
    } catch (error) {
      setSavedRecipes(originalRecipes); // Revert on error
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar la receta. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const renderContent = () => {
    if (pageLoading) {
      return (
         <div className="space-y-2">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
         </div>
      );
    }

    if (!user) {
       return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
            <LogIn className="w-16 h-16 mb-4" />
            <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Inicia Sesión para Ver tus Recetas</h3>
            <p className="mb-6">Guarda tus creaciones y accede a ellas desde cualquier lugar.</p>
            <Button asChild>
                <Link href="/login">Acceder / Registrarse</Link>
            </Button>
        </div>
      );
    }

    if (savedRecipes.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
            <BookHeart className="w-16 h-16 mb-4" />
            <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Tu Libro de Recetas está Vacío</h3>
            <p className="mb-6 max-w-sm">
              ¿Listo para un poco de magia culinaria? ¡Ve al generador para crear tu primera receta!
            </p>
             <Button asChild>
              <Link href="/generator">
                <Sparkles className="mr-2 h-4 w-4" />
                Ir al Generador de Recetas
              </Link>
            </Button>
        </div>
      );
    }

    return (
       <Accordion type="multiple" className="w-full space-y-2">
        {savedRecipes.map((recipe) => (
            <AccordionItem value={recipe.id} key={recipe.id} className="border-b-0">
            <Card>
                <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                {recipe.name}
                </AccordionTrigger>
                <AccordionContent className="p-6 pt-0 space-y-6">
                
                {recipe.imageUrl ? (
                  <div className="my-4 rounded-lg overflow-hidden shadow-inner aspect-video relative">
                    <Image
                      src={recipe.imageUrl}
                      alt={`Imagen de ${recipe.name}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="my-4 rounded-lg flex flex-col items-center justify-center bg-muted aspect-video text-muted-foreground">
                    <UtensilsCrossed className="w-10 h-10 mb-2" />
                    <p>Sin imagen</p>
                  </div>
                )}

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
                <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-6 border-t">
                    <Button 
                    onClick={() => handleGenerateList(recipe)} 
                    className="w-full flex-grow"
                    disabled={loadingRecipeId === recipe.name}
                    >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    {loadingRecipeId === recipe.name ? 'Generando...' : 'Crear Lista de Compras'}
                    </Button>
                    <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Receta
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Esto eliminará permanentemente la
                            receta "{recipe.name}" y su imagen.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteRecipe(recipe.id)}>
                            Continuar
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                    </AlertDialog>
                </div>
                </AccordionContent>
            </Card>
            </AccordionItem>
        ))}
        </Accordion>
    );
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
          {!pageLoading && user && <CardDescription>{savedRecipes.length} receta(s) guardada(s) en tu cuenta.</CardDescription>}
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
