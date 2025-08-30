import { createClient } from '@supabase/supabase-js';

// These would be environment variables in a production app
const supabaseUrl = 'https://your-supabase-url.supabase.co';
const supabaseKey = 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Prediction types
export type Market = '1X2' | 'O/U' | 'BTTS' | 'HT/FT';
export type Outcome = 'Home Win' | 'Draw' | 'Away Win' | 'Over 2.5' | 'Under 2.5' | 'BTTS Yes' | 'BTTS No' | string;

export interface Prediction {
  id: number;
  match_id: number;
  match: string;
  date: string;
  market: Market;
  prediction: Outcome;
  confidence: number;
  odds: number;
  expected_roi: number;
  actual_result?: Outcome;
  is_correct?: boolean;
  created_at: string;
}

// Database functions
export async function fetchRecommendedMatches() {
  const { data, error } = await supabase
    .from('predictions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error('Error fetching recommended matches:', error);
    return [];
  }
  
  return data;
}

export async function updateMatchResult(id: number, actualResult: Outcome, isCorrect: boolean) {
  const { data, error } = await supabase
    .from('predictions')
    .update({ 
      actual_result: actualResult,
      is_correct: isCorrect,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
    
  if (error) {
    console.error('Error updating match result:', error);
    return null;
  }
  
  return data;
}

export async function fetchPredictionStats() {
  const { data, error } = await supabase
    .rpc('get_prediction_stats');
    
  if (error) {
    console.error('Error fetching prediction stats:', error);
    return null;
  }
  
  return data;
}

export async function fetchHistoricalPerformance() {
  const { data, error } = await supabase
    .rpc('get_historical_performance');
    
  if (error) {
    console.error('Error fetching historical performance:', error);
    return null;
  }
  
  return data;
}

// Database schema types
export interface TeamModel {
  id: string;
  team_id: number;
  team_name: string;
  model_type: 'home' | 'away' | 'general';
  algorithm: 'logistic_regression' | 'random_forest' | 'xgboost' | 'lightgbm';
  features: string[];
  performance_metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    roc_auc: number;
  };
  last_trained: string;
  version: number;
  is_active: boolean;
  model_data: any;
  created_at: string;
  updated_at: string;
}

export interface Match {
  id: number;
  league_id: number;
  league_name: string;
  season: string;
  match_date: string;
  home_team_id: number;
  home_team: string;
  away_team_id: number;
  away_team: string;
  home_goals_ht: number;
  away_goals_ht: number;
  home_goals_ft: number;
  away_goals_ft: number;
  result_1x2: '1' | 'X' | '2';
  result_ou25: 'O' | 'U';
  result_btts: 'yes' | 'no';
  result_htft: string;
  odds_1: number;
  odds_x: number;
  odds_2: number;
  odds_o25: number;
  odds_u25: number;
  odds_btts_yes: number;
  odds_btts_no: number;
  odds_htft: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface MatchPrediction {
  id: string;
  match_id: number;
  prediction_type: '1x2' | 'ou25' | 'btts' | 'htft';
  predicted_outcome: string;
  confidence: number;
  probability_distribution: Record<string, number>;
  expected_roi: number;
  actual_outcome?: string;
  is_correct?: boolean;
  model_id: string;
  created_at: string;
  updated_at: string;
}

export interface TeamStats {
  id: number;
  team_id: number;
  team_name: string;
  league_id: number;
  season: string;
  matches_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_scored: number;
  goals_conceded: number;
  clean_sheets: number;
  failed_to_score: number;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  form_last_5: string;
  home_matches_played?: number;
  home_wins?: number;
  home_draws?: number;
  home_losses?: number;
  home_goals_scored?: number;
  home_goals_conceded?: number;
  away_matches_played?: number;
  away_wins?: number;
  away_draws?: number;
  away_losses?: number;
  away_goals_scored?: number;
  away_goals_conceded?: number;
  created_at: string;
  updated_at: string;
}

export interface SeasonPrediction {
  id: string;
  season: string;
  league_id: number;
  league_name: string;
  predictions: {
    match_id: number;
    home_team: string;
    away_team: string;
    match_date: string;
    predictions: {
      '1x2': {
        outcome: '1' | 'X' | '2';
        probabilities: {
          '1': number;
          'X': number;
          '2': number;
        };
        confidence: number;
      };
      'ou25': {
        outcome: 'O' | 'U';
        probabilities: {
          'O': number;
          'U': number;
        };
        confidence: number;
      };
      'btts': {
        outcome: 'yes' | 'no';
        probabilities: {
          'yes': number;
          'no': number;
        };
        confidence: number;
      };
      'htft': {
        outcome: string;
        probabilities: Record<string, number>;
        confidence: number;
      };
    };
  }[];
  created_at: string;
  updated_at: string;
}

// Database functions for team models
export async function fetchTeamModels(teamId?: number) {
  const query = supabase.from('team_models').select('*');
  
  if (teamId) {
    query.eq('team_id', teamId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching team models:', error);
    return [];
  }
  
  return data as TeamModel[];
}

export async function createTeamModel(model: Omit<TeamModel, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('team_models')
    .insert([{
      ...model,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select();
  
  if (error) {
    console.error('Error creating team model:', error);
    return null;
  }
  
  return data?.[0] as TeamModel;
}

export async function updateTeamModel(id: string, updates: Partial<TeamModel>) {
  const { data, error } = await supabase
    .from('team_models')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating team model:', error);
    return null;
  }
  
  return data?.[0] as TeamModel;
}

// Database functions for matches
export async function fetchMatches(options?: {
  leagueId?: number;
  season?: string;
  teamId?: number;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('matches').select('*');
  
  if (options?.leagueId) {
    query = query.eq('league_id', options.leagueId);
  }
  
  if (options?.season) {
    query = query.eq('season', options.season);
  }
  
  if (options?.teamId) {
    query = query.or(`home_team_id.eq.${options.teamId},away_team_id.eq.${options.teamId}`);
  }
  
  if (options?.limit) {
    query = query.limit(options.limit);
  }
  
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching matches:', error);
    return [];
  }
  
  return data as Match[];
}

export async function fetchMatchById(id: number) {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error(`Error fetching match with id ${id}:`, error);
    return null;
  }
  
  return data as Match;
}

// Database functions for match predictions
export async function createMatchPrediction(prediction: Omit<MatchPrediction, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('match_predictions')
    .insert([{
      ...prediction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select();
  
  if (error) {
    console.error('Error creating match prediction:', error);
    return null;
  }
  
  return data?.[0] as MatchPrediction;
}

export async function fetchMatchPredictions(matchId: number) {
  const { data, error } = await supabase
    .from('match_predictions')
    .select('*')
    .eq('match_id', matchId);
  
  if (error) {
    console.error(`Error fetching predictions for match ${matchId}:`, error);
    return [];
  }
  
  return data as MatchPrediction[];
}

export async function updateMatchPredictionResult(
  id: string, 
  actualOutcome: string, 
  isCorrect: boolean
) {
  const { data, error } = await supabase
    .from('match_predictions')
    .update({
      actual_outcome: actualOutcome,
      is_correct: isCorrect,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select();
  
  if (error) {
    console.error('Error updating match prediction result:', error);
    return null;
  }
  
  return data?.[0] as MatchPrediction;
}

// Database functions for team statistics
export async function fetchTeamStats(teamId: number, season?: string) {
  let query = supabase
    .from('team_stats')
    .select('*')
    .eq('team_id', teamId);
  
  if (season) {
    query = query.eq('season', season);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error(`Error fetching stats for team ${teamId}:`, error);
    return null;
  }
  
  return data?.[0] as TeamStats;
}

// Database functions for season predictions
export async function createSeasonPrediction(prediction: Omit<SeasonPrediction, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('season_predictions')
    .insert([{
      ...prediction,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }])
    .select();
  
  if (error) {
    console.error('Error creating season prediction:', error);
    return null;
  }
  
  return data?.[0] as SeasonPrediction;
}

export async function fetchSeasonPrediction(season: string, leagueId: number) {
  const { data, error } = await supabase
    .from('season_predictions')
    .select('*')
    .eq('season', season)
    .eq('league_id', leagueId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  if (error) {
    console.error(`Error fetching season prediction for ${season}:`, error);
    return null;
  }
  
  return data as SeasonPrediction;
}
