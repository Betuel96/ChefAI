// src/components/profile/PostGrid.tsx
'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { PublishedPost } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { UtensilsCrossed } from 'lucide-react';

export const PostGrid = ({ posts }: { posts: PublishedPost[] }) => {
    if (posts.length === 0) {
        return <p className="text-center text-muted-foreground pt-10">Este usuario aún no ha publicado nada.</p>;
    }
    
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
