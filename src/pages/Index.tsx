import { useState } from 'react';
import { SearchInterface } from '@/components/SearchInterface';
import { StatisticsGrid } from '@/components/StatisticsGrid';
import { MatchesTable } from '@/components/MatchesTable';
import { LegendModeCard } from '@/components/LegendModeCard';
import { PredictionsPanel } from '@/components/PredictionsPanel';
import { AdvancedPredictionsPanel } from '@/components/predictions/AdvancedPredictionsPanel';
import { PredictionAccuracyTracker } from '@/components/predictions/PredictionAccuracyTracker';
import { MLPredictionEngine } from '@/components/predictions/MLPredictionEngine';
import { UserMenu } from '@/components/auth/UserMenu';
import { Button } from '@/components/ui/button';
import { Match, StatisticsResult, LegendModeData } from '@/types';
import { ApiError } from '@/types/api';
import { matchService } from '@/services/matchService';
import { useToast } from '@/hooks/use-toast';
import { useRetry } from '@/hooks/useRetry';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { SearchLoadingOverlay } from '@/components/LoadingOverlay';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { usePredictions } from '@/hooks/usePredictions';
import { BarChart3, Users, Settings } from 'lucide-react';
import { OptimizedAdvancedPredictionsPanel } from '@/components/predictions/OptimizedAdvancedPredictionsPanel';

