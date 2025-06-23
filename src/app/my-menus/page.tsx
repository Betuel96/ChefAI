'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import type { WeeklyPlan, ShoppingListItem, DailyMealPlan } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MenuSquare, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Add an ID to the weekly plan for keying
interface SavedWeeklyPlan extends WeeklyPlan {
  id: string;
}

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

export default function MyMenusPage() {
  const [savedMenus] = useLocalStorage<SavedWeeklyPlan[]>('savedMenus', []);
  const [, setShoppingList] = useLocalStorage<ShoppingListItem[]>('shoppingList', []);
  const [loadingMenuId, setLoadingMenuId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleGenerateList = async (menu: WeeklyPlan) => {
    const menuId = (menu as SavedWeeklyPlan).id;
    setLoadingMenuId(menuId);
    try {
      const mealPlanString = menu.weeklyMealPlan
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
        description: `Redirigiéndote a tu nueva lista...`,
      });
      router.push('/shopping-list');
    } catch (error) {
      toast({
        title: 'Error al Generar la Lista',
        description: 'No se pudo generar la lista de compras. Por favor, inténtalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoadingMenuId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Mis Menús Guardados</h1>
        <p className="text-muted-foreground mt-2 text-lg">Tu colección de planes de comidas semanales.</p>
      </header>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <MenuSquare /> Tus Planes de Comidas
          </CardTitle>
          <CardDescription>{savedMenus.length} menú(s) guardado(s).</CardDescription>
        </CardHeader>
        <CardContent>
          {savedMenus.length > 0 ? (
            <Accordion type="multiple" className="w-full space-y-2">
              {savedMenus.map((menu, index) => (
                <AccordionItem value={menu.id || `menu-${index}`} key={menu.id || `menu-${index}`} className="border-b-0">
                  <Card>
                    <AccordionTrigger className="p-4 font-headline text-lg hover:no-underline">
                      Plan de Comida del {new Date(menu.id).toLocaleDateString()}
                    </AccordionTrigger>
                    <AccordionContent className="p-6 pt-0 space-y-4">
                      {Array.isArray(menu.weeklyMealPlan) &&
                        menu.weeklyMealPlan.map((dailyPlan) => (
                          <div key={dailyPlan.day} className="py-2 border-b last:border-b-0">
                            <h4 className="font-headline font-bold text-accent text-lg mb-2">{dailyPlan.day}</h4>
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
                          </div>
                        ))}
                      <Button
                        onClick={() => handleGenerateList(menu)}
                        className="mt-4 w-full sm:w-auto"
                        disabled={loadingMenuId === menu.id}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        {loadingMenuId === menu.id ? 'Generando...' : 'Crear Lista de Compras'}
                      </Button>
                    </AccordionContent>
                  </Card>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="text-center text-muted-foreground py-10">
              <p>Aún no has guardado ningún menú.</p>
              <p>Ve al Planificador Semanal para crear y guardar un nuevo plan.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
