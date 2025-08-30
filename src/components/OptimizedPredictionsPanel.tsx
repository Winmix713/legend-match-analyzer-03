import React, { memo, useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateCalibratedConfidence, explainConfidenceFactors, getConfidenceLevel } from '@/lib/prediction-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Brain, Clock } from 'lucide-react';
import type { Prediction } from '@/services/predictionService';
import type { PredictionResult } from '@/types/prediction';

interface OptimizedPredictionsPanelProps {
  prediction?: Prediction | PredictionResult | null;
  homeTeam: string;
  awayTeam: string;
  loading?: boolean;
  className?: string;
}

// Memoized loading skeleton
const LoadingSkeleton = memo(({ className }: { className?: string }) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5" />
        Előrejelzés
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-3">
        <div className="animate-pulse bg-muted h-4 rounded"></div>
        <div className="animate-pulse bg-muted h-8 rounded"></div>
        <div className="animate-pulse bg-muted h-4 rounded"></div>
      </div>
    </CardContent>
  </Card>
));
LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized empty state
const EmptyState = memo(({ 
  homeTeam, 
  awayTeam, 
  className 
}: { 
  homeTeam: string; 
  awayTeam: string; 
  className?: string; 
}) => (
  <Card className={className}>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Brain className="w-5 h-5" />
        Előrejelzés
      </CardTitle>
      <CardDescription>
        {homeTeam && awayTeam ? 
          `Előrejelzés készítése: ${homeTeam} vs ${awayTeam}` : 
          'Nincs elérhető előrejelzés ehhez a párosításhoz'
        }
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-center py-8 text-muted-foreground">
        <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
        {homeTeam && awayTeam ? (
          <div>
            <p className="font-medium">Baseline számítás folyamatban...</p>
            <p className="text-sm mt-1">A meccs adatok alapján készül az előrejelzés</p>
          </div>
        ) : (
          <p>Válassz csapatokat az előrejelzéshez</p>
        )}
      </div>
    </CardContent>
  </Card>
));
EmptyState.displayName = 'EmptyState';

