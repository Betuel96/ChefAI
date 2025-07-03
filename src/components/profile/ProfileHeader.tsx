// src/components/profile/ProfileHeader.tsx
'use client';

import type { ProfileData } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserCircle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProfileHeader = ({ profile, isFollowing, onFollowToggle, isCurrentUser }: { profile: ProfileData, isFollowing: boolean, onFollowToggle: () => void, isCurrentUser: boolean }) => {
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
