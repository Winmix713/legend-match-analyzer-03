/**
 * Fejlett matematikai előrejelzés panel
 * Ensemble modellek és statisztikai analízis megjelenítése
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePredictions } from '@/hooks/usePredictions';
import { Calculator, TrendingUp, Brain, BarChart3 } from 'lucide-react';
import type { Match } from '@/types';

interface AdvancedPredictionPanelProps {
  homeTeam: string;
  awayTeam: string;
  matches: Match[];
}

export default function AdvancedPredictionPanel({
  homeTeam,
  awayTeam,
  matches
}: AdvancedPredictionPanelProps) {
  const { calculateAdvancedPrediction, loading } = usePredictions();
  const [advancedPrediction, setAdvancedPrediction] = useState<any>(null);

  const handleCalculate = async () => {
    const result = await calculateAdvancedPrediction(homeTeam, awayTeam, matches);
    setAdvancedPrediction(result);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Fejlett Matematikai Előrejelzés
        </CardTitle>
        <CardDescription>
          Ensemble modellek: Bayesi statisztika, Monte Carlo, Elo rating, többváltozós regresszió
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={handleCalculate}
          disabled={loading || !homeTeam || !awayTeam}
          className="w-full"
        >
          <Calculator className="h-4 w-4 mr-2" />
          {loading ? 'Számítás folyamatban...' : 'Fejlett Analízis Futtatása'}
        </Button>

        {advancedPrediction && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-sm font-medium">Hazai győzelem</div>
                <Progress value={advancedPrediction.home_win_probability * 100} className="mt-1" />
                <div className="text-lg font-bold">
                  {(advancedPrediction.home_win_probability * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium">Döntetlen</div>
                <Progress value={advancedPrediction.draw_probability * 100} className="mt-1" />
                <div className="text-lg font-bold">
                  {(advancedPrediction.draw_probability * 100).toFixed(1)}%
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-sm font-medium">Vendég győzelem</div>
                <Progress value={advancedPrediction.away_win_probability * 100} className="mt-1" />
                <div className="text-lg font-bold">
                  {(advancedPrediction.away_win_probability * 100).toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                <span className="font-medium">Modell konfidencia:</span>
              </div>
              <Badge variant="secondary">
                {((advancedPrediction.confidence_score || 0) * 100).toFixed(1)}%
              </Badge>
            </div>

            {advancedPrediction.predicted_score && (
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground mb-1">Várható eredmény</div>
                <div className="text-2xl font-bold">
                  {advancedPrediction.predicted_score.home} - {advancedPrediction.predicted_score.away}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BarChart3 className="h-4 w-4" />
                Kulcs faktorok:
              </div>
              <div className="flex flex-wrap gap-1">
                {advancedPrediction.key_factors?.map((factor: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {factor}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}