
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CalendarDays, Sparkles, Loader2, Save, ShoppingCart, Utensils, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import type { DailyMealPlan, ShoppingListCategory, WeeklyPlan, Recipe } from '@/types';
import { createWeeklyMealPlan } from '@/ai/flows/create-weekly-meal-plan';
import { addMenu, publishMenuAsPost } from '@/lib/menus';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { v4 as uuidv4 } from 'uuid';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  dietaryPreferences: z.string().optional(),
  numberOfDays: z.coerce.number().int().min(1, 'El plan debe ser de al menos 1 día.').max(7, 'El plan no puede exceder los 7 días.'),
  numberOfPeople: z.coerce.number().int().min(1, 'Debe servir para al menos 1 persona.').max(20, 'No puede servir para más de 20 personas.'),
});

const MealCard = ({ meal }: { meal: Recipe }) => (
    <Card className="mt-4 border-accent/20">
      <CardHeader className="py-4">
        <CardTitle className="font-headline text-lg">{meal.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 py-4">
        <div>
          <h4 className="font-semibold text-accent text-sm">Ingredientes</h4>
          <ul className="list-disc list-inside mt-1 text-xs text-muted-foreground">
            {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-accent text-sm">Instrucciones</h4>
          <ol className="list-decimal list-inside mt-1 text-xs text-muted-foreground">
            {meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      </CardContent>
    </Card>
);

export default function MealPlannerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [mealPlan, setMealPlan] = useState<WeeklyPlan | null>(null);
  const [, setShoppingList] = useLocalStorage<ShoppingListCategory[]>('shoppingList', []);
  const [selectedMenu, setSelectedMenu] = useState<WeeklyPlan | null>(null);
  const [caption, setCaption] = useState('');


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      dietaryPreferences: '',
      numberOfDays: 7,
      numberOfPeople: 2,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMealPlan(null);
    try {
      const result = await createWeeklyMealPlan(values);
      if (!result || !result.weeklyMealPlan) {
        throw new Error('La IA no pudo generar un plan de comidas.');
      }
      setMealPlan({ ...result, ...values });
    } catch(error: any) {
        toast({
            title: 'Error de Generación',
            description: error.message || 'No se pudo generar el plan de comidas.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  const handleSaveMenu = async () => {
    if (!user) {
        toast({ title: 'Debes iniciar sesión para guardar menús.', variant: 'destructive' });
        router.push('/login');
        return;
    }
    if (!mealPlan) return;

    setIsSaving(true);
    try {
        await addMenu(user.uid, mealPlan);
        toast({
            title: '¡Menú Guardado!',
            description: 'Tu plan de comidas se ha guardado en "Mis Menús".'
        });
        router.push('/my-menus');
    } catch(error: any) {
         toast({
            title: 'Error al Guardar',
            description: error.message || 'No se pudo guardar el menú.',
            variant: 'destructive',
        });
    } finally {
        setIsSaving(false);
    }
  }

  const handlePublishClick = (menu: WeeklyPlan) => {
    if (!user) {
        toast({ title: 'Debes iniciar sesión para publicar.', variant: 'destructive'});
        router.push('/login');
        return;
    }
    setSelectedMenu(menu);
    setCaption(`¡Prueba mi nuevo plan de comidas semanal! Hecho con ChefAI.`);
  };

  const handlePublishConfirm = async () => {
    if (!user || !selectedMenu) return;
    setIsPublishing(true);
    try {
      await publishMenuAsPost(user.uid, user.displayName || 'Anónimo', user.photoURL, caption, selectedMenu);
      toast({
        title: "¡Menú Publicado!",
        description: "Tu plan de comidas ahora es visible en la comunidad."
      });
      setSelectedMenu(null);
    } catch (error: any) {
      toast({
        title: "Error al Publicar",
        description: error.message || "No se pudo publicar tu menú.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  }

  const handleGenerateShoppingList = async () => {
    if (!mealPlan) return;
    setIsGeneratingList(true);
    try {
        const allIngredients = mealPlan.weeklyMealPlan.flatMap(day => 
            [day.breakfast.ingredients, day.lunch.ingredients, day.comida.ingredients, day.dinner.ingredients]
        ).flat().join('\n');
        
        const result = await generateShoppingList({ allIngredients });

        if (!result.shoppingList) {
            throw new Error('No se pudo generar la lista de compras.');
        }

        const formattedList: ShoppingListCategory[] = result.shoppingList.map(category => ({
            ...category,
            items: category.items.map(item => ({
                id: uuidv4(),
                name: item,
                checked: false,
            }))
        }));

        setShoppingList(formattedList);
        toast({
            title: '¡Lista de Compras Generada!',
            description: 'Tu lista está lista. Hemos navegado por ti.',
        });
        router.push('/shopping-list');
    } catch (error: any) {
        toast({
            title: 'Error al Generar Lista',
            description: error.message || 'No se pudo generar la lista de compras.',
            variant: 'destructive',
        });
    } finally {
        setIsGeneratingList(false);
    }
  }

  const isActionInProgress = isSaving || isGeneratingList || isPublishing;

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-6">
        <header>
          <h1 className="font-headline text-4xl font-bold text-primary">Planificador Semanal</h1>
          <p className="text-muted-foreground mt-2 text-lg">Planifica tus comidas para la semana con IA.</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Tus Preferencias</CardTitle>
            <CardDescription>Dinos qué te gusta y crearemos un plan delicioso.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingredientes Base</FormLabel>
                      <FormControl>
                        <Textarea placeholder="ej., pasta, carne molida, tomates, cebollas" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dietaryPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferencias Dietéticas (opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="ej., vegetariano, sin gluten, bajo en carbohidratos" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="numberOfDays"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Días</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="7" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numberOfPeople"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Personas</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="20" {...field} disabled={isLoading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  {isLoading ? 'Generando Plan...' : 'Generar Plan de Comidas'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-24">
        <h2 className="font-headline text-3xl font-bold text-primary text-center">Tu Plan de Comidas</h2>
        <Card className="shadow-lg min-h-[400px]">
          <CardHeader>
            <CardTitle className="font-headline">
              <CalendarDays className="inline-block mr-2" />
              Plan Generado
            </CardTitle>
          </CardHeader>
          <CardContent>
             {isLoading ? (
                <div className="flex items-center justify-center h-full min-h-[400px] text-muted-foreground">
                    <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                    <p className="text-lg">Creando tu plan semanal...</p>
                </div>
              ) : mealPlan ? (
                <Accordion type="single" collapsible className="w-full">
                    {mealPlan.weeklyMealPlan.map((day, index) => (
                        <AccordionItem value={`item-${index}`} key={day.day}>
                            <AccordionTrigger className="font-headline text-lg">{day.day}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <h4 className="font-semibold text-md">Desayuno</h4>
                                <MealCard meal={day.breakfast} />
                                <h4 className="font-semibold text-md">Almuerzo</h4>
                                <MealCard meal={day.lunch} />
                                 <h4 className="font-semibold text-md">Comida</h4>
                                <MealCard meal={day.comida} />
                                <h4 className="font-semibold text-md">Cena</h4>
                                <MealCard meal={day.dinner} />
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
              ) : (
                <div className="text-center text-muted-foreground flex flex-col items-center justify-center min-h-[300px] p-6">
                    <Utensils className="w-16 h-16 mb-4" />
                    <p className="font-semibold">Tu plan de comidas aparecerá aquí.</p>
                    <p className="text-sm">Rellena el formulario para empezar.</p>
                </div>
              )}
          </CardContent>
          {mealPlan && (
            <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleSaveMenu} disabled={isActionInProgress} className="w-full">
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Guardar Menú
                </Button>
                 <Button onClick={() => handlePublishClick(mealPlan)} disabled={isActionInProgress} variant="outline" className="w-full">
                    <Share2 className="mr-2 h-4 w-4" />
                    Compartir
                </Button>
                <Button onClick={handleGenerateShoppingList} disabled={isActionInProgress} variant="secondary" className="w-full">
                     {isGeneratingList ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingCart className="mr-2 h-4 w-4" />}
                    Generar Lista
                </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
    <AlertDialog open={!!selectedMenu} onOpenChange={(isOpen) => !isOpen && setSelectedMenu(null)}>
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
    </>
  );
}
