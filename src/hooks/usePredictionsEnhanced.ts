import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  averageROI: number;
  marketAccuracy: {
    '1X2': number;
    'O/U': number;
    'BTTS': number;
    'HT/FT': number;
  };
}

export interface PredictionData {
  id: string;
  match: string;
  date: string;
  market: string;
  prediction: string;
  confidence: number;
  odds: number;
  expected_roi: number;
  actual_result?: string;
  is_correct?: boolean;
  created_at: string;
}

export const usePredictionsEnhanced = () => {
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<PredictionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [stats, setStats] = useState<PredictionStats>({
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

  const calculateMarketAccuracy = useCallback((predictions: PredictionData[], market: string) => {
    const marketPredictions = predictions.filter(p => p.market === market);
    const correct = marketPredictions.filter(p => p.is_correct);
    return marketPredictions.length > 0 ? (correct.length / marketPredictions.length) * 100 : 0;
  }, []);

  const calculateAverageROI = useCallback((predictions: PredictionData[]) => {
    if (predictions.length === 0) return 0;
    
    const totalROI = predictions.reduce((sum, p) => {
      if (p.is_correct) {
        return sum + ((p.odds - 1) * 100);
      }
      return sum - 100;
    }, 0);
    
    return totalROI / predictions.length;
  }, []);

  const calculateStats = useCallback((data: PredictionData[]) => {
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

  const loadPredictions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('match_predictions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match expected format
      const transformedData: PredictionData[] = data.map(item => ({
        id: item.id,
        match: `${item.home_team} vs ${item.away_team}`,
        date: item.match_date || item.created_at,
        market: 'General', // Using general market since specific market field doesn't exist
        prediction: typeof item.predicted_score === 'object' && item.predicted_score ? 
          `${(item.predicted_score as any).home || 0}-${(item.predicted_score as any).away || 0}` : 
          'Prediction',
        confidence: Math.round(item.confidence * 100),
        odds: 2.0, // Default odds, should be from actual data
        expected_roi: 0, // Default since field doesn't exist in schema
        actual_result: undefined, // To be updated when results come in
        is_correct: undefined,
        created_at: item.created_at
      }));

      setPredictions(transformedData);
      
      // Calculate stats
      const newStats = calculateStats(transformedData);
      setStats(newStats);
    } catch (error) {
      console.error("Error loading predictions:", error);
      toast({
        title: "Error",
        description: "Failed to load predictions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [calculateStats, toast]);

  const handleResultUpdate = useCallback(async (predictionId: string, result: string) => {
    setUpdating(predictionId);
    
    const prediction = predictions.find(p => p.id === predictionId);
    if (!prediction) return;
    
    // Determine if prediction was correct
    const isCorrect = prediction.prediction === result;
    
    try {
      // Update local state
      setPredictions(prev => 
        prev.map(p => 
          p.id === predictionId 
            ? { ...p, actual_result: result, is_correct: isCorrect } 
            : p
        )
      );
      
      // Show success toast
      toast({
        title: "Result Updated",
        description: `Result recorded for ${prediction.match}`,
      });
      
      // Refresh stats
      const updatedPredictions = predictions.map(p => 
        p.id === predictionId 
          ? { ...p, actual_result: result, is_correct: isCorrect } 
          : p
      );
      const newStats = calculateStats(updatedPredictions);
      setStats(newStats);
      
    } catch (error) {
      console.error("Error updating result:", error);
      toast({
        title: "Error",
        description: "Failed to update result. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  }, [predictions, calculateStats, toast]);

  useEffect(() => {
    loadPredictions();
  }, [loadPredictions]);

  return {
    predictions,
    stats,
    loading,
    updating,
    loadPredictions,
    handleResultUpdate,
    pendingPredictions: predictions.filter(p => p.actual_result === undefined),
    completedPredictions: predictions.filter(p => p.actual_result !== undefined)
  };
};