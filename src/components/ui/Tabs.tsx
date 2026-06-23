'use client';

import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { type ReactNode } from 'react';

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  className?: string;
  listClassName?: string;
}

export default function Tabs({
  tabs,
  defaultValue,
  value,
  onValueChange,
  className,
  listClassName,
}: TabsProps) {
  return (
    <RadixTabs.Root
      defaultValue={defaultValue || tabs[0]?.value}
      value={value}
      onValueChange={onValueChange}
      className={cn('w-full', className)}
    >
      <RadixTabs.List
        className={cn('flex border-b border-white/10 gap-1', listClassName)}
      >
        {tabs.map((tab) => (
          <RadixTabs.Trigger
            key={tab.value}
            value={tab.value}
            disabled={tab.disabled}
            className={cn(
              'relative px-4 py-2.5 text-sm font-medium text-white-muted transition-colors whitespace-nowrap',
              'hover:text-white',
              'data-[state=active]:text-accent',
              'data-[disabled]:opacity-30 data-[disabled]:cursor-not-allowed',
              'data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:h-0.5 data-[state=active]:after:w-full data-[state=active]:after:bg-accent data-[state=active]:after:rounded-full'
            )}
          >
            {tab.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {tabs.map((tab) => (
        <RadixTabs.Content
          key={tab.value}
          value={tab.value}
          className="pt-4 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded-lg"
        >
          {tab.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
