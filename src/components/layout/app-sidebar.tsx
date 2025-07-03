'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChefHat,
  Home,
  MenuSquare,
  BookHeart,
  ShoppingCart,
  CalendarDays,
  Sparkles,
  LogIn,
  LogOut,
  User as UserIcon,
  Users,
  PlusSquare,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '../ui/separator';
import { useAuth } from '@/hooks/use-auth';
import { auth as firebaseAuth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { UserCircle } from 'lucide-react';

const aiToolsItems = [
  { href: '/generator', label: 'Generador de Recetas', icon: Sparkles },
  { href: '/planner', label: 'Planificador Semanal', icon: CalendarDays },
];

const communityItems = [
  { href: '/publish', label: 'Crear Publicación', icon: PlusSquare },
  { href: '/community', label: 'Comunidad', icon: Users },
];

const libraryItems = [
  { href: '/my-recipes', label: 'Mis Recetas', icon: BookHeart },
  { href: '/my-menus', label: 'Mis Menús', icon: MenuSquare },
  { href: '/shopping-list', label: 'Lista de Compras', icon: ShoppingCart },
];


export function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      if (firebaseAuth) {
        await signOut(firebaseAuth);
        toast({
          title: 'Sesión Cerrada',
          description: 'Has cerrado sesión correctamente.',
        });
        router.push('/login');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-primary" />
          {isOpen && <h1 className="font-headline text-2xl font-bold">ChefAI</h1>}
        </div>
        <SidebarTrigger className="hidden sm:flex" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {loading && isOpen && (
            <div className="flex flex-col items-start gap-2 px-2 pb-4 border-b mb-4">
               <Skeleton className="h-10 w-10 rounded-full" />
               <Skeleton className="h-4 w-32" />
               <Skeleton className="h-3 w-40" />
            </div>
          )}
          {user && isOpen && (
             <Link href="/pro" className="block w-full">
                <div className="flex flex-col items-start gap-2 p-2 pb-4 border-b mb-4 hover:bg-muted/50 rounded-md transition-colors">
                  <Avatar>
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback>
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : <UserCircle />}
                      </AvatarFallback>
                    </Avatar>
                  <div className="text-sm font-medium">{user.displayName}</div>
                  <div className="text-xs text-muted-foreground">{user.email}</div>
                </div>
              </Link>
          )}

          <SidebarMenuItem>
              <Link href="/">
                <SidebarMenuButton isActive={pathname === '/'} tooltip="Panel">
                  <Home />
                  <span>Panel</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>

          <Separator className="my-2" />

          {aiToolsItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}

          <Separator className="my-2" />

           {communityItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}

          <Separator className="my-2" />

          {libraryItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton isActive={pathname === item.href} tooltip={item.label}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          
          <Separator className="my-2" />
          
           <SidebarMenuItem>
              <Link href="/pro">
                <SidebarMenuButton isActive={pathname === '/pro'} tooltip="Mi Perfil">
                  <UserIcon />
                  <span>Mi Perfil</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         {user ? (
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip="Cerrar Sesión">
                  <LogOut />
                  <span>Cerrar Sesión</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
          ) : !loading ? (
            <SidebarMenuItem>
              <Link href="/login">
                <SidebarMenuButton
                  isActive={pathname === '/login' || pathname === '/signup'}
                  tooltip="Acceder"
                >
                  <LogIn />
                  <span>Acceder / Registrarse</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ) : null }
      </SidebarFooter>
    </Sidebar>
  );
}
