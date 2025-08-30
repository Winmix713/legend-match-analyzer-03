
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatisticsResult } from '@/types';
import { ApiError } from '@/types/api';
import { Trophy, Target, TrendingUp, Activity } from 'lucide-react';
import { StatisticsGridSkeleton } from '@/components/ui/skeleton-variants';
import { ErrorDisplay } from '@/components/ErrorDisplay';

interface StatisticsGridProps {
  statistics?: StatisticsResult;
  homeTeam: string;
  awayTeam: string;
  loading?: boolean;
  error?: ApiError;
  onRetry?: () => void;
}

export const StatisticsGrid = React.memo(({ 
  statistics, 
  homeTeam, 
  awayTeam, 
  loading = false, 
  error, 
  onRetry 
}: StatisticsGridProps) => {
  // Show loading skeleton
  if (loading) {
    return <StatisticsGridSkeleton />;
  }

  // Show error state
  if (error) {
    return (
      <ErrorDisplay 
        error={error} 
        onRetry={onRetry}
        className="max-w-md mx-auto"
      />
    );
  }

  // Show empty state
  if (!statistics) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nincs statisztikai adat</p>
      </div>
    );
  }
  const stats = [
    {
      title: 'Összes meccs',
      value: statistics.total_matches,
      icon: Activity,
      color: 'text-primary'
    },
    {
      title: 'Hazai győzelem',
      value: statistics.home_wins,
      icon: Trophy,
      color: 'text-primary',
      percentage: statistics.win_percentage.home
    },
    {
      title: 'Vendég győzelem',
      value: statistics.away_wins,
      icon: Trophy,
      color: 'text-secondary',
      percentage: statistics.win_percentage.away
    },
    {
      title: 'Döntetlen',
      value: statistics.draws,
      icon: Target,
      color: 'text-muted-foreground',
      percentage: statistics.win_percentage.draw
    },
    {
      title: 'Átlag gól/meccs',
      value: statistics.average_goals_per_match.toFixed(1),
      icon: TrendingUp,
      color: 'text-accent'
    },
    {
      title: 'Gólkülönbség',
      value: `${statistics.home_goals} - ${statistics.away_goals}`,
      icon: Target,
      color: 'text-foreground'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="card-stat group">
            <div className="flex items-center justify-between mb-4">
              <Icon className={`w-6 h-6 ${stat.color}`} />
              {stat.percentage !== undefined && (
                <Badge variant="secondary" className="glass-light">
                  {stat.percentage.toFixed(1)}%
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-foreground group-hover:text-gradient transition-all">
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground">
                {stat.title}
              </p>
            </div>
          </Card>
        );
      })}
    </div>
  );
});

StatisticsGrid.displayName = 'StatisticsGrid';
