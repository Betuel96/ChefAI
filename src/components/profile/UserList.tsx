
// src/components/profile/UserList.tsx
'use client';

import Link from 'next/link';
import type { ProfileListItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

export const UserList = ({ users, emptyMessage }: { users: ProfileListItem[], emptyMessage: string }) => {
    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-10">{emptyMessage}</p>;
    }

    return (
        <div className="space-y-4 max-w-md mx-auto">
            {users.map(userItem => (
                <Link href={`/profile/${userItem.id}`} key={userItem.id}>
                    <Card className="hover:bg-muted/50 transition-colors">
                        <CardContent className="p-4 flex items-center gap-4">
                            <Avatar>
                                <AvatarImage src={userItem.photoURL || undefined} />
                                <AvatarFallback><UserCircle /></AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{userItem.name}</p>
                                <p className="text-sm text-muted-foreground">@{userItem.username}</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            ))}
        </div>
    );
};
