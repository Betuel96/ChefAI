'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { ChefHat } from 'lucide-react';
import Link from 'next/link';

export const MobileHeader = () => {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 sm:hidden">
      <Link href="/" className="flex items-center gap-2">
        <ChefHat className="w-8 h-8 text-primary" />
        <span className="font-headline text-2xl font-bold">ChefAI</span>
      </Link>
      <SidebarTrigger />
    </header>
  );
};
