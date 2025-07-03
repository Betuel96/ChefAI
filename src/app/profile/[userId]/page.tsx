'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { getProfileData, getUserPublishedRecipes, followUser, unfollowUser, getFollowingStatus } from '@/lib/community';
import type { ProfileData, PublishedRecipe } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, UtensilsCrossed, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ProfileHeader = ({ profile, isFollowing, onFollowToggle, isCurrentUser }: { profile: ProfileData, isFollowing: boolean, onFollowToggle: () => void, isCurrentUser: boolean }) => {
    const joinedDate = profile.createdAt ? new Date(profile.createdAt) : null;
      
    return (
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <Avatar className="h-24 w-24 text-6xl">
                <AvatarImage src={profile.photoURL || undefined} />
                <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-2 text-center sm:text-left">
                <h1 className="font-headline text-4xl font-bold">{profile.name}</h1>
                <div className="flex justify-center sm:justify-start gap-6 text-sm text-muted-foreground">
                    <span><span className="font-bold text-foreground">{profile.followersCount}</span> Seguidores</span>
                    <span><span className="font-bold text-foreground">{profile.followingCount}</span> Siguiendo</span>
                </div>
                 {joinedDate && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Se unió en {format(joinedDate, "MMMM 'de' yyyy", { locale: es })}</span>
                    </div>
                )}
            </div>
            {!isCurrentUser && (
                <Button onClick={onFollowToggle} variant={isFollowing ? 'secondary' : 'default'}>
                    {isFollowing ? 'Dejar de Seguir' : 'Seguir'}
                </Button>
            )}
        </div>
    );
};


const RecipeGrid = ({ recipes }: { recipes: PublishedRecipe[] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(recipe => (
                <Card key={recipe.id} className="overflow-hidden">
                    <div className="aspect-square relative">
                         {recipe.imageUrl ? (
                            <Image
                                src={recipe.imageUrl}
                                alt={`Imagen de ${recipe.name}`}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="bg-muted h-full flex items-center justify-center text-muted-foreground">
                                <UtensilsCrossed className="w-10 h-10" />
                            </div>
                        )}
                    </div>
                    <CardContent className="p-4">
                        <p className="font-semibold truncate">{recipe.name}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};


export default function ProfilePage() {
    const { user } = useAuth();
    const params = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [recipes, setRecipes] = useState<PublishedRecipe[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const isCurrentUser = user?.uid === params.userId;

    useEffect(() => {
        if (!params.userId) {
            return;
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const [profileData, publishedRecipes] = await Promise.all([
                    getProfileData(params.userId),
                    getUserPublishedRecipes(params.userId),
                ]);

                if (profileData) {
                    setProfile(profileData);
                    setRecipes(publishedRecipes);
                    if (user && !isCurrentUser) {
                        const followingStatus = await getFollowingStatus(user.uid, params.userId);
                        setIsFollowing(followingStatus);
                    }
                }
            } catch (error) {
                console.error("Error fetching profile page data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [params.userId, user, isCurrentUser]);

    const handleFollowToggle = async () => {
        if (!user || isCurrentUser || !params.userId) return;
        
        try {
            if (isFollowing) {
                await unfollowUser(user.uid, params.userId);
                setProfile(p => p ? {...p, followersCount: p.followersCount - 1} : null);
            } else {
                await followUser(user.uid, params.userId);
                setProfile(p => p ? {...p, followersCount: p.followersCount + 1} : null);
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            console.error("Error toggling follow:", error);
        }
    };


    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2 flex-grow">
                        <Skeleton className="h-10 w-1/2" />
                        <Skeleton className="h-4 w-1/3" />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   {[...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
                </div>
            </div>
        );
    }
    
    if (!profile) {
        return <div className="text-center">Usuario no encontrado.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <ProfileHeader profile={profile} isFollowing={isFollowing} onFollowToggle={handleFollowToggle} isCurrentUser={isCurrentUser} />
            <RecipeGrid recipes={recipes} />
             {recipes.length === 0 && (
                <p className="text-center text-muted-foreground pt-10">Este usuario aún no ha publicado ninguna receta.</p>
            )}
        </div>
    );
}
