'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export interface DropdownItem {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  separator?: boolean;
  danger?: boolean;
}

export interface DropdownProps {
  trigger: ReactNode;
  items: DropdownItem[];
  className?: string;
  align?: 'start' | 'center' | 'end';
}

export default function Dropdown({
  trigger,
  items,
  className,
  align = 'end',
}: DropdownProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={4}
          className={cn(
            'z-50 min-w-[12rem] overflow-hidden rounded-xl glass p-1.5 shadow-2xl',
            'data-[state=open]:animate-scale-in',
            className
          )}
        >
          {items.map((item, index) => (
            <div key={index}>
              {item.separator && index > 0 && (
                <DropdownMenu.Separator className="my-1 h-px bg-white/10" />
              )}
              <DropdownMenu.Item
                disabled={item.disabled}
                onClick={item.onClick}
                className={cn(
                  'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-white-muted outline-none transition-colors',
                  'data-[highlighted]:bg-white/10 data-[highlighted]:text-white',
                  'data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed',
                  item.danger && 'text-red-400 data-[highlighted]:bg-red-500/10 data-[highlighted]:text-red-300'
                )}
              >
                {item.icon && <span className="flex h-4 w-4 items-center justify-center">{item.icon}</span>}
                {item.label}
              </DropdownMenu.Item>
            </div>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
