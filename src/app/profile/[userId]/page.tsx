
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getProfileData, getUserPublishedPosts, followUser, unfollowUser, getFollowingStatus, getFollowingList, getFollowersList } from '@/lib/community';
import type { ProfileData, PublishedPost, ProfileListItem } from '@/types';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, UtensilsCrossed, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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


const PostGrid = ({ posts }: { posts: PublishedPost[] }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map(post => (
                <Link href={`/post/${post.id}`} key={post.id}>
                    <Card className="overflow-hidden group">
                        <div className="aspect-square relative">
                            {post.imageUrl ? (
                                <Image
                                    src={post.imageUrl}
                                    alt={`Imagen de ${post.content}`}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                            ) : (
                                <div className="bg-muted h-full flex items-center justify-center text-muted-foreground">
                                    <UtensilsCrossed className="w-10 h-10" />
                                </div>
                            )}
                        </div>
                        <CardContent className="p-4">
                            <p className="font-semibold truncate">{post.content}</p>
                        </CardContent>
                    </Card>
                 </Link>
            ))}
        </div>
    );
};

const UserList = ({ users }: { users: ProfileListItem[] }) => {
    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-10">No hay usuarios que mostrar.</p>;
    }

    return (
        <div className="space-y-4">
            {users.map(userItem => (
                <Link href={`/profile/${userItem.id}`} key={userItem.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={userItem.photoURL || undefined} />
                                <AvatarFallback><UserCircle /></AvatarFallback>
                            </Avatar>
                            <p className="font-semibold">{userItem.name}</p>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};


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
                    {posts.length === 0 && (
                        <p className="text-center text-muted-foreground pt-10">Este usuario aún no ha publicado nada.</p>
                    )}
                </TabsContent>
                <TabsContent value="following" className="mt-6">
                    <UserList users={following} />
                </TabsContent>
                <TabsContent value="followers" className="mt-6">
                    <UserList users={followers} />
                </TabsContent>
            </Tabs>

        </div>
    );
}
