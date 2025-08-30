import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  Target, 
  Activity, 
  Clock, 
  Users, 
  MapPin,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import type { PredictionResult } from '@/types/prediction';

interface AdvancedPredictionsPanelProps {
  prediction?: PredictionResult | null;
  homeTeam?: string;
  awayTeam?: string;
  loading?: boolean;
  className?: string;
}

interface PredictionInsight {
  type: 'strength' | 'weakness' | 'trend' | 'form';
  team: 'home' | 'away' | 'both';
  message: string;
  impact: 'high' | 'medium' | 'low';
  icon: React.ReactNode;
}

export const AdvancedPredictionsPanel: React.FC<AdvancedPredictionsPanelProps> = ({
  prediction,
  homeTeam,
  awayTeam,
  loading = false,
  className = ""
}) => {
  const [insights, setInsights] = useState<PredictionInsight[]>([]);

  // Generate advanced insights based on prediction data
  useEffect(() => {
    if (!prediction) return;

    const generatedInsights: PredictionInsight[] = [];

    // Home team strength analysis
    if (prediction.home_win_probability > 0.6) {
      generatedInsights.push({
        type: 'strength',
        team: 'home',
        message: `${homeTeam} erős hazai előnyben`,
        impact: 'high',
        icon: <Target className="h-4 w-4" />
      });
    }

    // Away team analysis
    if (prediction.away_win_probability > 0.5) {
      generatedInsights.push({
        type: 'strength',
        team: 'away',
        message: `${awayTeam} jó idegenbeli formában`,
        impact: 'high',
        icon: <TrendingUp className="h-4 w-4" />
      });
    }

    // BTTS analysis
    if (prediction.btts_probability && prediction.btts_probability > 0.7) {
      generatedInsights.push({
        type: 'trend',
        team: 'both',
        message: 'Mindkét csapat szokott gólt rúgni',
        impact: 'medium',
        icon: <Activity className="h-4 w-4" />
      });
    }

    // Over 2.5 analysis
    if (prediction.over25_probability && prediction.over25_probability > 0.6) {
      generatedInsights.push({
        type: 'trend',
        team: 'both',
        message: 'Várhatóan gólgazdag meccs',
        impact: 'medium',
        icon: <TrendingUp className="h-4 w-4" />
      });
    }

    // Confidence analysis
    if (prediction.confidence_score && prediction.confidence_score < 0.6) {
      generatedInsights.push({
        type: 'weakness',
        team: 'both',
        message: 'Nehezen kiszámítható mérkőzés',
        impact: 'high',
        icon: <AlertCircle className="h-4 w-4" />
      });
    }

    setInsights(generatedInsights);
  }, [prediction, homeTeam, awayTeam]);

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getConfidenceColor = (confidence?: number): string => {
    if (!confidence) return 'hsl(var(--muted))';
    if (confidence >= 0.8) return 'hsl(var(--success))';
    if (confidence >= 0.6) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const getImpactBadgeVariant = (impact: string) => {
    switch (impact) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Fejlett Előrejelzés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!prediction) {
    return (
      <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${className}`}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Fejlett Előrejelzés
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Nincs elérhető előrejelzés ehhez a párosításhoz. Válassz ki két csapatot a részletes elemzéshez.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Fejlett Előrejelzés
          </div>
          {prediction.confidence_score && (
            <Badge 
              variant="outline" 
              className="border-2"
              style={{ borderColor: getConfidenceColor(prediction.confidence_score) }}
            >
              {formatPercentage(prediction.confidence_score)} megbízhatóság
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Áttekintés</TabsTrigger>
            <TabsTrigger value="insights">Elemzés</TabsTrigger>
            <TabsTrigger value="details">Részletek</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4 mt-4">
            {/* Main Probabilities */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">
                    {formatPercentage(prediction.home_win_probability)}
                  </div>
                  <div className="text-sm text-muted-foreground">{homeTeam} győzelem</div>
                  <Progress 
                    value={prediction.home_win_probability * 100} 
                    className="h-2"
                  />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-muted-foreground">
                    {formatPercentage(prediction.draw_probability)}
                  </div>
                  <div className="text-sm text-muted-foreground">Döntetlen</div>
                  <Progress 
                    value={prediction.draw_probability * 100} 
                    className="h-2"
                  />
                </div>
              </Card>
              
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-secondary">
                    {formatPercentage(prediction.away_win_probability)}
                  </div>
                  <div className="text-sm text-muted-foreground">{awayTeam} győzelem</div>
                  <Progress 
                    value={prediction.away_win_probability * 100} 
                    className="h-2"
                  />
                </div>
              </Card>
            </div>

            {/* Additional Markets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {prediction.btts_probability && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Mindkét csapat gólra</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatPercentage(prediction.btts_probability)}
                    </div>
                  </div>
                </Card>
              )}
              
              {prediction.over25_probability && (
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">2,5 gól felett</span>
                    </div>
                    <div className="text-lg font-semibold">
                      {formatPercentage(prediction.over25_probability)}
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Predicted Score */}
            {prediction.predicted_score && (
              <Card className="p-4">
                <div className="text-center space-y-2">
                  <div className="text-sm text-muted-foreground">Várható eredmény</div>
                  <div className="text-3xl font-bold">
                    {prediction.predicted_score.home} - {prediction.predicted_score.away}
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="insights" className="space-y-4 mt-4">
            {insights.length > 0 ? (
              <div className="space-y-3">
                {insights.map((insight, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium">{insight.message}</p>
                          <Badge variant={getImpactBadgeVariant(insight.impact)}>
                            {insight.impact === 'high' ? 'Magas' : 
                             insight.impact === 'medium' ? 'Közepes' : 'Alacsony'} hatás
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {insight.type === 'strength' ? 'Erősség' :
                           insight.type === 'weakness' ? 'Gyengeség' :
                           insight.type === 'trend' ? 'Trend' : 'Forma'} elemzés
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Nincs elegendő adat részletes elemzéshez.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="space-y-4 mt-4">
            {/* Key Factors */}
            {prediction.key_factors && prediction.key_factors.length > 0 && (
              <Card className="p-4">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Kulcs tényezők
                </h4>
                <div className="space-y-2">
                  {prediction.key_factors.map((factor, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                      {factor}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Model Information */}
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Modell információk
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Modell típus:</span>
                  <span>{prediction.model_type || 'Alapkonfiguráció'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Számítási módszer:</span>
                  <span>
                    {prediction.calculation_method === 'backend' ? 'Háttér számítás' : 'Kliens oldali'}
                  </span>
                </div>
                {prediction.confidence_score && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Megbízhatóság:</span>
                    <span>{formatPercentage(prediction.confidence_score)}</span>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};