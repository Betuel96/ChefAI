// src/components/community/stories-bar.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getStoriesForFeed } from '@/lib/community';
import type { StoryGroup } from '@/types';
import { AddStoryDialog } from './add-story-dialog';
import { StoryViewer } from './story-viewer';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Plus } from 'lucide-react';

const StoryAvatar = ({
  group,
  onClick,
  isCurrentUser = false
}: {
  group: StoryGroup | { publisherPhotoURL: string | null, publisherName: string };
  onClick: () => void;
  isCurrentUser?: boolean;
}) => (
    <button onClick={onClick} className="flex flex-col items-center gap-2 w-20 text-center">
        <div className="relative p-1 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500">
            <div className="p-0.5 bg-background rounded-full">
                <Avatar className="w-16 h-16">
                    <AvatarImage src={group.publisherPhotoURL || undefined} />
                    <AvatarFallback><UserCircle className="w-8 h-8" /></AvatarFallback>
                </Avatar>
            </div>
            {isCurrentUser && (
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1 border-2 border-background">
                    <Plus className="w-4 h-4"/>
                </div>
            )}
        </div>
        <p className="text-xs font-medium truncate w-full">
            {isCurrentUser ? 'Tu historia' : group.publisherName}
        </p>
    </button>
);


export const StoriesBar = () => {
    const { user, loading: authLoading } = useAuth();
    const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [viewerStartIndex, setViewerStartIndex] = useState(0);

    const fetchStories = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            setStoryGroups([]);
            return;
        }
        setIsLoading(true);
        try {
            const groups = await getStoriesForFeed(user.uid);
            setStoryGroups(groups);
        } catch (error) {
            console.error("Error fetching stories:", error);
        } finally {
            setIsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading) {
            fetchStories();
        }
    }, [authLoading, fetchStories]);
    
    const handleAddStory = () => {
        if (!user) return;
        setIsAddDialogOpen(true);
    };

    const handleOpenViewer = (index: number) => {
        setViewerStartIndex(index);
        setIsViewerOpen(true);
    };

    const currentUserStoryGroupIndex = storyGroups.findIndex(g => g.publisherId === user?.uid);
    const otherStoryGroups = storyGroups.filter(g => g.publisherId !== user?.uid);

    if (authLoading || (!user && !isLoading)) {
        return null; // Don't show bar if logged out or still checking auth
    }
    
    if (isLoading) {
        return (
            <div className="flex items-center gap-4 py-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-2">
                        <Skeleton className="w-16 h-16 rounded-full" />
                        <Skeleton className="h-3 w-12" />
                    </div>
                ))}
            </div>
        );
    }
    
    return (
        <>
            <div className="flex items-center gap-4 py-2 overflow-x-auto">
                <StoryAvatar 
                    group={{ publisherName: "Tu historia", publisherPhotoURL: user?.photoURL || null }}
                    onClick={handleAddStory}
                    isCurrentUser={true}
                />
                
                {otherStoryGroups.map((group, index) => (
                    <StoryAvatar key={group.publisherId} group={group} onClick={() => handleOpenViewer(index)} />
                ))}
            </div>

            {user && (
                 <AddStoryDialog
                    isOpen={isAddDialogOpen}
                    onOpenChange={setIsAddDialogOpen}
                    onStoryAdded={fetchStories}
                />
            )}
            
            {isViewerOpen && (
                <StoryViewer
                    groups={storyGroups}
                    startIndex={viewerStartIndex}
                    onClose={() => setIsViewerOpen(false)}
                />
            )}
        </>
    );
};
