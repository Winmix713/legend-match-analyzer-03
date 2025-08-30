import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { performance_utils } from "@/lib/performance-utils"
import { Cpu, HardDrive, Zap, TrendingUp } from "lucide-react"

interface PerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: {
    used: number
    total: number
    percentage: number
  } | null
  bundleSize: number
  cacheHitRate: number
  fps: number
}

export const PerformanceMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: null,
    bundleSize: 0,
    cacheHitRate: 0,
    fps: 60
  })

  const [isVisible, setIsVisible] = useState(false)
  const [frameCount, setFrameCount] = useState(0)

  useEffect(() => {
    // Only show in development mode
    if (process.env.NODE_ENV !== 'development') return

    const measureMetrics = performance_utils.measureAsync(async () => {
      const memory = performance_utils.getMemoryUsage()
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      return {
        loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        renderTime: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
        memoryUsage: memory ? {
          used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
          percentage: Math.round(memory.usagePercentage)
        } : null,
        bundleSize: 0, // Would be calculated by build tools
        cacheHitRate: 85, // Mock value - would be tracked in real implementation
        fps: 60
      }
    }, 'Performance Metrics Calculation')

    measureMetrics().then(setMetrics).catch(console.error)

    // FPS monitoring
    let lastTime = performance.now()
    let frames = 0
    
    const measureFPS = (currentTime: number) => {
      frames++
      
      if (currentTime - lastTime >= 1000) {
        setMetrics(prev => ({
          ...prev,
          fps: Math.round((frames * 1000) / (currentTime - lastTime))
        }))
        frames = 0
        lastTime = currentTime
      }
      
      setFrameCount(prev => prev + 1)
      requestAnimationFrame(measureFPS)
    }
    
    const rafId = requestAnimationFrame(measureFPS)

    // Toggle visibility with keyboard shortcut
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(!isVisible)
      }
    }

    window.addEventListener('keydown', handleKeydown)
    
    return () => {
      window.removeEventListener('keydown', handleKeydown)
      cancelAnimationFrame(rafId)
    }
  }, [isVisible])

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null
  }

  const getPerformanceStatus = (value: number, thresholds: { good: number; poor: number }) => {
    if (value <= thresholds.good) return 'good'
    if (value <= thresholds.poor) return 'needs-improvement'
    return 'poor'
  }

  const formatTime = (ms: number) => `${ms.toFixed(0)}ms`

  return (
    <Card className="fixed bottom-4 right-4 w-80 glass border-primary/20 z-50 animate-slide-up">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-primary" />
            Performance Monitor
          </div>
          <Badge variant="outline" className="text-xs bg-primary/20 text-primary">
            DEV
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Load Time */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              <span>Load Time</span>
            </div>
            <Badge 
              variant={getPerformanceStatus(metrics.loadTime, { good: 1500, poor: 3000 }) === 'good' ? 'default' : 'destructive'}
              className="text-xs"
            >
              {formatTime(metrics.loadTime)}
            </Badge>
          </div>
          <Progress 
            value={Math.min((metrics.loadTime / 3000) * 100, 100)} 
            className="h-1"
          />
        </div>

        {/* FPS */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <div className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <span>FPS</span>
            </div>
            <Badge 
              variant={metrics.fps >= 50 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {metrics.fps} fps
            </Badge>
          </div>
          <Progress 
            value={(metrics.fps / 60) * 100} 
            className="h-1"
          />
        </div>

        {/* Memory Usage */}
        {metrics.memoryUsage && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <div className="flex items-center gap-1">
                <HardDrive className="w-3 h-3" />
                <span>Memory</span>
              </div>
              <Badge 
                variant={metrics.memoryUsage.percentage > 80 ? 'destructive' : 'default'}
                className="text-xs"
              >
                {metrics.memoryUsage.used}MB
              </Badge>
            </div>
            <Progress 
              value={metrics.memoryUsage.percentage} 
              className="h-1"
            />
          </div>
        )}

        {/* Cache Hit Rate */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>Cache Hit Rate</span>
            <Badge 
              variant={metrics.cacheHitRate > 80 ? 'default' : 'destructive'}
              className="text-xs"
            >
              {metrics.cacheHitRate}%
            </Badge>
          </div>
          <Progress 
            value={metrics.cacheHitRate} 
            className="h-1"
          />
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t border-white/10">
          Press Ctrl+Shift+P to toggle
        </div>
      </CardContent>
    </Card>
  )
}

export default PerformanceMetrics