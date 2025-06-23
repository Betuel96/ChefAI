'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { WeeklyPlan, DailyMealPlan } from '@/types';
import { UtensilsCrossed } from 'lucide-react';

export default function Dashboard() {
  const [savedMenus] = useLocalStorage<WeeklyPlan[]>('savedMenus', []);
  const [todaysPlan, setTodaysPlan] = useState<DailyMealPlan | null>(null);

  useEffect(() => {
    if (savedMenus.length > 0) {
      const lastMenu = savedMenus[savedMenus.length - 1];
      const weeklyPlanArray = lastMenu.weeklyMealPlan;

      if(Array.isArray(weeklyPlanArray) && weeklyPlanArray.length > 0) {
        const today = new Date();
        // Note: getDay() is locale-dependent. Sunday is 0, Monday is 1...
        // We'll create a key like "Día 2" for Monday. This might not match perfectly if a plan
        // starts mid-week, but for a demo, it shows the concept.
        const dayKey = `Día ${today.getDay() + 1}`;
        
        // Find the plan for today's day of the week
        let planForToday = weeklyPlanArray.find(p => p.day === dayKey);
        
        // If no plan for today, fallback to the first day of the saved plan.
        if (!planForToday) {
          planForToday = weeklyPlanArray[0];
        }
        
        setTodaysPlan(planForToday);
      }
    }
  }, [savedMenus]);

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Panel de ChefAI</h1>
        <p className="text-muted-foreground mt-2 text-lg">Tu resumen culinario diario.</p>
      </header>
      
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Comidas de Hoy</CardTitle>
          <CardDescription>Esto es lo que hay en el menú de hoy de tu último plan.</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysPlan ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-headline text-xl font-semibold text-accent">Desayuno</h3>
                <p className="text-lg">{todaysPlan.breakfast.name}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-headline text-xl font-semibold text-accent">Almuerzo</h3>
                <p className="text-lg">{todaysPlan.lunch.name}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-headline text-xl font-semibold text-accent">Comida</h3>
                <p className="text-lg">{todaysPlan.comida.name}</p>
              </div>
              <Separator />
              <div>
                <h3 className="font-headline text-xl font-semibold text-accent">Cena</h3>
                <p className="text-lg">{todaysPlan.dinner.name}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-10">
              <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="font-headline text-2xl font-semibold">No Hay Comidas Planificadas para Hoy</h3>
              <p className="text-muted-foreground mt-2 mb-6">¿Listo para cocinar? Crea un nuevo plan de comidas semanal para empezar.</p>
              <Button asChild>
                <Link href="/planner">Ir al Planificador Semanal</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
