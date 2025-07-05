// src/components/community/post-content-viewer.tsx
'use client';

import type { PublishedPost, Recipe, NutritionalInfo } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Separator } from '@/components/ui/separator';
import { Sparkles, Beef } from 'lucide-react';

const MealDetail = ({ title, meal }: { title: string, meal: Recipe | undefined }) => (
  meal ? (
    <div>
      <h4 className="font-headline text-xl font-semibold text-accent">{title}: {meal.name}</h4>
      <div className="mt-2 space-y-3">
        {meal.benefits && (
            <div className="p-3 bg-primary/10 rounded-md">
                <h5 className="font-semibold text-primary/80 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4" /> Beneficios</h5>
                <p className="text-primary/70 text-xs mt-1">{meal.benefits}</p>
            </div>
        )}
        {meal.nutritionalTable && (
             <div className="p-3 bg-muted/50 rounded-md">
                <h5 className="font-semibold text-accent/80 flex items-center gap-2 text-sm"><Beef className="w-4 h-4" /> Info. Nutricional</h5>
                <div className="text-accent/70 text-xs mt-1 grid grid-cols-2">
                    <span>Calorías: {meal.nutritionalTable.calories}</span>
                    <span>Proteína: {meal.nutritionalTable.protein}</span>
                    <span>Carbohidratos: {meal.nutritionalTable.carbs}</span>
                    <span>Grasas: {meal.nutritionalTable.fats}</span>
                </div>
            </div>
        )}
        <div>
          <h5 className="font-semibold">Ingredientes:</h5>
          <ul className="whitespace-pre-wrap text-muted-foreground text-sm list-disc list-inside">
            {meal.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
          </ul>
        </div>
        <div>
          <h5 className="font-semibold">Instrucciones:</h5>
          <ol className="whitespace-pre-wrap text-muted-foreground text-sm list-decimal list-inside">
            {meal.instructions.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      </div>
    </div>
  ) : null
);

export const PostContentViewer = ({ post }: { post: PublishedPost }) => {

  if (post.type === 'recipe') {
    return (
      <div className="space-y-6 pt-4">
          <Separator />
           {post.benefits && (
            <div className="p-4 bg-primary/10 rounded-lg">
                <h3 className="font-headline text-xl font-semibold text-primary/80 flex items-center gap-2"><Sparkles className="w-5 h-5" /> Beneficios</h3>
                <p className="mt-2 text-primary/70">{post.benefits}</p>
            </div>
            )}
            {post.nutritionalTable && (
                 <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-headline text-xl font-semibold text-accent/80 flex items-center gap-2"><Beef className="w-5 h-5" /> Info. Nutricional (por porción)</h3>
                     <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span>Calorías: {post.nutritionalTable.calories}</span>
                        <span>Proteína: {post.nutritionalTable.protein}</span>
                        <span>Carbohidratos: {post.nutritionalTable.carbs}</span>
                        <span>Grasas: {post.nutritionalTable.fats}</span>
                    </div>
                </div>
            )}
          <div>
              <h3 className="font-headline text-2xl font-semibold text-accent">Ingredientes</h3>
              <ul className="list-disc list-inside mt-2">
                  {post.ingredients?.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
          </div>
          <Separator/>
          <div>
              <h3 className="font-headline text-2xl font-semibold text-accent">Instrucciones</h3>
              <ol className="list-decimal list-inside mt-2">
                   {post.instructions?.map((item, i) => <li key={i}>{item}</li>)}
              </ol>
          </div>
          <Separator/>
          <div>
              <h3 className="font-headline text-2xl font-semibold text-accent">Equipo Necesario</h3>
              <ul className="list-disc list-inside mt-2">
                  {post.equipment?.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
          </div>
      </div>
    )
  }

  if (post.type === 'menu' && post.weeklyMealPlan) {
    return (
      <div>
        <p className="text-muted-foreground mb-6">Usa las flechas para navegar por los días del plan de comidas.</p>
        <Carousel className="w-full max-w-xl mx-auto">
          <CarouselContent>
            {post.weeklyMealPlan.map((dayPlan, index) => (
              <CarouselItem key={index}>
                <div className="p-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="font-headline text-2xl">{dayPlan.day}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <MealDetail title="Desayuno" meal={dayPlan.breakfast} />
                        <Separator />
                        <MealDetail title="Almuerzo" meal={dayPlan.lunch} />
                        <Separator />
                        <MealDetail title="Comida" meal={dayPlan.comida} />
                        <Separator />
                        <MealDetail title="Cena" meal={dayPlan.dinner} />
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious className="ml-8" />
          <CarouselNext className="mr-8" />
        </Carousel>
      </div>
    )
  }
  
  return null;
}
