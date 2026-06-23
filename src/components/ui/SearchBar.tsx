'use client';

import { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onClear?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  onClear,
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={cn('relative', className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white-muted pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-10 w-full rounded-lg glass pl-10 pr-10 text-sm text-white placeholder:text-white-muted outline-none transition-all duration-300',
          'focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-primary'
        )}
      />
      <AnimatePresence>
        {value && (
          <motion.button
            key="clear-btn"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            type="button"
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
              onClear?.();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-white-muted hover:text-white transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
