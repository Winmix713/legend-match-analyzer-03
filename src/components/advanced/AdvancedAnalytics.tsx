import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Activity, GitBranch, Percent, BarChart3 } from "lucide-react";
import { MARKET_DISPLAY_NAMES, MARKET_ICONS } from "@/config/market-config";

const markets = [
  { label: "Match Result (1X2)", value: "1X2" },
  { label: "Over/Under 2.5", value: "O/U" },
  { label: "Both Teams To Score", value: "BTTS" },
  { label: "HT/FT", value: "HT/FT" },
];

export const AdvancedAnalytics = () => {
  const [selectedMarket, setSelectedMarket] = React.useState("1X2");
  const [historicalData, setHistoricalData] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(false);

  React.useEffect(() => {
    loadHistoricalData();
  }, [selectedMarket]);

  const loadHistoricalData = async () => {
    setIsLoading(true);
    try {
      // Simulate loading historical performance data
      await new Promise(resolve => setTimeout(resolve, 1000));
      setHistoricalData({
        patterns: {
          seasonal: { spring: 72, summer: 68, autumn: 75, winter: 71 },
          dayOfWeek: { monday: 69, tuesday: 73, wednesday: 71, thursday: 74, friday: 76, saturday: 72, sunday: 70 },
          timeOfDay: { early: 68, afternoon: 74, evening: 72, night: 69 }
        },
        monteCarlo: {
          simulations: 10000,
          meanAccuracy: 73.2,
          standardDeviation: 8.4,
          confidenceInterval: [65.1, 81.3]
        },
        bayesian: {
          priorAccuracy: 70,
          posteriorAccuracy: 73.2,
          evidenceStrength: 'Strong'
        },
        kelly: {
          optimalBetSize: 4.2,
          expectedGrowth: 12.7,
          riskLevel: 'Moderate'
        }
      });
    } catch (error) {
      console.error("Error loading historical data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Deep dive into prediction patterns and insights</p>
        </div>
        
        <div className="w-full md:w-64">
          <Select value={selectedMarket} onValueChange={setSelectedMarket}>
            <SelectTrigger>
              <SelectValue placeholder="Select market" />
            </SelectTrigger>
            <SelectContent>
              {markets.map((market) => (
                <SelectItem key={market.value} value={market.value}>
                  {market.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="patterns" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Patterns
          </TabsTrigger>
          <TabsTrigger value="monte-carlo" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Monte Carlo
          </TabsTrigger>
          <TabsTrigger value="bayesian" className="flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Bayesian
          </TabsTrigger>
          <TabsTrigger value="kelly" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Kelly Criterion
          </TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Seasonal Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historicalData?.patterns.seasonal && Object.entries(historicalData.patterns.seasonal).map(([season, accuracy]) => (
                    <div key={season} className="flex items-center justify-between">
                      <span className="capitalize">{season}</span>
                      <Badge variant={(accuracy as number) > 70 ? "default" : "secondary"}>
                        {accuracy as number}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Day of Week Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {historicalData?.patterns.dayOfWeek && Object.entries(historicalData.patterns.dayOfWeek).map(([day, accuracy]) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="capitalize">{day}</span>
                      <Badge variant={(accuracy as number) > 72 ? "default" : "secondary"}>
                        {accuracy as number}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monte-carlo">
          <Card>
            <CardHeader>
              <CardTitle>Monte Carlo Simulation Results</CardTitle>
              <p className="text-sm text-muted-foreground">
                Based on {historicalData?.monteCarlo.simulations.toLocaleString()} simulations
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {historicalData?.monteCarlo.meanAccuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground">Mean Accuracy</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    ±{historicalData?.monteCarlo.standardDeviation}%
                  </div>
                  <div className="text-sm text-muted-foreground">Standard Deviation</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold">
                    {historicalData?.monteCarlo.confidenceInterval[0]}% - {historicalData?.monteCarlo.confidenceInterval[1]}%
                  </div>
                  <div className="text-sm text-muted-foreground">95% Confidence Interval</div>
                </div>
              </div>
              <div className="mt-6 h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Probability Distribution Chart</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bayesian">
          <Card>
            <CardHeader>
              <CardTitle>Bayesian Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Prior and posterior probability distributions
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {historicalData?.bayesian.priorAccuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground">Prior Belief</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {historicalData?.bayesian.posteriorAccuracy}%
                  </div>
                  <div className="text-sm text-muted-foreground">Updated Belief</div>
                </div>
                <div className="text-center">
                  <Badge variant="default">
                    {historicalData?.bayesian.evidenceStrength}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Evidence Strength</div>
                </div>
              </div>
              <div className="mt-6 h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Bayesian Update Visualization</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kelly">
          <Card>
            <CardHeader>
              <CardTitle>Kelly Criterion Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Optimal bet sizing based on edge and odds
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {historicalData?.kelly.optimalBetSize}%
                  </div>
                  <div className="text-sm text-muted-foreground">Optimal Bet Size</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    +{historicalData?.kelly.expectedGrowth}%
                  </div>
                  <div className="text-sm text-muted-foreground">Expected Growth</div>
                </div>
                <div className="text-center">
                  <Badge variant="outline">
                    {historicalData?.kelly.riskLevel}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Risk Level</div>
                </div>
              </div>
              <div className="mt-6 h-64 flex items-center justify-center border-2 border-dashed border-border rounded-lg">
                <p className="text-muted-foreground">Kelly Criterion Optimization Chart</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};