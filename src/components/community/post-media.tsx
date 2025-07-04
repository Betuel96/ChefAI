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
    
    const useFill = !className?.includes('w-') && !className?.includes('h-');

    return (
        <Image
            src={mediaUrl}
            alt={altText}
            fill={useFill}
            width={useFill ? undefined : 1920}
            height={useFill ? undefined : 1080}
            className={className}
        />
    );
};
