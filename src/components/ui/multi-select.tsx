
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Check, PlusCircle, X } from 'lucide-react';
import { Badge } from './badge';

export type MultiSelectOption = {
  value: string;
  label: string;
};

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = 'Select tags...',
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const triggerRef = React.useRef<HTMLButtonElement>(null);
  
  const handleUnselect = (item: string) => {
    onChange(selected.filter((i) => i !== item));
  };

  const handleSelect = (value: string) => {
    setInputValue(''); // Clear input after selection
    if (selected.includes(value)) {
       // Optional: deselect if already selected
       onChange(selected.filter((item) => item !== value))
    } else {
      onChange([...selected, value]);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const input = e.target as HTMLInputElement;
    if (e.key === 'Enter' && input.value) {
      e.preventDefault();
      const newTag = input.value.trim();
      // Add the new tag if it doesn't already exist
      if (newTag && !selected.includes(newTag) && !options.some(opt => opt.value.toLowerCase() === newTag.toLowerCase())) {
        onChange([...selected, newTag]);
      }
      setInputValue(''); // Clear input field
    } else if (e.key === 'Backspace' && !input.value) {
      // Remove the last selected item on backspace
      onChange(selected.slice(0, selected.length - 1));
    }
  };

  const filteredOptions = options.filter(
    (option) =>
      !selected.includes(option.value) &&
      option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className={cn("flex-grow", className)}>
        <Command onKeyDown={handleKeyDown} className="overflow-visible bg-transparent">
          <div
            className="group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          >
            <div className="flex flex-wrap gap-1">
              {selected.map((item) => {
                const option = options.find(opt => opt.value === item);
                return (
                  <Badge
                    key={item}
                    variant="secondary"
                    className="gap-1.5"
                  >
                    {option ? option.label : item}
                    <button
                      className="rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      onClick={() => handleUnselect(item)}
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                );
              })}
              <CommandPrimitive.Input
                placeholder={placeholder}
                value={inputValue}
                onValueChange={setInputValue}
                onBlur={() => setOpen(false)}
                onFocus={() => setOpen(true)}
                className="ml-2 flex-1 bg-transparent p-0 outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>
          <div className="relative mt-2">
            {open && filteredOptions.length > 0 ? (
              <div className="absolute top-0 z-10 w-full rounded-md border bg-popover text-popover-foreground shadow-md outline-none animate-in">
                <CommandGroup className="h-full overflow-auto">
                  {filteredOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer"
                    >
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            ) : null}
          </div>
        </Command>
      </div>
    </Popover>
  );
}

// Re-export CommandPrimitive for internal use in the component
import { Command as CommandPrimitive } from "cmdk"
