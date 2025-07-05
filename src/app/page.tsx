
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DailyMealPlan, Recipe } from '@/types';
import { UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getMenus } from '@/lib/menus';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerificationBanner } from '@/components/layout/email-verification-banner';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const MealDetailCard = ({ meal }: { meal: Recipe | undefined }) => {
  if (!meal || !meal.name) return <p className="text-muted-foreground px-4 pb-4">No hay receta planificada para esta comida.</p>;
  return (
    <div className="px-4 pb-4 space-y-3">
        <div>
            <h4 className="font-semibold text-accent">Ingredientes:</h4>
            <ul className="list-disc list-inside mt-2 text-sm text-muted-foreground">
                {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
        </div>
        <div>
            <h4 className="font-semibold text-accent">Instrucciones:</h4>
            <ol className="list-decimal list-inside mt-2 text-sm text-muted-foreground">
                {meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
        </div>
    </div>
  )
};

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [todaysPlan, setTodaysPlan] = useState<DailyMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user) {
      setIsLoading(false);
      setTodaysPlan(null);
      return;
    }

    async function fetchLatestMenu() {
      setIsLoading(true);
      try {
        const menus = await getMenus(user!.uid);
        if (menus.length > 0) {
          const lastMenu = menus[0]; // getMenus sorts by creation date desc
          const weeklyPlanArray = lastMenu.weeklyMealPlan;

          if (Array.isArray(weeklyPlanArray) && weeklyPlanArray.length > 0) {
            const dayOfWeek = new Date().getDay(); // 0 for Sunday, 1 for Monday, etc.
            const planIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            if (weeklyPlanArray.length > planIndex) {
              const planForToday = weeklyPlanArray[planIndex];
              setTodaysPlan(planForToday);
            } else {
              setTodaysPlan(null);
            }
          }
        } else {
          setTodaysPlan(null);
        }
      } catch (error) {
        console.error("Failed to fetch menus:", error);
        setTodaysPlan(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLatestMenu();
  }, [user, authLoading]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="space-y-2 p-6 pt-0">
          {[...Array(4)].map((_, i) => (
             <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      );
    }
    
    if (todaysPlan) {
      return (
        <Accordion type="single" collapsible className="w-full px-6 pb-4">
            <AccordionItem value="breakfast">
                <AccordionTrigger className="font-headline text-xl font-semibold">Desayuno: {todaysPlan.breakfast?.name || 'No planificado'}</AccordionTrigger>
                <AccordionContent>
                    <MealDetailCard meal={todaysPlan.breakfast} />
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="lunch">
                <AccordionTrigger className="font-headline text-xl font-semibold">Almuerzo: {todaysPlan.lunch?.name || 'No planificado'}</AccordionTrigger>
                <AccordionContent>
                    <MealDetailCard meal={todaysPlan.lunch} />
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="comida">
                <AccordionTrigger className="font-headline text-xl font-semibold">Comida: {todaysPlan.comida?.name || 'No planificada'}</AccordionTrigger>
                <AccordionContent>
                    <MealDetailCard meal={todaysPlan.comida} />
                </AccordionContent>
            </AccordionItem>
             <AccordionItem value="dinner">
                <AccordionTrigger className="font-headline text-xl font-semibold">Cena: {todaysPlan.dinner?.name || 'No planificada'}</AccordionTrigger>
                <AccordionContent>
                    <MealDetailCard meal={todaysPlan.dinner} />
                </AccordionContent>
            </AccordionItem>
        </Accordion>
      );
    }

    const title = user ? "No Hay Comidas Planificadas Para Hoy" : "¡Bienvenido/a a ChefAI!";
    const description = user
      ? "¿Listo/a para cocinar? Crea un nuevo plan de comidas semanal para empezar."
      : "Inicia sesión para guardar tus planes y recetas, o crea tu primer plan de comidas semanal para empezar.";
    const buttonText = user ? "Ir al Planificador Semanal" : "Ir al Planificador";
    
    return (
       <div className="flex flex-col items-center justify-center text-center p-6">
          <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-headline text-2xl font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-md">{description}</p>
          <Button asChild>
            <Link href="/planner">{buttonText}</Link>
          </Button>
        </div>
    );
  };


  return (
    <div className="flex flex-col gap-8">
      <EmailVerificationBanner />
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Panel de ChefAI</h1>
        <p className="text-muted-foreground mt-2 text-lg">Tu resumen culinario.</p>
      </header>
      
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{todaysPlan ? `Menú para Hoy (${todaysPlan.day})` : 'Comidas de Hoy'}</CardTitle>
          <CardDescription>
            {user ? 'Esto es lo que hay en el menú de hoy de tu último plan.' : 'Crea un plan para ver tus comidas aquí.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
