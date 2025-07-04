
// src/app/profile/[userId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { 
    getProfileData, 
    getUserPublishedPosts, 
    followUser, 
    unfollowUser, 
    getFollowingStatus,
    sendFollowRequest
} from '@/lib/community';
import type { ProfileData, PublishedPost, FollowStatus, ProfileListItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostGrid } from '@/components/profile/PostGrid';
import { Separator } from '@/components/ui/separator';
import { Lock } from 'lucide-react';

const ProfilePageSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
            <div className="space-y-3 flex-grow text-center sm:text-left">
                <Skeleton className="h-10 w-1/2 mx-auto sm:mx-0" />
                <Skeleton className="h-5 w-1/3 mx-auto sm:mx-0" />
                <div className="flex justify-center sm:justify-start gap-6">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-1/4 mx-auto sm:mx-0" />
            </div>
        </div>
         <Skeleton className="h-px w-full" />
        <Skeleton className="aspect-square w-full" />
    </div>
);

export default function ProfilePage() {
    const { user: currentUser } = useAuth();
    const params = useParams<{ userId: string }>();
    const { toast } = useToast();

    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [followStatus, setFollowStatus] = useState<FollowStatus>('not-following');
    const [isLoading, setIsLoading] = useState(true);

    const isCurrentUser = currentUser?.uid === params.userId;

    const handleFollowToggle = useCallback(async () => {
        if (!currentUser || isCurrentUser || !profile) return;
        
        const originalStatus = followStatus;
        const originalFollowersCount = profile.followersCount;
        
        try {
            if (followStatus === 'following') {
                // Optimistically update UI for unfollow
                setFollowStatus('not-following');
                setProfile(p => p ? { ...p, followersCount: Math.max(0, p.followersCount - 1) } : null);
                await unfollowUser(currentUser.uid, profile.id);
            } else if (followStatus === 'not-following') {
                if (profile.profileType === 'private') {
                    // Optimistically update UI for request
                    setFollowStatus('requested');
                    const currentUserProfile: ProfileListItem = {
                        id: currentUser.uid,
                        name: currentUser.displayName || 'Usuario Anónimo',
                        username: currentUser.username,
                        photoURL: currentUser.photoURL
                    };
                    await sendFollowRequest(currentUser.uid, currentUserProfile, profile.id);
                     toast({ title: 'Solicitud enviada' });
                } else {
                    // Optimistically update UI for public follow
                    setFollowStatus('following');
                    setProfile(p => p ? { ...p, followersCount: p.followersCount + 1 } : null);
                    await followUser(currentUser.uid, profile.id);
                }
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            // Revert UI on error
            setFollowStatus(originalStatus);
            setProfile(p => p ? { ...p, followersCount: originalFollowersCount } : null);
            toast({ title: 'Error', description: 'No se pudo completar la acción.', variant: 'destructive' });
        }
    }, [currentUser, isCurrentUser, profile, followStatus, toast]);


    useEffect(() => {
        const fetchProfile = async () => {
            if (!params.userId) return;
            setIsLoading(true);
            
            try {
                const [profileData, publishedPosts] = await Promise.all([
                    getProfileData(params.userId),
                    getUserPublishedPosts(params.userId),
                ]);

                setProfile(profileData);
                setPosts(publishedPosts);

                if (currentUser && !isCurrentUser && profileData) {
                    const status = await getFollowingStatus(currentUser.uid, profileData.id);
                    setFollowStatus(status);
                }
            } catch (error) {
                 console.error("Error fetching profile page data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProfile();
    }, [params.userId, currentUser, isCurrentUser]);


    if (isLoading) {
        return <ProfilePageSkeleton />;
    }
    
    if (!profile) {
        return <div className="text-center py-20">Usuario no encontrado.</div>;
    }
    
    const canViewContent = profile.profileType === 'public' || followStatus === 'following' || isCurrentUser;

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <ProfileHeader profile={profile} followStatus={followStatus} onFollowToggle={handleFollowToggle} isCurrentUser={isCurrentUser} />
            
            <Separator />
            
            {canViewContent ? (
                <>
                    <h2 className="font-headline text-2xl font-bold text-center">Publicaciones</h2>
                    <PostGrid posts={posts} />
                </>
            ) : (
                <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-4">
                    <Lock className="w-12 h-12"/>
                    <h3 className="font-semibold text-lg text-foreground">Este perfil es privado</h3>
                    <p>Sigue a este usuario para ver sus publicaciones.</p>
                </div>
            )}
        </div>
    );
}
