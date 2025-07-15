'use client';

import { useLocalStorage } from '@/hooks/use-local-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { X } from 'lucide-react';
import { MyRecipesView } from '@/components/recipes/my-recipes-view';

// Default export for Next.js page compatibility
export default function MyRecipesPage() {
    const [showIntro, setShowIntro] = useLocalStorage('show-my-recipes-intro', true);
    return (
        <div className="max-w-4xl mx-auto space-y-6">
             <header>
                <h1 className="font-headline text-4xl font-bold text-primary">Mis Recetas Guardadas</h1>
                {showIntro && (
                    <Alert className="mt-4 relative pr-8">
                        <AlertDescription>
                          Todas tus recetas favoritas en un solo lugar.
                        </AlertDescription>
                        <button onClick={() => setShowIntro(false)} className="absolute top-1/2 -translate-y-1/2 right-2 p-1 rounded-full hover:bg-muted/50">
                            <X className="h-4 w-4" />
                        </button>
                    </Alert>
                )}
            </header>
            <MyRecipesView />
        </div>
    )
}
