// src/components/profile/ProfileHeader.tsx
'use client';

import type { ProfileData } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserCircle, CalendarIcon, UserPlus, UserCheck, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export const ProfileHeader = ({ profile, isFollowing, onFollowToggle, isCurrentUser }: { profile: ProfileData, isFollowing: boolean, onFollowToggle: () => void, isCurrentUser: boolean }) => {
    const joinedDate = profile.createdAt ? new Date(profile.createdAt) : null;
    const router = useRouter();
      
    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 text-6xl">
                <AvatarImage src={profile.photoURL || undefined} />
                <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-3 text-center sm:text-left">
                <div>
                    <h1 className="font-headline text-4xl font-bold">{profile.name}</h1>
                    <p className="text-muted-foreground text-lg">@{profile.username}</p>
                </div>
                <div className="flex justify-center sm:justify-start gap-6 text-muted-foreground">
                    <Link href={`/profile/${profile.id}/followers`} className="text-center hover:text-primary transition-colors">
                        <span className="font-bold text-lg text-foreground">{profile.followersCount}</span>
                        <p className="text-xs">Seguidores</p>
                    </Link>
                     <Link href={`/profile/${profile.id}/following`} className="text-center hover:text-primary transition-colors">
                        <span className="font-bold text-lg text-foreground">{profile.followingCount}</span>
                        <p className="text-xs">Siguiendo</p>
                    </Link>
                </div>
                 {joinedDate && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        <span>Se unió en {format(joinedDate, "MMMM 'de' yyyy", { locale: es })}</span>
                    </div>
                )}
            </div>
            <div className="w-full sm:w-auto flex flex-col gap-2">
                {isCurrentUser ? (
                    <Button onClick={() => router.push('/settings')} variant="outline" size="lg" className="w-full sm:w-auto">
                        <Settings className="mr-2 h-4 w-4" />
                        Editar Perfil
                    </Button>
                ) : (
                    <Button onClick={onFollowToggle} variant={isFollowing ? 'secondary' : 'default'} size="lg" className="w-full sm:w-auto">
                        {isFollowing ? <UserCheck className="mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                        {isFollowing ? 'Siguiendo' : 'Seguir'}
                    </Button>
                )}
            </div>
        </div>
    );
};
