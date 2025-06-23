// src/app/pro/page.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { CheckCircle, Gem } from 'lucide-react';

const proFeatures = [
  'Generaciones ilimitadas de recetas',
  'Generaciones ilimitadas de planes de comidas',
  'Guardado ilimitado en la nube',
  'Acceso anticipado a nuevas funciones',
  'Soporte prioritario',
];

export default function ProPage() {
  const [isPremium, setIsPremium] = useLocalStorage<boolean>('isPremium', false);

  const handleUpgrade = () => {
    // En una aplicación real, aquí se iniciaría el proceso de pago con Stripe, etc.
    // Por ahora, simplemente activamos el estado premium.
    setIsPremium(true);
  };

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <Card className="max-w-md w-full shadow-2xl border-2 border-primary/50">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Gem className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">ChefAI Pro</CardTitle>
          <CardDescription className="text-lg">
            Desbloquea todo el potencial de tu asistente de cocina.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ul className="space-y-3">
            {proFeatures.map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
          {isPremium ? (
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
              <p className="font-semibold text-green-700 dark:text-green-300">¡Ya eres un miembro Pro! Gracias por tu apoyo.</p>
            </div>
          ) : (
            <Button onClick={handleUpgrade} className="w-full text-lg py-6">
              ¡Actualizar a Pro Ahora!
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
