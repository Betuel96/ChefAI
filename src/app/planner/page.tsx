'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion } from '@/components/ui/accordion';
import { CalendarDays, Sparkles, Terminal } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  dietaryPreferences: z.string().optional(),
  numberOfDays: z.coerce.number().int().min(1).max(7),
  numberOfPeople: z.coerce.number().int().min(1).max(20),
});

export default function MealPlannerPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      dietaryPreferences: '',
      numberOfDays: 7,
      numberOfPeople: 2,
    },
  });

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <header>
            <h1 className="font-headline text-4xl font-bold text-primary">Planificador Semanal</h1>
            <p className="text-muted-foreground mt-2 text-lg">Planifica tus comidas para la semana con IA.</p>
          </header>

          <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle>Función de IA en Pausa</AlertTitle>
            <AlertDescription>
              Para permitir el desarrollo en el plan gratuito de Firebase, las funciones de generación por IA están temporalmente desactivadas. Se reactivarán una vez que el proyecto se actualice al plan de pago.
            </AlertDescription>
          </Alert>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline">Tus Preferencias</CardTitle>
              <CardDescription>Dinos qué te gusta y crearemos un plan delicioso.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="ingredients"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ingredientes Base</FormLabel>
                        <FormControl>
                          <Textarea placeholder="ej., pasta, carne molida, tomates, cebollas" {...field} disabled />
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
                        <FormLabel>Preferencias Dietéticas (opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="ej., vegetariano, sin gluten, bajo en carbohidratos" {...field} disabled />
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
                          <FormLabel>Días</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="7" {...field} disabled />
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
                          <FormLabel>Personas</FormLabel>
                          <FormControl>
                            <Input type="number" min="1" max="20" {...field} disabled />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <Button type="submit" disabled className="w-full">
                    Generación Desactivada
                    <Sparkles className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <h2 className="font-headline text-3xl font-bold text-primary text-center">Tu Plan de Comidas</h2>
          <Card className="shadow-lg min-h-[400px]">
            <CardHeader>
              <CardTitle className="font-headline">
                <CalendarDays className="inline-block mr-2" />
                Plan Generado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-10">
                <p>Las funciones de generación de planes por IA están actualmente en pausa.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
