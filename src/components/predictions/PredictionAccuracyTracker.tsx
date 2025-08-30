import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  TrendingUp, 
  Target, 
  Calendar,
  Award,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { usePredictions } from '@/hooks/usePredictions';
import { format, subDays } from 'date-fns';
import { hu } from 'date-fns/locale';

interface AccuracyMetric {
  period: string;
  accuracy: number;
  total_predictions: number;
  correct_predictions: number;
  confidence: number;
}

interface PredictionAccuracyTrackerProps {
  className?: string;
}

export const PredictionAccuracyTracker: React.FC<PredictionAccuracyTrackerProps> = ({
  className = ""
}) => {
  const [accuracyData, setAccuracyData] = useState<AccuracyMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  
  const { getAccuracyStats, triggerUpdate } = usePredictions();

  const fetchAccuracyData = async () => {
    setLoading(true);
    try {
      const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const dateFrom = format(subDays(new Date(), days), 'yyyy-MM-dd');
      const dateTo = format(new Date(), 'yyyy-MM-dd');
      
      const stats = await getAccuracyStats(dateFrom, dateTo);
      
      // Transform data for charts
      const transformedData = stats.map((stat, index) => ({
        period: `${days - index} nappal ezelőtt`,
        accuracy: stat.accuracy_percentage,
        total_predictions: stat.total_predictions,
        correct_predictions: stat.correct_predictions,
        confidence: stat.avg_confidence
      }));
      
      setAccuracyData(transformedData);
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccuracyData();
  }, [selectedPeriod]);

  const handleRefresh = async () => {
    await triggerUpdate();
    setTimeout(() => {
      fetchAccuracyData();
    }, 3000);
  };

  const calculateOverallAccuracy = (): number => {
    if (accuracyData.length === 0) return 0;
    const totalPredictions = accuracyData.reduce((sum, item) => sum + item.total_predictions, 0);
    const totalCorrect = accuracyData.reduce((sum, item) => sum + item.correct_predictions, 0);
    return totalPredictions > 0 ? (totalCorrect / totalPredictions) * 100 : 0;
  };

  const calculateAverageConfidence = (): number => {
    if (accuracyData.length === 0) return 0;
    const totalConfidence = accuracyData.reduce((sum, item) => sum + item.confidence, 0);
    return totalConfidence / accuracyData.length;
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 70) return 'hsl(var(--success))';
    if (accuracy >= 50) return 'hsl(var(--warning))';
    return 'hsl(var(--destructive))';
  };

  const overallAccuracy = calculateOverallAccuracy();
  const averageConfidence = calculateAverageConfidence();

  return (
    <Card className={`bg-card/50 backdrop-blur-sm border-border/50 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Előrejelzés Pontosság
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Frissítés
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="7d">7 nap</TabsTrigger>
            <TabsTrigger value="30d">30 nap</TabsTrigger>
            <TabsTrigger value="90d">90 nap</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedPeriod} className="space-y-6 mt-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted/20 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : accuracyData.length > 0 ? (
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-primary/10">
                        <Award className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold" style={{ color: getAccuracyColor(overallAccuracy) }}>
                          {overallAccuracy.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Átlagos pontosság</div>
                      </div>
                    </div>
                    <Progress 
                      value={overallAccuracy} 
                      className="mt-3 h-2"
                    />
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-secondary/10">
                        <BarChart3 className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {accuracyData.reduce((sum, item) => sum + item.total_predictions, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Összes előrejelzés</div>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      Helyes: {accuracyData.reduce((sum, item) => sum + item.correct_predictions, 0)}
                    </div>
                  </Card>
                  
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full bg-accent/10">
                        <TrendingUp className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {(averageConfidence * 100).toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Átlag megbízhatóság</div>
                      </div>
                    </div>
                    <Progress 
                      value={averageConfidence * 100} 
                      className="mt-3 h-2"
                    />
                  </Card>
                </div>

                {/* Accuracy Trend Chart */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Pontosság Trend
                  </h4>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="accuracy" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="hsl(var(--secondary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--secondary))' }}
                        yAxisId="right"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                {/* Predictions Volume Chart */}
                <Card className="p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Előrejelzések Mennyisége
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={accuracyData}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        className="text-muted-foreground"
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar 
                        dataKey="total_predictions" 
                        fill="hsl(var(--primary))" 
                        name="Összes"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="correct_predictions" 
                        fill="hsl(var(--success))" 
                        name="Helyes"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </>
            ) : (
              <Alert>
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  Nincs elérhető pontossági adat a kiválasztott időszakra.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};