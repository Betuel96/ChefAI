// src/components/layout/app-footer.tsx
import Link from 'next/link';

export function AppFooter() {
    return (
        <footer className="mt-12 py-6 border-t bg-background">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} ChefAI. Todos los derechos reservados.</p>
                <nav className="mt-2 space-x-4">
                    <Link href="/policies#terms-of-service" className="hover:text-primary transition-colors">Términos de Servicio</Link>
                    <Link href="/policies#privacy-policy" className="hover:text-primary transition-colors">Política de Privacidad</Link>
                </nav>
            </div>
        </footer>
    );
}
