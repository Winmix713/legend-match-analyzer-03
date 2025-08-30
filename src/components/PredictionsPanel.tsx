import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { calculateCalibratedConfidence, explainConfidenceFactors, getConfidenceLevel } from '@/lib/prediction-utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Brain, Clock } from 'lucide-react';
import type { Prediction } from '@/services/predictionService';
import type { PredictionResult } from '@/types/prediction';

interface PredictionsPanelProps {
  prediction?: Prediction | PredictionResult | null;
  homeTeam: string;
  awayTeam: string;
  loading?: boolean;
  className?: string;
}

export const PredictionsPanel: React.FC<PredictionsPanelProps> = ({
  prediction,
  homeTeam,
  awayTeam,
  loading = false,
  className = ""
}) => {
  // Debug logging
  console.log('PredictionsPanel render:', { prediction, homeTeam, awayTeam, loading });

  if (loading) {
    return (
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
    );
  }

  if (!prediction) {
    return (
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
    );
  }

  // Recalculate confidence using new utility for consistent display
  const displayConfidence = React.useMemo(() => {
    if (!prediction?.confidence_score) return prediction?.confidence_score;
    
    // For backend predictions, recalculate confidence for consistency
    return calculateCalibratedConfidence({
      home_win_probability: prediction.home_win_probability,
      draw_probability: prediction.draw_probability,
      away_win_probability: prediction.away_win_probability
    }, {
      accuracy: prediction.confidence_score, // Use original confidence as accuracy proxy
      recency: 0.9, // Assume reasonably fresh
      completeness: 0.8 // Assume good data completeness
    });
  }, [prediction]);

  const confidenceLevel = React.useMemo(() => {
    return displayConfidence ? getConfidenceLevel(displayConfidence) : null;
  }, [displayConfidence]);

  const confidenceExplanations = React.useMemo(() => {
    if (!prediction) return [];
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

  const formatPercentage = (value: number) => Math.round(value * 100);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Előrejelzés: {homeTeam} vs {awayTeam}
        </CardTitle>
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
          {'calculation_method' in prediction && prediction.calculation_method === 'client_baseline' && (
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Alapszintű
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Probabilities */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Kimenetel valószínűségek
          </h4>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">{homeTeam} győzelem</span>
              <span className="font-medium">{formatPercentage(prediction.home_win_probability)}%</span>
            </div>
            <Progress 
              value={formatPercentage(prediction.home_win_probability)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Döntetlen</span>
              <span className="font-medium">{formatPercentage(prediction.draw_probability)}%</span>
            </div>
            <Progress 
              value={formatPercentage(prediction.draw_probability)} 
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">{awayTeam} győzelem</span>
              <span className="font-medium">{formatPercentage(prediction.away_win_probability)}%</span>
            </div>
            <Progress 
              value={formatPercentage(prediction.away_win_probability)} 
              className="h-2"
            />
          </div>
        </div>

        {/* Additional Predictions */}
        {(prediction.btts_probability || prediction.over25_probability) && (
          <div className="space-y-3">
            <h4 className="font-semibold">További előrejelzések</h4>
            <div className="grid grid-cols-2 gap-4">
              {prediction.btts_probability && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    {formatPercentage(prediction.btts_probability)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Mindkét csapat gólt szerez
                  </div>
                </div>
              )}
              {prediction.over25_probability && (
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="text-lg font-bold">
                    {formatPercentage(prediction.over25_probability)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    2.5+ gól
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
        {displayConfidence && confidenceLevel && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Megbízhatóság</span>
              <span className="text-sm">{Math.round(displayConfidence * 100)}%</span>
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
};