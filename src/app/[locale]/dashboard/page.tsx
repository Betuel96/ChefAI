
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { DailyMealPlan, Recipe } from '@/types';
import { UtensilsCrossed, Sparkles, Beef, Mic, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerificationBanner } from '@/components/layout/email-verification-banner';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from '@/components/ui/separator';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { CookingAssistant } from '@/components/cooking/cooking-assistant';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getDictionary } from '@/lib/get-dictionary';
import type { Locale } from '@/i18n.config';
import { useParams } from 'next/navigation';


const TodayMealCard = ({ meal, mealType, onStartCooking, dict }: { meal: Recipe; mealType: string; onStartCooking: (recipe: Recipe) => void; dict: any; }) => {
  if (!meal || !meal.name) return null;

  return (
    <div className="p-1">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="font-headline text-2xl text-accent">{mealType}: {meal.name}</CardTitle>
           <Button variant="outline" size="icon" onClick={() => onStartCooking(meal)}>
              <Mic className="h-5 w-5" />
              <span className="sr-only">{dict.dashboard.start_cooking}</span>
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {meal.benefits && (
            <div className="p-3 bg-primary/10 rounded-md">
              <h4 className="font-semibold text-primary/80 flex items-center gap-2 text-md"><Sparkles className="w-4 h-4" /> {dict.dashboard.benefits}</h4>
              <p className="text-primary/70 text-sm mt-1">{meal.benefits}</p>
            </div>
          )}
          {meal.nutritionalTable && (
            <div className="p-3 bg-muted/50 rounded-md">
              <h4 className="font-semibold text-accent/80 flex items-center gap-2 text-md"><Beef className="w-4 h-4" /> {dict.dashboard.nutritional_info}</h4>
              <div className="text-accent/70 text-sm mt-1 grid grid-cols-2">
                <span>{dict.dashboard.calories}: {meal.nutritionalTable.calories}</span>
                <span>{dict.dashboard.protein}: {meal.nutritionalTable.protein}</span>
                <span>{dict.dashboard.carbs}: {meal.nutritionalTable.carbs}</span>
                <span>{dict.dashboard.fats}: {meal.nutritionalTable.fats}</span>
              </div>
            </div>
          )}
          <Separator />
          <div>
            <h4 className="font-semibold">{dict.dashboard.ingredients}:</h4>
            <ul className="whitespace-pre-wrap text-muted-foreground text-sm list-disc list-inside mt-2">
              {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">{dict.dashboard.instructions}:</h4>
            <ol className="whitespace-pre-wrap text-muted-foreground text-sm list-decimal list-inside mt-2">
              {meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as Locale;
  const { user, loading: authLoading } = useAuth();
  const [todaysPlan, setTodaysPlan] = useState<DailyMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDashboardIntro, setShowDashboardIntro] = useLocalStorage('show-dashboard-intro', true);

  const [isCooking, setIsCooking] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);
  
  const [hasMounted, setHasMounted] = useState(false);
  const [dict, setDict] = useState<any>(null);

  useEffect(() => {
    setHasMounted(true);
    if (locale) {
      getDictionary(locale).then(setDict);
    }
  }, [locale]);


  useEffect(() => {
    if (authLoading) {
      setIsLoading(true);
      return;
    }
    if (!user || !db) {
      setIsLoading(false);
      setTodaysPlan(null);
      return;
    }
    
    setIsLoading(true);
    const menusCollection = collection(db, 'users', user.uid, 'menus');
    const q = query(menusCollection, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        if (snapshot.empty) {
            setTodaysPlan(null);
            setIsLoading(false);
            return;
        }

        const lastMenuDoc = snapshot.docs[0];
        const menuData = lastMenuDoc.data();
        
        const weeklyPlanArray = (Array.isArray(menuData.weeklyMealPlan) ? menuData.weeklyMealPlan : []);

        if (weeklyPlanArray.length > 0) {
            const dayOfWeek = new Date().getDay();
            const planIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

            if (weeklyPlanArray.length > planIndex) {
                 const normalizeField = (field: any): string[] => {
                    if (Array.isArray(field)) return field;
                    if (typeof field === 'string') return field.split('\n').filter(line => line.trim() !== '');
                    return [];
                };
                const normalizeRecipe = (recipe: any): Recipe => {
                    if (!recipe) return { name: '', instructions: [], ingredients: [], equipment: [] };
                    return {
                        name: recipe.name || '',
                        instructions: normalizeField(recipe.instructions),
                        ingredients: normalizeField(recipe.ingredients),
                        equipment: normalizeField(recipe.equipment || []),
                        benefits: recipe.benefits || undefined,
                        nutritionalTable: recipe.nutritionalTable || undefined,
                    };
                };
                
                const rawPlanForToday = weeklyPlanArray[planIndex];
                const planForToday: DailyMealPlan = {
                    day: rawPlanForToday.day,
                    breakfast: normalizeRecipe(rawPlanForToday.breakfast),
                    lunch: normalizeRecipe(rawPlanForToday.lunch),
                    comida: normalizeRecipe(rawPlanForToday.comida),
                    dinner: normalizeRecipe(rawPlanForToday.dinner)
                };
                setTodaysPlan(planForToday);

            } else {
                setTodaysPlan(null);
            }
        } else {
            setTodaysPlan(null);
        }
        setIsLoading(false);
    }, (error) => {
        console.error("Failed to fetch menus with snapshot:", error);
        setTodaysPlan(null);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  const handleStartCooking = (recipe: Recipe) => {
    setCookingRecipe(recipe);
    setIsCooking(true);
  };
  
  if (!dict) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    )
  }

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
        { name: dict.dashboard.breakfast, recipe: todaysPlan.breakfast },
        { name: dict.dashboard.lunch, recipe: todaysPlan.lunch },
        { name: dict.dashboard.main_meal, recipe: todaysPlan.comida },
        { name: dict.dashboard.dinner, recipe: todaysPlan.dinner },
      ].filter(meal => meal.recipe && meal.recipe.name);

      if (meals.length === 0) {
        return (
          <div className="flex flex-col items-center justify-center text-center p-6 min-h-[200px]">
            <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="font-headline text-2xl font-semibold">{dict.dashboard.no_meals_today_title}</h3>
             <p className="text-muted-foreground mt-2 mb-6 max-w-md">{dict.dashboard.no_meals_today_desc}</p>
          </div>
        )
      }

      return (
        <Carousel className="w-full max-w-xl mx-auto py-4">
          <CarouselContent>
            {meals.map((meal, index) => (
              <CarouselItem key={index}>
                <TodayMealCard meal={meal.recipe} mealType={meal.name} onStartCooking={handleStartCooking} dict={dict} />
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-2 sm:ml-8" />
          <CarouselNext className="mr-2 sm:mr-8" />
        </Carousel>
      );
    }

    const title = user ? dict.dashboard.no_plan_title_user : dict.dashboard.no_plan_title_guest;
    const description = user
      ? dict.dashboard.no_plan_desc_user
      : dict.dashboard.no_plan_desc_guest;
    const buttonText = user ? dict.dashboard.no_plan_button_user : dict.dashboard.no_plan_button_guest;
    
    return (
       <div className="flex flex-col items-center justify-center text-center p-6 min-h-[200px]">
          <UtensilsCrossed className="w-16 h-16 text-muted-foreground mb-4" />
          <h3 className="font-headline text-2xl font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-md">{description}</p>
          <Button asChild>
            <Link href={`/${locale}/planner`}>{buttonText}</Link>
          </Button>
        </div>
    );
  };

  return (
    <>
    <div className="flex flex-col gap-8">
      <EmailVerificationBanner />
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">{dict.dashboard.title}</h1>
        {hasMounted && showDashboardIntro && (
            <Alert className="mt-4 relative pr-8">
                <AlertDescription>
                    {dict.dashboard.intro_banner}
                </AlertDescription>
                 <button onClick={() => setShowDashboardIntro(false)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full hover:bg-muted/50">
                    <X className="h-4 w-4" />
                </button>
            </Alert>
        )}
      </header>
      
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">{todaysPlan ? todaysPlan.day : dict.dashboard.todays_meals_fallback}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
    
    {cookingRecipe && (
        <CookingAssistant 
            recipe={cookingRecipe}
            isOpen={isCooking}
            onOpenChange={setIsCooking}
        />
    )}
    </>
  );
}
