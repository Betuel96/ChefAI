// src/components/profile/ProfileHeader.tsx
'use client';

import type { ProfileData } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserCircle, CalendarIcon, UserPlus, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export const ProfileHeader = ({ profile, isFollowing, onFollowToggle, isCurrentUser }: { profile: ProfileData, isFollowing: boolean, onFollowToggle: () => void, isCurrentUser: boolean }) => {
    const joinedDate = profile.createdAt ? new Date(profile.createdAt) : null;
      
    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 text-6xl">
                <AvatarImage src={profile.photoURL || undefined} />
                <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-3 text-center sm:text-left">
                <h1 className="font-headline text-4xl font-bold">{profile.name}</h1>
                <div className="flex justify-center sm:justify-start gap-6 text-muted-foreground">
                    <div className="text-center">
                        <span className="font-bold text-lg text-foreground">{profile.followersCount}</span>
                        <p className="text-xs">Seguidores</p>
                    </div>
                     <div className="text-center">
                        <span className="font-bold text-lg text-foreground">{profile.followingCount}</span>
                        <p className="text-xs">Siguiendo</p>
                    </div>
                </div>
                 {joinedDate && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Se unió en {format(joinedDate, "MMMM 'de' yyyy", { locale: es })}</span>
                    </div>
                )}
            </div>
            {!isCurrentUser && (
                 <Button onClick={onFollowToggle} variant={isFollowing ? 'secondary' : 'default'} size="lg" className="w-full sm:w-auto">
                    {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                    {isFollowing ? 'Siguiendo' : 'Seguir'}
                </Button>
            )}
        </div>
    );
};
