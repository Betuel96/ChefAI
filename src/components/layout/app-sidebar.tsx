'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChefHat,
  Home,
  MenuSquare,
  BookHeart,
  ShoppingCart,
  CalendarDays,
  Sparkles,
  LogIn,
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

const menuItems = [
  { href: '/', label: 'Panel', icon: Home },
  { href: '/generator', label: 'Generador de Recetas', icon: Sparkles },
  { href: '/planner', label: 'Planificador Semanal', icon: CalendarDays },
  { href: '/shopping-list', label: 'Lista de Compras', icon: ShoppingCart },
  { href: '/my-recipes', label: 'Mis Recetas', icon: BookHeart },
  { href: '/my-menus', label: 'Mis Menús', icon: MenuSquare },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useSidebar();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-primary" />
          {isOpen && <h1 className="font-headline text-2xl font-bold">ChefAI</h1>}
        </div>
        <SidebarTrigger />
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={item.href}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          <Separator className="my-2" />
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
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <p className="text-xs text-muted-foreground p-2 text-center">
          © {new Date().getFullYear()} ChefAI
        </p>
      </SidebarFooter>
    </Sidebar>
  );
}
