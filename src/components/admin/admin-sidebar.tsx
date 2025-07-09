// src/components/admin/admin-sidebar.tsx
'use client';

import Link from "next/link"
import { usePathname } from 'next/navigation'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import { ChefHat, Home, Users, Newspaper, LogOut } from 'lucide-react'
import { signOut } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRouter } from 'next/navigation'
import { useToast } from "@/hooks/use-toast";

const navItems = [
    { href: "/admin", icon: Home, label: "Panel Principal" },
    { href: "/admin/users", icon: Users, label: "Usuarios" },
    { href: "/admin/content", icon: Newspaper, label: "Contenido" },
]

export function AdminSidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: 'Sesión de administrador cerrada.'});
            router.push('/admin/login');
        } catch (error) {
            toast({ title: 'Error al cerrar sesión', variant: 'destructive'});
        }
    }

    return (
        <aside className="fixed inset-y-0 left-0 z-10 flex w-14 flex-col border-r bg-background">
            <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
                <Link
                    href="#"
                    className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
                >
                    <ChefHat className="h-4 w-4 transition-all group-hover:scale-110" />
                    <span className="sr-only">ChefAI Admin</span>
                </Link>
                <TooltipProvider>
                    {navItems.map(item => (
                        <Tooltip key={item.label}>
                            <TooltipTrigger asChild>
                                <Link
                                    href={item.href}
                                    className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors md:h-8 md:w-8 ${
                                        pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin')
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="sr-only">{item.label}</span>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">{item.label}</TooltipContent>
                        </Tooltip>
                    ))}
                </TooltipProvider>
            </nav>
            <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <button
                                onClick={handleLogout}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                            >
                                <LogOut className="h-5 w-5" />
                                <span className="sr-only">Cerrar Sesión</span>
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="right">Cerrar Sesión</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </nav>
        </aside>
    )
}
