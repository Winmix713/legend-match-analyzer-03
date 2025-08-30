import { useEffect, useRef, useState } from 'react'
import { performance_utils } from '@/lib/performance-utils'

interface PerformanceData {
  fps: number
  memoryUsage: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
    usagePercentage: number
  } | null
  longTasks: number
  renderTime: number
  networkLatency: number
}

export const usePerformanceMonitor = (enabled: boolean = process.env.NODE_ENV === 'development') => {
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    fps: 60,
    memoryUsage: null,
    longTasks: 0,
    renderTime: 0,
    networkLatency: 0
  })

  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const longTaskCount = useRef(0)
  const rafId = useRef<number>()
  const disconnectLongTaskObserver = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!enabled) return

    // FPS monitoring
    const measureFPS = () => {
      frameCount.current++
      const currentTime = performance.now()
      
      if (currentTime - lastTime.current >= 1000) {
        const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current))
        
        setPerformanceData(prev => ({
          ...prev,
          fps,
          memoryUsage: performance_utils.getMemoryUsage()
        }))

        frameCount.current = 0
        lastTime.current = currentTime
      }

      rafId.current = requestAnimationFrame(measureFPS)
    }

    // Start FPS monitoring
    rafId.current = requestAnimationFrame(measureFPS)

    // Long task monitoring
    disconnectLongTaskObserver.current = performance_utils.detectLongTasks(50)

    // Custom long task counter
    const originalConsoleWarn = console.warn
    console.warn = (...args) => {
      if (args[0]?.includes?.('Long task detected')) {
        longTaskCount.current++
        setPerformanceData(prev => ({
          ...prev,
          longTasks: longTaskCount.current
        }))
      }
      originalConsoleWarn(...args)
    }

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
      if (disconnectLongTaskObserver.current) {
        disconnectLongTaskObserver.current()
      }
      console.warn = originalConsoleWarn
    }
  }, [enabled])

  const measureRenderTime = <T,>(component: string, fn: () => T): T => {
    if (!enabled) return fn()

    const startTime = performance.now()
    const result = fn()
    const endTime = performance.now()
    const renderTime = endTime - startTime

    setPerformanceData(prev => ({
      ...prev,
      renderTime: Math.max(prev.renderTime, renderTime)
    }))

    if (renderTime > 16) {
      console.warn(`Slow render detected in ${component}: ${renderTime.toFixed(2)}ms`)
    }

    return result
  }

  const measureNetworkLatency = async (url: string): Promise<number> => {
    if (!enabled) return 0

    const startTime = performance.now()
    
    try {
      await fetch(url, { method: 'HEAD', mode: 'no-cors' })
      const endTime = performance.now()
      const latency = endTime - startTime
      
      setPerformanceData(prev => ({
        ...prev,
        networkLatency: latency
      }))
      
      return latency
    } catch (error) {
      console.warn('Network latency measurement failed:', error)
      return 0
    }
  }

  const markPerformance = (name: string) => {
    if (enabled && 'mark' in performance) {
      performance.mark(name)
    }
  }

  const measurePerformance = (name: string, startMark: string, endMark?: string) => {
    if (enabled && 'measure' in performance) {
      if (endMark) {
        performance.measure(name, startMark, endMark)
      } else {
        performance.mark(`${startMark}-end`)
        performance.measure(name, startMark, `${startMark}-end`)
      }
    }
  }

  const getPerformanceEntries = (type?: string) => {
    if (!enabled || !('getEntriesByType' in performance)) return []
    
    return type 
      ? performance.getEntriesByType(type)
      : performance.getEntries()
  }

  const clearPerformanceData = () => {
    if (enabled && 'clearMarks' in performance) {
      performance.clearMarks()
      performance.clearMeasures()
    }
    
    longTaskCount.current = 0
    setPerformanceData(prev => ({
      ...prev,
      longTasks: 0,
      renderTime: 0,
      networkLatency: 0
    }))
  }

  const getWebVitals = () => {
    if (!enabled || !('getEntriesByType' in performance)) return null

    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paintEntries = performance.getEntriesByType('paint')
    
    if (!navigationEntry) return null

    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    const largestContentfulPaint = performance.getEntriesByType('largest-contentful-paint')[0]

    return {
      // Time to First Byte
      ttfb: navigationEntry.responseStart - navigationEntry.fetchStart,
      
      // First Contentful Paint
      fcp: firstContentfulPaint ? firstContentfulPaint.startTime : 0,
      
      // Largest Contentful Paint
      lcp: largestContentfulPaint ? largestContentfulPaint.startTime : 0,
      
      // DOM Content Loaded
      domContentLoaded: navigationEntry.domContentLoadedEventEnd - navigationEntry.fetchStart,
      
      // Load Complete
      loadComplete: navigationEntry.loadEventEnd - navigationEntry.fetchStart
    }
  }

  return {
    performanceData,
    measureRenderTime,
    measureNetworkLatency,
    markPerformance,
    measurePerformance,
    getPerformanceEntries,
    getWebVitals,
    clearPerformanceData,
    isEnabled: enabled
  }
}

export default usePerformanceMonitor