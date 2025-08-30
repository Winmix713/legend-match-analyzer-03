import { useState, useEffect, useMemo, useCallback } from 'react';

interface VirtualizationOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  buffer?: number;
}

interface VirtualizationResult {
  visibleRange: {
    start: number;
    end: number;
  };
  totalHeight: number;
  offsetY: number;
  scrollToIndex: (index: number) => void;
}

export function useVirtualization<T>(
  items: T[],
  options: VirtualizationOptions
): VirtualizationResult {
  const { itemHeight, containerHeight, overscan = 5, buffer = 10 } = options;
  
  const [scrollTop, setScrollTop] = useState(0);
  
  const totalHeight = useMemo(() => items.length * itemHeight, [items.length, itemHeight]);
  
  const visibleRange = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
    
    return { start, end };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);

  const offsetY = useMemo(() => visibleRange.start * itemHeight, [visibleRange.start, itemHeight]);

  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    setScrollTop(Math.max(0, Math.min(targetScrollTop, totalHeight - containerHeight)));
  }, [itemHeight, totalHeight, containerHeight]);

  return {
    visibleRange,
    totalHeight,
    offsetY,
    scrollToIndex
  };
}

// Hook for dynamic item heights
export function useDynamicVirtualization<T>(
  items: T[],
  getItemHeight: (index: number, item: T) => number,
  containerHeight: number,
  overscan: number = 5
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemPositions, setItemPositions] = useState<number[]>([]);

  // Calculate item positions and total height
  const { totalHeight, positions } = useMemo(() => {
    const positions: number[] = [0];
    let totalHeight = 0;

    for (let i = 0; i < items.length; i++) {
      const height = getItemHeight(i, items[i]);
      totalHeight += height;
      positions.push(totalHeight);
    }

    return { totalHeight, positions };
  }, [items, getItemHeight]);

  // Find visible range based on positions
  const visibleRange = useMemo(() => {
    let start = 0;
    let end = items.length - 1;

    // Binary search for start index
    for (let i = 0; i < positions.length - 1; i++) {
      if (positions[i] <= scrollTop && positions[i + 1] > scrollTop) {
        start = Math.max(0, i - overscan);
        break;
      }
    }

    // Find end index
    const viewportBottom = scrollTop + containerHeight;
    for (let i = start; i < positions.length - 1; i++) {
      if (positions[i + 1] >= viewportBottom) {
        end = Math.min(items.length - 1, i + overscan);
        break;
      }
    }

    return { start, end };
  }, [scrollTop, containerHeight, overscan, positions, items.length]);

  const offsetY = positions[visibleRange.start] || 0;

  const scrollToIndex = useCallback((index: number) => {
    if (index >= 0 && index < positions.length - 1) {
      setScrollTop(positions[index]);
    }
  }, [positions]);

  return {
    visibleRange,
    totalHeight,
    offsetY,
    scrollToIndex,
    setScrollTop
  };
}