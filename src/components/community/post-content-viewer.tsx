// src/components/community/post-content-viewer.tsx
'use client';

import type { PublishedPost, Recipe } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import { Separator } from '@/components/ui/separator';

const MealDetail = ({ title, meal }: { title: string, meal: Recipe | undefined }) => (
  meal ? (
    <div>
      <h4 className="font-headline text-xl font-semibold text-accent">{title}</h4>
      <div className="mt-2 space-y-3">
        <div>
          <h5 className="font-semibold">Ingredientes:</h5>
          <p className="whitespace-pre-wrap text-muted-foreground text-sm">{meal.ingredients}</p>
        </div>
        <div>
          <h5 className="font-semibold">Instrucciones:</h5>
          <p className="whitespace-pre-wrap text-muted-foreground text-sm">{meal.instructions}</p>
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
          <div>
              <h3 className="font-headline text-2xl font-semibold text-accent">Ingredientes</h3>
              <p className="whitespace-pre-wrap mt-2">{post.additionalIngredients}</p>
          </div>
          <Separator/>
          <div>
              <h3 className="font-headline text-2xl font-semibold text-accent">Instrucciones</h3>
              <p className="whitespace-pre-wrap mt-2">{post.instructions}</p>
          </div>
          <Separator/>
          <div>
              <h3 className="font-headline text-2xl font-semibold text-accent">Equipo Necesario</h3>
              <p className="whitespace-pre-wrap mt-2">{post.equipment}</p>
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
