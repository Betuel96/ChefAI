// src/app/pro/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getProfileData, getUserPublishedPosts } from '@/lib/community';
import { resendVerificationEmail } from '@/lib/users';
import type { ProfileData, PublishedPost } from '@/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostGrid } from '@/components/profile/PostGrid';

import Link from 'next/link';
import { CheckCircle, Gem, LogIn, Mail, VenetianMask, Settings } from 'lucide-react';

const proFeatures = [
  'Generaciones ilimitadas de recetas',
  'Generaciones ilimitadas de planes de comidas',
  'Guardado ilimitado en la nube',
  'Acceso anticipado a nuevas funciones',
  'Soporte prioritario',
  'Sin anuncios',
];

const AccountSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isSending, setIsSending] = useState(false);

  if (!user) return null;

  const handleUpgrade = async () => {
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
      if (url) window.location.href = url;
      else throw new Error('No se recibió la URL de pago.');
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
    toast({
      title: result.success ? 'Correo Enviado' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
    setIsSending(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pt-6">
        <div className="lg:col-span-2 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle className='font-headline'>Información del Perfil</CardTitle>
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
                            checked={!!user.isPremium}
                            onCheckedChange={(checked) => {
                                if (checked && !user.isPremium) handleUpgrade();
                            }}
                            disabled={!!user.isPremium || isRedirecting}
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
  );
}

const MyProfilePageSkeleton = () => (
     <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
            <div className="space-y-3 flex-grow text-center sm:text-left">
                <Skeleton className="h-10 w-1/2 mx-auto sm:mx-0" />
                <Skeleton className="h-5 w-1/3 mx-auto sm:mx-0" />
                <div className="flex justify-center sm:justify-start gap-6">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-1/4 mx-auto sm:mx-0" />
            </div>
        </div>
         <Skeleton className="h-px w-full" />
         <Skeleton className="aspect-square w-full" />
    </div>
);

export default function MyProfilePage() {
  const { user, loading: authLoading } = useAuth();
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
        setIsLoading(true);
        try {
             const [profileData, publishedPosts] = await Promise.all([
                getProfileData(user.uid),
                getUserPublishedPosts(user.uid),
            ]);
            setProfile(profileData);
            setPosts(publishedPosts);
        } catch (error) {
             console.error("Error fetching my profile data:", error);
        } finally {
             setIsLoading(false);
        }
    };

    fetchData();
  }, [user, authLoading]);


  if (authLoading || isLoading) {
    return <MyProfilePageSkeleton />;
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-8rem)]">
        <Card className="max-w-md w-full shadow-lg p-8 text-center">
            <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
            <CardTitle className='font-headline text-2xl'>Inicia sesión para ver tu perfil</CardTitle>
            <CardDescription className='mt-2 mb-6'>No has iniciado sesión. Accede a tu cuenta para ver tu perfil y gestionar tu cuenta.</CardDescription>
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
            Cargando perfil...
        </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <ProfileHeader profile={profile} isFollowing={false} onFollowToggle={() => {}} isCurrentUser={true} />

      <Separator />

      <h2 className="font-headline text-2xl font-bold text-center">Mis Publicaciones</h2>
      <PostGrid posts={posts} />

      <Separator />

      <div className="space-y-4">
        <h2 className="font-headline text-2xl font-bold text-center flex items-center justify-center gap-2">
            <Settings className="h-6 w-6" />
            Configuración de la Cuenta
        </h2>
        <AccountSettings />
      </div>
    </div>
  );
}
