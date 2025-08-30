// Performance utilities and optimizations

// Web Worker utilities
export class WorkerManager {
  private workers: Map<string, Worker> = new Map();
  private taskQueue: Map<string, { resolve: Function; reject: Function; timeout?: NodeJS.Timeout }> = new Map();

  createWorker(name: string, workerScript: string): Worker {
    if (this.workers.has(name)) {
      return this.workers.get(name)!;
    }

    const worker = new Worker(workerScript, { type: 'module' });
    
    worker.onmessage = (event) => {
      const { id, type, payload, error, progress } = event.data;
      
      if (type === 'READY') {
        console.log(`Worker ${name} is ready`);
        return;
      }
      
      const task = this.taskQueue.get(id);
      if (!task) return;

      switch (type) {
        case 'SUCCESS':
          if (task.timeout) clearTimeout(task.timeout);
          this.taskQueue.delete(id);
          task.resolve(payload);
          break;
          
        case 'ERROR':
          if (task.timeout) clearTimeout(task.timeout);
          this.taskQueue.delete(id);
          task.reject(new Error(error));
          break;
          
        case 'PROGRESS':
          // Progress updates can be handled by custom callbacks
          break;
      }
    };

    worker.onerror = (error) => {
      console.error(`Worker ${name} error:`, error);
    };

    this.workers.set(name, worker);
    return worker;
  }

  async executeTask<T>(
    workerName: string, 
    taskType: string, 
    payload: any, 
    timeout: number = 30000
  ): Promise<T> {
    const worker = this.workers.get(workerName);
    if (!worker) {
      throw new Error(`Worker ${workerName} not found`);
    }

    const taskId = `${workerName}_${Date.now()}_${Math.random()}`;
    
    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.taskQueue.delete(taskId);
        reject(new Error(`Worker task timed out after ${timeout}ms`));
      }, timeout);

      this.taskQueue.set(taskId, { resolve, reject, timeout: timeoutId });
      
      worker.postMessage({
        id: taskId,
        type: taskType,
        payload
      });
    });
  }

  terminateWorker(name: string): void {
    const worker = this.workers.get(name);
    if (worker) {
      worker.terminate();
      this.workers.delete(name);
    }
  }

  terminateAll(): void {
    this.workers.forEach((worker, name) => {
      worker.terminate();
    });
    this.workers.clear();
    this.taskQueue.clear();
  }
}

// Singleton worker manager
export const workerManager = new WorkerManager();

// Performance monitoring utilities
export const performance_utils = {
  // Measure function execution time
  measureSync: <T extends any[], R>(
    fn: (...args: T) => R,
    name?: string
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (name && process.env.NODE_ENV === 'development') {
        console.log(`${name} took ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  },

  // Measure async function execution time
  measureAsync: <T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    name?: string
  ) => {
    return async (...args: T): Promise<R> => {
      const start = performance.now();
      try {
        const result = await fn(...args);
        const end = performance.now();
        
        if (name && process.env.NODE_ENV === 'development') {
          console.log(`${name} took ${(end - start).toFixed(2)}ms`);
        }
        
        return result;
      } catch (error) {
        const end = performance.now();
        
        if (name && process.env.NODE_ENV === 'development') {
          console.log(`${name} failed after ${(end - start).toFixed(2)}ms`);
        }
        
        throw error;
      }
    };
  },

  // Debounce function calls
  debounce: <T extends any[]>(
    fn: (...args: T) => void,
    delay: number
  ) => {
    let timeoutId: NodeJS.Timeout;
    
    return (...args: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  },

  // Throttle function calls
  throttle: <T extends any[]>(
    fn: (...args: T) => void,
    limit: number
  ) => {
    let inThrottle: boolean;
    
    return (...args: T) => {
      if (!inThrottle) {
        fn(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Batch operations for better performance
  batch: <T>(
    items: T[],
    batchSize: number,
    processor: (batch: T[]) => void | Promise<void>,
    delay: number = 0
  ): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          await processor(batch);
          
          if (delay > 0 && i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usagePercentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
      };
    }
    return null;
  },

  // Request animation frame batching
  rafBatch: (() => {
    let callbacks: (() => void)[] = [];
    let rafId: number | null = null;

    const flush = () => {
      const toRun = callbacks;
      callbacks = [];
      rafId = null;
      
      toRun.forEach(callback => {
        try {
          callback();
        } catch (error) {
          console.error('RAF batch callback error:', error);
        }
      });
    };

    return (callback: () => void) => {
      callbacks.push(callback);
      
      if (rafId === null) {
        rafId = requestAnimationFrame(flush);
      }
    };
  })(),

  // Long task detection
  detectLongTasks: (threshold: number = 50) => {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.duration > threshold) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
          }
        });
      });

      try {
        observer.observe({ entryTypes: ['longtask'] });
        return () => observer.disconnect();
      } catch (error) {
        console.warn('Long task observation not supported');
        return () => {};
      }
    }
    
    return () => {};
  }
};

// Bundle analyzer helper (dev only)
export const bundleAnalyzer = {
  logChunkSizes: () => {
    if (process.env.NODE_ENV === 'development') {
      // This would integrate with bundler plugins
      console.log('Bundle analysis would go here in a real implementation');
    }
  },

  reportLargeModules: (threshold: number = 100000) => {
    if (process.env.NODE_ENV === 'development') {
      // Module size reporting
      console.log(`Modules larger than ${threshold} bytes would be reported here`);
    }
  }
};