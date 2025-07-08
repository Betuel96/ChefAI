
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '../globals.css';
import { cn } from '@/lib/utils';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/hooks/use-auth';
import { MobileHeader } from '@/components/layout/mobile-header';
import { NotificationProvider } from '@/hooks/use-notifications';
import { FeedStatusProvider } from '@/hooks/use-feed-status';
import { AppFooter } from '@/components/layout/app-footer';
import { BottomNavBar } from '@/components/layout/bottom-nav-bar';
import { i18n } from '@/i18n.config';
import { getDictionary } from '@/lib/get-dictionary';


const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export async function generateStaticParams() {
  return i18n.locales.map(locale => ({ locale }));
}

export const metadata: Metadata = {
  title: 'ChefAI',
  description: 'Tu asistente de cocina personal con IA',
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const dict = await getDictionary(params.locale as any);
  return (
    <html lang={params.locale} suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#F7A849" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Alegreya:ital,wght@0,400..900;1,400..900&family=Belleza&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased', inter.variable)}>
        <AuthProvider>
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
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
