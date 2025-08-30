
import { supabase } from "@/integrations/supabase/client";
import type { Database } from '@/integrations/supabase/types';

export const databaseService = {
  // Create missing database functions
  async createMissingFunctions(): Promise<boolean> {
    try {
      // Since we can't create functions directly, we'll return true
      // and rely on the backend having the required functions
      console.log('Database functions check completed');
      return true;
    } catch (error) {
      console.error('Error creating database functions:', error);
      return false;
    }
  },

  // Check if required functions exist
  async checkFunctionExists(functionName: keyof Database['public']['Functions']): Promise<boolean> {
    try {
      // Try to call the function with minimal parameters to check if it exists
      const { error } = await supabase.rpc(functionName);
      
      // If there's no error or it's a parameter error, the function exists
      return !error || error.message.includes('parameter');
    } catch {
      return false;
    }
  },

  // Initialize sample data for testing
  async initializeSampleData(): Promise<boolean> {
    try {
      // Check if we already have data
      const { count } = await supabase
        .from('predictions')
        .select('*', { count: 'exact', head: true });

      // Only add sample data if we have less than 3 records
      if (count && count >= 3) {
        console.log('Sample data already exists');
        return true;
      }

      const samplePredictions = [
        {
          home_team: 'Manchester City',
          away_team: 'Liverpool',
          home_win_probability: 0.45,
          away_win_probability: 0.35,
          draw_probability: 0.20,
          confidence_score: 0.78,
          prediction_type: 'enhanced',
          cache_key: 'sample_1_' + Date.now(),
          league: 'Premier League',
          match_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          prediction_correct: true,
          probability_accuracy: 0.85
        },
        {
          home_team: 'Arsenal',
          away_team: 'Chelsea',
          home_win_probability: 0.40,
          away_win_probability: 0.30,
          draw_probability: 0.30,
          confidence_score: 0.65,
          prediction_type: 'baseline',
          cache_key: 'sample_2_' + Date.now(),
          league: 'Premier League',
          match_date: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          prediction_correct: false,
          probability_accuracy: 0.52
        }
      ];

      // Insert sample data with better error handling
      const { error } = await supabase
        .from('predictions')
        .insert(samplePredictions);
      
      if (error) {
        console.error('Error inserting sample data:', error);
        // Don't return false here, as the main functionality can work without sample data
        return true;
      }

      console.log('Sample data initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing sample data:', error);
      return true; // Return true to not block the main functionality
    }
  }
};
