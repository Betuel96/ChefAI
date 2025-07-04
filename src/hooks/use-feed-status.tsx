'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getLatestPostTimestamp } from '@/lib/community';

interface FeedStatusContextType {
  hasNewPublicPosts: boolean;
  hasNewFollowingPosts: boolean;
  checkFeedStatus: () => void;
}
const FeedStatusContext = createContext<FeedStatusContextType>({
  hasNewPublicPosts: false,
  hasNewFollowingPosts: false,
  checkFeedStatus: () => {},
});

export const FeedStatusProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [hasNewPublicPosts, setHasNewPublicPosts] = useState(false);
  const [hasNewFollowingPosts, setHasNewFollowingPosts] = useState(false);

  const checkFeedStatus = useCallback(async () => {
    if (!user) {
        setHasNewPublicPosts(false);
        setHasNewFollowingPosts(false);
        return;
    };

    const settings = user.notificationSettings || { publicFeed: true, followingFeed: true };

    // Check public feed
    if (settings.publicFeed) {
      const lastVisited = user.lastVisitedFeeds?.public ? new Date(user.lastVisitedFeeds.public) : new Date(0);
      const latestPostTimestamp = await getLatestPostTimestamp('public');
      if (latestPostTimestamp && latestPostTimestamp.toDate() > lastVisited) {
        setHasNewPublicPosts(true);
      } else {
        setHasNewPublicPosts(false);
      }
    } else {
        setHasNewPublicPosts(false);
    }

    // Check following feed
    if (settings.followingFeed && user.uid) {
       const lastVisited = user.lastVisitedFeeds?.following ? new Date(user.lastVisitedFeeds.following) : new Date(0);
       const latestPostTimestamp = await getLatestPostTimestamp('following', user.uid);
       if (latestPostTimestamp && latestPostTimestamp.toDate() > lastVisited) {
        setHasNewFollowingPosts(true);
       } else {
         setHasNewFollowingPosts(false);
       }
    } else {
        setHasNewFollowingPosts(false);
    }
  }, [user]);

  useEffect(() => {
    checkFeedStatus();
    // Set up an interval to check for new posts periodically
    const interval = setInterval(checkFeedStatus, 60000); // Check every 60 seconds
    return () => clearInterval(interval);
  }, [user, checkFeedStatus]);

  return (
    <FeedStatusContext.Provider value={{ hasNewPublicPosts, hasNewFollowingPosts, checkFeedStatus }}>
      {children}
    </FeedStatusContext.Provider>
  );
};

export const useFeedStatus = () => {
    const context = useContext(FeedStatusContext);
    if (context === undefined) {
        throw new Error('useFeedStatus must be used within a FeedStatusProvider');
    }
    return context;
};
