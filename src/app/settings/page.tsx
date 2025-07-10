// src/app/settings/page.tsx
'use client';

import { Suspense } from 'react';
import SettingsPageContent from '@/app/[locale]/settings/page';
import { Skeleton } from '@/components/ui/skeleton';

const SettingsPageSkeleton = () => (
    <div className="max-w-4xl mx-auto space-y-8">
        <Skeleton className="h-8 w-1/4" />
        <Skeleton className="h-10 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start pt-6">
            <div className="lg:col-span-2 space-y-8">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-96 w-full" />
            </div>
            <div className="lg:col-span-3">
                <Skeleton className="h-[500px] w-full" />
            </div>
        </div>
    </div>
);


export default function SettingsPage() {
    return (
        <Suspense fallback={<SettingsPageSkeleton />}>
            <SettingsPageContent />
        </Suspense>
    );
}
