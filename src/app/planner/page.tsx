
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createWeeklyMealPlan } from '@/ai/flows/create-weekly-meal-plan';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { WeeklyPlan, ShoppingListCategory, DailyMealPlan } from '@/types';
import { BookHeart, CalendarDays, Gem, ShoppingCart, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { addMenu } from '@/lib/menus';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  dietaryPreferences: z.string().optional(),
  numberOfDays: z.coerce.number().int().min(1).max(7),
  numberOfPeople: z.coerce.number().int().min(1).max(20),
});

const MealCard = ({ meal }: { meal: DailyMealPlan['breakfast'] }) => (
  <Card className="mt-4 border-accent/20">
    <CardHeader>
      <CardTitle className="font-headline text-xl">{meal?.name || 'No planificado'}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      {meal ? (
        <>
          <div>
            <h5 className="font-headline font-semibold text-accent">Ingredientes</h5>
            <ul className="list-disc list-inside mt-2 text-muted-foreground">
              {meal.ingredients
                .split('\n')
                .filter((ing) => ing.trim() !== '')
                .map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
            </ul>
          </div>
          <div>
            <h5 className="font-headline font-semibold text-accent">Instrucciones</h5>
            <p className="whitespace-pre-wrap mt-2 text-muted-foreground">{meal.instructions}</p>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">No se ha planificado esta comida.</p>
      )}
    </CardContent>
  </Card>
);

const FREE_GENERATIONS_LIMIT = 2;

export default function MealPlannerPage() {
  const [mealPlan, setMealPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingList, setIsGeneratingList] = useState(false);
  const [isSimulatingAd, setIsSimulatingAd] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const { toast } = useToast();
  const [, setShoppingList] = useLocalStorage<ShoppingListCategory[]>('shoppingList', []);
  const [generationCount, setGenerationCount] = useLocalStorage<number>('planGenerationCount', 0);
  const router = useRouter();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      dietaryPreferences: '',
      numberOfDays: 7,
      numberOfPeople: 2,
    },
  });

  const runGeneration = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    setMealPlan(null);
    try {
      const plan = await createWeeklyMealPlan(values);
      setMealPlan(plan);
      if (!user?.isPremium) {
        setGenerationCount(generationCount + 1);
      }
    } catch (error) {
      console.error('Error al generar plan semanal:', error);
      toast({
        title: 'Error al Generar el Plan',
        description: error instanceof Error ? error.message : 'Algo salió mal. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (user?.isPremium || generationCount < FREE_GENERATIONS_LIMIT) {
      runGeneration(values);
    } else {
      setShowAdDialog(true);
    }
  };

  const handleWatchAd = () => {
    // TODO: INTEGRACIÓN REAL DE ANUNCIOS
    // 1. Una vez que tu app esté publicada y aprobada por una red de anuncios (ej. Google AdSense),
    //    obtendrás un fragmento de código o una llamada a una función del SDK.
    // 2. Reemplaza la simulación de `setTimeout` con la llamada real de tu red de anuncios.
    //    La llamada a `runGeneration(form.getValues())` debe ocurrir en el callback de éxito del anuncio,
    //    es decir, cuando el usuario ha visto el anuncio completo.
    //
    // Ejemplo de cómo podría verse:
    //
    //   adNetwork.showRewardedAd({
    //     onSuccess: () => {
    //       setIsSimulatingAd(false);
    //       runGeneration(form.getValues());
    //     },
    //     onFailure: () => {
    //       setIsSimulatingAd(false);
    //       toast({ title: 'Anuncio no completado', description: 'Inténtalo de nuevo para generar.' });
    //     }
    //   });
    
    setIsSimulatingAd(true);
    setShowAdDialog(false);
    setTimeout(() => {
      setIsSimulatingAd(false);
      runGeneration(form.getValues());
    }, 2000); // Simula un anuncio de 2 segundos
  };

  const handleSaveMenu = async () => {
    if (!mealPlan) return;

    if (!user) {
      toast({
        title: 'Inicia Sesión para Guardar',
        description: 'Crea una cuenta o inicia sesión para guardar tus menús en la nube.',
        variant: 'default',
      });
      return;
    }

    setIsSaving(true);
    try {
      await addMenu(user.uid, mealPlan);
      toast({
        title: '¡Menú Guardado!',
        description: 'Tu nuevo plan de comidas ha sido guardado en tu cuenta.',
      });
    } catch (error) {
      toast({
        title: 'Error al Guardar',
        description: `No se pudo guardar el menú. Inténtalo de nuevo.`,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlan) return;
    setIsGeneratingList(true);
    try {
      const allIngredients =
        mealPlan.weeklyMealPlan
          .flatMap((day) => [
            ...(day.breakfast?.ingredients?.split('\n') || []),
            ...(day.lunch?.ingredients?.split('\n') || []),
            ...(day.comida?.ingredients?.split('\n') || []),
            ...(day.dinner?.ingredients?.split('\n') || []),
          ])
          .filter((ing) => ing.trim() !== '') || [];

      const allIngredientsString = allIngredients.join('\n');

      if (!allIngredientsString) {
        toast({
          title: 'No hay Ingredientes',
          description: 'Este plan de comidas no tiene ingredientes para generar una lista.',
          variant: 'destructive',
        });
        setIsGeneratingList(false);
        return;
      }
      
      const result = await generateShoppingList({ allIngredients: allIngredientsString });

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
        description: 'Redirigiéndote a tu nueva lista...',
      });
      router.push('/shopping-list');
    } catch (error) {
      toast({
        title: 'Error al Generar la Lista',
        description: 'No se pudo generar la lista de compras. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingList(false);
    }
  };
  
  const anyLoading = isLoading || isGeneratingList || isSimulatingAd || isSaving;
  const generationsLeft = FREE_GENERATIONS_LIMIT - generationCount;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                          <Textarea placeholder="ej., pasta, carne molida, tomates, cebollas" {...field} />
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
                          <Input placeholder="ej., vegetariano, sin gluten, bajo en carbohidratos" {...field} />
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
                            <Input type="number" min="1" max="7" {...field} />
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
                            <Input type="number" min="1" max="20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled={anyLoading} className="w-full">
                    {isLoading ? 'Generando Plan...' : isSimulatingAd ? 'Viendo Anuncio...' : 'Generar Plan de Comidas'}
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
            {!user?.isPremium && (
              <CardFooter className="justify-center">
                <p className="text-sm text-muted-foreground">
                    Te queda{generationsLeft === 1 ? '' : 'n'} {generationsLeft > 0 ? generationsLeft : 0} generaci{generationsLeft === 1 ? 'ón' : 'ones'} gratuita{generationsLeft === 1 ? '' : 's'}.
                </p>
              </CardFooter>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="font-headline text-3xl font-bold text-primary text-center">Tu Plan de Comidas</h2>
          <Card className="shadow-lg min-h-[400px]">
            <CardHeader>
              <CardTitle className="font-headline">
                <CalendarDays className="inline-block mr-2" />
                Plan Generado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading && !mealPlan && (
                <div className="space-y-4 p-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              )}
               {isSimulatingAd && (
                <div className="text-center text-muted-foreground py-10">
                  <p className="font-semibold">Cargando anuncio...</p>
                  <p>Tu plan se generará en un momento.</p>
                </div>
              )}
              {mealPlan && (
                <Accordion type="single" collapsible className="w-full">
                  {mealPlan.weeklyMealPlan.map((dailyPlan) => (
                    <AccordionItem value={dailyPlan.day} key={dailyPlan.day}>
                      <AccordionTrigger className="font-headline text-lg">{dailyPlan.day}</AccordionTrigger>
                      <AccordionContent className="space-y-4 px-1">
                        <Tabs defaultValue="breakfast" className="w-full">
                          <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="breakfast">Desayuno</TabsTrigger>
                            <TabsTrigger value="lunch">Almuerzo</TabsTrigger>
                            <TabsTrigger value="comida">Comida</TabsTrigger>
                            <TabsTrigger value="dinner">Cena</TabsTrigger>
                          </TabsList>
                          <TabsContent value="breakfast">
                             <MealCard meal={dailyPlan.breakfast} />
                          </TabsContent>
                          <TabsContent value="lunch">
                            <MealCard meal={dailyPlan.lunch} />
                          </TabsContent>
                          <TabsContent value="comida">
                            <MealCard meal={dailyPlan.comida} />
                          </TabsContent>
                          <TabsContent value="dinner">
                            <MealCard meal={dailyPlan.dinner} />
                          </TabsContent>
                        </Tabs>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
              {!anyLoading && !mealPlan && (
                <div className="text-center text-muted-foreground py-10">
                  <p>Tu plan de comidas generado se mostrará aquí.</p>
                </div>
              )}
            </CardContent>
            {mealPlan && (
              <CardFooter className="flex flex-col sm:flex-row gap-2">
                <Button onClick={handleSaveMenu} variant="secondary" className="w-full" disabled={anyLoading}>
                  {isSaving ? (
                     <>Guardando...</>
                  ) : (
                    <>
                      <BookHeart className="mr-2 h-4 w-4" /> Guardar Menú
                    </>
                  )}
                </Button>
                <Button onClick={handleGenerateShoppingList} className="w-full" disabled={anyLoading}>
                  <ShoppingCart className="mr-2 h-4 w-4" /> 
                  {isGeneratingList ? 'Generando Lista...' : 'Generar Lista de Compras'}
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
               Has utilizado tu generación de plan gratuita. Para seguir creando, mira un anuncio o actualiza a Pro para tener generaciones ilimitadas.
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
