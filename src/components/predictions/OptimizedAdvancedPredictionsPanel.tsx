

import React, { memo, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Target, Zap } from 'lucide-react';
import type { Prediction } from '@/services/predictionService';
import type { PredictionResult } from '@/types/prediction';

interface OptimizedAdvancedPredictionsPanelProps {
  prediction: Prediction | PredictionResult | null;
  homeTeam: string;
  awayTeam: string;
  loading: boolean;
}

// Memoized loading skeleton to prevent re-renders
const LoadingSkeleton = memo(() => (
  <Card className="glass">
    <CardHeader>
      <div className="flex items-center gap-2">
        <Brain className="w-5 h-5" />
        <CardTitle>AI Előrejelzés</CardTitle>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center space-y-2">
            <Skeleton className="h-6 w-16 mx-auto" />
            <Skeleton className="h-4 w-12 mx-auto" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized empty state to prevent re-renders
const EmptyState = memo(() => (
  <Card className="glass">
    <CardContent className="py-8 text-center">
      <Brain className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
      <p className="text-muted-foreground">
        Előrejelzés készítése folyamatban...
      </p>
    </CardContent>
  </Card>
));

EmptyState.displayName = 'EmptyState';

// Memoized prediction content to prevent unnecessary re-renders
const PredictionContent = memo(({ 
  prediction, 
  homeTeam, 
  awayTeam 
}: { 
  prediction: Prediction | PredictionResult; 
  homeTeam: string; 
  awayTeam: string; 
}) => {
  const memoizedProbabilities = useMemo(() => {
    const homeWin = Math.round((prediction.home_win_probability || 0) * 100);
    const draw = Math.round((prediction.draw_probability || 0) * 100);
    const awayWin = Math.round((prediction.away_win_probability || 0) * 100);
    
    return { homeWin, draw, awayWin };
  }, [prediction.home_win_probability, prediction.draw_probability, prediction.away_win_probability]);

  const memoizedAdditionalStats = useMemo(() => ({
    btts: Math.round((prediction.btts_probability || 0) * 100),
    over25: Math.round((prediction.over25_probability || 0) * 100),
    confidence: Math.round((prediction.confidence_score || 0) * 100)
  }), [prediction.btts_probability, prediction.over25_probability, prediction.confidence_score]);

  const getConfidenceBadge = useMemo(() => {
    const confidence = memoizedAdditionalStats.confidence;
    if (confidence >= 80) return { variant: "default" as const, icon: CheckCircle, text: "Magas", color: "text-green-600" };
    if (confidence >= 60) return { variant: "secondary" as const, icon: Target, text: "Közepes", color: "text-yellow-600" };
    return { variant: "outline" as const, icon: AlertCircle, text: "Alacsony", color: "text-red-600" };
  }, [memoizedAdditionalStats.confidence]);

  const ConfidenceIcon = getConfidenceBadge.icon;

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            <CardTitle className="text-lg">AI Előrejelzés</CardTitle>
          </div>
          <Badge variant={getConfidenceBadge.variant} className="flex items-center gap-1">
            <ConfidenceIcon className="w-3 h-3" />
            {getConfidenceBadge.text}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Outcome Probabilities */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-2">
            <div className="text-2xl font-bold text-primary">
              {memoizedProbabilities.homeWin}%
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {homeTeam} győzelem
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-secondary">
              {memoizedProbabilities.draw}%
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              Döntetlen
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-accent">
              {memoizedProbabilities.awayWin}%
            </div>
            <div className="text-sm text-muted-foreground font-medium">
              {awayTeam} győzelem
            </div>
          </div>
        </div>

        {/* Additional Statistics */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Mindkét csapat gólja</span>
            <div className="flex items-center gap-2">
              <Progress value={memoizedAdditionalStats.btts} className="w-20 h-2" />
              <span className="text-sm font-medium w-10">{memoizedAdditionalStats.btts}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">2.5+ gól</span>
            <div className="flex items-center gap-2">
              <Progress value={memoizedAdditionalStats.over25} className="w-20 h-2" />
              <span className="text-sm font-medium w-10">{memoizedAdditionalStats.over25}%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Magabiztosság</span>
            <div className="flex items-center gap-2">
              <Progress value={memoizedAdditionalStats.confidence} className="w-20 h-2" />
              <span className={`text-sm font-medium w-10 ${getConfidenceBadge.color}`}>
                {memoizedAdditionalStats.confidence}%
              </span>
            </div>
          </div>
        </div>

        {/* Predicted Score */}
        {prediction.predicted_score && (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Várható eredmény</span>
            </div>
            <div className="text-xl font-bold">
              {homeTeam} {prediction.predicted_score.home} - {prediction.predicted_score.away} {awayTeam}
            </div>
          </div>
        )}

        {/* Key Factors */}
        {prediction.key_factors && prediction.key_factors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Kulcs tényezők</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {prediction.key_factors.slice(0, 3).map((factor, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {factor}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

PredictionContent.displayName = 'PredictionContent';

export const OptimizedAdvancedPredictionsPanel = memo(({ 
  prediction, 
  homeTeam, 
  awayTeam, 
  loading 
}: OptimizedAdvancedPredictionsPanelProps) => {
  // Stable condition checking with useMemo to prevent flickering
  const shouldShowContent = useMemo(() => {
    return !loading && prediction !== null && prediction !== undefined;
  }, [loading, prediction]);

  const shouldShowLoading = useMemo(() => {
    return loading === true;
  }, [loading]);

  // Prevent rapid state changes by showing stable states
  if (shouldShowLoading) {
    return <LoadingSkeleton />;
  }

  if (shouldShowContent) {
    return (
      <PredictionContent 
        prediction={prediction!} 
        homeTeam={homeTeam} 
        awayTeam={awayTeam} 
      />
    );
  }

  // Show empty state only when truly empty (not loading and no prediction)
  return <EmptyState />;
});

OptimizedAdvancedPredictionsPanel.displayName = 'OptimizedAdvancedPredictionsPanel';

