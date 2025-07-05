
// src/app/settings/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getProfileData } from '@/lib/community';
import { resendVerificationEmail, updateProfileSettings, updateNotificationPreferences } from '@/lib/users';
import type { ProfileData, UserAccount } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, Gem, LogIn, Mail, VenetianMask, Terminal, ShieldQuestion, BellRing, Sparkles } from 'lucide-react';

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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPrivacySaving, setIsPrivacySaving] = useState(false);
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);

  if (!user) return null;

  const handleUpgrade = async (priceId: string) => {
    setIsRedirecting(true);
    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, priceId }),
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
    } finally {
        setIsRedirecting(false);
    }
  };

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
    setIsNotificationSaving(true);
    try {
      await updateNotificationPreferences(user.uid, { [key]: value });
      onProfileUpdate({
        notificationSettings: {
          ...profile.notificationSettings,
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
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pt-6">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Información de la Cuenta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                            <Button variant="secondary" size="sm" onClick={handleResend} disabled={isSending}>
                                {isSending ? 'Enviando...' : 'Reenviar'}
                            </Button>
                        )}
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

            <EditProfileForm profile={profile} onProfileUpdate={onProfileUpdate} />

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
                                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID!)} 
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
                                    onClick={() => handleUpgrade(process.env.NEXT_PUBLIC_STRIPE_VOICE_PLUS_PRICE_ID!)}
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
  );
}


export default function SettingsPage() {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
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
    }, [user, authLoading, router]);

    const handleProfileUpdate = (newData: Partial<UserAccount>) => {
        setProfile(prevProfile => {
            if (!prevProfile) return null;
            // Deep merge for nested objects like notificationSettings
            const updatedProfile = {
                ...prevProfile,
                ...newData,
                notificationSettings: {
                    ...prevProfile.notificationSettings,
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
                  <Link href="/login">Acceder / Registrarse</Link>
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
            <Button variant="ghost" onClick={() => router.push(`/profile/${user.uid}`)}>
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
