// src/components/community/friend-suggestions.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { getFriendSuggestions, followUser, unfollowUser, getFollowingStatus } from '@/lib/community';
import type { ProfileListItem } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, UserPlus, Users } from 'lucide-react';

const SuggestionItem = ({ suggestion, currentUserId }: { suggestion: ProfileListItem, currentUserId: string }) => {
    const [isFollowing, setIsFollowing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getFollowingStatus(currentUserId, suggestion.id).then(status => {
            setIsFollowing(status);
            setIsLoading(false);
        });
    }, [currentUserId, suggestion.id]);

    const handleFollowToggle = async (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsLoading(true);
        try {
            if (isFollowing) {
                await unfollowUser(currentUserId, suggestion.id);
            } else {
                await followUser(currentUserId, suggestion.id);
            }
            setIsFollowing(!isFollowing);
        } catch (error) {
            console.error("Failed to toggle follow", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-between gap-3">
            <Link href={`/profile/${suggestion.id}`} className="flex items-center gap-3 flex-grow min-w-0">
                <Avatar>
                    <AvatarImage src={suggestion.photoURL || undefined} />
                    <AvatarFallback><UserCircle /></AvatarFallback>
                </Avatar>
                <div className="truncate">
                    <p className="font-semibold text-sm truncate">{suggestion.name}</p>
                </div>
            </Link>
            <Button size="sm" variant={isFollowing ? 'secondary' : 'outline'} onClick={handleFollowToggle} disabled={isLoading}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isFollowing ? 'Siguiendo' : 'Seguir'}
            </Button>
        </div>
    )
}

export const FriendSuggestions = () => {
    const { user } = useAuth();
    const [suggestions, setSuggestions] = useState<ProfileListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            setIsLoading(true);
            getFriendSuggestions(user.uid)
                .then(setSuggestions)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [user]);

    if (!user || (!isLoading && suggestions.length === 0)) {
        return null;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-xl flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    A quién seguir
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    [...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-9 w-24 rounded-md" />
                        </div>
                    ))
                ) : (
                    suggestions.map(suggestion => <SuggestionItem key={suggestion.id} suggestion={suggestion} currentUserId={user.uid} />)
                )}
            </CardContent>
        </Card>
    );
};
