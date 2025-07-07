// src/app/landing/page.tsx
'use client';

import { useState } from 'react';
import { ChefHat, Sparkles, CalendarDays, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-center p-6 text-center bg-background/50 rounded-lg">
        <div className="p-3 mb-4 text-primary bg-primary/10 rounded-full">
            {icon}
        </div>
        <h3 className="text-xl font-bold font-headline">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
    </div>
);


export default function LandingPage() {
    const { toast } = useToast();
    const [email, setEmail] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // En una implementación real, esto se enviaría a un servicio de email marketing.
            console.log('Email submitted:', email);
            toast({
                title: '¡Gracias por tu interés!',
                description: 'Te hemos añadido a la lista de espera. Te notificaremos cuando lancemos.',
            });
            setEmail('');
        }
    };

    return (
        <div className="bg-background text-foreground">
            <header className="py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ChefHat className="w-8 h-8 text-primary" />
                    <h1 className="font-headline text-2xl font-bold">ChefAI</h1>
                </div>
            </header>

            <main>
                {/* Hero Section */}
                <section className="py-20 px-6 text-center bg-secondary/30">
                    <h2 className="text-4xl md:text-6xl font-bold font-headline text-primary">El Futuro de la Cocina Inteligente</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
                        ChefAI es tu asistente de cocina personal. Genera recetas, planifica tus menús semanales y te guía paso a paso con voz. Deja que la IA se encargue de la planificación para que tú disfrutes de la cocina.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Button size="lg" asChild>
                            <a href="#kickstarter-signup">Únete a la Lista de Espera</a>
                        </Button>
                    </div>
                </section>
                
                {/* Image/Video Placeholder */}
                <section className="px-6 md:px-12 -mt-12">
                     <div className="relative aspect-video max-w-4xl mx-auto rounded-lg shadow-2xl overflow-hidden bg-muted">
                        <Image 
                            src="https://placehold.co/1280x720/333333/f7a849?text=ChefAI+Demo" 
                            alt="Demostración de la aplicación ChefAI"
                            layout="fill"
                            objectFit="cover"
                            data-ai-hint="app interface food"
                         />
                     </div>
                </section>

                {/* Features Section */}
                <section className="py-20 px-6">
                    <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={<Sparkles className="w-8 h-8" />}
                            title="Genera Recetas al Instante"
                            description="Convierte los ingredientes que tienes a mano en recetas creativas y deliciosas con un solo clic."
                        />
                        <FeatureCard 
                            icon={<CalendarDays className="w-8 h-8" />}
                            title="Planifica tu Semana"
                            description="Crea planes de comidas semanales personalizados según tus gustos y necesidades dietéticas."
                        />
                        <FeatureCard 
                            icon={<Mic className="w-8 h-8" />}
                            title="Cocina con Asistencia de Voz"
                            description="Sigue las instrucciones paso a paso sin tocar la pantalla. Tu asistente de IA te guía en tiempo real."
                        />
                    </div>
                </section>

                {/* Kickstarter Signup Section */}
                <section id="kickstarter-signup" className="py-20 px-6 bg-secondary/30">
                    <div className="max-w-xl mx-auto text-center">
                        <h3 className="text-3xl md:text-4xl font-bold font-headline">¡Sé parte de nuestra historia!</h3>
                        <p className="mt-4 text-muted-foreground text-lg">
                           Estamos preparando nuestro lanzamiento en Kickstarter para llevar ChefAI al siguiente nivel. Únete a nuestra lista de correo para ser el primero en saberlo y tener acceso a recompensas exclusivas para los primeros patrocinadores.
                        </p>
                        <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
                            <Input 
                                type="email"
                                placeholder="Tu correo electrónico"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="h-12 text-base"
                            />
                            <Button type="submit" size="lg" className="h-12">Notifícame</Button>
                        </form>
                    </div>
                </section>
            </main>

            <footer className="py-6 px-6 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} ChefAI. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}