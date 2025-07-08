// src/app/layout.tsx

import { ReactNode } from 'react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';

// This is a top-level root layout. It should not contain any client-side specific logic
// or providers that are already in the [locale] layout. Its main purpose is to provide
// a basic HTML structure and global providers like AuthProvider and Toaster.

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Basic head elements can go here if needed */}
      </head>
      <body className={cn('antialiased bg-background text-foreground')}>
        <AuthProvider>
            <Toaster />
            {children}
        </AuthProvider>
      </body>
    </html>
  );
}
