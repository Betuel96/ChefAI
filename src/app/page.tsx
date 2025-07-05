
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DailyMealPlan, Recipe, NutritionalInfo } from '@/types';
import { UtensilsCrossed, Sparkles, Beef, Mic, Terminal } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailVerificationBanner } from '@/components/layout/email-verification-banner';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Separator } from '@/components/ui/separator';
import { collection, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { CookingAssistant } from '@/components/cooking/cooking-assistant';


const TodayMealCard = ({ meal, mealType, onStartCooking }: { meal: Recipe; mealType: string; onStartCooking: (recipe: Recipe) => void; }) => {
  if (!meal || !meal.name) return null;

  return (
    <div className="p-1">
      <Card>
        <CardHeader className="flex flex-row justify-between items-center">
          <CardTitle className="font-headline text-2xl text-accent">{mealType}: {meal.name}</CardTitle>
           <Button variant="outline" size="icon" onClick={() => onStartCooking(meal)}>
              <Mic className="h-5 w-5" />
              <span className="sr-only">Empezar a Cocinar</span>
            </Button>
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

const FirebaseSetupGuide = () => (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader>
                <CardTitle className="text-2xl font-headline text-destructive flex items-center gap-2">
                    <Terminal /> Acción Requerida: Configura tu Backend
                </CardTitle>
                <CardDescription>
                    La aplicación no puede conectar con Firebase. Por favor, sigue estos pasos para habilitar las funciones principales.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <p>
                    Para que el inicio de sesión, el guardado de datos y las funciones de IA funcionen, necesitas proporcionar tus propias claves de API de Firebase y Stripe.
                </p>
                <div className="space-y-2">
                    <h3 className="font-semibold">1. Crea un archivo <code>.env</code></h3>
                    <p className="text-sm text-muted-foreground">
                        En la raíz de tu proyecto (en el mismo nivel que <code>package.json</code>), crea un nuevo archivo llamado <code>.env</code>.
                    </p>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">2. Añade tus claves</h3>
                    <p className="text-sm text-muted-foreground">
                        Copia el siguiente texto, pégalo en tu archivo <code>.env</code> y reemplaza los valores <code>...</code> con tus claves reales.
                    </p>
                    <pre className="mt-2 p-4 bg-muted rounded-md text-xs overflow-x-auto">
                        <code>
                            {`# Firebase Configuration (Encuentra esto en tu Consola de Firebase > Configuración del Proyecto > General)
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="..."
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# Stripe Configuration (Encuentra esto en tu Dashboard de Stripe > Desarrolladores > Claves API)
STRIPE_SECRET_KEY="..."
STRIPE_WEBHOOK_SECRET="..."
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID="..."
NEXT_PUBLIC_STRIPE_VOICE_PLUS_PRICE_ID="..."
`}
                        </code>
                    </pre>
                </div>
                <div className="space-y-2">
                    <h3 className="font-semibold">3. Reinicia la aplicación</h3>
                    <p className="text-sm text-muted-foreground">
                        Detén y vuelve a iniciar el servidor de desarrollo para que los nuevos cambios surtan efecto.
                    </p>
                </div>
            </CardContent>
        </Card>
    </div>
);


export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [todaysPlan, setTodaysPlan] = useState<DailyMealPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State for the cooking assistant
  const [isCooking, setIsCooking] = useState(false);
  const [cookingRecipe, setCookingRecipe] = useState<Recipe | null>(null);

  // If Firebase is not configured, show the setup guide and stop rendering the rest of the component.
  if (!isFirebaseConfigured) {
      return <FirebaseSetupGuide />;
  }

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
                <TodayMealCard meal={meal.recipe} mealType={meal.name} onStartCooking={handleStartCooking} />
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
    <>
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