// Memoized confidence badge component
const ConfidenceBadge = memo(({ prediction }: { prediction: Prediction | PredictionResult }) => {
  const displayConfidence = useMemo(() => {
    if (!prediction.confidence_score) return null;
    
    // Recalculate confidence for consistency
    return calculateCalibratedConfidence({
      home_win_probability: prediction.home_win_probability,
      draw_probability: prediction.draw_probability,
      away_win_probability: prediction.away_win_probability
    }, {
      accuracy: prediction.confidence_score,
      recency: 0.9,
      completeness: 0.8
    });
  }, [prediction]);

  const confidenceLevel = useMemo(() => {
    return displayConfidence ? getConfidenceLevel(displayConfidence) : null;
  }, [displayConfidence]);

  const confidenceExplanations = useMemo(() => {
    return explainConfidenceFactors({
      home_win_probability: prediction.home_win_probability,
      draw_probability: prediction.draw_probability,
      away_win_probability: prediction.away_win_probability
    }, {
      accuracy: prediction.confidence_score,
      recency: 0.9,
      completeness: 0.8
    });
  }, [prediction]);

  const isBaseline = useMemo(() => {
    return 'calculation_method' in prediction && prediction.calculation_method === 'client_baseline';
  }, [prediction]);

  return (
    <div className="flex items-center gap-2">
      {displayConfidence && confidenceLevel && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="flex items-center gap-1 cursor-help">
                <Target className="w-3 h-3" />
                Megbízhatóság: {confidenceLevel.text}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">Megbízhatósági tényezők:</p>
                {confidenceExplanations.map((explanation, index) => (
                  <p key={index} className="text-xs">• {explanation}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
      {isBaseline && (
        <Badge variant="outline" className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Alapszintű
        </Badge>
      )}
    </div>
  );
});
ConfidenceBadge.displayName = 'ConfidenceBadge';

// Memoized probability section
const ProbabilitySection = memo(({ 
  prediction, 
  homeTeam, 
  awayTeam 
}: { 
  prediction: Prediction | PredictionResult; 
  homeTeam: string; 
  awayTeam: string; 
}) => {
  const formatPercentage = useMemo(() => (value: number) => Math.round(value * 100), []);
  
  const probabilities = useMemo(() => ({
    home: formatPercentage(prediction.home_win_probability),
    draw: formatPercentage(prediction.draw_probability),
    away: formatPercentage(prediction.away_win_probability)
  }), [prediction.home_win_probability, prediction.draw_probability, prediction.away_win_probability, formatPercentage]);

  return (
    <div className="space-y-3">
      <h4 className="font-semibold flex items-center gap-2">
        <TrendingUp className="w-4 h-4" />
        Kimenetel valószínűségek
      </h4>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">{homeTeam} győzelem</span>
          <span className="font-medium">{probabilities.home}%</span>
        </div>
        <Progress value={probabilities.home} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">Döntetlen</span>
          <span className="font-medium">{probabilities.draw}%</span>
        </div>
        <Progress value={probabilities.draw} className="h-2" />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm">{awayTeam} győzelem</span>
          <span className="font-medium">{probabilities.away}%</span>
        </div>
        <Progress value={probabilities.away} className="h-2" />
      </div>
    </div>
  );
});
ProbabilitySection.displayName = 'ProbabilitySection';

// Memoized additional predictions section
const AdditionalPredictions = memo(({ prediction }: { prediction: Prediction | PredictionResult }) => {
  const formatPercentage = useMemo(() => (value: number) => Math.round(value * 100), []);
  
  const additionalStats = useMemo(() => ({
    btts: prediction.btts_probability ? formatPercentage(prediction.btts_probability) : null,
    over25: prediction.over25_probability ? formatPercentage(prediction.over25_probability) : null
  }), [prediction.btts_probability, prediction.over25_probability, formatPercentage]);

  if (!additionalStats.btts && !additionalStats.over25) return null;

  return (
    <div className="space-y-3">
      <h4 className="font-semibold">További előrejelzések</h4>
      <div className="grid grid-cols-2 gap-4">
        {additionalStats.btts && (
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">{additionalStats.btts}%</div>
            <div className="text-xs text-muted-foreground">
              Mindkét csapat gólt szerez
            </div>
          </div>
        )}
        {additionalStats.over25 && (
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-lg font-bold">{additionalStats.over25}%</div>
            <div className="text-xs text-muted-foreground">2.5+ gól</div>
          </div>
        )}
      </div>
    </div>
  );
});
AdditionalPredictions.displayName = 'AdditionalPredictions';

// Memoized prediction content
const PredictionContent = memo(({ 
  prediction, 
  homeTeam, 
  awayTeam, 
  className 
}: { 
  prediction: Prediction | PredictionResult; 
  homeTeam: string; 
  awayTeam: string; 
  className?: string; 
}) => {
  const formatPercentage = useMemo(() => (value: number) => Math.round(value * 100), []);
  
  const displayConfidence = useMemo(() => {
    if (!prediction.confidence_score) return null;
    
    return calculateCalibratedConfidence({
      home_win_probability: prediction.home_win_probability,
      draw_probability: prediction.draw_probability,
      away_win_probability: prediction.away_win_probability
    }, {
      accuracy: prediction.confidence_score,
      recency: 0.9,
      completeness: 0.8
    });
  }, [prediction]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Előrejelzés: {homeTeam} vs {awayTeam}
        </CardTitle>
        <ConfidenceBadge prediction={prediction} />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <ProbabilitySection 
          prediction={prediction} 
          homeTeam={homeTeam} 
          awayTeam={awayTeam} 
        />

        <AdditionalPredictions prediction={prediction} />

        {/* Predicted Score */}
        {prediction.predicted_score && (
          <div className="space-y-2">
            <h4 className="font-semibold">Várható eredmény</h4>
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {prediction.predicted_score.home} - {prediction.predicted_score.away}
              </div>
              <div className="text-sm text-muted-foreground">
                {homeTeam} vs {awayTeam}
              </div>
            </div>
          </div>
        )}

        {/* Key Factors */}
        {prediction.key_factors && prediction.key_factors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold">Kulcstényezők</h4>
            <div className="space-y-1">
              {prediction.key_factors.map((factor, index) => (
                <div key={index} className="text-sm p-2 bg-muted rounded text-muted-foreground">
                  {factor}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Confidence Indicator */}
        {displayConfidence && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Megbízhatóság</span>
              <span className="text-sm">{formatPercentage(displayConfidence)}%</span>
            </div>
            <Progress 
              value={displayConfidence * 100} 
              className="h-2"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
});
PredictionContent.displayName = 'PredictionContent';

export const OptimizedPredictionsPanel = memo(({
  prediction,
  homeTeam,
  awayTeam,
  loading = false,
  className = ""
}: OptimizedPredictionsPanelProps) => {
  // Stable condition checking with useMemo
  const shouldShowLoading = useMemo(() => loading === true, [loading]);
  const shouldShowContent = useMemo(() => {
    return !loading && prediction !== null && prediction !== undefined;
  }, [loading, prediction]);

  if (shouldShowLoading) {
    return <LoadingSkeleton className={className} />;
  }

  if (shouldShowContent) {
    return (
      <PredictionContent 
        prediction={prediction!} 
        homeTeam={homeTeam} 
        awayTeam={awayTeam} 
        className={className}
      />
    );
  }

  return <EmptyState homeTeam={homeTeam} awayTeam={awayTeam} className={className} />;
});

OptimizedPredictionsPanel.displayName = 'OptimizedPredictionsPanel';