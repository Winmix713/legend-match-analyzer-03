import React from "react";
import { fetchRecommendedMatches, updateMatchResult, Prediction, Outcome } from "../lib/supabase";
import { addToast } from "@heroui/react";
import { useTranslation } from "./use-translation";

export const usePredictions = () => {
  const { t } = useTranslation();
  const [predictions, setPredictions] = React.useState<Prediction[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [updating, setUpdating] = React.useState<number | null>(null);
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

  const calculateMarketAccuracy = React.useCallback((predictions: Prediction[], market: string) => {
    const marketPredictions = predictions.filter(p => p.market === market);
    const correct = marketPredictions.filter(p => p.is_correct);
    return marketPredictions.length > 0 ? (correct.length / marketPredictions.length) * 100 : 0;
  }, []);

  const calculateAverageROI = React.useCallback((predictions: Prediction[]) => {
    if (predictions.length === 0) return 0;
    
    const totalROI = predictions.reduce((sum, p) => {
      if (p.is_correct) {
        return sum + ((p.odds - 1) * 100);
      }
      return sum - 100;
    }, 0);
    
    return totalROI / predictions.length;
  }, []);

  const calculateStats = React.useCallback((data: Prediction[]) => {
    const completed = data.filter(p => p.actual_result !== undefined);
    const correct = completed.filter(p => p.is_correct);
    
    const marketStats = {
      '1X2': calculateMarketAccuracy(completed, '1X2'),
      'O/U': calculateMarketAccuracy(completed, 'O/U'),
      'BTTS': calculateMarketAccuracy(completed, 'BTTS'),
      'HT/FT': calculateMarketAccuracy(completed, 'HT/FT')
    };
    
    return {
      totalPredictions: completed.length,
      correctPredictions: correct.length,
      accuracy: completed.length > 0 ? (correct.length / completed.length) * 100 : 0,
      averageROI: calculateAverageROI(completed),
      marketAccuracy: marketStats
    };
  }, [calculateMarketAccuracy, calculateAverageROI]);

  const loadPredictions = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchRecommendedMatches();
      setPredictions(data);
      
      // Calculate stats
      const newStats = calculateStats(data);
      setStats(newStats);
    } catch (error) {
      console.error("Error loading predictions:", error);
      addToast({
        title: t('errors.loadingFailed'),
        description: t('errors.tryAgainLater'),
        severity: "danger"
      });
    } finally {
      setLoading(false);
    }
  }, [calculateStats, t]);

  const handleResultUpdate = React.useCallback(async (prediction: Prediction, result: Outcome) => {
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
      
      // Show success toast
      addToast({
        title: t('success.resultUpdated'),
        description: t('success.resultUpdatedDescription', { match: prediction.match }),
        severity: "success"
      });
      
      // Refresh stats
      loadPredictions();
    } catch (error) {
      console.error("Error updating result:", error);
      addToast({
        title: t('errors.updateFailed'),
        description: t('errors.tryAgainLater'),
        severity: "danger"
      });
    } finally {
      setUpdating(null);
    }
  }, [loadPredictions, t]);

  React.useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  return {
    predictions,
    stats,
    loading,
    updating,
    loadPredictions,
    handleResultUpdate
  };
};
