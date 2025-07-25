'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import type { SavedWeeklyPlan, DailyMealPlan, Recipe, SavedRecipe, NutritionalInfo } from '@/types';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MenuSquare, Trash2, LogIn, CalendarDays, Share2, Info, FilePenLine, Save, UtensilsCrossed, Loader2, Sparkles, Beef, RefreshCw, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getMenus, deleteMenu, publishMenuAsPost, updateMenu } from '@/lib/menus';
import { getRecipes } from '@/lib/recipes';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { generateDetailedRecipe } from '@/ai/flows/generate-detailed-recipe';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Locale } from '@/i18n.config';


const MealCard = ({ meal, onChangeClick }: { meal: Recipe; onChangeClick: () => void }) => (
  <Card className="mt-4 border-accent/20">
    <CardHeader className="py-4 flex flex-row items-center justify-between">
      <CardTitle className="font-headline text-xl">{meal.name || 'Receta sin nombre'}</CardTitle>
      <Button variant="outline" size="sm" onClick={onChangeClick}>
        <FilePenLine className="mr-2 h-4 w-4" /> Cambiar
      </Button>
    </CardHeader>
    <CardContent className="space-y-4 pt-0 pb-4">
      {meal.benefits && (
         <div className="mt-4 pt-4 border-t border-dashed">
            <h5 className="font-headline font-semibold text-accent flex items-center gap-2"><Sparkles className="w-4 h-4" /> Beneficios</h5>
            <p className="mt-1 text-sm text-muted-foreground">{meal.benefits}</p>
        </div>
      )}
      {meal.nutritionalTable && (
        <div className="mt-4 pt-4 border-t border-dashed">
            <h5 className="font-headline font-semibold text-accent flex items-center gap-2"><Beef className="w-4 h-4" /> Info. Nutricional (por porción)</h5>
            <div className="text-sm text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
            <span>Calorías: {meal.nutritionalTable.calories}</span>
            <span>Proteína: {meal.nutritionalTable.protein}</span>
            <span>Carbohidratos: {meal.nutritionalTable.carbs}</span>
            <span>Grasas: {meal.nutritionalTable.fats}</span>
            </div>
        </div>
      )}
      <Separator />
      <div>
        <h5 className="font-headline font-semibold text-accent">Ingredientes</h5>
        <ul className="list-disc list-inside mt-2 text-muted-foreground">
          {meal.ingredients.map((ing, i) => (
            <li key={i}>{ing}</li>
          ))}
        </ul>
      </div>
      <div>
        <h5 className="font-headline font-semibold text-accent">Instrucciones</h5>
        <ol className="list-decimal list-inside mt-2 text-muted-foreground">
          {meal.instructions.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
      </div>
    </CardContent>
  </Card>
);

export function MyMenusView() {
  const { user, loading: authLoading } = useAuth();
  const [savedMenus, setSavedMenus] = useState<SavedWeeklyPlan[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;
  const { toast } = useToast();
  const [showBetaAlert, setShowBetaAlert] = useLocalStorage('show-menu-beta-alert', true);

  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMenuToPublish, setSelectedMenuToPublish] = useState<SavedWeeklyPlan | null>(null);
  const [caption, setCaption] = useState('');

  const [modifiedMenuIds, setModifiedMenuIds] = useState<Set<string>>(new Set());

  // State for the new customization dialog flow
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [isRecipeListOpen, setIsRecipeListOpen] = useState(false);
  const [isGeneratingDetails, setIsGeneratingDetails] = useState(false);
  const [actionContext, setActionContext] = useState<{
    menu: SavedWeeklyPlan;
    dayIndex: number;
    mealType: 'breakfast' | 'lunch' | 'comida' | 'dinner';
  } | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (user) {
      setPageLoading(true);
      Promise.all([
        getMenus(user.uid),
        getRecipes(user.uid)
      ]).then(([menus, recipes]) => {
        setSavedMenus(menus);
        setSavedRecipes(recipes);
      }).catch(() => {
        toast({
          title: 'Error al Cargar Datos',
          description: 'No se pudieron obtener tus menús y recetas guardados.',
          variant: 'destructive',
        });
      }).finally(() => setPageLoading(false));
    } else {
      setSavedMenus([]);
      setSavedRecipes([]);
      setPageLoading(false);
    }
  }, [user, authLoading, toast]);
  
  const handlePublishClick = (menu: SavedWeeklyPlan) => {
    setSelectedMenuToPublish(menu);
    setCaption(`¡Mira mi plan de comidas para ${menu.weeklyMealPlan.length} días! Hecho con ChefAI.`);
  };

  const handlePublishConfirm = async () => {
    if (!user || !selectedMenuToPublish) return;
    setIsPublishing(true);
    try {
      await publishMenuAsPost(user.uid, user.displayName || 'Anónimo', user.photoURL, caption, selectedMenuToPublish);
      toast({
        title: "¡Menú Publicado!",
        description: "Tu plan de comidas ahora está visible en la comunidad."
      });
      setSelectedMenuToPublish(null);
    } catch (error) {
      toast({
        title: "Error al Publicar",
        description: "No se pudo publicar tu menú.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  }


  const handleDeleteMenu = async (menuIdToDelete: string) => {
    if (!user) return;
    
    const originalMenus = [...savedMenus];
    setSavedMenus(savedMenus.filter((menu) => menu.id !== menuIdToDelete));

    try {
      await deleteMenu(user.uid, menuIdToDelete);
      toast({
        title: 'Menú Eliminado',
        description: 'El plan de comidas ha sido eliminado de tu cuenta.',
      });
    } catch (error) {
      setSavedMenus(originalMenus);
      toast({
        title: 'Error al Eliminar',
        description: 'No se pudo eliminar el menú. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };
  
  const handleOpenActionDialog = (menu: SavedWeeklyPlan, dayIndex: number, mealType: 'breakfast' | 'lunch' | 'comida' | 'dinner') => {
    setActionContext({ menu, dayIndex, mealType });
    setIsActionDialogOpen(true);
  };

  const handleSelectRecipe = (selectedRecipe: SavedRecipe) => {
    if (!actionContext) return;
    const { menu, dayIndex, mealType } = actionContext;
    
    const newRecipeForPlan: Recipe = {
        name: selectedRecipe.name,
        ingredients: selectedRecipe.ingredients,
        instructions: selectedRecipe.instructions,
        equipment: selectedRecipe.equipment,
        benefits: selectedRecipe.benefits,
        nutritionalTable: selectedRecipe.nutritionalTable
    };

    setSavedMenus(currentMenus => 
        currentMenus.map(m => {
            if (m.id === menu.id) {
                const newWeeklyPlan = [...m.weeklyMealPlan];
                newWeeklyPlan[dayIndex] = { ...newWeeklyPlan[dayIndex], [mealType]: newRecipeForPlan };
                return { ...m, weeklyMealPlan: newWeeklyPlan };
            }
            return m;
        })
    );
    setModifiedMenuIds(prev => new Set(prev).add(menu.id));
    setIsRecipeListOpen(false);
  };
  
  const handleSaveChanges = async (menuToSave: SavedWeeklyPlan) => {
    if (!user) return;
    setIsSaving(true);
    try {
        await updateMenu(user.uid, menuToSave.id, menuToSave.weeklyMealPlan);
        toast({ title: "¡Menú Actualizado!", description: "Tus cambios se han guardado."});
        setModifiedMenuIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(menuToSave.id);
            return newSet;
        });
    } catch (error) {
        toast({ title: "Error", description: "No se pudieron guardar los cambios.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateRecipe = async () => {
    if (!actionContext) return;
    const { menu, dayIndex, mealType } = actionContext;
    const recipeToRegenerate = menu.weeklyMealPlan[dayIndex][mealType as keyof DailyMealPlan] as Recipe;
    if (!recipeToRegenerate || !recipeToRegenerate.name) {
        toast({ title: "Error", description: "No se puede regenerar una receta sin nombre.", variant: "destructive" });
        return;
    };

    setIsGeneratingDetails(true);
    try {
        const result = await generateDetailedRecipe({
            recipeName: recipeToRegenerate.name,
            servings: menu.numberOfPeople || 2,
            context: `Based on a weekly plan that included these ingredients: ${menu.ingredients || 'various'}. Dietary preferences: ${menu.dietaryPreferences || 'none'}`,
        });
        
        if (!result) throw new Error("La IA no pudo generar los detalles.");

        const newRecipeForPlan: Recipe = {
            name: result.name,
            ingredients: result.ingredients,
            instructions: result.instructions,
            equipment: result.equipment,
            benefits: result.benefits,
            nutritionalTable: result.nutritionalTable
        };

        setSavedMenus(currentMenus =>
            currentMenus.map(m => {
                if (m.id === menu.id) {
                    const newWeeklyPlan = [...m.weeklyMealPlan];
                    newWeeklyPlan[dayIndex] = { ...newWeeklyPlan[dayIndex], [mealType]: newRecipeForPlan };
                    return { ...m, weeklyMealPlan: newWeeklyPlan };
                }
                return m;
            })
        );
        setModifiedMenuIds(prev => new Set(prev).add(menu.id));
        toast({ title: "¡Receta actualizada!", description: "La receta ha sido regenerada con más detalles." });

    } catch (error: any) {
        toast({ title: "Error al generar", description: error.message || "No se pudieron generar los detalles de la receta.", variant: "destructive" });
    } finally {
        setIsGeneratingDetails(false);
        setIsActionDialogOpen(false);
    }
  };

  const renderContent = () => {
    if (authLoading || pageLoading) {
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
            <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">Inicia Sesión para Ver tus Menús</h3>
            <p className="mb-6">Guarda tus planes de comidas y accede a ellos desde cualquier lugar.</p>
            <Button asChild>
                <Link href={`/${locale}/login`}>Acceder / Registrarse</Link>
            </Button>
        </div>
      );
    }

    if (savedMenus.length === 0) {
      return (
        <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
          <MenuSquare className="w-16 h-16 mb-4" />
          <h3 className="font-headline text-2xl font-semibold mb-2 text-foreground">No Tienes Menús Guardados</h3>
          <p className="mb-6 max-w-sm">
            Parece que aún no has creado ningún plan de comidas. ¡Empieza a planificar tu semana ahora!
          </p>
          <Button asChild>
            <Link href={`/${locale}/planner`}>
              <CalendarDays className="mr-2 h-4 w-4" />
              Ir al Planificador Semanal
            </Link>
          </Button>
        </div>
      );
    }

    return (
      <Accordion type="multiple" className="w-full space-y-2">
        {savedMenus.map((menu, index) => (
          <AccordionItem value={menu.id} key={menu.id} className="border-b-0">
            <Card>
              <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                Plan de Comida Guardado #{index + 1}
              </AccordionTrigger>
              <AccordionContent className="p-6 pt-0 space-y-4">
                {Array.isArray(menu.weeklyMealPlan) &&
                  menu.weeklyMealPlan.map((dailyPlan, dayIndex) => (
                    <div key={dailyPlan.day} className="py-2 border-b last:border-b-0">
                      <h4 className="font-headline font-bold text-accent text-lg mb-2">{dailyPlan.day}</h4>
                      <Tabs defaultValue="breakfast" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="breakfast">Desayuno</TabsTrigger>
                          <TabsTrigger value="lunch">Almuerzo</TabsTrigger>
                          <TabsTrigger value="comida">Comida</TabsTrigger>
                          <TabsTrigger value="dinner">Cena</TabsTrigger>
                        </TabsList>
                        <TabsContent value="breakfast">
                          {dailyPlan.breakfast && <MealCard meal={dailyPlan.breakfast} onChangeClick={() => handleOpenActionDialog(menu, dayIndex, 'breakfast')} />}
                        </TabsContent>
                        <TabsContent value="lunch">
                          {dailyPlan.lunch && <MealCard meal={dailyPlan.lunch} onChangeClick={() => handleOpenActionDialog(menu, dayIndex, 'lunch')} />}
                        </TabsContent>
                        <TabsContent value="comida">
                          {dailyPlan.comida && <MealCard meal={dailyPlan.comida} onChangeClick={() => handleOpenActionDialog(menu, dayIndex, 'comida')} />}
                        </TabsContent>
                        <TabsContent value="dinner">
                          {dailyPlan.dinner && <MealCard meal={dailyPlan.dinner} onChangeClick={() => handleOpenActionDialog(menu, dayIndex, 'dinner')} />}
                        </TabsContent>
                      </Tabs>
                    </div>
                  ))}
                <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-6 border-t">
                  {modifiedMenuIds.has(menu.id) && (
                    <Button onClick={() => handleSaveChanges(menu)} disabled={isSaving}>
                      {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      Guardar Cambios
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handlePublishClick(menu)}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir en la Comunidad
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full sm:w-auto">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Menú
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente
                          este plan de comidas.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteMenu(menu.id)}>
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
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <MenuSquare /> Tus Planes de Comidas
          </CardTitle>
          {!authLoading && !pageLoading && user && <CardDescription>{savedMenus.length} menú(s) guardado(s) en tu cuenta.</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {showBetaAlert && (
                <Alert className="relative pr-8">
                    <Info className="h-4 w-4" />
                    <AlertTitle>¡Personaliza tu Menú!</AlertTitle>
                    <AlertDescription>
                    La IA está en pruebas y algunas recetas pueden ser mejorables. Usa el botón 'Cambiar' en cualquier comida para **sustituirla por una de tus recetas guardadas** o para **generar una nueva versión detallada** con la IA.
                    </AlertDescription>
                    <button onClick={() => setShowBetaAlert(false)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full hover:bg-muted/50">
                        <X className="h-4 w-4" />
                    </button>
                </Alert>
             )}
            {renderContent()}
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!selectedMenuToPublish} onOpenChange={(isOpen) => !isOpen && setSelectedMenuToPublish(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Compartir tu Plan de Comidas</AlertDialogTitle>
            <AlertDialogDescription>
              Añade un título o descripción para tu publicación. Será visible para otros en la comunidad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="caption">Título/Descripción</Label>
              <Textarea id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handlePublishConfirm} disabled={isPublishing}>
              {isPublishing ? 'Publicando...' : 'Publicar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Action Dialog */}
      <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="font-headline">Cambiar Receta</DialogTitle>
                <DialogDescription>
                    Elige cómo quieres cambiar esta receta en tu menú.
                </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
                <Button variant="outline" onClick={() => { setIsRecipeListOpen(true); setIsActionDialogOpen(false); }}>
                    <UtensilsCrossed className="mr-2 h-4 w-4" />
                    Sustituir de Mis Recetas
                </Button>
                <Button onClick={handleRegenerateRecipe} disabled={isGeneratingDetails}>
                    {isGeneratingDetails ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Generar Detalles con IA
                </Button>
            </div>
        </DialogContent>
      </Dialog>
      
      {/* Recipe Selector Dialog */}
      <Dialog open={isRecipeListOpen} onOpenChange={setIsRecipeListOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-headline">Selecciona una Receta para Sustituir</DialogTitle>
            <DialogDescription>
              Elige una de tus recetas guardadas para añadirla a este menú.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 my-4">
            <div className="space-y-2 pr-4">
              {savedRecipes.length > 0 ? (
                savedRecipes.map(recipe => (
                  <Card key={recipe.id} className="cursor-pointer hover:bg-muted transition-colors" onClick={() => handleSelectRecipe(recipe)}>
                    <CardHeader className="py-3">
                      <CardTitle className="text-base">{recipe.name}</CardTitle>
                    </CardHeader>
                  </Card>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-10 flex flex-col items-center">
                  <UtensilsCrossed className="w-12 h-12 mx-auto mb-4" />
                  <p className="font-semibold">No tienes recetas guardadas.</p>
                  <p className="text-sm mt-2">
                    Ve al <Link href={`/${locale}/generator`} className="underline text-primary">Generador de Recetas</Link> para crear una.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
