'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import type { WeeklyPlan, ShoppingListItem } from '@/types';
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

// Add an ID to the weekly plan for keying
interface SavedWeeklyPlan extends WeeklyPlan {
  id: string;
}

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
      const mealPlanString = Object.entries(menu.weeklyMealPlan)
        .map(([day, meals]) => `${day}:\n- Desayuno: ${meals.breakfast.name}\n- Almuerzo: ${meals.lunch.name}\n- Cena: ${meals.dinner.name}`)
        .join('\n\n');
      
      const result = await generateShoppingList({ mealPlan: mealPlanString });
      const items = result.shoppingList.split('\n').filter(item => item.trim() !== '').map(item => ({
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
          <CardTitle className="font-headline flex items-center gap-2"><MenuSquare /> Tus Planes de Comidas</CardTitle>
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
                      {Object.entries(menu.weeklyMealPlan).map(([day, meals]) => (
                        <div key={day} className="py-2">
                          <h4 className="font-headline font-bold text-accent text-lg">{day}</h4>
                          <ul className="list-disc list-inside text-muted-foreground">
                            <li><strong>Desayuno:</strong> {meals.breakfast.name}</li>
                            <li><strong>Almuerzo:</strong> {meals.lunch.name}</li>
                            <li><strong>Cena:</strong> {meals.dinner.name}</li>
                          </ul>
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
