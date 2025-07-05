'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusSquare, BookHeart, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';

export function BottomNavBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }
  
  const navItems = [
    { href: '/', icon: Home, label: 'Inicio' },
    { href: '/community', icon: Users, label: 'Comunidad' },
    { href: '/publish', icon: PlusSquare, label: 'Crear', isCentral: true },
    { href: '/library', icon: BookHeart, label: 'Librería' },
    { href: `/profile/${user.uid}`, icon: UserCircle, label: 'Perfil' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 z-40 w-full h-16 bg-background border-t border-border sm:hidden">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map((item) => {
          let isActive = pathname.startsWith(item.href);
          if (item.href === '/') {
            isActive = pathname === '/';
          }
          // Make profile link active for /pro page as well, and other profile subpages
          if (item.href.startsWith('/profile') && (pathname.startsWith('/profile/') || pathname.startsWith('/pro'))) {
            isActive = true;
          }
           // Make library link active for all sub-pages that were moved
          if (item.href === '/library' && (pathname.startsWith('/my-recipes') || pathname.startsWith('/my-menus') || pathname.startsWith('/shopping-list') || pathname.startsWith('/saved'))) {
            isActive = true;
          }
          
          if (item.isCentral) {
            return (
              <Link href={item.href} key={item.href} className="flex justify-center items-center">
                <div className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                  <item.icon className="h-7 w-7" />
                  <span className="sr-only">{item.label}</span>
                </div>
              </Link>
            );
          }
          
          return (
            <Link href={item.href} key={item.href} className="inline-flex flex-col items-center justify-center px-1 pt-2 text-center hover:bg-muted/50 group rounded-lg">
              <item.icon className={cn(
                'w-6 h-6 text-muted-foreground group-hover:text-primary',
                isActive && 'text-primary'
              )} />
              <span className={cn(
                "text-[10px] leading-tight text-muted-foreground group-hover:text-primary",
                isActive && 'text-primary'
              )}>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
