// src/components/layout/user-search.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/hooks/use-debounce';
import { searchUsers } from '@/lib/community';
import type { ProfileListItem } from '@/types';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserCircle, Search, Loader2 } from 'lucide-react';

export const UserSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<ProfileListItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);
    const debouncedQuery = useDebounce(query, 300);

    useEffect(() => {
        const performSearch = async () => {
            if (debouncedQuery.trim().length > 1) {
                setIsLoading(true);
                const users = await searchUsers(debouncedQuery);
                setResults(users);
                setIsLoading(false);
                if (users.length > 0) {
                    setIsPopoverOpen(true);
                }
            } else {
                setResults([]);
                setIsPopoverOpen(false);
            }
        };
        performSearch();
    }, [debouncedQuery]);

    const handleResultClick = () => {
        setIsPopoverOpen(false);
        setQuery('');
        setResults([]);
    };
    
    return (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar usuarios..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="pl-9"
                    />
                    {isLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-1 mt-1" align="start">
                {results.length > 0 ? (
                    <div className="flex flex-col gap-1">
                        {results.map(user => (
                            <Link href={`/profile/${user.id}`} key={user.id} onClick={handleResultClick} className="block">
                                <div className="flex items-center gap-3 p-2 rounded-md hover:bg-accent transition-colors cursor-pointer">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.photoURL || undefined} />
                                        <AvatarFallback><UserCircle /></AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium">{user.name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    !isLoading && <p className="p-4 text-center text-sm text-muted-foreground">No se encontraron usuarios.</p>
                )}
            </PopoverContent>
        </Popover>
    );
}
