import { cn } from '@/lib/utils';

export interface SpinnerProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Spinner({ size = 24, className, strokeWidth = 2 }: SpinnerProps) {
  return (
    <svg
      className={cn('animate-spin text-accent', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
