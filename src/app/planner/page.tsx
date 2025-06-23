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
import type { WeeklyPlan, ShoppingListItem, DailyMealPlan } from '@/types';
import { BookHeart, CalendarDays, ShoppingCart, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  dietaryPreferences: z.string().optional(),
  numberOfDays: z.coerce.number().int().min(1).max(7),
  numberOfPeople: z.coerce.number().int().min(1).max(20),
});

const MealCard = ({ meal }: { meal: DailyMealPlan['breakfast'] }) => (
  <Card className="mt-4 border-accent/20">
    <CardHeader>
      <CardTitle className="font-headline text-xl">{meal.name}</CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
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
    </CardContent>
  </Card>
);

export default function MealPlannerPage() {
  const [mealPlan, setMealPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [savedMenus, setSavedMenus] = useLocalStorage<WeeklyPlan[]>('savedMenus', []);
  const [, setShoppingList] = useLocalStorage<ShoppingListItem[]>('shoppingList', []);
  const router = useRouter();

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
      const plan = await createWeeklyMealPlan(values);
      setMealPlan(plan);
    } catch (error) {
      console.error('Error al generar plan semanal:', error);
      toast({
        title: 'Error al Generar el Plan',
        description: error instanceof Error ? error.message : 'Algo salió mal. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }

  const handleSaveMenu = () => {
    if (mealPlan) {
      const newMenuWithId = { ...mealPlan, id: new Date().toISOString() };
      setSavedMenus([...savedMenus, newMenuWithId]);
      toast({
        title: '¡Menú Guardado!',
        description: 'Tu nuevo plan de comidas ha sido guardado.',
      });
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlan) return;
    setIsLoading(true);
    try {
      const mealPlanString = mealPlan.weeklyMealPlan
        .map(
          (plan) =>
            `${plan.day}:\n- Desayuno: ${plan.breakfast.name}\n- Almuerzo: ${plan.lunch.name}\n- Cena: ${plan.dinner.name}`
        )
        .join('\n\n');

      const result = await generateShoppingList({ mealPlan: mealPlanString });
      const items = result.shoppingList
        .split('\n')
        .filter((item) => item.trim() !== '')
        .map((item) => ({
          id: crypto.randomUUID(),
          name: item.replace(/^- /g, '').trim(),
          checked: false,
        }));
      setShoppingList(items);

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
      setIsLoading(false);
    }
  };

  return (
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
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Generando Plan...' : 'Generar Plan de Comidas'}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
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
            {mealPlan && (
              <Accordion type="single" collapsible className="w-full">
                {mealPlan.weeklyMealPlan.map((dailyPlan) => (
                  <AccordionItem value={dailyPlan.day} key={dailyPlan.day}>
                    <AccordionTrigger className="font-headline text-lg">{dailyPlan.day}</AccordionTrigger>
                    <AccordionContent className="space-y-4 px-1">
                      <Tabs defaultValue="breakfast" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="breakfast">Desayuno</TabsTrigger>
                          <TabsTrigger value="lunch">Almuerzo</TabsTrigger>
                          <TabsTrigger value="dinner">Cena</TabsTrigger>
                        </TabsList>
                        <TabsContent value="breakfast">
                          <MealCard meal={dailyPlan.breakfast} />
                        </TabsContent>
                        <TabsContent value="lunch">
                          <MealCard meal={dailyPlan.lunch} />
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
            {!isLoading && !mealPlan && (
              <div className="text-center text-muted-foreground py-10">
                <p>Tu plan de comidas generado se mostrará aquí.</p>
              </div>
            )}
          </CardContent>
          {mealPlan && (
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSaveMenu} variant="secondary" className="w-full" disabled={isLoading}>
                <BookHeart className="mr-2 h-4 w-4" /> Guardar Menú
              </Button>
              <Button onClick={handleGenerateShoppingList} className="w-full" disabled={isLoading}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Generar Lista de Compras
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
