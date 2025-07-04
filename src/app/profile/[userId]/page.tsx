
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { getProfileData, getUserPublishedPosts, followUser, unfollowUser, getFollowingStatus, getFollowingList, getFollowersList } from '@/lib/community';
import type { ProfileData, PublishedPost, ProfileListItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostGrid } from '@/components/profile/PostGrid';
import { UserList } from '@/components/profile/UserList';

const ProfilePageSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
            <Skeleton className="h-24 w-24 rounded-full sm:h-32 sm:w-32" />
            <div className="space-y-3 flex-grow text-center sm:text-left">
                <Skeleton className="h-10 w-1/2 mx-auto sm:mx-0" />
                <Skeleton className="h-5 w-1/3 mx-auto sm:mx-0" />
                <div className="flex justify-center sm:justify-start gap-6">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                </div>
                <Skeleton className="h-4 w-1/4 mx-auto sm:mx-0" />
            </div>
        </div>
         <Skeleton className="h-10 w-full" />
        <Skeleton className="aspect-square w-full" />
    </div>
);

export default function ProfilePage() {
    const { user: currentUser } = useAuth();
    const params = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [following, setFollowing] = useState<ProfileListItem[]>([]);
    const [followers, setFollowers] = useState<ProfileListItem[]>([]);
    const [isFollowing, setIsFollowing] = useState(false);
    
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    const [isLoadingSocials, setIsLoadingSocials] = useState(true);

    const isCurrentUser = currentUser?.uid === params.userId;

    const handleFollowToggle = useCallback(async () => {
        if (!currentUser || isCurrentUser || !profile) return;
        
        const originalIsFollowing = isFollowing;
        
        // Optimistic UI updates
        setIsFollowing(!originalIsFollowing);
        setProfile(p => {
            if (!p) return null;
            const newFollowersCount = originalIsFollowing ? p.followersCount - 1 : p.followersCount + 1;
            return {...p, followersCount: newFollowersCount };
        });
        setFollowers(prev => {
            if (originalIsFollowing) {
                return prev.filter(f => f.id !== currentUser.uid);
            } else {
                 const meAsFollower: ProfileListItem = {
                    id: currentUser.uid,
                    name: currentUser.displayName || '',
                    username: (currentUser as any).username || '',
                    photoURL: currentUser.photoURL,
                };
                return [...prev, meAsFollower];
            }
        });

        try {
            if (originalIsFollowing) {
                await unfollowUser(currentUser.uid, profile.id);
            } else {
                await followUser(currentUser.uid, profile.id);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            // Revert optimistic updates on failure
            setIsFollowing(originalIsFollowing);
            setProfile(p => {
                if (!p) return null;
                return {...p, followersCount: originalIsFollowing ? p.followersCount + 1 : p.followersCount - 1 };
            });
             setFollowers(prev => {
                if (originalIsFollowing) {
                    const meAsFollower: ProfileListItem = {
                        id: currentUser.uid,
                        name: currentUser.displayName || '',
                        username: (currentUser as any).username || '',
                        photoURL: currentUser.photoURL,
                    };
                    return [...prev, meAsFollower];
                } else {
                    return prev.filter(f => f.id !== currentUser.uid);
                }
            });
        }
    }, [currentUser, isCurrentUser, profile, isFollowing]);


    useEffect(() => {
        const fetchProfile = async () => {
            if (!params.userId) return;
            setIsLoadingProfile(true);
            setIsLoadingSocials(true);
            
            try {
                // Fetch primary profile data first for faster perceived load
                const profileData = await getProfileData(params.userId);
                setProfile(profileData);
                if (currentUser && !isCurrentUser) {
                    const followingStatus = await getFollowingStatus(currentUser.uid, params.userId);
                    setIsFollowing(followingStatus);
                }
            } catch (error) {
                 console.error("Error fetching profile data:", error);
            } finally {
                setIsLoadingProfile(false);
            }

            // Fetch social data in parallel afterwards
            try {
                const [publishedPosts, followingList, followersList] = await Promise.all([
                    getUserPublishedPosts(params.userId),
                    getFollowingList(params.userId),
                    getFollowersList(params.userId),
                ]);
                setPosts(publishedPosts);
                setFollowing(followingList);
                setFollowers(followersList);
            } catch (error) {
                console.error("Error fetching social details:", error);
            } finally {
                 setIsLoadingSocials(false);
            }
        };

        fetchProfile();
    }, [params.userId, currentUser, isCurrentUser]);


    if (isLoadingProfile) {
        return <ProfilePageSkeleton />;
    }
    
    if (!profile) {
        return <div className="text-center py-20">Usuario no encontrado.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <ProfileHeader profile={profile} isFollowing={isFollowing} onFollowToggle={handleFollowToggle} isCurrentUser={isCurrentUser} />
            
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Publicaciones ({posts.length})</TabsTrigger>
                    <TabsTrigger value="following">Siguiendo ({following.length})</TabsTrigger>
                    <TabsTrigger value="followers">Seguidores ({followers.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="mt-6">
                    {isLoadingSocials ? (
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                           {[...Array(3)].map((_, i) => <Skeleton key={i} className="aspect-square" />)}
                        </div>
                    ) : (
                        <PostGrid posts={posts} />
                    )}
                </TabsContent>
                <TabsContent value="following" className="mt-6">
                     {isLoadingSocials ? (
                        <div className="space-y-4 max-w-md mx-auto">
                           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                    ) : (
                        <UserList users={following} emptyMessage="Este usuario no sigue a nadie." />
                    )}
                </TabsContent>
                <TabsContent value="followers" className="mt-6">
                    {isLoadingSocials ? (
                        <div className="space-y-4 max-w-md mx-auto">
                           {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                        </div>
                    ) : (
                        <UserList users={followers} emptyMessage="Este usuario no tiene seguidores." />
                    )}
                </TabsContent>
            </Tabs>

        </div>
    );
}
