'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createWeeklyMealPlan } from '@/ai/flows/create-weekly-meal-plan';
import { generateShoppingList } from '@/ai/flows/generate-shopping-list';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import type { WeeklyPlan, ShoppingListItem } from '@/types';
import { BookHeart, CalendarDays, ChefHat, ShoppingCart, Sparkles } from 'lucide-react';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Please list at least a few ingredients.'),
  dietaryPreferences: z.string().optional(),
  numberOfDays: z.coerce.number().int().min(1).max(7),
  numberOfPeople: z.coerce.number().int().min(1).max(20),
});

export default function MealPlannerPage() {
  const [mealPlan, setMealPlan] = useState<WeeklyPlan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [savedMenus, setSavedMenus] = useLocalStorage<WeeklyPlan[]>('savedMenus', []);
  const [, setShoppingList] = useLocalStorage<ShoppingListItem[]>('shoppingList', []);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      dietaryPreferences: '',
      numberOfDays: 7,
      numberOfPeople: 2,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setMealPlan(null);
    try {
      const plan = await createWeeklyMealPlan(values);
      setMealPlan(plan);
    } catch (error) {
      toast({
        title: 'Error Generating Plan',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  }
  
  const handleSaveMenu = () => {
    if (mealPlan) {
      const newMenuWithId = { ...mealPlan, id: new Date().toISOString() };
      setSavedMenus([...savedMenus, newMenuWithId]);
      toast({
        title: 'Menu Saved!',
        description: 'Your new meal plan has been saved.',
      });
    }
  };

  const handleGenerateShoppingList = async () => {
    if (!mealPlan) return;
    setIsLoading(true);
    try {
      const mealPlanString = Object.entries(mealPlan.weeklyMealPlan)
        .map(([day, meals]) => `${day}:\n- Breakfast: ${meals.breakfast.name}\n- Lunch: ${meals.lunch.name}\n- Dinner: ${meals.dinner.name}`)
        .join('\n\n');
      
      const result = await generateShoppingList({ mealPlan: mealPlanString });
      const items = result.shoppingList.split('\n').filter(item => item.trim() !== '').map(item => ({
        id: crypto.randomUUID(),
        name: item.replace(/^- /g, '').trim(),
        checked: false,
      }));
      setShoppingList(items);

      toast({
        title: 'Shopping List Generated!',
        description: 'Redirecting you to your new list...',
      });
      router.push('/shopping-list');
    } catch (error) {
       toast({
        title: 'Error Generating List',
        description: 'Could not generate shopping list. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <header>
          <h1 className="font-headline text-4xl font-bold text-primary">Weekly Planner</h1>
          <p className="text-muted-foreground mt-2 text-lg">Plan your meals for the week ahead with AI.</p>
        </header>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline">Your Preferences</CardTitle>
            <CardDescription>Tell us what you like, and we'll create a delicious plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Base Ingredients</FormLabel>
                      <FormControl>
                        <Textarea placeholder="e.g., pasta, ground beef, tomatoes, onions" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dietaryPreferences"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dietary Preferences (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., vegetarian, gluten-free, low-carb" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="numberOfDays"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Days</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="7" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="numberOfPeople"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>People</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="20" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? 'Generating Plan...' : 'Generate Meal Plan'}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <h2 className="font-headline text-3xl font-bold text-primary text-center">Your Meal Plan</h2>
        <Card className="shadow-lg min-h-[400px]">
          <CardHeader>
            <CardTitle className="font-headline">
              <CalendarDays className="inline-block mr-2" />
              Generated Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && !mealPlan && (
              <div className="space-y-4 p-2">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            )}
            {mealPlan && (
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(mealPlan.weeklyMealPlan).map(([day, meals]) => (
                  <AccordionItem value={day} key={day}>
                    <AccordionTrigger className="font-headline text-lg">{day}</AccordionTrigger>
                    <AccordionContent className="space-y-4 pl-4">
                      <div>
                        <h4 className="font-semibold text-accent">Breakfast</h4>
                        <p>{meals.breakfast.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-accent">Lunch</h4>
                        <p>{meals.lunch.name}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-accent">Dinner</h4>
                        <p>{meals.dinner.name}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            )}
            {!isLoading && !mealPlan && (
              <div className="text-center text-muted-foreground py-10">
                <p>Your generated meal plan will be displayed here.</p>
              </div>
            )}
          </CardContent>
          {mealPlan && (
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleSaveMenu} variant="secondary" className="w-full" disabled={isLoading}>
                <BookHeart className="mr-2 h-4 w-4" /> Save Menu
              </Button>
              <Button onClick={handleGenerateShoppingList} className="w-full" disabled={isLoading}>
                <ShoppingCart className="mr-2 h-4 w-4" /> Generate Shopping List
              </Button>
            </CardFooter>
          )}
        </Card>
      </div>
    </div>
  );
}
