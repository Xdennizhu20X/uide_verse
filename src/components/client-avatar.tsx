'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function ClientAvatar({ src, alt, fallback }: { 
  src: string; 
  alt: string; 
  fallback: string 
}) {
  return (
    <Avatar>
      <AvatarImage 
        src={src} 
        alt={alt}
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
        }}
      />
      <AvatarFallback>{fallback}</AvatarFallback>
    </Avatar>
  );
}