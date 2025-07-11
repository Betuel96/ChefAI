
'use client';

import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { NotificationProvider } from '@/hooks/use-notifications';
import { FeedStatusProvider } from '@/hooks/use-feed-status';
import { AppFooter } from '@/components/layout/app-footer';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar';
import { getDictionary } from '@/lib/get-dictionary';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';


export default function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const [dict, setDict] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    getDictionary(params.locale as any).then(setDict);
  }, [params.locale]);

  // If the path is for the landing page, return only the children without the main app layout.
  if (pathname === `/${params.locale}/landing`) {
    return <>{children}</>;
  }

  if (!dict) {
    return (
        <div className="flex items-center justify-center h-screen">
            <Loader2 className="w-8 h-8 animate-spin" />
        </div>
    )
  }

  return (
    <NotificationProvider>
      <FeedStatusProvider>
        <SidebarProvider>
          <AppSidebar dict={dict} />
          <MobileHeader />
          <SidebarInset>
            <div className="flex flex-col min-h-screen">
              <main className="flex-grow p-4 sm:p-6 lg:p-8 pb-24 sm:pb-6">{children}</main>
              <AppFooter />
            </div>
          </SidebarInset>
          <BottomNavBar />
        </SidebarProvider>
      </FeedStatusProvider>
    </NotificationProvider>
  );
}
