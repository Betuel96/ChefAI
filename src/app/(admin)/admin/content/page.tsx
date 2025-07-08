// src/app/(admin)/admin/content/page.tsx
'use client';
import { useState, useEffect } from 'react';
import type { PublishedPost } from '@/types';
import { getAllPublishedContent } from '@/lib/admin';
import { ContentTable } from '@/components/admin/content-table';
import { Skeleton } from '@/components/ui/skeleton';

export default function AdminContentPage() {
  const [posts, setPosts] = useState<PublishedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const allPosts = await getAllPublishedContent();
        setPosts(allPosts);
      } catch (error) {
        console.error("Error fetching content:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handlePostDeleted = (postId: string) => {
    setPosts(currentPosts => currentPosts.filter(p => p.id !== postId));
  };

  if (isLoading) {
    return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-1/4" />
            <Skeleton className="h-96 w-full" />
        </div>
    )
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Contenido</h1>
        <p className="text-muted-foreground">Modera las publicaciones de la comunidad.</p>
      </header>
      <ContentTable data={posts} onPostDeleted={handlePostDeleted} />
    </div>
  );
}
