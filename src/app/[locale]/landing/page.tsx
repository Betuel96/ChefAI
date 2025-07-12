// src/app/[locale]/landing/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { ChefHat, Sparkles, CalendarDays, Mic, HeartHandshake, Zap, BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Locale } from '@/i18n.config';


const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <div className="flex flex-col items-center p-6 text-center bg-background/50 rounded-lg shadow-lg border">
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
    const params = useParams();
    const locale = params.locale as Locale;
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // In a real implementation, this would be sent to an email marketing service.
            console.log('Email submitted:', email);
            toast({
                title: '¡Gracias por unirte a la misión!',
                description: 'Te hemos añadido a la lista de espera. Te notificaremos cuando lancemos la campaña.',
            });
            setEmail('');
        }
    };

    return (
        <div className="bg-background text-foreground">
            <header className="py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-50 border-b">
                 <div className="flex items-center gap-2">
                    {/* Replace this with your actual logo file in the /public folder */}
                    <Image 
                        src="/logo.png" 
                        alt="ChefAI Logo"
                        width={120}
                        height={32}
                        priority
                        data-ai-hint="logo"
                    />
                </div>
                 {hasMounted && locale && (
                    <Button asChild>
                        <Link href={`/${locale}/dashboard`}>Ir al Prototipo</Link>
                    </Button>
                 )}
            </header>

            <main>
                {/* Hero Section */}
                <section className="py-20 px-6 text-center bg-secondary/30">
                    <h2 className="text-4xl md:text-6xl font-bold font-headline text-primary">Inteligencia Artificial para la Vida Real</h2>
                    <p className="mt-4 max-w-3xl mx-auto text-lg md:text-xl text-muted-foreground">
                        ChefAI es nuestro primer paso para crear tecnología que realmente importa. Un asistente de cocina que elimina el estrés para que tú disfrutes de lo esencial: cocinar, comer, vivir.
                    </p>
                    <div className="mt-8 flex justify-center">
                        <Button size="lg" asChild className="text-lg h-14 px-10">
                            <a href="#kickstarter-signup">Apoya Nuestra Misión</a>
                        </Button>
                    </div>
                </section>
                
                 {/* Image/Video Placeholder */}
                <section className="px-6 md:px-12 -mt-16">
                     <div className="relative aspect-video max-w-5xl mx-auto rounded-lg shadow-2xl overflow-hidden bg-muted border-4 border-background">
                        <Image 
                            src="https://placehold.co/1280x720.png" 
                            alt="Una persona cocinando en una cocina moderna con la ayuda de ChefAI"
                            fill
                            className="object-cover"
                            data-ai-hint="modern kitchen cooking"
                         />
                     </div>
                </section>

                {/* Features Section */}
                <section className="py-24 px-6">
                    <div className="text-center mb-12">
                         <h2 className="text-3xl font-bold font-headline">Un Prototipo Funcional y Robusto</h2>
                         <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">ChefAI ya es una herramienta poderosa. Esto es lo que puedes hacer hoy mismo:</p>
                    </div>
                    <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
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
                <section id="kickstarter-signup" className="py-24 px-6 bg-secondary/30">
                    <div className="max-w-3xl mx-auto text-center">
                        <h3 className="text-4xl md:text-5xl font-bold font-headline text-primary">Más Allá de la Cocina</h3>
                        <p className="mt-6 text-muted-foreground text-lg leading-relaxed">
                           ChefAI es mucho más que una app. Es la prueba de que la Inteligencia Artificial puede ser una herramienta empática para resolver problemas cotidianos. El éxito de este proyecto es el combustible que nos permitirá crecer y financiar la investigación y el desarrollo de nuevas tecnologías con impacto social.
                        </p>
                         <div className="mt-10 grid sm:grid-cols-3 gap-8 text-primary">
                            <div className="flex flex-col items-center gap-2">
                                <BrainCircuit className="w-10 h-10" />
                                <span className="font-semibold">Avances en IA</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <HeartHandshake className="w-10 h-10" />
                                <span className="font-semibold">Salud Accesible</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <Zap className="w-10 h-10" />
                                <span className="font-semibold">Energías Limpias</span>
                            </div>
                        </div>
                        <p className="mt-10 text-foreground font-semibold text-xl">
                           Al apoyarnos, no estás comprando una suscripción. Estás invirtiendo en un futuro donde la tecnología nos cuida. Únete a nuestra lista de espera y sé el primero en saber cuándo lanzaremos nuestra campaña.
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
                            <Button type="submit" size="lg" className="h-12 text-base">Quiero Ser Parte del Futuro</Button>
                        </form>
                    </div>
                </section>
            </main>

            <footer className="py-8 px-6 text-center text-sm text-muted-foreground border-t">
                <p>&copy; {new Date().getFullYear()} ChefAI. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
}
