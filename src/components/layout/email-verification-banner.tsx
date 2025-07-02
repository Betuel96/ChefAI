// src/components/layout/email-verification-banner.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { VenetianMask, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { resendVerificationEmail } from '@/lib/users';

export function EmailVerificationBanner() {
  const { user, loading } = useAuth();
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

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

  if (loading || !user || user.emailVerified) {
    return null;
  }
  
  // This banner is only for users who signed up with email/password
  const isEmailPasswordUser = user.providerData.some(
    (provider) => provider.providerId === 'password'
  );

  if (!isEmailPasswordUser) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-6">
      <VenetianMask className="h-4 w-4" />
      <AlertTitle>Verifica tu dirección de correo electrónico</AlertTitle>
      <AlertDescription className='flex flex-col md:flex-row md:items-center justify-between gap-4'>
        <span>
            Para acceder a todas las funciones, por favor, haz clic en el enlace que enviamos a <strong>{user.email}</strong>.
        </span>
        <Button
          onClick={handleResend}
          disabled={isSending}
          variant="secondary"
          className="bg-destructive-foreground text-destructive hover:bg-destructive-foreground/90"
          size="sm"
        >
          <Mail className="mr-2 h-4 w-4" />
          {isSending ? 'Enviando...' : 'Reenviar Correo'}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
