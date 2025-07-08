'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, PlusSquare, BookHeart, UserCircle, PenSquare, Sparkles, CalendarDays } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { buttonVariants } from '@/components/ui/button';

export function BottomNavBar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }
  
  const removeLocaleFromPath = (path: string) => {
    const segments = path.split('/');
    if (segments.length > 2 && /^[a-z]{2}(-[A-Z]{2})?$/.test(segments[1])) {
        return `/${segments.slice(2).join('/')}`;
    }
    return path;
  }
  const currentRoute = removeLocaleFromPath(pathname);

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
          let isActive = false;
          if (item.href === '/') {
            isActive = currentRoute === '/';
          } else if (item.href.startsWith('/profile')) {
             isActive = currentRoute.startsWith('/profile') || currentRoute.startsWith('/pro');
          } else if (item.href === '/library') {
             isActive = currentRoute.startsWith('/library') || currentRoute.startsWith('/my-recipes') || currentRoute.startsWith('/my-menus') || currentRoute.startsWith('/shopping-list') || currentRoute.startsWith('/saved');
          } else {
             isActive = currentRoute.startsWith(item.href);
          }
          
          if (item.isCentral) {
            return (
              <Sheet key="create-sheet">
                <SheetTrigger asChild>
                  <div className="flex justify-center items-center cursor-pointer">
                    <div className="flex items-center justify-center w-14 h-14 -mt-6 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors">
                      <item.icon className="h-7 w-7" />
                      <span className="sr-only">{item.label}</span>
                    </div>
                  </div>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-lg">
                  <SheetHeader>
                    <SheetTitle className="font-headline text-center text-2xl">Crear</SheetTitle>
                  </SheetHeader>
                  <div className="grid grid-cols-1 gap-4 py-4">
                    <SheetClose asChild>
                      <Link href="/publish" className={cn(buttonVariants({ variant: "outline" }), "justify-start h-16 text-base")}>
                        <PenSquare className="mr-4 h-6 w-6 text-primary" /> Crear Publicación
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                       <Link href="/generator" className={cn(buttonVariants({ variant: "outline" }), "justify-start h-16 text-base")}>
                        <Sparkles className="mr-4 h-6 w-6 text-primary" /> Generar Receta con IA
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                       <Link href="/planner" className={cn(buttonVariants({ variant: "outline" }), "justify-start h-16 text-base")}>
                        <CalendarDays className="mr-4 h-6 w-6 text-primary" /> Planificador Semanal con IA
                      </Link>
                    </SheetClose>
                  </div>
                </SheetContent>
              </Sheet>
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
