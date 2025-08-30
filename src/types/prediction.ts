export interface PredictionResult {
  home_win_probability: number;
  away_win_probability: number;
  draw_probability: number;
  btts_probability?: number;
  over25_probability?: number;
  predicted_score?: {
    home: number;
    away: number;
  };
  confidence_score?: number;
  key_factors?: string[];
  model_type?: string;
  calculation_method?: 'backend' | 'client_baseline';
}

export interface PredictionFeatures {
  home_team_form: number;
  away_team_form: number;
  home_advantage: number;
  head_to_head_ratio: number;
  avg_goals_home: number;
  avg_goals_away: number;
  recent_meetings: number;
  home_offensive_strength: number;
  away_offensive_strength: number;
  home_defensive_strength: number;
  away_defensive_strength: number;
}

export interface PoissonPrediction {
  home_goals_expected: number;
  away_goals_expected: number;
  probabilities: {
    home_win: number;
    draw: number;
    away_win: number;
    btts: number;
    over25: number;
  };
  score_matrix: number[][];
}