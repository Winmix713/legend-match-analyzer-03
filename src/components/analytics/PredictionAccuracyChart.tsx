
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePredictions } from '@/hooks/usePredictions';
import { Target, TrendingUp, RefreshCw, Calendar, Award, AlertTriangle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { DatePickerWithRange } from '@/components/ui/date-picker-range';
import { DateRange } from 'react-day-picker';

export const PredictionAccuracyChart = () => {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [modelType, setModelType] = useState<string>('all');
  const [accuracyStats, setAccuracyStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const { 
    getAccuracyStats, 
    triggerUpdate, 
    initialized, 
    error: hookError,
    realTimeStatus,
    refetch
  } = usePredictions();

  const fetchAccuracyStats = async () => {
    setLoading(true);
    try {
      const stats = await getAccuracyStats(
        dateRange?.from?.toISOString(),
        dateRange?.to?.toISOString()
      );
      setAccuracyStats(stats);
    } catch (error) {
      console.error('Failed to fetch accuracy stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialized) {
      fetchAccuracyStats();
    }
  }, [dateRange, modelType, initialized]);

  const handleUpdatePredictions = async () => {
    await triggerUpdate();
    setTimeout(fetchAccuracyStats, 3000);
  };

  const averageAccuracy = accuracyStats.length > 0 
    ? Math.round(accuracyStats.reduce((sum, stat) => sum + stat.accuracy_percentage, 0) / accuracyStats.length)
    : 0;

  const totalPredictions = accuracyStats.reduce((sum, stat) => sum + stat.total_predictions, 0);
  const correctPredictions = accuracyStats.reduce((sum, stat) => sum + stat.correct_predictions, 0);

  // Show initialization error if service failed to initialize
  if (!initialized && hookError) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p><strong>Szolgáltatás inicializálási hiba:</strong> {hookError}</p>
              <p>Lehetséges megoldások:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Ellenőrizd az internetkapcsolatot</li>
                <li>Frissítsd az oldalt</li>
                <li>Várj néhány percet és próbáld újra</li>
              </ul>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.reload()}
                className="mt-2"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Oldal frissítése
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Target className="w-6 h-6 text-primary" />
            Előrejelzés Pontosság
            {!initialized && (
              <Badge variant="outline" className="ml-2">
                Inicializálás...
              </Badge>
            )}
          </h2>
          <p className="text-muted-foreground">
            AI modell teljesítmény és előrejelzési pontosság nyomon követése
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-1 text-sm">
            {realTimeStatus.connected ? (
              <>
                <Wifi className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Élő</span>
              </>
            ) : realTimeStatus.fallbackMode ? (
              <>
                <WifiOff className="w-4 h-4 text-yellow-500" />
                <span className="text-yellow-600">Polling</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4 text-gray-500" />
                <span className="text-gray-500">Offline</span>
              </>
            )}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchAccuracyStats();
              refetch();
            }}
            disabled={loading || !initialized}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Frissítés
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleUpdatePredictions}
            disabled={!initialized}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Előrejelzés Frissítése
          </Button>
        </div>
      </div>

      {/* System Status */}
      {hookError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Hiba:</strong> {hookError}
          </AlertDescription>
        </Alert>
      )}

      {initialized && !hookError && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Rendszer inicializálva és működőképes. 
            {realTimeStatus.fallbackMode && " Polling módban működik az élő frissítések helyett."}
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Időszak</label>
              <DatePickerWithRange
                date={dateRange}
                onDateChange={setDateRange}
                className="w-[280px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Modell típus</label>
              <Select value={modelType} onValueChange={setModelType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Összes modell</SelectItem>
                  <SelectItem value="enhanced">Továbbfejlesztett</SelectItem>
                  <SelectItem value="baseline">Alapszintű</SelectItem>
                  <SelectItem value="ensemble">Ensemble</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Átlagos pontosság</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageAccuracy}%</div>
            <div className="flex items-center space-x-2 mt-2">
              <Progress value={averageAccuracy} className="flex-1" />
              <Badge variant={averageAccuracy >= 70 ? "default" : averageAccuracy >= 50 ? "secondary" : "destructive"}>
                {averageAccuracy >= 70 ? "Kiváló" : averageAccuracy >= 50 ? "Jó" : "Fejlesztendő"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Összes előrejelzés</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPredictions}</div>
            <p className="text-xs text-muted-foreground">
              {correctPredictions} helyes előrejelzés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Megbízhatósági index</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {accuracyStats.length > 0 
                ? Math.round(accuracyStats.reduce((sum, stat) => sum + (stat.avg_confidence || 0), 0) / accuracyStats.length * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Átlagos modell bizalom
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accuracy Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Pontossági trend</CardTitle>
          <CardDescription>
            Előrejelzési pontosság alakulása időben
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Adatok betöltése...
              </div>
            </div>
          ) : accuracyStats.length > 0 ? (
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="prediction_type" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${Math.round(value)}%`,
                      name === 'accuracy_percentage' ? 'Pontosság' : 
                      name === 'avg_confidence' ? 'Megbízhatóság' : name
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="accuracy_percentage" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_confidence" 
                    stroke="hsl(var(--secondary))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Nincs elérhető pontossági adat</p>
                <p className="text-sm">
                  {!initialized ? "Rendszer inicializálása folyamatban..." : "Válassz másik időszakot vagy modell típust"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Részletes lebontás</CardTitle>
          <CardDescription>
            Előrejelzési teljesítmény típusok szerint
          </CardDescription>
        </CardHeader>
        <CardContent>
          {accuracyStats.length > 0 ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={accuracyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="prediction_type" 
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      name === 'correct_predictions' || name === 'total_predictions' ? value : `${Math.round(value)}%`,
                      name === 'correct_predictions' ? 'Helyes' : 
                      name === 'total_predictions' ? 'Összes' : 
                      name === 'accuracy_percentage' ? 'Pontosság' : name
                    ]}
                  />
                  <Bar dataKey="total_predictions" fill="hsl(var(--muted))" name="total_predictions" />
                  <Bar dataKey="correct_predictions" fill="hsl(var(--primary))" name="correct_predictions" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              Nincs elérhető részletes adat
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
