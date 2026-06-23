import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const cardVariants = cva(
  'rounded-2xl glass transition-all duration-500',
  {
    variants: {
      padding: {
        none: 'p-0',
        sm: 'p-4',
        md: 'p-6',
        lg: 'p-8',
      },
      hover: {
        true: 'glass-card-hover cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      padding: 'md',
      hover: false,
    },
  }
);

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  children: ReactNode;
}

export default function Card({
  className,
  padding,
  hover,
  children,
  ...props
}: CardProps) {
  return (
    <div className={cn(cardVariants({ padding, hover }), className)} {...props}>
      {children}
    </div>
  );
}

export { cardVariants };
