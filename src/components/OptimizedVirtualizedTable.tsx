import React, { memo, useMemo, useCallback } from "react"
import { FixedSizeList as List } from "react-window"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { Match } from "@/types"
import { Calendar, MapPin } from "lucide-react"

interface OptimizedVirtualizedTableProps {
  matches: Match[]
  height?: number
  itemHeight?: number
  className?: string
  homeTeam: string
  awayTeam: string
}

interface RowProps {
  index: number
  style: React.CSSProperties
  data: {
    matches: Match[]
    homeTeam: string
    awayTeam: string
  }
}

// Memoized row component with optimized calculations
const OptimizedVirtualizedRow = memo(({ index, style, data }: RowProps) => {
  const { matches, homeTeam, awayTeam } = data
  const match = matches[index]
  
  const matchData = useMemo(() => {
    const getMatchResult = (match: Match) => {
      if (match.full_time_home_goals > match.full_time_away_goals) {
        return 'HOME_WIN';
      } else if (match.full_time_home_goals < match.full_time_away_goals) {
        return 'AWAY_WIN';
      }
      return 'DRAW';
    };

    const getResultBadge = (result: string) => {
      switch (result) {
        case 'HOME_WIN':
          return <Badge className="bg-primary/20 text-primary border-primary/30">H</Badge>;
        case 'AWAY_WIN':
          return <Badge className="bg-secondary/20 text-secondary border-secondary/30">V</Badge>;
        default:
          return <Badge variant="secondary" className="glass-light">D</Badge>;
      }
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return {
      result: getMatchResult(match),
      resultBadge: getResultBadge(getMatchResult(match)),
      formattedDate: formatDate(match.match_time)
    };
  }, [match]);
  
  return (
    <div style={style} className="px-6">
      <div className="glass-light rounded-xl p-4 hover:bg-white/10 transition-all duration-300 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {matchData.formattedDate}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {match.league}
            </div>
          </div>

          <div className="text-center">
            <p className="font-medium text-foreground">
              {match.home_team}
            </p>
            <p className="text-sm text-muted-foreground">Hazai</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {match.full_time_home_goals}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({match.half_time_home_goals})
                </p>
              </div>
              <div className="text-muted-foreground">-</div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">
                  {match.full_time_away_goals}
                </p>
                <p className="text-xs text-muted-foreground">
                  ({match.half_time_away_goals})
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="font-medium text-foreground">
              {match.away_team}
            </p>
            <p className="text-sm text-muted-foreground">Vendég</p>
            {matchData.resultBadge}
          </div>
        </div>
      </div>
    </div>
  )
})

OptimizedVirtualizedRow.displayName = "OptimizedVirtualizedRow"

// Memoized empty state
const EmptyState = memo(() => (
  <div className="text-center py-8 text-muted-foreground">
    Nincsenek megjeleníthető meccsek
  </div>
))
EmptyState.displayName = "EmptyState"

// Memoized table content
const VirtualizedTableContent = memo(({
  matches,
  height,
  itemHeight,
  className,
  homeTeam,
  awayTeam
}: OptimizedVirtualizedTableProps) => {
  const memoizedData = useMemo(() => ({
    matches,
    homeTeam,
    awayTeam
  }), [matches, homeTeam, awayTeam])

  const listHeight = useMemo(() => 
    Math.min(height!, matches.length * itemHeight!), 
    [height, matches.length, itemHeight]
  )

  return (
    <Card className={`glass ${className}`}>
      <div className="p-6 pb-2">
        <h3 className="text-legend text-foreground mb-4">
          Meccseredmények (Virtualizálva)
        </h3>
      </div>
      
      <List
        height={listHeight}
        width="100%"
        itemCount={matches.length}
        itemSize={itemHeight!}
        itemData={memoizedData}
        overscanCount={3}
        className="scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent"
      >
        {OptimizedVirtualizedRow}
      </List>
      
      {matches.length > 50 && (
        <div className="p-4 text-center text-sm text-muted-foreground border-t border-white/10">
          Virtualizálva: {matches.length} meccs
        </div>
      )}
    </Card>
  )
})
VirtualizedTableContent.displayName = "VirtualizedTableContent"

export const OptimizedVirtualizedTable = memo(({
  matches,
  height = 600,
  itemHeight = 120,
  className,
  homeTeam,
  awayTeam
}: OptimizedVirtualizedTableProps) => {
  // Stable condition checking with useMemo
  const hasMatches = useMemo(() => matches.length > 0, [matches.length])

  if (!hasMatches) {
    return <EmptyState />
  }

  return (
    <VirtualizedTableContent
      matches={matches}
      height={height}
      itemHeight={itemHeight}
      className={className}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
    />
  )
})

OptimizedVirtualizedTable.displayName = "OptimizedVirtualizedTable"

export default OptimizedVirtualizedTable