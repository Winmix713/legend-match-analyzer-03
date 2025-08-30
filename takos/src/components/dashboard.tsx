import React from "react";
import { 
  Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, 
  TableRow, TableCell, Button, Chip, Select, SelectItem, Tabs, Tab, Divider, Progress 
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { fetchRecommendedMatches, updateMatchResult, Prediction, Outcome } from "../lib/supabase";
import { PredictionAccuracyByMarketChart } from "./charts/prediction-accuracy-by-market-chart";
import { ROIPerformanceChart } from "./charts/roi-performance-chart";

// Change the component name from ResultsFeedback to Dashboard
export const Dashboard = () => {
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState<number | null>(null);
  const [selectedTab, setSelectedTab] = React.useState("pending");
  const [stats, setStats] = React.useState({
    totalPredictions: 0,
    correctPredictions: 0,
    accuracy: 0,
    averageROI: 0,
    marketAccuracy: {
      '1X2': 0,
      'O/U': 0,
      'BTTS': 0,
      'HT/FT': 0
    }
  });

  React.useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    setLoading(true);
    try {
      const data = await fetchRecommendedMatches();
      setPredictions(data);
      
      // Calculate stats
      const completed = data.filter(p => p.actual_result !== undefined);
      const correct = completed.filter(p => p.is_correct);
      
      const marketStats = {
        '1X2': calculateMarketAccuracy(completed, '1X2'),
        'O/U': calculateMarketAccuracy(completed, 'O/U'),
        'BTTS': calculateMarketAccuracy(completed, 'BTTS'),
        'HT/FT': calculateMarketAccuracy(completed, 'HT/FT')
      };
      
      setStats({
        totalPredictions: completed.length,
        correctPredictions: correct.length,
        accuracy: completed.length > 0 ? (correct.length / completed.length) * 100 : 0,
        averageROI: calculateAverageROI(completed),
        marketAccuracy: marketStats
      });
    } catch (error) {
      console.error("Error loading predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMarketAccuracy = (predictions: Prediction[], market: string) => {
    const marketPredictions = predictions.filter(p => p.market === market);
    const correct = marketPredictions.filter(p => p.is_correct);
    return marketPredictions.length > 0 ? (correct.length / marketPredictions.length) * 100 : 0;
  };

  const calculateAverageROI = (predictions: Prediction[]) => {
    if (predictions.length === 0) return 0;
    
    const totalROI = predictions.reduce((sum, p) => {
      if (p.is_correct) {
        return sum + ((p.odds - 1) * 100);
      }
      return sum - 100;
    }, 0);
    
    return totalROI / predictions.length;
  };

  const handleResultUpdate = async (prediction: Prediction, result: Outcome) => {
    setUpdating(prediction.id);
    
    // Determine if prediction was correct
    const isCorrect = prediction.prediction === result;
    
    try {
      await updateMatchResult(prediction.id, result, isCorrect);
      
      // Update local state
      setPredictions(prev => 
        prev.map(p => 
          p.id === prediction.id 
            ? { ...p, actual_result: result, is_correct: isCorrect } 
            : p
        )
      );
      
      // Refresh stats
      loadPredictions();
    } catch (error) {
      console.error("Error updating result:", error);
    } finally {
      setUpdating(null);
    }
  };

  const getPossibleOutcomes = (market: string): Outcome[] => {
    switch (market) {
      case '1X2':
        return ['Home Win', 'Draw', 'Away Win'];
      case 'O/U':
        return ['Over 2.5', 'Under 2.5'];
      case 'BTTS':
        return ['BTTS Yes', 'BTTS No'];
      case 'HT/FT':
        return ['HT/FT 1/1', 'HT/FT 1/X', 'HT/FT 1/2', 'HT/FT X/1', 'HT/FT X/X', 'HT/FT X/2', 'HT/FT 2/1', 'HT/FT 2/X', 'HT/FT 2/2'];
      default:
        return [];
    }
  };

  const pendingPredictions = predictions.filter(p => p.actual_result === undefined);
  const completedPredictions = predictions.filter(p => p.actual_result !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Results Feedback</h2>
          <p className="text-default-500">Record match outcomes and evaluate prediction accuracy</p>
        </div>
        
        <Button 
          color="primary" 
          startContent={<Icon icon="lucide:refresh-cw" />}
          onPress={loadPredictions}
          isLoading={loading}
        >
          Refresh Data
        </Button>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-col">
              <p className="text-small text-default-500">Total Predictions</p>
              <p className="text-2xl font-bold">{stats.totalPredictions}</p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-col">
              <p className="text-small text-default-500">Accuracy Rate</p>
              <p className="text-2xl font-bold">{stats.accuracy.toFixed(1)}%</p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-col">
              <p className="text-small text-default-500">Average ROI</p>
              <p className={`text-2xl font-bold ${stats.averageROI >= 0 ? 'text-success' : 'text-danger'}`}>
                {stats.averageROI >= 0 ? '+' : ''}{stats.averageROI.toFixed(2)}%
              </p>
            </div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="p-4">
            <div className="flex flex-col">
              <p className="text-small text-default-500">Best Market</p>
              <p className="text-2xl font-bold">
                {Object.entries(stats.marketAccuracy).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      <Tabs 
        aria-label="Results Feedback Options" 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key.toString())}
      >
        <Tab 
          key="pending" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:clock" />
              <span>Pending Results</span>
              {pendingPredictions.length > 0 && (
                <Chip size="sm" color="primary">{pendingPredictions.length}</Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Pending Match Results</p>
                  <p className="text-small text-default-500">Record outcomes for recommended matches</p>
                </div>
              </CardHeader>
              <CardBody>
                {pendingPredictions.length === 0 ? (
                  <div className="text-center py-8 text-default-500">
                    <Icon icon="lucide:check-circle" className="text-4xl mb-2" />
                    <p>No pending results to record</p>
                  </div>
                ) : (
                  <Table 
                    removeWrapper 
                    aria-label="Pending Predictions"
                    classNames={{
                      th: "bg-default-100"
                    }}
                  >
                    <TableHeader>
                      <TableColumn>Match</TableColumn>
                      <TableColumn>Date</TableColumn>
                      <TableColumn>Market</TableColumn>
                      <TableColumn>Prediction</TableColumn>
                      <TableColumn>Confidence</TableColumn>
                      <TableColumn>Odds</TableColumn>
                      <TableColumn>Expected ROI</TableColumn>
                      <TableColumn>Actual Result</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {pendingPredictions.map((prediction) => (
                        <TableRow key={prediction.id}>
                          <TableCell>{prediction.match}</TableCell>
                          <TableCell>{new Date(prediction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{prediction.market}</TableCell>
                          <TableCell>{prediction.prediction}</TableCell>
                          <TableCell>
                            <Chip 
                              color={prediction.confidence > 75 ? "success" : prediction.confidence > 65 ? "primary" : "warning"} 
                              variant="flat"
                              size="sm"
                            >
                              {prediction.confidence}%
                            </Chip>
                          </TableCell>
                          <TableCell>{prediction.odds.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className={prediction.expected_roi >= 0 ? 'text-success' : 'text-danger'}>
                              {prediction.expected_roi >= 0 ? '+' : ''}{prediction.expected_roi.toFixed(2)}%
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              {getPossibleOutcomes(prediction.market).map((outcome) => (
                                <Button 
                                  key={outcome}
                                  size="sm" 
                                  color={outcome === prediction.prediction ? "success" : "default"}
                                  variant="flat"
                                  isLoading={updating === prediction.id}
                                  onPress={() => handleResultUpdate(prediction, outcome)}
                                >
                                  {outcome}
                                </Button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="completed" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:check" />
              <span>Completed Results</span>
              {completedPredictions.length > 0 && (
                <Chip size="sm" color="success">{completedPredictions.length}</Chip>
              )}
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Completed Match Results</p>
                  <p className="text-small text-default-500">Historical prediction performance</p>
                </div>
              </CardHeader>
              <CardBody>
                {completedPredictions.length === 0 ? (
                  <div className="text-center py-8 text-default-500">
                    <Icon icon="lucide:info" className="text-4xl mb-2" />
                    <p>No completed results available</p>
                  </div>
                ) : (
                  <Table 
                    removeWrapper 
                    aria-label="Completed Predictions"
                    classNames={{
                      th: "bg-default-100"
                    }}
                  >
                    <TableHeader>
                      <TableColumn>Match</TableColumn>
                      <TableColumn>Date</TableColumn>
                      <TableColumn>Market</TableColumn>
                      <TableColumn>Prediction</TableColumn>
                      <TableColumn>Actual Result</TableColumn>
                      <TableColumn>Accuracy</TableColumn>
                      <TableColumn>Confidence</TableColumn>
                      <TableColumn>ROI</TableColumn>
                    </TableHeader>
                    <TableBody>
                      {completedPredictions.map((prediction) => (
                        <TableRow key={prediction.id}>
                          <TableCell>{prediction.match}</TableCell>
                          <TableCell>{new Date(prediction.date).toLocaleDateString()}</TableCell>
                          <TableCell>{prediction.market}</TableCell>
                          <TableCell>{prediction.prediction}</TableCell>
                          <TableCell>{prediction.actual_result}</TableCell>
                          <TableCell>
                            <Chip 
                              color={prediction.is_correct ? "success" : "danger"} 
                              variant="flat"
                              size="sm"
                            >
                              {prediction.is_correct ? "Correct" : "Incorrect"}
                            </Chip>
                          </TableCell>
                          <TableCell>{prediction.confidence}%</TableCell>
                          <TableCell>
                            <span className={prediction.is_correct ? 'text-success' : 'text-danger'}>
                              {prediction.is_correct 
                                ? `+${((prediction.odds - 1) * 100).toFixed(2)}%` 
                                : '-100.00%'}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="analytics" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:bar-chart-2" />
              <span>Performance Analytics</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Prediction Accuracy by Market</p>
                  <p className="text-small text-default-500">Performance across different markets</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  <PredictionAccuracyByMarketChart />
                </div>
              </CardBody>
            </Card>
            
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">ROI Performance</p>
                  <p className="text-small text-default-500">Expected vs. Actual ROI</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="h-80">
                  <ROIPerformanceChart />
                </div>
              </CardBody>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Market Performance Breakdown</p>
                  <p className="text-small text-default-500">Detailed analysis by market type</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">1X2 Market</span>
                      <span>{stats.marketAccuracy['1X2'].toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={stats.marketAccuracy['1X2']} 
                      color="primary" 
                      aria-label="1X2 Market Accuracy" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">Over/Under 2.5 Market</span>
                      <span>{stats.marketAccuracy['O/U'].toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={stats.marketAccuracy['O/U']} 
                      color="secondary" 
                      aria-label="Over/Under Market Accuracy" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">BTTS Market</span>
                      <span>{stats.marketAccuracy['BTTS'].toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={stats.marketAccuracy['BTTS']} 
                      color="success" 
                      aria-label="BTTS Market Accuracy" 
                    />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium">HT/FT Market</span>
                      <span>{stats.marketAccuracy['HT/FT'].toFixed(1)}%</span>
                    </div>
                    <Progress 
                      value={stats.marketAccuracy['HT/FT']} 
                      color="warning" 
                      aria-label="HT/FT Market Accuracy" 
                    />
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="learning" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:brain" />
              <span>Model Learning</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">Model Learning & Improvement</p>
                  <p className="text-small text-default-500">How feedback improves prediction accuracy</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold">Feedback Loop Process</h3>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="bg-primary-100 p-2 rounded-medium">
                            <Icon icon="lucide:list" className="text-primary text-xl" />
                          </div>
                          <div>
                            <p className="font-medium">1. Prediction Generation</p>
                            <p className="text-small text-default-500">System generates predictions with confidence scores</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-primary-100 p-2 rounded-medium">
                            <Icon icon="lucide:check-circle" className="text-primary text-xl" />
                          </div>
                          <div>
                            <p className="font-medium">2. Result Recording</p>
                            <p className="text-small text-default-500">Actual outcomes are recorded in the system</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-primary-100 p-2 rounded-medium">
                            <Icon icon="lucide:bar-chart-2" className="text-primary text-xl" />
                          </div>
                          <div>
                            <p className="font-medium">3. Performance Analysis</p>
                            <p className="text-small text-default-500">System analyzes prediction accuracy and patterns</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-3">
                          <div className="bg-primary-100 p-2 rounded-medium">
                            <Icon icon="lucide:refresh-cw" className="text-primary text-xl" />
                          </div>
                          <div>
                            <p className="font-medium">4. Model Retraining</p>
                            <p className="text-small text-default-500">Models are updated with new data and insights</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Divider orientation="vertical" className="hidden md:block" />
                    
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold">Learning Metrics</h3>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-small">Model Improvement Rate</span>
                            <span className="text-small text-success">+12.4%</span>
                          </div>
                          <Progress value={62} color="success" aria-label="Model Improvement Rate" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-small">Error Reduction</span>
                            <span className="text-small text-success">+8.7%</span>
                          </div>
                          <Progress value={48} color="success" aria-label="Error Reduction" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-small">ROI Optimization</span>
                            <span className="text-small text-success">+15.2%</span>
                          </div>
                          <Progress value={75} color="success" aria-label="ROI Optimization" />
                        </div>
                        
                        <div>
                          <div className="flex justify-between mb-1">
                            <span className="text-small">Confidence Calibration</span>
                            <span className="text-small text-success">+9.3%</span>
                          </div>
                          <Progress value={52} color="success" aria-label="Confidence Calibration" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div className="text-center">
                    <Button 
                      color="primary" 
                      size="lg"
                      startContent={<Icon icon="lucide:refresh-cw" />}
                    >
                      Retrain Models with New Data
                    </Button>
                    <p className="text-small text-default-500 mt-2">
                      Last model update: 2 days ago
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>
      </Tabs>
    </div>
  );
};