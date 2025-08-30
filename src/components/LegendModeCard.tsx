
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LegendModeData } from '@/types';
import { ApiError } from '@/types/api';
import { Zap, TrendingUp, Target, Award, Lock } from 'lucide-react';
import { LegendModeCardSkeleton } from '@/components/ui/skeleton-variants';
import { ErrorDisplay } from '@/components/ErrorDisplay';

interface LegendModeCardProps {
  data?: LegendModeData;
  homeTeam: string;
  awayTeam: string;
  loading?: boolean;
  error?: ApiError;
  onRetry?: () => void;
  isPremium?: boolean;
}

export const LegendModeCard = ({ 
  data, 
  homeTeam, 
  awayTeam, 
  loading = false, 
  error, 
  onRetry,
  isPremium = true 
}: LegendModeCardProps) => {
  // Show loading skeleton
  if (loading) {
    return <LegendModeCardSkeleton />;
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

  // Show premium locked state
  if (!isPremium) {
    return (
      <Card className="glass p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-accent/20 rounded-full flex items-center justify-center">
          <Lock className="w-8 h-8 text-accent" />
        </div>
        <h3 className="text-legend text-gradient mb-2">
          LEGEND MODE Elemzés
        </h3>
        <p className="text-muted-foreground mb-4">
          Ez a fejlett elemzés csak premium felhasználók számára érhető el
        </p>
        <Badge className="bg-accent/20 text-accent border-accent/30">
          PREMIUM SZÜKSÉGES
        </Badge>
      </Card>
    );
  }

  // Show empty state
  if (!data) {
    return (
      <Card className="glass p-12 text-center">
        <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Legend Mode adat hiányzik
        </h3>
        <p className="text-muted-foreground">
          Nincs elegendő adat a fejlett elemzéshez
        </p>
      </Card>
    );
  }
  return (
    <Card className="glass p-6 animate-float">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-6 h-6 text-accent animate-glow" />
        <h3 className="text-legend text-gradient">
          LEGEND MODE Elemzés
        </h3>
        <Badge className="bg-accent/20 text-accent border-accent/30 animate-pulse">
          PREMIUM
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Comeback Analysis */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Comeback Képesség
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{homeTeam}</span>
              <Badge variant="secondary" className="glass-light">
                {data.comeback_analysis.home_comebacks} comeback
              </Badge>
            </div>
            <Progress 
              value={(data.comeback_analysis.home_comebacks / 10) * 100} 
              className="h-2"
            />
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">{awayTeam}</span>
              <Badge variant="secondary" className="glass-light">
                {data.comeback_analysis.away_comebacks} comeback
              </Badge>
            </div>
            <Progress 
              value={(data.comeback_analysis.away_comebacks / 10) * 100} 
              className="h-2"
            />
          </div>

          {data.comeback_analysis.biggest_comeback && (
            <div className="glass-light rounded-lg p-3">
              <p className="text-xs text-muted-foreground mb-1">Legnagyobb comeback:</p>
              <p className="text-sm font-medium text-foreground">
                {data.comeback_analysis.biggest_comeback.deficit} gól hátrányból
              </p>
            </div>
          )}
        </div>

        {/* Performance Trends */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-secondary" />
            Teljesítmény Trendek
          </h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Jelenlegi forma</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={data.performance_trends.recent_form} 
                  className="w-16 h-2"
                />
                <span className="text-sm font-medium text-foreground">
                  {data.performance_trends.recent_form}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Hazai előny</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={data.performance_trends.home_advantage} 
                  className="w-16 h-2"
                />
                <span className="text-sm font-medium text-foreground">
                  {data.performance_trends.home_advantage}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Vendég teljesítmény</span>
              <div className="flex items-center gap-2">
                <Progress 
                  value={data.performance_trends.away_performance} 
                  className="w-16 h-2"
                />
                <span className="text-sm font-medium text-foreground">
                  {data.performance_trends.away_performance}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Head to Head Summary */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-foreground">
              Egymás elleni mérleg
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-primary font-medium">
              {data.head_to_head.home_wins}W
            </span>
            <span className="text-muted-foreground">
              {data.head_to_head.draws}D
            </span>
            <span className="text-secondary font-medium">
              {data.head_to_head.away_wins}W
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};
