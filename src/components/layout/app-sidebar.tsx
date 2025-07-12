
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useParams } from 'next/navigation';
import {
  ChefHat,
  Home,
  CalendarDays,
  Sparkles,
  LogIn,
  LogOut,
  Users,
  PlusSquare,
  Bell,
  Settings,
  Rocket,
} from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
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
import { UserSearch } from './user-search';
import { useNotifications } from '@/hooks/use-notifications';
import { useFeedStatus } from '@/hooks/use-feed-status';
import LanguageSwitcher from '../i18n/language-switcher';
import type { Locale } from '@/i18n.config';

export function AppSidebar({ dict }: { dict: any }) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as Locale;
  const { isOpen } = useSidebar();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const { unreadCount } = useNotifications();
  const { hasNewPublicPosts, hasNewFollowingPosts } = useFeedStatus();

  const handleLogout = async () => {
    try {
      if (firebaseAuth) {
        await signOut(firebaseAuth);
        toast({
          title: 'Sesión Cerrada',
          description: 'Has cerrado sesión correctamente.',
        });
        router.push(`/${locale}/login`);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo cerrar la sesión. Inténtalo de nuevo.',
        variant: 'destructive',
      });
    }
  };

  const hasNewCommunityPost = hasNewPublicPosts || hasNewFollowingPosts;
  
  const CommunityIndicator = React.useMemo(() => {
    if (!hasNewCommunityPost) return undefined;
    return <div className="h-2 w-2 rounded-full bg-primary" />;
  }, [hasNewCommunityPost]);

  const NotificationIndicator = React.useMemo(() => {
    if (unreadCount === 0) return undefined;
    if (isOpen) {
      return (
        <span className="text-xs font-bold bg-primary text-primary-foreground rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">
          {unreadCount}
        </span>
      );
    }
    return <div className="h-2 w-2 rounded-full bg-primary" />;
  }, [unreadCount, isOpen]);
  
  const getIsActive = (href: string) => {
    // Remove locale from the beginning of the path for comparison
    const currentPathWithoutLocale = pathname.startsWith(`/${locale}`)
      ? pathname.substring(locale.length + 1)
      : pathname;
    
    // Ensure we handle the root path correctly
    if (href === '/dashboard' && (currentPathWithoutLocale === '/dashboard' || currentPathWithoutLocale === '/')) {
      return true;
    }
    if (href !== '/dashboard' && currentPathWithoutLocale.startsWith(href)) {
      return true;
    }
    return false;
  };

  const aiToolsItems = [
    { href: '/generator', label: dict.sidebar.recipe_generator, icon: Sparkles },
    { href: '/planner', label: dict.sidebar.weekly_planner, icon: CalendarDays },
  ];

  const communityItems = [
    { href: '/community', label: dict.sidebar.community, icon: Users, indicator: CommunityIndicator },
    { href: '/publish', label: dict.sidebar.create_post, icon: PlusSquare },
    { href: '/requests', label: dict.sidebar.notifications, icon: Bell, indicator: NotificationIndicator },
  ];
  
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
            <>
              <Link href={`/${locale}/profile/${user.uid}`} className="block w-full px-2">
                  <div className="flex flex-col items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
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
                <div className='py-4'>
                  <UserSearch />
                </div>
                <Separator className="my-2" />
            </>
          )}

          <SidebarMenuItem>
              <Link href={`/${locale}/dashboard`}>
                <SidebarMenuButton isActive={getIsActive('/dashboard')} tooltip={dict.sidebar.dashboard}>
                  <Home />
                  <span>{dict.sidebar.dashboard}</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>

          <SidebarMenuItem>
              <Link href={`/${locale}/landing`} target="_blank">
                <SidebarMenuButton tooltip="Nuestra Misión">
                  <Rocket />
                  <span>Nuestra Misión</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>

          <Separator className="my-2" />
          
          {isOpen && <h3 className="px-4 pt-2 pb-1 text-xs uppercase text-muted-foreground font-semibold tracking-wider">{dict.sidebar.ai_tools}</h3>}
          {aiToolsItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={`/${locale}${item.href}`}>
                <SidebarMenuButton isActive={getIsActive(item.href)} tooltip={item.label}>
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}

          <Separator className="my-2" />

          {isOpen && <h3 className="px-4 pt-2 pb-1 text-xs uppercase text-muted-foreground font-semibold tracking-wider">{dict.sidebar.community}</h3>}
           {communityItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <Link href={`/${locale}${item.href}`}>
                <SidebarMenuButton 
                  isActive={getIsActive(item.href)}
                  tooltip={item.label}
                  indicator={item.indicator}
                >
                  <item.icon />
                  <span>{item.label}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
          
           <Separator className="my-2" />
           <SidebarMenuItem>
              <Link href={`/${locale}/settings`}>
                <SidebarMenuButton isActive={getIsActive('/settings')} tooltip={dict.sidebar.settings}>
                  <Settings />
                  <span>{dict.sidebar.settings}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <LanguageSwitcher />
            </SidebarMenuItem>

         {user ? (
             <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout} tooltip={dict.sidebar.logout}>
                  <LogOut />
                  <span>{dict.sidebar.logout}</span>
                </SidebarMenuButton>
             </SidebarMenuItem>
          ) : !loading ? (
            <SidebarMenuItem>
              <Link href={`/${locale}/login`}>
                <SidebarMenuButton
                  isActive={getIsActive('/login')}
                  tooltip={dict.sidebar.login}
                >
                  <LogIn />
                  <span>{dict.sidebar.login}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ) : null }
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
