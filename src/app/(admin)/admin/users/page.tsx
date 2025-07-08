// src/app/(admin)/admin/users/page.tsx
'use client';
import { useState, useEffect } from 'react';
import type { UserAccount } from '@/types';
import { getAllUsers } from '@/lib/admin';
import { UsersTable } from '@/components/admin/users-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

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
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h1>
        <p className="text-muted-foreground">Visualiza, busca y gestiona todos los usuarios de la plataforma.</p>
      </header>
      <UsersTable data={users} />
    </div>
  );
}
