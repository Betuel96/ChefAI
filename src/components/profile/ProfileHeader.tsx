
// src/components/profile/ProfileHeader.tsx
'use client';

import type { ProfileData, FollowStatus } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserCircle, CalendarIcon, UserPlus, UserCheck, Settings, Check, Clock, ChefHat } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

interface ProfileHeaderProps {
    profile: ProfileData;
    followStatus: FollowStatus;
    onFollowToggle: () => void;
    isCurrentUser: boolean;
}

export const ProfileHeader = ({ profile, followStatus, onFollowToggle, isCurrentUser }: ProfileHeaderProps) => {
    const joinedDate = profile.createdAt ? new Date(profile.createdAt) : null;
    const router = useRouter();
      
    const getFollowButton = () => {
        if (isCurrentUser) {
            return (
                <Button onClick={() => router.push('/settings')} variant="outline" size="lg" className="w-full sm:w-auto">
                    <Settings className="mr-2 h-4 w-4" />
                    Editar Perfil
                </Button>
            );
        }
        
        switch (followStatus) {
            case 'following':
                return (
                    <Button onClick={onFollowToggle} variant="secondary" size="lg" className="w-full sm:w-auto">
                        <UserCheck className="mr-2 h-4 w-4" />
                        Siguiendo
                    </Button>
                );
            case 'requested':
                return (
                    <Button variant="outline" size="lg" className="w-full sm:w-auto" disabled>
                        <Clock className="mr-2 h-4 w-4" />
                        Solicitado
                    </Button>
                );
            case 'not-following':
                return (
                     <Button onClick={onFollowToggle} variant="default" size="lg" className="w-full sm:w-auto">
                        <UserPlus className="mr-2 h-4 w-4" />
                        {profile.profileType === 'private' ? 'Solicitar seguimiento' : 'Seguir'}
                    </Button>
                );
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <Avatar className="h-24 w-24 sm:h-32 sm:w-32 text-6xl">
                <AvatarImage src={profile.photoURL || undefined} />
                <AvatarFallback><UserCircle /></AvatarFallback>
            </Avatar>
            <div className="flex-grow space-y-3 text-center sm:text-left">
                <div>
                    <h1 className="font-headline text-4xl font-bold flex items-center justify-center sm:justify-start gap-2">
                        {profile.name}
                        {profile.isVerified && (
                             <div className="relative text-blue-500 flex-shrink-0" title="Cuenta Verificada">
                                <ChefHat className="w-6 h-6" />
                                <Check className="w-3 h-3 absolute -bottom-0.5 -right-0.5 bg-blue-500 text-white rounded-full p-0.5" />
                            </div>
                        )}
                    </h1>
                    <p className="text-muted-foreground text-lg">@{profile.username}</p>
                </div>
                {profile.badges && profile.badges.length > 0 && (
                    <div className="flex justify-center sm:justify-start gap-2 flex-wrap">
                    {profile.badges.map(badge => (
                        <Badge key={badge} variant="outline" className="border-primary/50 text-primary">{badge}</Badge>
                    ))}
                    </div>
                )}
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
                {getFollowButton()}
            </div>
        </div>
    );
};
