// src/components/community/post-media.tsx
'use client';

import Image from "next/image";

interface PostMediaProps {
    mediaUrl: string;
    mediaType: 'image' | 'video';
    altText: string;
    className?: string;
    controls?: boolean;
}

export const PostMedia = ({ mediaUrl, mediaType, altText, className, controls = false }: PostMediaProps) => {
    if (mediaType === 'video') {
        return (
            <video
                src={mediaUrl}
                className={className}
                autoPlay={!controls}
                muted
                loop={!controls}
                playsInline
                controls={controls}
            />
        );
    }

    return (
        <Image
            src={mediaUrl}
            alt={altText}
            fill={!className?.includes('w-') && !className?.includes('h-')}
            width={className?.includes('w-') ? undefined : 1920}
            height={className?.includes('h-') ? undefined : 1080}
            className={className}
        />
    );
};
