'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { getProfileData, getUserPublishedPosts, followUser, unfollowUser, getFollowingStatus, getFollowingList, getFollowersList } from '@/lib/community';
import type { ProfileData, PublishedPost, ProfileListItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { PostGrid } from '@/components/profile/PostGrid';
import { UserList } from '@/components/profile/UserList';

export default function ProfilePage() {
    const { user } = useAuth();
    const params = useParams<{ userId: string }>();
    const [profile, setProfile] = useState<ProfileData | null>(null);
    const [posts, setPosts] = useState<PublishedPost[]>([]);
    const [following, setFollowing] = useState<ProfileListItem[]>([]);
    const [followers, setFollowers] = useState<ProfileListItem[]>([]);
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
                const [profileData, publishedPosts, followingList, followersList] = await Promise.all([
                    getProfileData(params.userId),
                    getUserPublishedPosts(params.userId),
                    getFollowingList(params.userId),
                    getFollowersList(params.userId),
                ]);

                if (profileData) {
                    setProfile(profileData);
                    setPosts(publishedPosts);
                    setFollowing(followingList);
                    setFollowers(followersList);
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
        
        const originalIsFollowing = isFollowing;
        setIsFollowing(!originalIsFollowing);
        setProfile(p => {
            if (!p) return null;
            const newFollowersCount = originalIsFollowing ? p.followersCount - 1 : p.followersCount + 1;
            return {...p, followersCount: newFollowersCount };
        });

        try {
            if (originalIsFollowing) {
                await unfollowUser(user.uid, params.userId);
            } else {
                await followUser(user.uid, params.userId);
            }
        } catch (error) {
            console.error("Error toggling follow:", error);
            setIsFollowing(originalIsFollowing);
             setProfile(p => {
                if (!p) return null;
                const newFollowersCount = originalIsFollowing ? p.followersCount + 1 : p.followersCount - 1;
                return {...p, followersCount: newFollowersCount };
            });
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
                         <Skeleton className="h-4 w-1/4" />
                    </div>
                     <Skeleton className="h-10 w-28" />
                </div>
                 <Skeleton className="h-10 w-full" />
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
            
            <Tabs defaultValue="posts" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="posts">Publicaciones ({posts.length})</TabsTrigger>
                    <TabsTrigger value="following">Siguiendo ({following.length})</TabsTrigger>
                    <TabsTrigger value="followers">Seguidores ({followers.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="posts" className="mt-6">
                    <PostGrid posts={posts} />
                </TabsContent>
                <TabsContent value="following" className="mt-6">
                    <UserList users={following} emptyMessage="Este usuario no sigue a nadie." />
                </TabsContent>
                <TabsContent value="followers" className="mt-6">
                    <UserList users={followers} emptyMessage="Este usuario no tiene seguidores." />
                </TabsContent>
            </Tabs>

        </div>
    );
}
