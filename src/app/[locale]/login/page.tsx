
'use client';
import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isFirebaseConfigured } from '@/lib/firebase';
import { signInWithGoogle, registerWithEmailAndPassword } from '@/lib/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Locale } from '@/i18n.config';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-5.02 1.9-4.44 0-8.09-3.64-8.09-8.12s3.65-8.12 8.09-8.12c2.44 0 4.13.92 5.2 1.9l2.5-2.5C18.64.92 15.98 0 12.48 0 5.88 0 0 5.88 0 12.5s5.88 12.5 12.48 12.5c7.34 0 12.04-5.02 12.04-12.24 0-.7-.06-1.3-.18-1.92H12.48z"/>
    </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;
  const { toast } = useToast();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) {
        toast({
            title: 'Firebase no está configurado',
            description: 'Por favor, añade tus credenciales de Firebase al archivo .env.',
            variant: 'destructive',
        });
        return;
    }
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      toast({
        title: '¡Sesión Iniciada!',
        description: 'Bienvenido/a a ChefAI.',
      });
      router.push(`/${locale}/dashboard`);
    } catch (error: any) {
      if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.log('El usuario cerró el popup de inicio de sesión.');
      } else {
         toast({
          title: 'Error de inicio de sesión',
          description: error.message || 'No se pudo iniciar sesión con Google.',
          variant: 'destructive',
        });
      }
    } finally {
        setIsSigningIn(false);
    }
  }

  async function handleEmailRegister(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) {
        toast({ title: "Por favor, completa todos los campos.", variant: 'destructive' });
        return;
    }
    setIsSigningIn(true);
    try {
        await registerWithEmailAndPassword(email, password, name);
        toast({
            title: '¡Registro Exitoso!',
            description: 'Te hemos enviado un correo de verificación. Por favor, revisa tu bandeja de entrada.'
        });
        router.push(`/${locale}/dashboard`);
    } catch (error: any) {
        toast({
            title: 'Error de Registro',
            description: error.message || 'No se pudo crear la cuenta.',
            variant: 'destructive'
        });
    } finally {
        setIsSigningIn(false);
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="mx-auto max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Acceder o Registrarse</CardTitle>
          <CardDescription>
            Usa tu cuenta de Google o regístrate con tu correo electrónico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleGoogleSignIn} 
                disabled={!isFirebaseConfigured || isSigningIn}
              >
                {isSigningIn ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <GoogleIcon className="mr-2 h-4 w-4"/>
                )}
                 Continuar con Google
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">O regístrate con correo</span>
                </div>
              </div>

              <form onSubmit={handleEmailRegister} className="space-y-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" type="text" placeholder="Tu nombre completo" value={name} onChange={e => setName(e.target.value)} required disabled={isSigningIn} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <Input id="email" type="email" placeholder="tu@ejemplo.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={isSigningIn} />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} disabled={isSigningIn} />
                </div>
                 <Button type="submit" className="w-full" disabled={isSigningIn}>
                    {isSigningIn ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Crear Cuenta
                </Button>
              </form>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
