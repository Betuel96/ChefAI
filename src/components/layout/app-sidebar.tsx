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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

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

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <ChefHat className="w-8 h-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold">ChefAI</h1>
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
