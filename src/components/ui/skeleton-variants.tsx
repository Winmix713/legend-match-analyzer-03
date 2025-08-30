import { cn } from "@/lib/utils"

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

const Skeleton = ({ className, ...props }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/20", className)}
      {...props}
    />
  )
}

// Matches table skeleton variant
export const MatchesTableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="glass p-6 space-y-4">
    <div className="flex items-center gap-2 mb-6">
      <Skeleton className="h-5 w-5" />
      <Skeleton className="h-6 w-48" />
    </div>
    
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="glass-light rounded-xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          {/* Date and league */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          
          {/* Home team */}
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-24 mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
          
          {/* Score */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center space-y-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-3 w-6" />
              </div>
              <Skeleton className="h-4 w-2" />
              <div className="text-center space-y-1">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-3 w-6" />
              </div>
            </div>
          </div>
          
          {/* Away team */}
          <div className="text-center space-y-1">
            <Skeleton className="h-5 w-24 mx-auto" />
            <Skeleton className="h-4 w-16 mx-auto" />
            <Skeleton className="h-6 w-8 mx-auto" />
          </div>
        </div>
      </div>
    ))}
  </div>
)

// Statistics card skeleton
export const StatCardSkeleton = () => (
  <div className="card-stat space-y-3">
    <Skeleton className="h-6 w-24" />
    <Skeleton className="h-8 w-16" />
    <Skeleton className="h-4 w-32" />
  </div>
)

// Statistics grid skeleton
export const StatisticsGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: 8 }).map((_, i) => (
      <StatCardSkeleton key={i} />
    ))}
  </div>
)

// Legend mode card skeleton
export const LegendModeCardSkeleton = () => (
  <div className="glass rounded-2xl p-8 space-y-6">
    <div className="space-y-3">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-64" />
    </div>
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-36" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  </div>
)

// Search interface skeleton
export const SearchInterfaceSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("glass rounded-2xl p-8 space-y-6", className)}>
    <div className="text-center space-y-4">
      <Skeleton className="h-12 w-96 mx-auto" />
      <Skeleton className="h-6 w-48 mx-auto" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
    <Skeleton className="h-12 w-48 mx-auto" />
  </div>
)

export { Skeleton }