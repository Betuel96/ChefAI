
import type { Metadata } from 'next';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { MobileHeader } from '@/components/layout/mobile-header';
import { NotificationProvider } from '@/hooks/use-notifications';
import { FeedStatusProvider } from '@/hooks/use-feed-status';
import { AppFooter } from '@/components/layout/app-footer';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar';
import { i18n } from '@/i18n.config';
import { getDictionary } from '@/lib/get-dictionary';


export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: 'ChefAI',
  description: 'Tu asistente de cocina personal con IA',
};

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const dict = await getDictionary(params.locale as any);
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