const Index = () => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [searchMode, setSearchMode] = useState<"pairing" | "return-matches">("return-matches");
  const [matches, setMatches] = useState<Match[]>([]);
  const [statistics, setStatistics] = useState<StatisticsResult | null>(null);
  const [legendData, setLegendData] = useState<LegendModeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    statistics: false,
    matches: false,
    legend: false
  });
  const [errors, setErrors] = useState({
    statistics: null as ApiError | null,
    matches: null as ApiError | null,
    legend: null as ApiError | null
  });
  
  const { toast } = useToast();
  const { handleError, handleSuccess } = useErrorHandler();
  const { profile, hasPermission } = useAuth();
  const navigate = useNavigate();

  // Predictions hook
  const { 
    prediction, 
    loading: predictionLoading, 
    calculateBaselinePrediction 
  } = usePredictions({ 
    homeTeam, 
    awayTeam, 
    enableRealTime: true, 
    enableBaseline: true 
  });

  // Create retry-enabled service calls
  const { execute: executeSearch, isRetrying, attempt, maxAttempts } = useRetry(
    async (homeTeam: string, awayTeam: string) => {
      const realMatches = await matchService.getMatchesBetweenTeams(homeTeam, awayTeam);
      const realStats = matchService.calculateStatistics(realMatches, homeTeam, awayTeam);
      const realLegend = matchService.calculateLegendMode(realMatches, homeTeam, awayTeam);
      
      return { realMatches, realStats, realLegend };
    },
    {
      maxAttempts: 3,
      delay: 1000,
      onError: (error, attempt) => {
        console.log(`Search attempt ${attempt} failed:`, error.message);
      }
    }
  );

  const handleSearch = async () => {
    if (!homeTeam?.trim() || !awayTeam?.trim()) {
      toast({
        title: "Hiányzó adatok",
        description: "Kérlek add meg mindkét csapat nevét!",
        variant: "destructive"
      });
      return;
    }

    // Reset states
    setLoading(true);
    setMatches([]);
    setStatistics(null);
    setLegendData(null);
    setLoadingStates({ statistics: true, matches: true, legend: true });
    setErrors({ statistics: null, matches: null, legend: null });
    
    try {
      // Progressive loading: fetch matches first
      setLoadingStates(prev => ({ ...prev, matches: true }));
      const realMatches = await matchService.getMatchesBetweenTeams(homeTeam.trim(), awayTeam.trim(), { searchMode });
      setMatches(realMatches);
      setLoadingStates(prev => ({ ...prev, matches: false }));
      
      // Then calculate statistics
      setLoadingStates(prev => ({ ...prev, statistics: true }));
      const realStats = matchService.calculateStatistics(realMatches, homeTeam, awayTeam);
      setStatistics(realStats);
      setLoadingStates(prev => ({ ...prev, statistics: false }));
      
      // Finally calculate legend mode
      setLoadingStates(prev => ({ ...prev, legend: true }));
      const realLegend = matchService.calculateLegendMode(realMatches, homeTeam, awayTeam);
      setLegendData(realLegend);
      setLoadingStates(prev => ({ ...prev, legend: false }));
      
      // Calculate baseline prediction if no backend prediction available
      console.log('Checking prediction state:', prediction, 'matches count:', realMatches.length);
      if (!prediction || 'calculation_method' in prediction) {
        console.log('Triggering baseline calculation with', realMatches.length, 'matches');
        calculateBaselinePrediction(realMatches);
      }
      
      handleSuccess("Elemzés kész!", `${realMatches.length} meccs adatait elemeztük az adatbázisból.`);
    } catch (error) {
      const apiError = handleError(error, { showToast: true }, 'search');
      setErrors({ 
        statistics: apiError.error, 
        matches: apiError.error, 
        legend: apiError.error 
      });
      setLoadingStates({ statistics: false, matches: false, legend: false });
    } finally {
      setLoading(false);
    }
  };

  const retryStatistics = () => {
    if (matches.length > 0) {
      setLoadingStates(prev => ({ ...prev, statistics: true }));
      setErrors(prev => ({ ...prev, statistics: null }));
      try {
        const realStats = matchService.calculateStatistics(matches, homeTeam, awayTeam);
        setStatistics(realStats);
        setLoadingStates(prev => ({ ...prev, statistics: false }));
      } catch (error) {
        const apiError = handleError(error, { showToast: true }, 'statistics calculation');
        setErrors(prev => ({ ...prev, statistics: apiError.error }));
        setLoadingStates(prev => ({ ...prev, statistics: false }));
      }
    }
  };

  const retryLegend = () => {
    if (matches.length > 0) {
      setLoadingStates(prev => ({ ...prev, legend: true }));
      setErrors(prev => ({ ...prev, legend: null }));
      try {
        const realLegend = matchService.calculateLegendMode(matches, homeTeam, awayTeam);
        setLegendData(realLegend);
        setLoadingStates(prev => ({ ...prev, legend: false }));
      } catch (error) {
        const apiError = handleError(error, { showToast: true }, 'legend mode calculation');
        setErrors(prev => ({ ...prev, legend: apiError.error }));
        setLoadingStates(prev => ({ ...prev, legend: false }));
      }
    }
  };

  return (
    <div className="min-h-screen p-4 space-y-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header with Navigation */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <h1 className="text-2xl font-bold">Football Analytics</h1>
            <nav className="flex items-center gap-4">
              {hasPermission('view_analytics') && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/analytics')}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </Button>
              )}
              {profile?.role === 'admin' && (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/admin')}
                  className="flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Admin
                </Button>
              )}
            </nav>
          </div>
          <UserMenu />
        </header>

        {/* Search Interface */}
        <div className="mb-12">
          <SearchInterface
            homeTeam={homeTeam}
            awayTeam={awayTeam}
            onHomeTeamChange={setHomeTeam}
            onAwayTeamChange={setAwayTeam}
            onSearch={handleSearch}
            loading={loading}
            searchMode={searchMode}
            onSearchModeChange={setSearchMode}
          />
        </div>

        {/* Results */}
        {(statistics || matches.length > 0 || loading || Object.values(loadingStates).some(Boolean)) && (
          <div className="space-y-8">
            {/* Advanced Predictions */}
            {(homeTeam && awayTeam) && (
              <div className="animate-fade-in space-y-6">
                <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                  AI Előrejelzés Rendszer
                </h2>
                <div className="grid gap-6 max-w-7xl mx-auto">
                  <OptimizedAdvancedPredictionsPanel
                    prediction={prediction}
                    homeTeam={homeTeam}
                    awayTeam={awayTeam}
                    loading={predictionLoading}
                  />
                  <div className="grid md:grid-cols-2 gap-6">
                    <PredictionAccuracyTracker />
                    <MLPredictionEngine 
                      homeTeam={homeTeam}
                      awayTeam={awayTeam}
                      features={prediction ? {
                        home_team_form: 75,
                        away_team_form: 68,
                        home_advantage: 0.6,
                        head_to_head_ratio: 0.5,
                        avg_goals_home: 1.8,
                        avg_goals_away: 1.4,
                        recent_meetings: 5,
                        home_offensive_strength: 1.1,
                        away_offensive_strength: 0.9,
                        home_defensive_strength: 1.0,
                        away_defensive_strength: 1.2
                      } : undefined}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Grid */}
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
                Statisztikai Áttekintés
              </h2>
              <StatisticsGrid
                statistics={statistics}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                loading={loadingStates.statistics}
                error={errors.statistics}
                onRetry={retryStatistics}
              />
            </div>

            {/* Legend Mode */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <LegendModeCard
                data={legendData}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                loading={loadingStates.legend}
                error={errors.legend}
                onRetry={retryLegend}
                isPremium={true}
              />
            </div>

            {/* Matches Table */}
            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <MatchesTable
                matches={matches}
                homeTeam={homeTeam}
                awayTeam={awayTeam}
                loading={loadingStates.matches}
                error={errors.matches}
                onRetry={handleSearch}
              />
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <SearchLoadingOverlay 
            isVisible={loading}
            teamNames={homeTeam && awayTeam ? { home: homeTeam, away: awayTeam } : undefined}
            variant="inline"
          />
        )}

        {/* Empty State */}
        {!statistics && !loading && !matches.length && !Object.values(errors).some(Boolean) && (
          <div className="text-center py-20">
            <div className="animate-float">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
                <div className="text-4xl">⚽</div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-muted-foreground mb-2">
              Kezdj egy keresést
            </h3>
            <p className="text-muted-foreground">
              Add meg a csapatok nevét a részletes elemzéshez
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
