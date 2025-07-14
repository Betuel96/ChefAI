
// src/app/[locale]/settings/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getProfileData } from '@/lib/community';
import { resendVerificationEmail, updateProfileSettings, updateNotificationPreferences, submitVerificationRequest } from '@/lib/users';
import type { ProfileData, UserAccount, Locale } from '@/types';
import Link from 'next/link';
import { useRouter, useSearchParams, useParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, Gem, LogIn, Mail, VenetianMask, Terminal, ShieldQuestion, BellRing, Sparkles, Banknote, Loader2, UserCheck, Send } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';


const verificationSchema = z.object({
  reason: z.string().min(20, 'Por favor, proporciona una razón más detallada (mín. 20 caracteres).'),
  link: z.string().url('Por favor, introduce una URL válida (ej. https://ejemplo.com).'),
});

const VerificationCard = ({ profile, onProfileUpdate }: { profile: ProfileData, onProfileUpdate: (newData: Partial<UserAccount>) => void }) => {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const form = useForm<z.infer<typeof verificationSchema>>({
        resolver: zodResolver(verificationSchema),
        defaultValues: { reason: '', link: '' },
    });

    const onSubmit = async (values: z.infer<typeof verificationSchema>) => {
        setIsSubmitting(true);
        try {
            await submitVerificationRequest(profile.id, values);
            toast({
                title: '¡Solicitud Enviada!',
                description: 'Hemos recibido tu solicitud de verificación. La revisaremos pronto.',
            });
            onProfileUpdate({ verificationRequestStatus: 'pending' });
        } catch (error: any) {
            toast({
                title: 'Error al Enviar',
                description: error.message || 'No se pudo enviar tu solicitud. Inténtalo de nuevo.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (profile.isVerified) {
        return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <UserCheck className="text-blue-500"/>
                        Cuenta Verificada
                    </CardTitle>
                </CardHeader>
                 <CardContent>
                    <Alert variant="default" className="border-green-500">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <AlertTitle>¡Felicidades!</AlertTitle>
                        <AlertDescription>
                            Esta cuenta ha sido verificada por el equipo de ChefAI.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (profile.verificationRequestStatus === 'pending') {
         return (
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Solicitud de Verificación</CardTitle>
                </CardHeader>
                <CardContent>
                     <Alert>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <AlertTitle>Solicitud Pendiente</AlertTitle>
                        <AlertDescription>
                           Tu solicitud de verificación está siendo revisada por nuestro equipo. Te notificaremos cuando haya una actualización.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Solicitar Verificación</CardTitle>
                <CardDescription>
                    Si eres una figura pública, marca o chef notable, puedes solicitar la verificación de tu cuenta.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Razón de la solicitud</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Explica por qué tu cuenta debería ser verificada..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="link"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Enlace oficial</FormLabel>
                                    <FormControl>
                                        <Input placeholder="https://tu-sitio-web.com" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        Enlace a tu sitio web, red social principal u otra referencia.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                            {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                        </Button>
                    </form>
                 </Form>
            </CardContent>
        </Card>
    );
};


const proFeatures = [
  'Generaciones ilimitadas de recetas',
  'Generaciones ilimitadas de planes de comidas',
  'Guardado ilimitado en la nube',
  'Acceso anticipado a nuevas funciones',
];

const voicePlusFeatures = [
    'Todo lo incluido en el plan Pro',
    'Asistente de cocina por voz con IA',
    'Generación de imágenes de recetas',
    'Soporte prioritario',
];

const SettingsPageSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pt-6">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-3">
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    </div>
);

const AccountSettings = ({ profile, onProfileUpdate }: { profile: ProfileData, onProfileUpdate: (newData: Partial<UserAccount>) => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const locale = params.locale as Locale;
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);
  const [isConnectingStripe, setIsConnectingStripe] = useState(false);
  
  const [agreementDialog, setAgreementDialog] = useState<{type: 'monetization' | 'subscription', priceId?: string} | null>(null);
  const [isAgreed, setIsAgreed] = useState(false);


  const handleUpgradeClick = (priceId: string) => {
    const placeholderIds = ["your_pro_price_id", "your_voice_plus_id"];
    if (!priceId || placeholderIds.includes(priceId)) {
        toast({
            title: 'Configuración de Stripe Incompleta',
            description: "Para activar las suscripciones, primero debes crear los productos en tu panel de Stripe y luego añadir los 'Price IDs' correspondientes en el archivo apphosting.yaml.",
            variant: 'destructive',
            duration: 9000,
        });
        return;
    }
    setIsAgreed(false);
    setAgreementDialog({ type: 'subscription', priceId });
  };
  
  const proceedWithSubscription = async () => {
    if (!agreementDialog || !agreementDialog.priceId || !user) return;
    
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, priceId: agreementDialog.priceId, locale }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'No se pudo iniciar el proceso de pago.');
      }
      const { url } = await response.json();
      if (url) window.location.href = url;
      else throw new Error('No se recibió la URL de pago.');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'No se pudo redirigir a la página de pago. Inténtalo de nuevo.',
        variant: 'destructive',
      });
      setIsRedirecting(false);
    } finally {
      setAgreementDialog(null);
    }
  };

  const handleCreateConnectAccountClick = () => {
    setIsAgreed(false);
    setAgreementDialog({ type: 'monetization' });
  };
  
  const proceedWithStripeConnection = async () => {
    if (!user) return;
    setIsConnectingStripe(true);
    setAgreementDialog(null);
    try {
        const response = await fetch('/api/create-connect-account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.uid, locale }),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'No se pudo crear la cuenta de Stripe.');
        }
        const { url } = await response.json();
        if (url) {
            window.location.href = url;
        } else {
            throw new Error('No se recibió la URL de Stripe.');
        }
    } catch(error: any) {
        toast({
            title: 'Error de Conexión',
            description: error.message,
            variant: 'destructive',
        });
        setIsConnectingStripe(false);
    }
  }

  const handleResend = async () => {
    setIsSending(true);
    const result = await resendVerificationEmail();
    toast({
      title: result.success ? 'Correo Enviado' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    setIsSending(false);
  };
  
  const handleProfileTypeChange = async (isPrivate: boolean) => {
    if (!user) return;
    const newType = isPrivate ? 'private' : 'public';
    setIsPrivacySaving(true);
    try {
      await updateProfileSettings(user.uid, { profileType: newType });
      onProfileUpdate({ profileType: newType });
      toast({
        title: 'Privacidad actualizada',
        description: `Tu perfil ahora es ${isPrivate ? 'privado' : 'público'}.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error al actualizar',
        description: 'No se pudo cambiar la privacidad de tu perfil.',
        variant: 'destructive',
      });
    } finally {
        setIsPrivacySaving(false);
    }
  };

  const handleNotificationChange = async (key: 'publicFeed' | 'followingFeed', value: boolean) => {
    if (!user) return;
    setIsNotificationSaving(true);
    try {
      const currentSettings = profile.notificationSettings || { publicFeed: true, followingFeed: true };
      await updateNotificationPreferences(user.uid, { [key]: value });
      onProfileUpdate({
        notificationSettings: {
          ...currentSettings,
          [key]: value,
        },
      });
      toast({ title: 'Preferencias guardadas' });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron guardar tus preferencias.', variant: 'destructive' });
    } finally {
      setIsNotificationSaving(false);
    }
  };


  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pt-6">
        <div className="lg:col-span-2 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Monetización</CardTitle>
                    <CardDescription>Recibe propinas por tu contenido.</CardDescription>
                </CardHeader>
                <CardContent>
                    {profile.stripeConnectAccountId ? (
                        profile.canMonetize ? (
                            <Alert variant="default" className="border-green-500">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <AlertTitle>¡Cuenta Conectada!</AlertTitle>
                                <AlertDescription>
                                    Tu cuenta de Stripe está configurada y lista para recibir pagos. Otros usuarios ahora pueden darte propinas.
                                </AlertDescription>
                            </Alert>
                        ) : (
                             <Alert>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <AlertTitle>Configuración Pendiente</AlertTitle>
                                <AlertDescription>
                                    Tu cuenta de Stripe está conectada pero necesita más información. Completa el proceso en Stripe para empezar a monetizar.
                                </AlertDescription>
                                 <Button size="sm" className="w-full mt-4" onClick={handleCreateConnectAccountClick} disabled={isConnectingStripe}>
                                    {isConnectingStripe ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                                    Continuar en Stripe
                                </Button>
                            </Alert>
                        )
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Conecta una cuenta de Stripe para aceptar propinas de $2.00 en tus publicaciones. ChefAI recibe una comisión de $0.50 (25%) por cada propina para mantener la plataforma.</p>
                            <Button className="w-full" onClick={handleCreateConnectAccountClick} disabled={isConnectingStripe}>
                                {isConnectingStripe ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Banknote className="mr-2 h-4 w-4" />}
                                Conectar con Stripe
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            <VerificationCard profile={profile} onProfileUpdate={onProfileUpdate} />

            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Información de la Cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className='flex items-center gap-3 text-sm text-muted-foreground'>
                        <Mail className='w-4 h-4' />
                        <span>{user?.email}</span>
                     </div>
                     <div className='flex items-center justify-between gap-3 text-sm'>
                        <div className='flex items-center gap-3 text-muted-foreground'>
                            {user?.emailVerified ? (
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
                         {!user?.emailVerified && (
                            <Button variant="secondary" size="sm" onClick={handleResend} disabled={isSending}>
                                {isSending ? 'Enviando...' : 'Reenviar'}
                            </Button>
                        )}
                     </div>
                </CardContent>
            </Card>

            <EditProfileForm profile={profile} onProfileUpdate={onProfileUpdate} />

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Privacidad del Perfil</CardTitle>
                    <CardDescription>Controla quién puede ver tu perfil y publicaciones.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <ShieldQuestion className="w-6 h-6" />
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="private-profile-switch">Perfil Privado</Label>
                            <p className="text-xs text-muted-foreground">
                                Si está activado, los usuarios deberán solicitar seguirte.
                            </p>
                        </div>
                        <Switch
                            id="private-profile-switch"
                            checked={profile.profileType === 'private'}
                            onCheckedChange={handleProfileTypeChange}
                            disabled={isPrivacySaving}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">Preferencias de Notificación</CardTitle>
                    <CardDescription>Controla qué indicadores de actividad ves.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4 rounded-md border p-4">
                        <BellRing className="w-6 h-6" />
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="public-feed-switch">Nuevas publicaciones públicas</Label>
                            <p className="text-xs text-muted-foreground">
                                Muestra un indicador para nuevas publicaciones en el feed "Para ti".
                            </p>
                        </div>
                        <Switch
                            id="public-feed-switch"
                            checked={profile.notificationSettings?.publicFeed ?? true}
                            onCheckedChange={(checked) => handleNotificationChange('publicFeed', checked)}
                            disabled={isNotificationSaving}
                        />
                    </div>
                     <div className="flex items-center space-x-4 rounded-md border p-4">
                        <BellRing className="w-6 h-6" />
                        <div className="flex-1 space-y-1">
                            <Label htmlFor="following-feed-switch">Nuevas publicaciones de seguidos</Label>
                            <p className="text-xs text-muted-foreground">
                                Muestra un indicador para nuevas publicaciones en el feed "Siguiendo".
                            </p>
                        </div>
                        <Switch
                            id="following-feed-switch"
                            checked={profile.notificationSettings?.followingFeed ?? true}
                            onCheckedChange={(checked) => handleNotificationChange('followingFeed', checked)}
                            disabled={isNotificationSaving}
                        />
                    </div>
                </CardContent>
            </Card>

        </div>
        <div className="lg:col-span-3">
             <Card className="shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-4">
                        <Gem className="w-10 h-10 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-3xl text-primary">Planes ChefAI</CardTitle>
                    <CardDescription className="text-base">
                        Desbloquea todo el potencial de tu asistente de cocina.
                    </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pro Plan */}
                    <Card className={user?.subscriptionTier === 'pro' ? 'border-2 border-primary' : ''}>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">Pro</CardTitle>
                            <CardDescription>$5 / mes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm">
                                {proFeatures.map((feature) => (
                                <li key={feature} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {user?.subscriptionTier === 'pro' ? (
                                <Button className="w-full" disabled>Suscripción Activa</Button>
                            ) : (
                                <Button 
                                    onClick={() => handleUpgradeClick(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!)} 
                                    className="w-full"
                                    disabled={isRedirecting || !!user?.subscriptionTier}
                                >
                                    Obtener Pro
                                </Button>
                            )}
                        </CardFooter>
                    </Card>

                    {/* Voice+ Plan */}
                    <Card className={user?.subscriptionTier === 'voice+' ? 'border-2 border-primary' : ''}>
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl flex items-center gap-2">
                                Voice+ <Sparkles className="w-5 h-5 text-primary" />
                            </CardTitle>
                            <CardDescription>$15 / mes</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ul className="space-y-3 text-sm">
                                {voicePlusFeatures.map((feature) => (
                                <li key={feature} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <span className="text-muted-foreground">{feature}</span>
                                </li>
                                ))}
                            </ul>
                        </CardContent>
                        <CardFooter>
                            {user?.subscriptionTier === 'voice+' ? (
                                <Button className="w-full" disabled>Suscripción Activa</Button>
                            ) : (
                                <Button 
                                    onClick={() => handleUpgradeClick(process.env.NEXT_PUBLIC_STRIPE_VOICE_PLUS_PRICE_ID!)}
                                    className="w-full"
                                    disabled={isRedirecting || user?.subscriptionTier === 'pro'}
                                >
                                    Obtener Voice+
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </CardContent>
            </Card>
        </div>
      </div>
      
      <AlertDialog open={!!agreementDialog} onOpenChange={() => setAgreementDialog(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Acuerdo de {agreementDialog?.type === 'monetization' ? 'Monetización' : 'Suscripción'}</AlertDialogTitle>
                <AlertDialogDescription>
                    {agreementDialog?.type === 'monetization' 
                        ? 'Al conectar tu cuenta, aceptas las Políticas de Monetización de ChefAI y los Términos de Servicio de Stripe.'
                        : 'Al suscribirte, tu pago se procesará y se renovará automáticamente. Puedes cancelar en cualquier momento.'
                    }
                    <div className="flex items-center space-x-2 mt-4">
                        <Checkbox id="terms-agreement" checked={isAgreed} onCheckedChange={(checked) => setIsAgreed(checked as boolean)} />
                        <Label htmlFor="terms-agreement" className="text-sm font-normal text-muted-foreground">
                            He leído y acepto los <Link href={`/${locale}/policies`} className="underline" target="_blank">términos y políticas</Link> aplicables.
                        </Label>
                    </div>
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                    onClick={agreementDialog?.type === 'monetization' ? proceedWithStripeConnection : proceedWithSubscription} 
                    disabled={!isAgreed || isConnectingStripe || isRedirecting}
                >
                    Aceptar y Continuar
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  );
}


export default function SettingsPage() {
    return (
        <Suspense fallback={<SettingsPageSkeleton />}>
            <SettingsPageContent />
        </Suspense>
    )
}

function SettingsPageContent() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const params = useParams();
    const locale = params.locale as Locale;
    const { toast } = useToast();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (searchParams.get('stripe_connect_return')) {
            toast({
                title: "¡Bienvenido de vuelta!",
                description: "Tu cuenta de Stripe está siendo verificada. Recibirás una notificación cuando esté lista.",
            });
             // Clean up the URL
            router.replace(`/${locale}/settings`, undefined);
        }
    }, [searchParams, router, toast, locale]);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push(`/${locale}/login`);
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const profileData = await getProfileData(user.uid);
                setProfile(profileData);
            } catch (error) {
                console.error("Error fetching settings data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [user, authLoading, router, locale]);

    const handleProfileUpdate = (newData: Partial<UserAccount>) => {
        setProfile(prevProfile => {
            if (!prevProfile) return null;
            // Deep merge for nested objects like notificationSettings
            const updatedProfile = {
                ...prevProfile,
                ...newData,
                notificationSettings: {
                    ...(prevProfile.notificationSettings || { publicFeed: true, followingFeed: true }),
                    ...newData.notificationSettings,
                },
            };
            return updatedProfile as ProfileData;
        });
    };

    if (authLoading || isLoading) {
        return <SettingsPageSkeleton />;
    }

    if (!user) {
      return (
        <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
          <Card className="max-w-md w-full shadow-lg p-8 text-center">
              <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
              <CardTitle className='font-headline text-2xl'>Acceso Denegado</CardTitle>
              <CardDescription className='mt-2 mb-6'>Debes iniciar sesión para acceder a la configuración.</CardDescription>
              <Button asChild>
                  <Link href={`/${locale}/login`}>Acceder / Registrarse</Link>
              </Button>
          </Card>
        </div>
      );
    }
    
    if (!profile) {
        return (
            <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
                <Alert variant="destructive" className="max-w-lg">
                    <Terminal className='h-4 w-4' />
                    <AlertTitle>Error al Cargar Perfil</AlertTitle>
                    <AlertDescription>
                        No pudimos cargar los datos de tu perfil. Por favor, intenta recargar la página.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
         <div className="max-w-4xl mx-auto space-y-8">
            <Button variant="ghost" onClick={() => router.push(`/${locale}/profile/${user.uid}`)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a mi perfil
            </Button>
            <header>
                <h1 className="font-headline text-4xl font-bold text-primary">Configuración de la Cuenta</h1>
                <p className="text-muted-foreground mt-2 text-lg">Gestiona tu perfil, suscripción y datos de la cuenta.</p>
            </header>
            <AccountSettings profile={profile} onProfileUpdate={handleProfileUpdate} />
         </div>
    );
}
