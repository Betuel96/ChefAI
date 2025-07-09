'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { generateAdminPost, GenerateAdminPostOutput } from '@/ai/flows/generate-admin-post';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Wand2, Loader2, CheckCircle, Link as LinkIcon } from 'lucide-react';

const formSchema = z.object({
  topic: z.string().min(10, 'El tema debe tener al menos 10 caracteres.'),
});

export default function ContentGeneratorPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateAdminPostOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { topic: '' },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsGenerating(true);
    setResult(null);
    try {
      const generatedPost = await generateAdminPost(values);
      setResult(generatedPost);
      toast({
        title: '¡Contenido Generado!',
        description: 'La nueva publicación se ha añadido a la cuenta oficial de ChefAI.',
      });
      form.reset();
    } catch (error: any) {
      toast({
        title: 'Error de Generación',
        description: error.message || 'No se pudo generar el contenido.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAnother = () => {
    setResult(null);
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Generador de Contenido Automático</h1>
        <p className="text-muted-foreground">Crea y publica contenido de alta calidad para la cuenta oficial de ChefAI.</p>
      </header>
      
      <Card>
        <CardHeader>
          <CardTitle>Generar una Nueva Publicación</CardTitle>
          <CardDescription>Describe un tema o idea para una receta, y la IA generará y publicará una receta completa con una imagen.</CardDescription>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-4 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">¡Publicación Creada Exitosamente!</h3>
                <p className="text-muted-foreground">Se ha generado y publicado una nueva receta.</p>
                <div className="flex justify-center gap-4 pt-4">
                    <Button asChild>
                        <Link href={`/post/${result.postId}`} target="_blank">
                            <LinkIcon className="mr-2 h-4 w-4" />
                            Ver Publicación
                        </Link>
                    </Button>
                    <Button variant="outline" onClick={handleGenerateAnother}>
                        Generar Otra
                    </Button>
                </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="topic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tema de la Receta</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Ej: una ensalada de verano refrescante con sandía y queso feta..." {...field} rows={3} disabled={isGenerating} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isGenerating}>
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                  {isGenerating ? 'Generando Contenido...' : 'Generar y Publicar'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
      
      <Alert>
          <Wand2 className="h-4 w-4" />
          <AlertTitle>¿Cómo funciona?</AlertTitle>
          <AlertDescription>
            Esta herramienta utiliza tres modelos de IA: uno para crear una receta detallada basada en tu tema, otro para generar una imagen fotorrealista de la receta, y un tercero para publicarla automáticamente en la cuenta oficial de ChefAI en la comunidad.
          </AlertDescription>
      </Alert>
    </div>
  );
}
