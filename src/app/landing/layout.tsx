import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'ChefAI - El Futuro de la Cocina Inteligente',
  description: 'Únete a la lista de espera para el lanzamiento en Kickstarter de ChefAI.',
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <div className="font-body antialiased bg-background text-foreground">
          {children}
          <Toaster />
      </div>
  );
}
