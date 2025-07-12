// src/app/(admin)/admin/layout.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { checkIsAdmin } from '@/lib/admin';
import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { Loader2, Terminal } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      if (pathname !== '/admin/login') {
        router.push('/admin/login');
      }
      setIsAdmin(false);
      return;
    }

    // This is a safe-guard for the checkIsAdmin call below
    if (user.uid) {
        checkIsAdmin(user.uid)
        .then((isAdminStatus) => {
            setIsAdmin(isAdminStatus);
            if (!isAdminStatus && pathname !== '/admin/login') {
                router.push('/admin/login?error=unauthorized');
            }
        })
        .catch(() => {
            setIsAdmin(false);
            if (pathname !== '/admin/login') {
                router.push('/admin/login?error=unauthorized');
            }
        });
    }
  }, [user, authLoading, router, pathname]);

  const renderContent = () => {
    if (isAdmin === null || authLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (!isAdmin && pathname !== '/admin/login') {
        return (
             <div className="flex h-screen items-center justify-center bg-muted">
                <Alert variant="destructive" className="max-w-md">
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Acceso Denegado</AlertTitle>
                    <AlertDescription>
                        No tienes permiso para acceder a esta área.
                    </AlertDescription>
                     <Button asChild variant="link">
                        <Link href="/admin/login">Ir a la página de inicio de sesión</Link>
                    </Button>
                </Alert>
            </div>
        )
    }

    if (pathname === '/admin/login') {
        return children;
    }
    
    return (
        <div className="flex min-h-screen w-full bg-muted/40">
            <AdminSidebar />
            <div className="flex flex-col gap-4 py-4 pl-14 flex-grow">
                <main className="p-4 px-6">
                    {children}
                </main>
            </div>
        </div>
    );
  };
  
  return (
    <>
      {renderContent()}
    </>
  )
}
