
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Match } from '@/types';
import { ApiError } from '@/types/api';
import { Calendar, MapPin, Trophy } from 'lucide-react';
import { MatchesTableSkeleton } from '@/components/ui/skeleton-variants';
import { ErrorDisplay } from '@/components/ErrorDisplay';

interface MatchesTableProps {
  matches?: Match[];
  homeTeam: string;
  awayTeam: string;
  loading?: boolean;
  error?: ApiError;
  onRetry?: () => void;
}

export const MatchesTable = ({ 
  matches, 
  homeTeam, 
  awayTeam, 
  loading = false, 
  error, 
  onRetry 
}: MatchesTableProps) => {
  // Show loading skeleton
  if (loading) {
    return <MatchesTableSkeleton />;
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
  if (!matches || matches.length === 0) {
    return (
      <Card className="glass p-12 text-center">
        <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Nincs mérkőzés adat
        </h3>
        <p className="text-muted-foreground">
          A megadott csapatok között nem találtunk mérkőzéseket
        </p>
      </Card>
    );
  }
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

  return (
    <Card className="glass p-6">
      <div className="flex items-center gap-2 mb-6">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="text-legend text-foreground">
          Meccseredmények
        </h3>
      </div>

      <div className="space-y-4">
        {matches.slice(0, 10).map((match, index) => (
          <div
            key={match.id}
            className="glass-light rounded-xl p-4 hover:bg-white/10 transition-all duration-300 animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {formatDate(match.match_time)}
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
                {getResultBadge(getMatchResult(match))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {matches.length > 10 && (
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            És még {matches.length - 10} meccs...
          </p>
        </div>
      )}
    </Card>
  );
};
