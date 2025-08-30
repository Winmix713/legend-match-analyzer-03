import React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Monitor, Contrast, Type } from 'lucide-react';
import { useTheme, type Theme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeOption {
  value: Theme;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const themeOptions: ThemeOption[] = [
  {
    value: 'light',
    label: 'Light',
    description: 'Light theme with standard contrast',
    icon: Sun,
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dark theme for reduced eye strain',
    icon: Moon,
  },
  {
    value: 'system',
    label: 'System',
    description: 'Follow system preference',
    icon: Monitor,
  },
  {
    value: 'high-contrast',
    label: 'High Contrast',
    description: 'Enhanced contrast for better visibility',
    icon: Contrast,
  },
  {
    value: 'dyslexia-friendly',
    label: 'Dyslexia Friendly',
    description: 'Optimized for dyslexic users',
    icon: Type,
  },
];

interface ThemeToggleProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function ThemeToggle({
  variant = 'outline',
  size = 'default',
  showLabel = false,
  className,
}: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const currentTheme = themeOptions.find(option => option.value === theme) || themeOptions[2];
  const CurrentIcon = currentTheme.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn('gap-2', className)}
          aria-label="Theme options"
        >
          <CurrentIcon className="h-4 w-4" />
          {showLabel && <span>{currentTheme.label}</span>}
          <span className="sr-only">Open theme selector</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-64 bg-popover z-50"
        sideOffset={8}
      >
        <DropdownMenuLabel className="text-sm font-medium">
          Theme Options
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {themeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = theme === option.value;
          
          return (
            <DropdownMenuItem
              key={option.value}
              className={cn(
                'flex items-start gap-3 p-3 cursor-pointer',
                isSelected && 'bg-accent text-accent-foreground'
              )}
              onClick={() => setTheme(option.value)}
            >
              <Icon className={cn(
                'h-4 w-4 mt-0.5 flex-shrink-0',
                isSelected ? 'text-accent-foreground' : 'text-muted-foreground'
              )} />
              <div className="flex-1 space-y-1">
                <div className={cn(
                  'text-sm font-medium',
                  isSelected && 'text-accent-foreground'
                )}>
                  {option.label}
                  {isSelected && (
                    <span className="ml-2 text-xs">(Current)</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {option.description}
                </div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}