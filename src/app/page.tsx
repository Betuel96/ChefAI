
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DailyMealPlan, Recipe, NutritionalInfo } from '@/types';
import { UtensilsCrossed, Sparkles, Beef } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { getMenus } from '@/lib/menus';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerificationBanner } from '@/components/layout/email-verification-banner';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from '@/components/ui/separator';

const TodayMealCard = ({ meal, mealType }: { meal: Recipe; mealType: string }) => {
  if (!meal || !meal.name) return null;

  return (
    <div className="p-1">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl text-accent">{mealType}: {meal.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {meal.benefits && (
            <div className="p-3 bg-primary/10 rounded-md">
              <h4 className="font-semibold text-primary/80 flex items-center gap-2 text-md"><Sparkles className="w-4 h-4" /> Beneficios</h4>
              <p className="text-primary/70 text-sm mt-1">{meal.benefits}</p>
            </div>
          )}
          {meal.nutritionalTable && (
            <div className="p-3 bg-muted/50 rounded-md">
              <h4 className="font-semibold text-accent/80 flex items-center gap-2 text-md"><Beef className="w-4 h-4" /> Info. Nutricional</h4>
              <div className="text-accent/70 text-sm mt-1 grid grid-cols-2">
                <span>Calorías: {meal.nutritionalTable.calories}</span>
                <span>Proteína: {meal.nutritionalTable.protein}</span>
                <span>Carbohidratos: {meal.nutritionalTable.carbs}</span>
                <span>Grasas: {meal.nutritionalTable.fats}</span>
              </div>
            </div>
          )}
          <Separator />
          <div>
            <h4 className="font-semibold">Ingredientes:</h4>
            <ul className="whitespace-pre-wrap text-muted-foreground text-sm list-disc list-inside mt-2">
              {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Instrucciones:</h4>
            <ol className="whitespace-pre-wrap text-muted-foreground text-sm list-decimal list-inside mt-2">
              {meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
        <div className="p-6 pt-0">
          <Skeleton className="h-64 w-full" />
        </div>
      );
    }
    
    if (todaysPlan) {
      const meals = [
        { name: 'Desayuno', recipe: todaysPlan.breakfast },
        { name: 'Almuerzo', recipe: todaysPlan.lunch },
        { name: 'Comida', recipe: todaysPlan.comida },
        { name: 'Cena', recipe: todaysPlan.dinner },
      ].filter(meal => meal.recipe && meal.recipe.name);

      if (meals.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center text-center p-6 min-h-[200px]">
            <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-headline text-2xl font-semibold">No Hay Comidas en el Plan Para Hoy</h3>
             <p className="text-muted-foreground mt-2 mb-6 max-w-md">Tu plan de esta semana no parece tener ninguna comida para el día de hoy.</p>
          </div>
        )
      }

      return (
        <Carousel className="w-full max-w-xl mx-auto py-4">
          <CarouselContent>
            {meals.map((meal, index) => (
              <CarouselItem key={index}>
                <TodayMealCard meal={meal.recipe} mealType={meal.name} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-2 sm:ml-8" />
          <CarouselNext className="mr-2 sm:mr-8" />
        </Carousel>
      );
    }

    const title = user ? "No Hay Comidas Planificadas Para Hoy" : "¡Bienvenido/a a ChefAI!";
    const description = user
      ? "¿Listo/a para cocinar? Crea un nuevo plan de comidas semanal para empezar."
      : "Inicia sesión para guardar tus planes y recetas, o crea tu primer plan de comidas semanal para empezar.";
    const buttonText = user ? "Ir al Planificador Semanal" : "Ir al Planificador";
    
    return (
       <div className="flex flex-col items-center justify-center text-center p-6 min-h-[200px]">
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
