import { ChevronRight, Home } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
  homeHref?: string;
}

export default function Breadcrumb({
  items,
  className,
  showHome = true,
  homeHref = '/',
}: BreadcrumbProps) {
  return (
    <nav className={cn('flex items-center gap-1 text-sm flex-wrap', className)} aria-label="Breadcrumb">
      {showHome && (
        <>
          <Link
            href={homeHref}
            className="flex items-center gap-1 text-white-muted hover:text-accent transition-colors"
          >
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-3.5 w-3.5 text-accent shrink-0" />
        </>
      )}
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center gap-1">
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-white-muted hover:text-accent transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  isLast ? 'text-white font-medium' : 'text-white-muted'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="h-3.5 w-3.5 text-accent shrink-0" />
            )}
          </span>
        );
      })}
    </nav>
  );
}
