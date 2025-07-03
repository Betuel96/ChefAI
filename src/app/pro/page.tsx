// src/app/pro/page.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { CheckCircle, Gem, LogIn, UserCircle, Mail, VenetianMask } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { resendVerificationEmail } from '@/lib/users';

const proFeatures = [
  'Generaciones ilimitadas de recetas',
  'Generaciones ilimitadas de planes de comidas',
  'Guardado ilimitado en la nube',
  'Acceso anticipado a nuevas funciones',
  'Soporte prioritario',
  'Sin anuncios',
];


export default function ProPage() {
  const { user, loading } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo iniciar el proceso de pago.');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No se recibió la URL de pago.');
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo redirigir a la página de pago. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsRedirecting(false);
    }
  };
  
  const handleResend = async () => {
    setIsSending(true);
    const result = await resendVerificationEmail();
    if (result.success) {
      toast({
        title: 'Correo Enviado',
        description: result.message,
      });
    } else {
      toast({
        title: 'Error',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsSending(false);
  };


  if (loading) {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header>
                <Skeleton className="h-10 w-1/2" />
                <Skeleton className="h-4 w-1/3 mt-2" />
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2">
                    <Skeleton className="h-48 w-full" />
                </div>
                <div className="lg:col-span-3">
                    <Skeleton className="h-72 w-full" />
                </div>
            </div>
        </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Card className="max-w-md w-full shadow-lg p-8 text-center">
            <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className='font-headline text-2xl'>Inicia sesión para ver tu cuenta</CardTitle>
            <CardDescription className='mt-2 mb-6'>No has iniciado sesión. Accede a tu cuenta para gestionar tu suscripción y ver tu perfil.</CardDescription>
            <Button asChild>
                <Link href="/login">Acceder / Registrarse</Link>
            </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <header>
        <h1 className="font-headline text-4xl font-bold text-primary">Mi Cuenta</h1>
        <p className="text-muted-foreground mt-2 text-lg">Gestiona tu información personal y tu suscripción.</p>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Información del Perfil</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Avatar className="h-16 w-16 text-3xl">
                            <AvatarImage src={user.photoURL || undefined} />
                            <AvatarFallback>
                                <UserCircle />
                            </AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-bold text-lg">{user.displayName}</p>
                            <p className="text-sm text-muted-foreground">{user.isPremium ? 'Miembro Pro' : 'Plan Gratuito'}</p>
                        </div>
                    </div>
                     <Separator />
                     <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                        <Mail className='w-4 h-4' />
                        <span>{user.email}</span>
                     </div>
                     <div className='flex items-center justify-between gap-3 text-sm'>
                        <div className='flex items-center gap-3 text-muted-foreground'>
                            {user.emailVerified ? (
                                <>
                                    <CheckCircle className='w-4 h-4 text-green-500' />
                                    <span>Correo verificado</span>
                                </>
                            ) : (
                                <>
                                    <VenetianMask className='w-4 h-4 text-destructive' />
                                    <span>Correo no verificado</span>
                                </>
                            )}
                        </div>
                         {!user.emailVerified && (
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleResend}
                                disabled={isSending}
                            >
                                {isSending ? 'Enviando...' : 'Verificar'}
                            </Button>
                        )}
                     </div>
                </CardContent>
            </Card>
        </div>
        <div className="lg:col-span-3">
             <Card className="shadow-lg border-2 border-primary/50">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <Gem className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl text-primary">ChefAI Pro</CardTitle>
                    <CardDescription className="text-base">
                        Desbloquea todo el potencial de tu asistente de cocina.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
                        <div>
                            <p className="font-bold">{user.isPremium ? 'Suscripción a Pro Activa' : 'Activar ChefAI Pro'}</p>
                            <p className="text-xs text-muted-foreground">{user.isPremium ? '¡Gracias por tu apoyo!' : 'Desbloquea funciones ilimitadas.'}</p>
                        </div>
                        <Switch
                            checked={user.isPremium}
                            onCheckedChange={(checked) => {
                                if (checked && !user.isPremium) {
                                    handleUpgrade();
                                }
                            }}
                            disabled={user.isPremium || isRedirecting}
                            aria-readonly
                        />
                    </div>
                    
                    <ul className="space-y-3 text-sm">
                        {proFeatures.map((feature) => (
                        <li key={feature} className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                        </li>
                        ))}
                    </ul>
                    
                    {!user.isPremium && (
                        <>
                            <Button onClick={handleUpgrade} className="w-full text-lg py-6" disabled={isRedirecting}>
                                {isRedirecting ? 'Redirigiendo a pago...' : 'Obtener ChefAI Pro'}
                            </Button>
                            <p className="text-xs text-muted-foreground text-center mt-2">
                                La suscripción se renueva automáticamente. Cancela en cualquier momento.
                            </p>
                        </>
                    )}

                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
