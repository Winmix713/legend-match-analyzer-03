import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Clock, Star, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface SearchSuggestion {
  type: 'team' | 'recent' | 'favorite';
  value: string;
  label: string;
  metadata?: {
    lastUsed?: string;
    frequency?: number;
    isFavorite?: boolean;
  };
}

interface SearchSuggestionsProps {
  query: string;
  suggestions: SearchSuggestion[];
  onSelect: (suggestion: SearchSuggestion) => void;
  maxHeight?: number;
  className?: string;
  showIcons?: boolean;
  virtualized?: boolean;
}

interface SuggestionItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    suggestions: SearchSuggestion[];
    onSelect: (suggestion: SearchSuggestion) => void;
    showIcons: boolean;
    selectedIndex: number;
  };
}

function SuggestionItem({ index, style, data }: SuggestionItemProps) {
  const { suggestions, onSelect, showIcons, selectedIndex } = data;
  const suggestion = suggestions[index];

  const getIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4 text-muted-foreground" />;
      case 'favorite':
        return <Star className="h-4 w-4 text-yellow-500 fill-current" />;
      default:
        return <Search className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div style={style}>
      <button
        type="button"
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
          index === selectedIndex && 'bg-accent text-accent-foreground',
          'focus:outline-none focus:bg-accent focus:text-accent-foreground'
        )}
        onClick={() => onSelect(suggestion)}
      >
        {showIcons && (
          <span className="flex-shrink-0">
            {getIcon(suggestion.type)}
          </span>
        )}
        <span className="flex-1 truncate">{suggestion.label}</span>
        {suggestion.metadata?.frequency && suggestion.metadata.frequency > 1 && (
          <span className="text-xs text-muted-foreground">
            {suggestion.metadata.frequency}x
          </span>
        )}
      </button>
    </div>
  );
}

export function SearchSuggestions({
  query,
  suggestions,
  onSelect,
  maxHeight = 300,
  className,
  showIcons = true,
  virtualized = false,
}: SearchSuggestionsProps) {
  const [searchHistory, setSearchHistory] = useLocalStorage<string[]>('search-history', [], 1);
  
  const sortedSuggestions = useMemo(() => {
    // Sort suggestions by relevance and type
    return suggestions.sort((a, b) => {
      // Favorites first
      if (a.type === 'favorite' && b.type !== 'favorite') return -1;
      if (b.type === 'favorite' && a.type !== 'favorite') return 1;
      
      // Then recent searches
      if (a.type === 'recent' && b.type === 'team') return -1;
      if (b.type === 'recent' && a.type === 'team') return 1;
      
      // Then by frequency if available
      const aFreq = a.metadata?.frequency || 0;
      const bFreq = b.metadata?.frequency || 0;
      if (aFreq !== bFreq) return bFreq - aFreq;
      
      // Finally alphabetical
      return a.label.localeCompare(b.label);
    });
  }, [suggestions]);

  const handleSelect = (suggestion: SearchSuggestion) => {
    // Add to search history
    const newHistory = [suggestion.value, ...searchHistory.filter(item => item !== suggestion.value)].slice(0, 10);
    setSearchHistory(newHistory);
    
    onSelect(suggestion);
  };

  if (sortedSuggestions.length === 0) {
    return null;
  }

  const itemHeight = 44; // Height of each suggestion item in pixels
  const listHeight = Math.min(maxHeight, sortedSuggestions.length * itemHeight);

  if (virtualized && sortedSuggestions.length > 10) {
    return (
      <div
        className={cn(
          'border bg-popover text-popover-foreground shadow-md rounded-md overflow-hidden',
          className
        )}
        role="listbox"
        aria-label="Search suggestions"
      >
        <List
          width="100%"
          height={listHeight}
          itemCount={sortedSuggestions.length}
          itemSize={itemHeight}
          itemData={{
            suggestions: sortedSuggestions,
            onSelect: handleSelect,
            showIcons,
            selectedIndex: -1, // TODO: Implement keyboard navigation for virtualized list
          }}
        >
          {SuggestionItem}
        </List>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'border bg-popover text-popover-foreground shadow-md rounded-md overflow-hidden',
        className
      )}
      style={{ maxHeight }}
      role="listbox"
      aria-label="Search suggestions"
    >
      <div className="max-h-full overflow-y-auto">
        {sortedSuggestions.map((suggestion, index) => (
          <button
            key={`${suggestion.type}-${suggestion.value}`}
            type="button"
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground transition-colors',
              'focus:outline-none focus:bg-accent focus:text-accent-foreground'
            )}
            onClick={() => handleSelect(suggestion)}
            role="option"
            aria-selected={false}
          >
            {showIcons && (
              <span className="flex-shrink-0">
                {suggestion.type === 'recent' && <Clock className="h-4 w-4 text-muted-foreground" />}
                {suggestion.type === 'favorite' && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                {suggestion.type === 'team' && <Search className="h-4 w-4 text-muted-foreground" />}
              </span>
            )}
            <span className="flex-1 truncate">{suggestion.label}</span>
            {suggestion.metadata?.frequency && suggestion.metadata.frequency > 1 && (
              <span className="text-xs text-muted-foreground">
                {suggestion.metadata.frequency}x
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}