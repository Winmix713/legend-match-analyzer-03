import { lazy } from 'react';

// Lazy load heavy components to improve initial bundle size
export const LazyStatisticsGrid = lazy(() => 
  import('@/components/StatisticsGrid').then(module => ({
    default: module.StatisticsGrid
  }))
);

export const LazyLegendModeCard = lazy(() => 
  import('@/components/LegendModeCard').then(module => ({
    default: module.LegendModeCard
  }))
);

export const LazyVirtualizedTable = lazy(() => 
  import('@/components/VirtualizedTable').then(module => ({
    default: module.VirtualizedTable
  }))
);

export const LazyPerformanceMetrics = lazy(() => 
  import('@/components/PerformanceMetrics').then(module => ({
    default: module.PerformanceMetrics
  }))
);

export const LazyExportDialog = lazy(() => 
  import('@/components/ExportDialog').then(module => ({
    default: module.ExportDialog
  }))
);

// Preload functions for eager loading of critical components
export const preloadStatisticsGrid = () => import('@/components/StatisticsGrid');
export const preloadLegendModeCard = () => import('@/components/LegendModeCard');
export const preloadVirtualizedTable = () => import('@/components/VirtualizedTable');

// Utility function to preload multiple components
export const preloadCriticalComponents = async () => {
  try {
    await Promise.all([
      preloadStatisticsGrid(),
      preloadLegendModeCard(),
      preloadVirtualizedTable()
    ]);
    console.log('Critical components preloaded successfully');
  } catch (error) {
    console.warn('Failed to preload some components:', error);
  }
};

// Component preloading based on user interaction
export const preloadOnHover = (componentLoader: () => Promise<any>) => {
  let preloaded = false;
  
  return {
    onMouseEnter: () => {
      if (!preloaded) {
        preloaded = true;
        componentLoader().catch(console.warn);
      }
    }
  };
};

// Intersection observer based preloading
export const preloadOnVisible = (componentLoader: () => Promise<any>, threshold = 0.1) => {
  return (element: Element | null) => {
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            componentLoader().catch(console.warn);
            observer.unobserve(element);
          }
        });
      },
      { threshold }
    );
    
    observer.observe(element);
    
    return () => observer.unobserve(element);
  };
};