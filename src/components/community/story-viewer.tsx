// src/components/community/story-viewer.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { Story, StoryGroup } from '@/types';
import { Dialog, DialogContent, DialogOverlay } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostMedia } from '@/components/community/post-media';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface StoryViewerProps {
  groups: StoryGroup[];
  startIndex: number;
  onClose: () => void;
}

const STORY_DURATION_MS = 5000; // 5 seconds for images

export function StoryViewer({ groups, startIndex, onClose }: StoryViewerProps) {
  const [currentGroupIndex, setCurrentGroupIndex] = useState(startIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentGroup = groups[currentGroupIndex];
  const currentStory = currentGroup?.stories[currentStoryIndex];

  const goToNextStory = useCallback(() => {
    if (currentGroup && currentStoryIndex < currentGroup.stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    } else if (currentGroupIndex < groups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  }, [currentGroup, currentStoryIndex, currentGroupIndex, groups.length, onClose]);

  const goToPrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    } else if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      // Go to the last story of the previous group
      setCurrentStoryIndex(groups[currentGroupIndex - 1].stories.length - 1);
    }
  };
  
  const startTimer = useCallback((duration: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(goToNextStory, duration);
  }, [goToNextStory]);

  useEffect(() => {
    if (isPaused || !currentStory) return;
    
    if (currentStory.mediaType === 'image') {
      startTimer(STORY_DURATION_MS);
    }
    // For video, the timer will be started by the onCanPlay event

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentStoryIndex, currentGroupIndex, isPaused, currentStory, startTimer]);
  
  const handleVideoCanPlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (isPaused) return;
    const duration = e.currentTarget.duration * 1000;
    startTimer(duration);
    e.currentTarget.play();
  };

  const pausePlayback = () => setIsPaused(true);
  const resumePlayback = () => setIsPaused(false);
  
  if (!currentGroup || !currentStory) {
    return null;
  }

  return (
    <Dialog open onOpenChange={onClose}>
        <DialogOverlay className="bg-black/90" />
        <DialogContent className="bg-transparent border-none shadow-none w-screen h-screen max-w-none p-0 sm:p-0 flex items-center justify-center">
            <div className="relative w-full h-full max-w-md max-h-[95vh] aspect-[9/16] bg-black rounded-lg overflow-hidden" onMouseDown={pausePlayback} onMouseUp={resumePlayback} onTouchStart={pausePlayback} onTouchEnd={resumePlayback}>
                
                {/* Progress Bars */}
                <div className="absolute top-2 left-2 right-2 flex items-center gap-1 z-20">
                    {currentGroup.stories.map((_, index) => (
                        <div key={index} className="w-full bg-white/30 h-1 rounded-full overflow-hidden">
                           <div
                             className={cn("h-full bg-white transition-all duration-200", {
                                 'w-full': index < currentStoryIndex,
                                 'w-0': index > currentStoryIndex,
                             })}
                             style={index === currentStoryIndex && !isPaused ? {
                                 animation: `story-progress ${currentStory.mediaType === 'image' ? STORY_DURATION_MS / 1000 : videoRef.current?.duration || 5}s linear`,
                             } : {}}
                            />
                        </div>
                    ))}
                </div>

                {/* Header */}
                <header className="absolute top-5 left-4 right-4 z-20 flex items-center gap-3">
                     <Link href={`/profile/${currentGroup.publisherId}`} onClick={onClose}>
                        <Avatar className="h-10 w-10 border-2 border-white">
                            <AvatarImage src={currentGroup.publisherPhotoURL || undefined} />
                            <AvatarFallback>{currentGroup.publisherName.charAt(0)}</AvatarFallback>
                        </Avatar>
                     </Link>
                     <div className="text-white text-shadow">
                        <Link href={`/profile/${currentGroup.publisherId}`} onClick={onClose} className="font-bold text-sm">{currentGroup.publisherName}</Link>
                        <p className="text-xs">{formatDistanceToNow(new Date(currentStory.createdAt), { locale: es, addSuffix: true })}</p>
                    </div>
                </header>

                {/* Media */}
                <div className="w-full h-full flex items-center justify-center">
                    <PostMedia 
                        mediaUrl={currentStory.mediaUrl}
                        mediaType={currentStory.mediaType}
                        altText={`Story by ${currentGroup.publisherName}`}
                        className="object-contain w-full h-full"
                    />
                     {currentStory.mediaType === 'video' && (
                        <video
                            ref={videoRef}
                            key={currentStory.id}
                            className="absolute inset-0 w-full h-full object-contain"
                            src={currentStory.mediaUrl}
                            onCanPlay={handleVideoCanPlay}
                            muted
                            playsInline
                        />
                    )}
                </div>

                {/* Navigation */}
                <button onClick={goToPrevStory} className="absolute left-0 top-0 h-full w-1/2 z-10" aria-label="Previous story" />
                <button onClick={goToNextStory} className="absolute right-0 top-0 h-full w-1/2 z-10" aria-label="Next story" />
            
            </div>
            
            {/* Close Button */}
            <button onClick={onClose} className="absolute top-4 right-4 text-white z-30" aria-label="Close stories">
                <X className="w-8 h-8"/>
            </button>
            
            {/* Nav Chevrons */}
            {currentGroupIndex > 0 && (
                <button onClick={goToPrevStory} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 z-30 hidden md:block" aria-label="Previous user">
                    <ChevronLeft className="w-8 h-8"/>
                </button>
            )}
             {currentGroupIndex < groups.length - 1 && (
                <button onClick={goToNextStory} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 z-30 hidden md:block" aria-label="Next user">
                    <ChevronRight className="w-8 h-8"/>
                </button>
            )}
        </DialogContent>
    </Dialog>
  );
}

// Custom CSS for text shadow - add to globals.css if needed, or use a utility
const textShadowStyle = {
    textShadow: '0 1px 3px rgba(0,0,0,0.5)'
}

// Add keyframes for progress to globals.css
const keyframes = `
@keyframes story-progress {
  from { width: 0%; }
  to { width: 100%; }
}
`;

// Inject keyframes into the document head
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.type = "text/css";
  styleSheet.innerText = keyframes;
  document.head.appendChild(styleSheet);
}
