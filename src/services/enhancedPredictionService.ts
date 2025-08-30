
import { supabase } from "@/integrations/supabase/client";
import { predictionService, type Prediction, type PredictionAccuracy } from "./predictionService";
import { databaseService } from "./databaseService";

export class EnhancedPredictionService {
  private initialized = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;

    try {
      // Check if required functions exist
      const functionsExist = await Promise.all([
        databaseService.checkFunctionExists('get_prediction_accuracy_stats'),
        databaseService.checkFunctionExists('update_enhanced_predictions'),
        databaseService.checkFunctionExists('cleanup_expired_predictions')
      ]);

      if (!functionsExist.every(exists => exists)) {
        console.log('Creating missing database functions...');
        const created = await databaseService.createMissingFunctions();
        if (!created) {
          console.error('Failed to create database functions');
          return false;
        }
      }

      // Initialize sample data if needed
      const { count } = await supabase
        .from('predictions')
        .select('*', { count: 'exact' });

      if (!count || count < 5) {
        console.log('Initializing sample data...');
        await databaseService.initializeSampleData();
      }

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing enhanced prediction service:', error);
      return false;
    }
  }

  async getAccuracyStats(
    dateFrom?: string,
    dateTo?: string,
    modelType?: string
  ): Promise<PredictionAccuracy[]> {
    try {
      await this.initialize();

      // Try the enhanced function first
      const { data, error } = await supabase.rpc('get_prediction_accuracy_stats', {
        date_from: dateFrom,
        date_to: dateTo,
        model_type: modelType
      });

      if (error) {
        console.warn('Enhanced function failed, falling back to basic implementation:', error);
        return this.getBasicAccuracyStats(dateFrom, dateTo);
      }

      return data || [];
    } catch (error) {
      console.error('Error getting accuracy stats:', error);
      // Fallback to basic implementation
      return this.getBasicAccuracyStats(dateFrom, dateTo);
    }
  }

  private async getBasicAccuracyStats(dateFrom?: string, dateTo?: string): Promise<PredictionAccuracy[]> {
    try {
      let query = supabase
        .from('predictions')
        .select('*');

      if (dateFrom) {
        query = query.gte('created_at', dateFrom);
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo);
      }

      const { data: predictions, error } = await query;

      if (error) throw error;

      if (!predictions || predictions.length === 0) {
        return [{
          prediction_type: 'No Data',
          accuracy_percentage: 0,
          total_predictions: 0,
          correct_predictions: 0,
          avg_confidence: 0,
          avg_probability_accuracy: 0
        }];
      }

      // Group by prediction type and calculate stats
      const grouped = predictions.reduce((acc, pred) => {
        const type = pred.prediction_type || 'default';
        if (!acc[type]) {
          acc[type] = {
            total: 0,
            correct: 0,
            confidenceSum: 0,
            probabilityAccuracySum: 0
          };
        }

        acc[type].total++;
        if (pred.prediction_correct === true) {
          acc[type].correct++;
        }
        if (pred.confidence_score) {
          acc[type].confidenceSum += pred.confidence_score;
        }
        if (pred.probability_accuracy) {
          acc[type].probabilityAccuracySum += pred.probability_accuracy;
        }

        return acc;
      }, {} as Record<string, any>);

      return Object.entries(grouped).map(([type, stats]) => ({
        prediction_type: type,
        accuracy_percentage: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        total_predictions: stats.total,
        correct_predictions: stats.correct,
        avg_confidence: stats.total > 0 ? stats.confidenceSum / stats.total : 0,
        avg_probability_accuracy: stats.total > 0 ? stats.probabilityAccuracySum / stats.total : 0
      }));
    } catch (error) {
      console.error('Error in basic accuracy stats:', error);
      return [];
    }
  }

  async triggerUpdate(): Promise<boolean> {
    try {
      await this.initialize();

      const { error } = await supabase.rpc('update_enhanced_predictions');
      
      if (error) {
        console.warn('Enhanced update failed, trying basic update:', error);
        return await this.basicTriggerUpdate();
      }

      return true;
    } catch (error) {
      console.error('Error triggering update:', error);
      return false;
    }
  }

  private async basicTriggerUpdate(): Promise<boolean> {
    try {
      // Basic update logic - just refresh the cache timestamp
      const { error } = await supabase
        .from('predictions')
        .update({ updated_at: new Date().toISOString() })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all records

      return !error;
    } catch (error) {
      console.error('Error in basic trigger update:', error);
      return false;
    }
  }

  async cleanupExpired(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_expired_predictions');
      
      if (error) {
        console.warn('Enhanced cleanup failed, trying basic cleanup:', error);
        return await this.basicCleanup();
      }

      return data || 0;
    } catch (error) {
      console.error('Error cleaning up expired predictions:', error);
      return 0;
    }
  }

  private async basicCleanup(): Promise<number> {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      
      const { data, error } = await supabase
        .from('predictions')
        .delete()
        .lt('expires_at', sevenDaysAgo)
        .select('id');

      if (error) throw error;

      return data?.length || 0;
    } catch (error) {
      console.error('Error in basic cleanup:', error);
      return 0;
    }
  }

  // Delegate other methods to the original service
  async getPrediction(homeTeam: string, awayTeam: string): Promise<Prediction | null> {
    return predictionService.getPrediction(homeTeam, awayTeam);
  }

  async getAllPredictions(): Promise<Prediction[]> {
    return predictionService.getAllPredictions();
  }

  async checkPredictionFreshness(): Promise<{ stale: number; fresh: number }> {
    return predictionService.checkPredictionFreshness();
  }
}

export const enhancedPredictionService = new EnhancedPredictionService();
