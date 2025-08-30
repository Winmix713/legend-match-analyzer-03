import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation';
import { announceToScreenReader } from '@/lib/accessibility-utils';
import { ChevronDown, X } from 'lucide-react';

export interface AutocompleteOption {
  value: string;
  label: string;
  metadata?: any;
}

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (option: AutocompleteOption) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
  maxSuggestions?: number;
  showClearButton?: boolean;
  'aria-label'?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  disabled = false,
  error,
  className,
  maxSuggestions = 10,
  showClearButton = true,
  'aria-label': ariaLabel,
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [inputId] = useState(() => `autocomplete-${Math.random().toString(36).substr(2, 9)}`);
  const [listId] = useState(() => `${inputId}-list`);

  const filteredOptions = options.slice(0, maxSuggestions);

  const { containerRef } = useKeyboardNavigation<HTMLDivElement>({
    onArrowUp: () => {
      if (!isOpen) return;
      setSelectedIndex(prev => {
        const newIndex = prev <= 0 ? filteredOptions.length - 1 : prev - 1;
        announceToScreenReader(
          `${filteredOptions[newIndex]?.label || 'Option'} ${newIndex + 1} of ${filteredOptions.length}`,
          'polite'
        );
        return newIndex;
      });
    },
    onArrowDown: () => {
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      setSelectedIndex(prev => {
        const newIndex = prev >= filteredOptions.length - 1 ? 0 : prev + 1;
        announceToScreenReader(
          `${filteredOptions[newIndex]?.label || 'Option'} ${newIndex + 1} of ${filteredOptions.length}`,
          'polite'
        );
        return newIndex;
      });
    },
    onEnter: () => {
      if (isOpen && selectedIndex >= 0 && filteredOptions[selectedIndex]) {
        handleSelect(filteredOptions[selectedIndex]);
      }
    },
    onEscape: () => {
      setIsOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.focus();
    },
    disabled: disabled,
  });

  const handleSelect = (option: AutocompleteOption) => {
    onChange(option.value);
    onSelect?.(option);
    setIsOpen(false);
    setSelectedIndex(-1);
    announceToScreenReader(`Selected ${option.label}`, 'polite');
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length > 0);
    setSelectedIndex(-1);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
    announceToScreenReader('Input cleared', 'polite');
  };

  const handleInputClick = () => {
    if (!disabled && value.length > 0) {
      setIsOpen(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected option into view
  useEffect(() => {
    if (selectedIndex >= 0 && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          id={inputId}
          value={value}
          onChange={handleInputChange}
          onClick={handleInputClick}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-8',
            error && 'border-destructive',
            isOpen && 'ring-2 ring-primary ring-offset-2'
          )}
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? listId : undefined}
          aria-activedescendant={
            isOpen && selectedIndex >= 0 ? `${listId}-option-${selectedIndex}` : undefined
          }
          role="combobox"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {showClearButton && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
              aria-label="Clear input"
            >
              <X className="h-3 w-3" />
            </button>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform',
              isOpen && 'rotate-180'
            )}
          />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      {isOpen && filteredOptions.length > 0 && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          {filteredOptions.map((option, index) => (
            <li
              key={option.value}
              id={`${listId}-option-${index}`}
              role="option"
              aria-selected={index === selectedIndex}
              className={cn(
                'relative flex cursor-pointer select-none items-center rounded-sm px-3 py-2 text-sm outline-none transition-colors',
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              )}
              onClick={() => handleSelect(option)}
            >
              <span className="truncate">{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}