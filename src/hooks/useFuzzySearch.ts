import { useMemo, useState } from 'react';
import Fuse, { type IFuseOptions, type FuseResult } from 'fuse.js';

export interface FuzzySearchOptions<T> {
  keys: string[];
  threshold?: number;
  includeScore?: boolean;
  includeMatches?: boolean;
  minMatchCharLength?: number;
  shouldSort?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score?: number;
  matches?: any[];
}

export function useFuzzySearch<T>(
  data: T[],
  options: FuzzySearchOptions<T>
) {
  const [query, setQuery] = useState('');

  const fuse = useMemo(() => {
    const fuseOptions: IFuseOptions<T> = {
      keys: options.keys,
      threshold: options.threshold ?? 0.4,
      includeScore: options.includeScore ?? true,
      includeMatches: options.includeMatches ?? true,
      minMatchCharLength: options.minMatchCharLength ?? 1,
      shouldSort: options.shouldSort ?? true,
      distance: 100,
      location: 0,
      findAllMatches: true,
    };

    return new Fuse(data, fuseOptions);
  }, [data, options]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return data.map(item => ({ item }));
    }

    const fuseResults = fuse.search(query);
    return fuseResults.map(result => ({
      item: result.item,
      score: result.score,
      matches: result.matches,
    }));
  }, [fuse, query, data]);

  return {
    query,
    setQuery,
    results,
    hasQuery: query.trim().length > 0,
  };
}