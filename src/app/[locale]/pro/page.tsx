'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import type { Locale } from '@/i18n.config';

const LoadingSkeleton = () => (
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

export default function MyProfileRedirectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;

  useEffect(() => {
    if (loading) {
      // Esperar hasta que se resuelva el estado de autenticación
      return;
    }

    if (user?.uid) {
      router.replace(`/${locale}/profile/${user.uid}`);
    } else {
      // Si no se ha iniciado sesión después de comprobar, redirigir al inicio de sesión
      router.replace(`/${locale}/login`);
    }
  }, [user, loading, router, locale]);

  // Mostrar un esqueleto de carga mientras se redirige para proporcionar una transición suave
  return <LoadingSkeleton />;
}
