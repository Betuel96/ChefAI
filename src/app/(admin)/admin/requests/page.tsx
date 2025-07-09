// src/app/(admin)/admin/requests/page.tsx
'use client';
import { useState, useEffect } from 'react';
import type { VerificationRequest } from '@/types';
import { getVerificationRequests } from '@/lib/admin';
import { RequestsTable } from '@/components/admin/requests-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const allRequests = await getVerificationRequests();
        setRequests(allRequests);
      } catch (error) {
        console.error("Error fetching verification requests:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleRequestProcessed = (requestId: string) => {
    setRequests(currentRequests => currentRequests.filter(r => r.id !== requestId));
  };

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Solicitudes de Verificación</h1>
        <p className="text-muted-foreground">Revisa y gestiona las solicitudes de verificación de los usuarios.</p>
      </header>
      <RequestsTable data={requests} onRequestProcessed={handleRequestProcessed} />
    </div>
  );
}
