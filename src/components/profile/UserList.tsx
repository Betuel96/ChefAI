
// src/components/profile/UserList.tsx
'use client';

import Link from 'next/link';
import type { ProfileListItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle } from 'lucide-react';

interface UserListProps {
    users: ProfileListItem[];
    emptyMessage: string;
    actionSlot?: (user: ProfileListItem) => React.ReactNode;
}

export const UserList = ({ users, emptyMessage, actionSlot }: UserListProps) => {
    if (users.length === 0) {
        return <p className="text-center text-muted-foreground pt-10">{emptyMessage}</p>;
    }

    return (
        <div className="space-y-2 max-w-md mx-auto">
            {users.map(userItem => (
                <div key={userItem.id} className="flex items-center justify-between gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Link href={`/profile/${userItem.id}`} className="flex items-center gap-4 flex-grow min-w-0">
                        <Avatar>
                            <AvatarImage src={userItem.photoURL || undefined} />
                            <AvatarFallback><UserCircle /></AvatarFallback>
                        </Avatar>
                        <div className="truncate">
                            <p className="font-semibold truncate">{userItem.name}</p>
                            <p className="text-sm text-muted-foreground truncate">@{userItem.username}</p>
                        </div>
                    </Link>
                    {actionSlot && (
                        <div className="flex-shrink-0">
                            {actionSlot(userItem)}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};
