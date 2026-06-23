import { cn } from '@/lib/utils';

export interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export default function Skeleton({
  className,
  width,
  height,
  borderRadius = '8px',
}: SkeletonProps) {
  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ width, height, borderRadius }}
    >
      <div className="absolute inset-0 bg-white/5" />
      <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}
