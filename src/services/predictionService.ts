import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export interface Prediction {
  id: string;
  home_team: string;
  away_team: string;
  home_win_probability: number;
  away_win_probability: number;
  draw_probability: number;
  btts_probability?: number;
  over25_probability?: number;
  confidence_score?: number;
  key_factors?: string[];
  predicted_score?: {
    home: number;
    away: number;
  };
  cache_key: string;
  expires_at: string;
  created_at: string;
  updated_at?: string;
}

export interface PredictionAccuracy {
  accuracy_percentage: number;
  avg_confidence: number;
  avg_probability_accuracy: number;
  correct_predictions: number;
  total_predictions: number;
  prediction_type: string;
}

type SupabasePrediction = Database["public"]["Tables"]["predictions"]["Row"];

const convertSupabasePrediction = (sp: SupabasePrediction): Prediction => ({
  id: sp.id,
  home_team: sp.home_team,
  away_team: sp.away_team,
  home_win_probability: sp.home_win_probability,
  away_win_probability: sp.away_win_probability,
  draw_probability: sp.draw_probability,
  confidence_score: sp.confidence_score || undefined,
  predicted_score: sp.predicted_home_goals && sp.predicted_away_goals ? {
    home: sp.predicted_home_goals,
    away: sp.predicted_away_goals
  } : undefined,
  cache_key: sp.cache_key,
  expires_at: sp.expires_at || new Date().toISOString(),
  created_at: sp.created_at,
  updated_at: sp.predicted_at || undefined,
});

export const predictionService = {
  // Get prediction for specific teams
  async getPrediction(homeTeam: string, awayTeam: string): Promise<Prediction | null> {
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .eq("home_team", homeTeam)
        .eq("away_team", awayTeam)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // No prediction found
        }
        throw error;
      }

      if (!data) {
        console.warn('No prediction found for teams:', homeTeam, 'vs', awayTeam);
        return null;
      }

      return convertSupabasePrediction(data);
    } catch (error) {
      console.error("Error fetching prediction:", error);
      return null;
    }
  },

  // Get all fresh predictions
  async getAllPredictions(): Promise<Prediction[]> {
    try {
      const { data, error } = await supabase
        .from("predictions")
        .select("*")
        .gt("expires_at", new Date().toISOString())
        .order("confidence_score", { ascending: false });

      if (error) throw error;

      return data ? data.map(convertSupabasePrediction) : [];
    } catch (error) {
      console.error("Error fetching all predictions:", error);
      return [];
    }
  },

  // Trigger prediction calculation (admin only)
  async triggerPredictionUpdate(): Promise<boolean> {
    try {
      const { error } = await supabase.rpc("update_enhanced_predictions");

      if (error) {
        console.error("Error triggering prediction update:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error triggering prediction update:", error);
      return false;
    }
  },

  // Get prediction accuracy statistics
  async getAccuracyStats(
    dateFrom?: string,
    dateTo?: string,
    modelType?: string
  ): Promise<PredictionAccuracy[]> {
    try {
      const { data, error } = await supabase.rpc("get_prediction_accuracy_stats", {
        date_from: dateFrom,
        date_to: dateTo,
        model_type: modelType,
      });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error("Error fetching accuracy stats:", error);
      return [];
    }
  },

  // Check if predictions need updating
  async checkPredictionFreshness(): Promise<{ stale: number; fresh: number }> {
    try {
      const now = new Date().toISOString();
      
      const [staleResult, freshResult] = await Promise.all([
        supabase
          .from("predictions")
          .select("id", { count: "exact" })
          .lt("expires_at", now),
        supabase
          .from("predictions")
          .select("id", { count: "exact" })
          .gt("expires_at", now)
      ]);

      return {
        stale: staleResult.count || 0,
        fresh: freshResult.count || 0,
      };
    } catch (error) {
      console.error("Error checking prediction freshness:", error);
      return { stale: 0, fresh: 0 };
    }
  },

  // Clean up expired predictions
  async cleanupExpiredPredictions(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc("cleanup_expired_predictions");

      if (error) throw error;

      return data || 0;
    } catch (error) {
      console.error("Error cleaning up expired predictions:", error);
      return 0;
    }
  },
};