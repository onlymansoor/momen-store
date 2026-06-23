'use client';

import { forwardRef } from 'react';
import * as RadixSelect from '@radix-ui/react-select';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  label?: string;
  disabled?: boolean;
}

const Select = forwardRef<HTMLButtonElement, SelectProps>(
  ({ options, value, onValueChange, placeholder, className, error, label, disabled }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-white-muted">
            {label}
          </label>
        )}
        <RadixSelect.Root value={value} onValueChange={onValueChange} disabled={disabled}>
          <RadixSelect.Trigger
            ref={ref}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-lg glass px-3 py-2 text-sm text-white placeholder:text-white-muted outline-none transition-all duration-300',
              'focus:ring-2 focus:ring-accent/50 focus:ring-offset-2 focus:ring-offset-primary',
              'data-[placeholder]:text-white-muted',
              error && 'border-red-500/50 focus:ring-red-500/50',
              className
            )}
          >
            <RadixSelect.Value placeholder={placeholder || 'Select an option'} />
            <RadixSelect.Icon>
              <ChevronDown className="h-4 w-4 text-white-muted transition-transform duration-200 group-data-[state=open]:rotate-180" />
            </RadixSelect.Icon>
          </RadixSelect.Trigger>
          <RadixSelect.Portal>
            <RadixSelect.Content
              position="popper"
              sideOffset={4}
              className={cn(
                'z-50 min-w-[8rem] overflow-hidden rounded-xl glass p-1.5 shadow-2xl',
                'data-[state=open]:animate-scale-in'
              )}
            >
              <RadixSelect.Viewport>
                {options.map((option) => (
                  <RadixSelect.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      'relative flex cursor-pointer select-none items-center rounded-lg px-8 py-2 text-sm text-white-muted outline-none transition-colors',
                      'data-[highlighted]:bg-white/10 data-[highlighted]:text-white',
                      'data-[state=checked]:text-accent'
                    )}
                  >
                    <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                    <RadixSelect.ItemIndicator className="absolute left-2 inline-flex items-center">
                      <Check className="h-4 w-4 text-accent" />
                    </RadixSelect.ItemIndicator>
                  </RadixSelect.Item>
                ))}
              </RadixSelect.Viewport>
            </RadixSelect.Content>
          </RadixSelect.Portal>
        </RadixSelect.Root>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
