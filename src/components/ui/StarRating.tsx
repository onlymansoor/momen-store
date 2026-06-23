'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface StarRatingProps {
  rating?: number;
  maxRating?: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

export default function StarRating({
  rating = 0,
  maxRating = 5,
  size = 20,
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);
  const displayRating = hoverRating || rating;

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: maxRating }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= displayRating;

        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            className={cn(
              'transition-all duration-150',
              interactive
                ? 'cursor-pointer hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-sm'
                : 'cursor-default'
            )}
            onClick={() => interactive && onChange?.(starValue)}
            onMouseEnter={() => interactive && setHoverRating(starValue)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            aria-label={`${starValue} star${starValue > 1 ? 's' : ''}`}
          >
            <Star
              size={size}
              className={cn(
                'transition-colors duration-150',
                filled
                  ? 'fill-accent text-accent'
                  : 'fill-none text-white/20'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
