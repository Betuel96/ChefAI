// src/app/profile/[userId]/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getProfileData, getUserPublishedPosts, followUser, unfollowUser, getFollowingStatus } from '@/lib/community';
import type { ProfileData, PublishedPost } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostGrid } from '@/components/profile/PostGrid';
import { Separator } from '@/components/ui/separator';

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
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    
    const [isLoading, setIsLoading] = useState(true);

    const isCurrentUser = currentUser?.uid === params.userId;

    const handleFollowToggle = useCallback(async () => {
        if (!currentUser || isCurrentUser || !profile) return;
        
        const originalIsFollowing = isFollowing;
        const originalFollowersCount = profile.followersCount;
        
        setIsFollowing(!originalIsFollowing);
        setProfile(p => {
            if (!p) return null;
            const newFollowersCount = originalIsFollowing ? p.followersCount - 1 : p.followersCount + 1;
            return {...p, followersCount: newFollowersCount < 0 ? 0 : newFollowersCount };
        });
        
        try {
            if (originalIsFollowing) {
                await unfollowUser(currentUser.uid, profile.id);
            } else {
                await followUser(currentUser.uid, profile.id);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            setIsFollowing(originalIsFollowing);
            setProfile(p => p ? { ...p, followersCount: originalFollowersCount } : null);
        }
    }, [currentUser, isCurrentUser, profile, isFollowing]);


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
                    const followingStatus = await getFollowingStatus(currentUser.uid, profileData.id);
                    setIsFollowing(followingStatus);
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

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <ProfileHeader profile={profile} isFollowing={isFollowing} onFollowToggle={handleFollowToggle} isCurrentUser={isCurrentUser} />
            
            <Separator />
            
            <h2 className="font-headline text-2xl font-bold text-center">Publicaciones</h2>
            <PostGrid posts={posts} />
        </div>
    );
}
