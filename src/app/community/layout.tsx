'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FriendSuggestions } from '@/components/community/friend-suggestions';
import { StoriesBar } from '@/components/community/stories-bar';

export default function CommunityLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <header>
                    <h1 className="font-headline text-4xl font-bold text-primary">Comunidad ChefAI</h1>
                    <p className="text-muted-foreground mt-2 text-lg">Descubre qué están cocinando otros usuarios.</p>
                </header>

                <StoriesBar />
                
                <Tabs value={pathname} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="/community" asChild>
                            <Link href="/community">Para ti</Link>
                        </TabsTrigger>
                        <TabsTrigger value="/community/following" asChild>
                           <Link href="/community/following">Siguiendo</Link>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <main>{children}</main>
            </div>
            <aside className="lg:col-span-1 space-y-8 sticky top-24 hidden lg:block">
                <FriendSuggestions />
            </aside>
        </div>
    );
}
