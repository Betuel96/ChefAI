'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getPublishedRecipes } from '@/lib/community';
import type { PublishedRecipe } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UtensilsCrossed, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const RecipePostCard = ({ recipe }: { recipe: PublishedRecipe }) => {
    const timeAgo = recipe.createdAt ? formatDistanceToNow(recipe.createdAt.toDate(), { addSuffix: true, locale: es }) : '';
    
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <Link href={`/profile/${recipe.publisherId}`}>
                        <Avatar className="cursor-pointer">
                            <AvatarImage src={recipe.publisherPhotoURL || undefined} />
                            <AvatarFallback><UserCircle /></AvatarFallback>
                        </Avatar>
                    </Link>
                    <div>
                        <Link href={`/profile/${recipe.publisherId}`}>
                            <p className="font-semibold cursor-pointer hover:underline">{recipe.publisherName}</p>
                        </Link>
                        <p className="text-xs text-muted-foreground">{timeAgo}</p>
                    </div>
                </div>
            </CardHeader>
            {recipe.imageUrl ? (
                <div className="aspect-video relative overflow-hidden">
                    <Image
                        src={recipe.imageUrl}
                        alt={`Imagen de ${recipe.name}`}
                        fill
                        className="object-cover"
                    />
                </div>
            ) : (
                <div className="aspect-video bg-muted flex items-center justify-center text-muted-foreground">
                    <UtensilsCrossed className="w-12 h-12" />
                </div>
            )}
            <CardContent className="pt-4">
                <CardTitle className="font-headline text-2xl">{recipe.name}</CardTitle>
            </CardContent>
            <CardFooter>
                {/* Like, comment, save buttons can go here later */}
            </CardFooter>
        </Card>
    );
};

export default function CommunityPage() {
    const [recipes, setRecipes] = useState<PublishedRecipe[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRecipes = async () => {
            setIsLoading(true);
            try {
                const fetchedRecipes = await getPublishedRecipes();
                setRecipes(fetchedRecipes);
            } catch (error) {
                console.error("Error fetching published recipes:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchRecipes();
    }, []);

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <header>
                <h1 className="font-headline text-4xl font-bold text-primary">Comunidad ChefAI</h1>
                <p className="text-muted-foreground mt-2 text-lg">Descubre qué están cocinando otros usuarios.</p>
            </header>

            {isLoading ? (
                <div className="space-y-8">
                    {[...Array(3)].map((_, i) => (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </CardHeader>
                            <Skeleton className="aspect-video w-full" />
                            <CardContent className="pt-4">
                                <Skeleton className="h-7 w-3/4" />
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="space-y-8">
                    {recipes.length > 0 ? (
                        recipes.map(recipe => <RecipePostCard key={recipe.id} recipe={recipe} />)
                    ) : (
                        <div className="text-center text-muted-foreground py-10">
                            <p className="font-semibold">¡La comunidad está tranquila!</p>
                            <p>Sé el primero en publicar una receta desde el Generador.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
