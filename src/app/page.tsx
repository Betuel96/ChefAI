'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import type { DailyMealPlan } from '@/types';
import { UtensilsCrossed } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getMenus } from '@/lib/menus';
import { Skeleton } from '@/components/ui/skeleton';

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
            // For simplicity and robustness, display the first day of the latest plan.
            const planForToday = weeklyPlanArray[0];
            setTodaysPlan(planForToday);
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
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <React.Fragment key={i}>
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-5 w-1/2" />
              </div>
              {i < 3 && <Separator />}
            </React.Fragment>
          ))}
        </div>
      );
    }
    
    if (todaysPlan) {
      return (
        <div className="space-y-6">
          <div>
            <h3 className="font-headline text-xl font-semibold text-accent">Desayuno</h3>
            <p className="text-lg">{todaysPlan.breakfast?.name || 'No planificado'}</p>
          </div>
          <Separator />
          <div>
            <h3 className="font-headline text-xl font-semibold text-accent">Almuerzo</h3>
            <p className="text-lg">{todaysPlan.lunch?.name || 'No planificado'}</p>
          </div>
          <Separator />
          <div>
            <h3 className="font-headline text-xl font-semibold text-accent">Comida</h3>
            <p className="text-lg">{todaysPlan.comida?.name || 'No planificada'}</p>
          </div>
          <Separator />
          <div>
            <h3 className="font-headline text-xl font-semibold text-accent">Cena</h3>
            <p className="text-lg">{todaysPlan.dinner?.name || 'No planificada'}</p>
          </div>
        </div>
      );
    }

    const title = user ? "No Hay Comidas Planificadas" : "¡Bienvenido/a a ChefAI!";
    const description = user
      ? "¿Listo/a para cocinar? Crea un nuevo plan de comidas semanal para empezar."
      : "Inicia sesión para guardar tus planes y recetas, o crea tu primer plan de comidas semanal para empezar.";
    const buttonText = user ? "Ir al Planificador Semanal" : "Ir al Planificador";
    
    return (
       <div className="flex flex-col items-center justify-center text-center py-10">
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
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Panel de ChefAI</h1>
        <p className="text-muted-foreground mt-2 text-lg">Tu resumen culinario.</p>
      </header>
      
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{todaysPlan ? `Menú para ${todaysPlan.day}` : 'Comidas de Hoy'}</CardTitle>
          <CardDescription>
            {user ? 'Esto es lo que hay en el menú de hoy de tu último plan.' : 'Crea un plan para ver tus comidas aquí.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
