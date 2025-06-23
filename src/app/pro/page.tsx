// src/app/pro/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle, Gem, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const proFeatures = [
  'Generaciones ilimitadas de recetas',
  'Generaciones ilimitadas de planes de comidas',
  'Guardado ilimitado en la nube',
  'Acceso anticipado a nuevas funciones',
  'Soporte prioritario',
];

export default function ProPage() {
  const { user, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleUpgrade = async () => {
    if (!user) {
      toast({
        title: 'Debes Iniciar Sesión',
        description: 'Por favor, inicia sesión para suscribirte a Pro.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid }),
      });

      if (!response.ok) {
        throw new Error('No se pudo iniciar el proceso de pago.');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No se recibió la URL de pago.');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo redirigir a la página de pago. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsRedirecting(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center p-4">
          <p>Cargando estado de tu cuenta...</p>
        </div>
      );
    }

    if (!user) {
        return (
          <div className="text-center p-4 bg-muted/50 rounded-lg flex flex-col items-center gap-4">
            <LogIn className="w-8 h-8 text-primary" />
            <p className="font-semibold">Inicia sesión para gestionar tu suscripción Pro.</p>
            <Button asChild>
                <Link href="/login">Acceder / Registrarse</Link>
            </Button>
          </div>
        )
    }
    
    if (user.isPremium) {
        return (
            <div className="text-center p-4 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <p className="font-semibold text-green-700 dark:text-green-300">¡Ya eres un miembro Pro! Gracias por tu apoyo.</p>
            </div>
        )
    }

    return (
        <>
            <Button onClick={handleUpgrade} className="w-full text-lg py-6" disabled={isRedirecting}>
                {isRedirecting ? 'Redirigiendo a pago...' : 'Suscribirse a Pro'}
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
                La suscripción se renueva automáticamente. Cancela en cualquier momento.
            </p>
        </>
    )
  }

  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
      <Card className="max-w-md w-full shadow-2xl border-2 border-primary/50">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
            <Gem className="w-10 h-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-4xl text-primary">ChefAI Pro</CardTitle>
          <CardDescription className="text-lg">
            Únete a nuestro plan de suscripción Pro y desbloquea todo el potencial de tu asistente de cocina.
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
          
          <div className="text-center my-4">
            <span className="text-4xl font-bold font-headline">$9.99</span>
            <span className="text-muted-foreground">/mes</span>
          </div>
          
          {renderContent()}

        </CardContent>
      </Card>
    </div>
  );
}