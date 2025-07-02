'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { signInWithGoogle } from '@/lib/users';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.62 1.9-5.02 1.9-4.44 0-8.09-3.64-8.09-8.12s3.65-8.12 8.09-8.12c2.44 0 4.13.92 5.2 1.9l2.5-2.5C18.64.92 15.98 0 12.48 0 5.88 0 0 5.88 0 12.5s5.88 12.5 12.48 12.5c7.34 0 12.04-5.02 12.04-12.24 0-.7-.06-1.3-.18-1.92H12.48z"/>
    </svg>
);

const formSchema = z.object({
  email: z.string().email('Por favor, introduce un correo electrónico válido.'),
  password: z.string().min(1, 'La contraseña no puede estar vacía.'),
});

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!isFirebaseConfigured || !auth) {
      toast({
        title: 'Firebase no está configurado',
        description: 'Por favor, añade tus credenciales de Firebase al archivo .env.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, values.email, values.password);
      toast({
        title: '¡Sesión Iniciada!',
        description: 'Bienvenido/a de nuevo.',
      });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      let description = 'Ocurrió un error inesperado. Por favor, inténtalo de nuevo.';
      
      switch (error.code) {
        case 'auth/invalid-credential':
          description = 'El correo electrónico o la contraseña no son correctos.';
          break;
        case 'auth/user-disabled':
          description = 'Este usuario ha sido deshabilitado.';
          break;
        case 'auth/too-many-requests':
          description = 'El acceso a esta cuenta se ha deshabilitado temporalmente debido a demasiados intentos fallidos. Inténtalo más tarde.';
          break;
        default:
          description = 'Ocurrió un error inesperado al iniciar sesión.';
          break;
      }

      toast({
        title: 'Error al Iniciar Sesión',
        description: description,
        variant: 'destructive',
      });
    }
  }

  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) return;
    try {
      await signInWithGoogle();
      toast({
        title: '¡Sesión Iniciada!',
        description: 'Bienvenido/a con tu cuenta de Google.',
      });
      router.push('/');
    } catch (error: any) {
      toast({
        title: 'Error de inicio de sesión',
        description: error.message || 'No se pudo iniciar sesión con Google.',
        variant: 'destructive',
      });
    }
  }
  
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
      <Card className="mx-auto max-w-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Iniciar Sesión</CardTitle>
          <CardDescription>
            Ingresa tus datos para acceder a tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
           {!isFirebaseConfigured && (
            <Alert variant="destructive" className="mb-4">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Configuración Requerida</AlertTitle>
                <AlertDescription>
                    Firebase no está configurado. Por favor, añade tus credenciales en el archivo <code>.env</code> para habilitar el inicio de sesión.
                </AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="nombre@ejemplo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !isFirebaseConfigured}>
                {form.formState.isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>
          </Form>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                    O continúa con
                </span>
            </div>
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={!isFirebaseConfigured}>
            <GoogleIcon className="mr-2 h-4 w-4"/>
             Google
          </Button>

          <div className="mt-4 text-center text-sm">
            ¿No tienes una cuenta?{' '}
            <Link href="/signup" className="underline">
              Regístrate
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
