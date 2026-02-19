import Image from 'next/image';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  name: string | null;
  image: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-lg' };

export function UserAvatar({ name, image, size = 'md', className }: UserAvatarProps) {
  if (image) {
    return (
      <Image
        src={image}
        alt={name || 'Avatar'}
        width={size === 'lg' ? 64 : size === 'md' ? 40 : 32}
        height={size === 'lg' ? 64 : size === 'md' ? 40 : 32}
        className={cn('rounded-full object-cover', sizeMap[size], className)}
      />
    );
  }

  return (
    <div className={cn('rounded-full bg-primary/10 flex items-center justify-center font-bold', sizeMap[size], className)}>
      {getInitials(name)}
    </div>
  );
}
