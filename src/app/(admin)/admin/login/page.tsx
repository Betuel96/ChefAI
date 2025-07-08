// src/app/(admin)/admin/login/page.tsx
'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { isFirebaseConfigured, auth } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/users';
import { checkIsAdmin } from '@/lib/admin';
import { useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-5.02 1.9-4.44 0-8.09-3.64-8.09-8.12s3.65-8.12 8.09-8.12c2.44 0 4.13.92 5.2 1.9l2.5-2.5C18.64.92 15.98 0 12.48 0 5.88 0 0 5.88 0 12.5s5.88 12.5 12.48 12.5c7.34 0 12.04-5.02 12.04-12.24 0-.7-.06-1.3-.18-1.92H12.48z"/>
    </svg>
);

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const unauthorizedError = searchParams.get('error') === 'unauthorized';

  useEffect(() => {
    if (unauthorizedError) {
        toast({
            title: 'Acceso Denegado',
            description: 'No tienes permisos de administrador. Por favor, inicia sesión con una cuenta autorizada.',
            variant: 'destructive'
        })
    }
  }, [unauthorizedError, toast]);

  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) {
        toast({
            title: 'Firebase no está configurado',
            description: 'Por favor, añade tus credenciales de Firebase al archivo .env.',
            variant: 'destructive',
        });
        return;
    }
    try {
      await signInWithGoogle();
      if (!auth?.currentUser) {
          throw new Error('No se pudo autenticar al usuario.');
      }
      const isAdmin = await checkIsAdmin(auth.currentUser.uid);

      if (isAdmin) {
          toast({
            title: '¡Sesión Iniciada!',
            description: 'Bienvenido al panel de administración.',
          });
          router.push('/admin');
      } else {
        await signOut(auth);
        toast({
            title: 'Acceso Denegado',
            description: 'Esta cuenta no tiene privilegios de administrador.',
            variant: 'destructive'
        });
      }
      
    } catch (error: any) {
      toast({
        title: 'Error de inicio de sesión',
        description: error.message || 'No se pudo iniciar sesión con Google.',
        variant: 'destructive',
      });
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-muted">
      <Card className="mx-auto max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Admin ChefAI</CardTitle>
          <CardDescription>
            Inicia sesión con tu cuenta de administrador de Google.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={!isFirebaseConfigured}>
            <GoogleIcon className="mr-2 h-4 w-4"/>
             Continuar con Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
