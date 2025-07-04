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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Sparkles, Terminal } from 'lucide-react';

const formSchema = z.object({
  ingredients: z.string().min(10, 'Por favor, enumera al menos algunos ingredientes.'),
  servings: z.coerce.number().int().min(1, 'Debe servir al menos para 1 persona.').max(20, 'No puede servir para más de 20 personas.'),
});

export default function RecipeGeneratorPage() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ingredients: '',
      servings: 2,
    },
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-6">
        <header>
          <h1 className="font-headline text-4xl font-bold text-primary">Generador de Recetas</h1>
          <p className="text-muted-foreground mt-2 text-lg">¡Convierte tus ingredientes en una comida deliciosa!</p>
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
            <CardTitle className="font-headline">Tus Ingredientes</CardTitle>
            <CardDescription>Ingresa lo que tienes y crearemos una receta para ti.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <FormField
                  control={form.control}
                  name="ingredients"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ingredientes Disponibles</FormLabel>
                      <FormControl>
                        <Textarea placeholder="ej., pechuga de pollo, arroz, brócoli, salsa de soja" {...field} rows={4} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="servings"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Porciones</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="20" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
        <h2 className="font-headline text-3xl font-bold text-primary text-center">Receta Generada</h2>
        <Card className="shadow-lg min-h-[400px]">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Tu receta aparecerá aquí</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-muted-foreground py-10">
              <p>Las funciones de generación de recetas por IA están actualmente en pausa.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
