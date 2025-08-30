import React from "react";
import { 
  Card, CardBody, CardHeader, Table, TableHeader, TableColumn, TableBody, 
  TableRow, TableCell, Button, Chip, Select, SelectItem, Tabs, Tab, Divider, Progress 
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { fetchRecommendedMatches, updateMatchResult, Prediction, Outcome } from "../lib/supabase";
import { PredictionAccuracyByMarketChart } from "./charts/prediction-accuracy-by-market-chart";
import { ROIPerformanceChart } from "./charts/roi-performance-chart";
import { addToast } from "@heroui/react";
import { useTranslation } from "../hooks/use-translation";
import { StatCard } from "./ui/stat-card";
import { PendingPredictionsTable } from "./tables/pending-predictions-table";
import { CompletedPredictionsTable } from "./tables/completed-predictions-table";
import { MarketPerformanceBreakdown } from "./ui/market-performance-breakdown";
import { FeedbackLoopProcess } from "./ui/feedback-loop-process";
import { LearningMetrics } from "./ui/learning-metrics";
import { usePredictions } from "../hooks/use-predictions";

export const ResultsFeedback = () => {
  const { t, formatDate } = useTranslation();
  const { 
    predictions, 
    stats, 
    loading, 
    updating, 
    loadPredictions, 
    handleResultUpdate 
  } = usePredictions();
  
  // Add the missing selectedTab state
  const [selectedTab, setSelectedTab] = React.useState("pending");

  const pendingPredictions = predictions.filter(p => p.actual_result === undefined);
  const completedPredictions = predictions.filter(p => p.actual_result !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{t('resultsFeedback.title')}</h2>
          <p className="text-default-500">{t('resultsFeedback.subtitle')}</p>
        </div>
        
        <Button 
          color="primary" 
          startContent={<Icon icon="lucide:refresh-cw" />}
          onPress={loadPredictions}
          isLoading={loading}
          aria-label={t('resultsFeedback.refreshData')}
        >
          {t('resultsFeedback.refreshData')}
        </Button>
      </div>

      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title={t('resultsFeedback.totalPredictions')}
          value={stats.totalPredictions.toString()}
        />
        
        <StatCard 
          title={t('resultsFeedback.accuracyRate')}
          value={`${stats.accuracy.toFixed(1)}%`}
        />
        
        <StatCard 
          title={t('resultsFeedback.averageROI')}
          value={`${stats.averageROI >= 0 ? '+' : ''}${stats.averageROI.toFixed(2)}%`}
          valueClassName={stats.averageROI >= 0 ? 'text-success' : 'text-danger'}
        />
        
        <StatCard 
          title={t('resultsFeedback.bestMarket')}
          value={Object.entries(stats.marketAccuracy).sort((a, b) => b[1] - a[1])[0]?.[0] || t('common.notAvailable')}
        />
      </div>

      <Tabs 
        aria-label={t('resultsFeedback.tabsAriaLabel')}
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key.toString())}
      >
        <Tab 
          key="pending" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:clock" />
              <span>{t('resultsFeedback.tabs.pending')}</span>
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
                  <p className="text-md font-semibold">{t('resultsFeedback.pendingResults.title')}</p>
                  <p className="text-small text-default-500">{t('resultsFeedback.pendingResults.subtitle')}</p>
                </div>
              </CardHeader>
              <CardBody>
                <PendingPredictionsTable 
                  predictions={pendingPredictions}
                  updating={updating}
                  onResultUpdate={handleResultUpdate}
                  formatDate={formatDate}
                />
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="completed" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:check" />
              <span>{t('resultsFeedback.tabs.completed')}</span>
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
                  <p className="text-md font-semibold">{t('resultsFeedback.completedResults.title')}</p>
                  <p className="text-small text-default-500">{t('resultsFeedback.completedResults.subtitle')}</p>
                </div>
              </CardHeader>
              <CardBody>
                <CompletedPredictionsTable 
                  predictions={completedPredictions}
                  formatDate={formatDate}
                />
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="analytics" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:bar-chart-2" />
              <span>{t('resultsFeedback.tabs.analytics')}</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">{t('resultsFeedback.analytics.accuracyByMarket')}</p>
                  <p className="text-small text-default-500">{t('resultsFeedback.analytics.accuracyByMarketSubtitle')}</p>
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
                  <p className="text-md font-semibold">{t('resultsFeedback.analytics.roiPerformance')}</p>
                  <p className="text-small text-default-500">{t('resultsFeedback.analytics.roiPerformanceSubtitle')}</p>
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
                  <p className="text-md font-semibold">{t('resultsFeedback.analytics.marketBreakdown')}</p>
                  <p className="text-small text-default-500">{t('resultsFeedback.analytics.marketBreakdownSubtitle')}</p>
                </div>
              </CardHeader>
              <CardBody>
                <MarketPerformanceBreakdown marketAccuracy={stats.marketAccuracy} />
              </CardBody>
            </Card>
          </div>
        </Tab>
        
        <Tab 
          key="learning" 
          title={
            <div className="flex items-center gap-2">
              <Icon icon="lucide:brain" />
              <span>{t('resultsFeedback.tabs.learning')}</span>
            </div>
          }
        >
          <div className="mt-4">
            <Card>
              <CardHeader className="flex gap-3">
                <div className="flex flex-col">
                  <p className="text-md font-semibold">{t('resultsFeedback.learning.title')}</p>
                  <p className="text-small text-default-500">{t('resultsFeedback.learning.subtitle')}</p>
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold">{t('resultsFeedback.learning.feedbackLoop')}</h3>
                      <FeedbackLoopProcess />
                    </div>
                    
                    <Divider orientation="vertical" className="hidden md:block" />
                    
                    <div className="flex-1 space-y-2">
                      <h3 className="text-lg font-semibold">{t('resultsFeedback.learning.metrics')}</h3>
                      <LearningMetrics />
                    </div>
                  </div>
                  
                  <Divider />
                  
                  <div className="text-center">
                    <Button 
                      color="primary" 
                      size="lg"
                      startContent={<Icon icon="lucide:refresh-cw" />}
                      aria-label={t('resultsFeedback.learning.retrainButton')}
                    >
                      {t('resultsFeedback.learning.retrainButton')}
                    </Button>
                    <p className="text-small text-default-500 mt-2">
                      {t('resultsFeedback.learning.lastUpdate', { days: 2 })}
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