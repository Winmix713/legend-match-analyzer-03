
export interface Match {
  id: number;
  match_time: string; // TIME format HH:MM (e.g., "20:37")
  home_team: string;
  away_team: string;
  half_time_home_goals: number;
  half_time_away_goals: number;
  full_time_home_goals: number;
  full_time_away_goals: number;
  league: string;
  season: string;
  created_at?: string;
  updated_at?: string;
}

export interface StatisticsResult {
  total_matches: number;
  home_wins: number;
  away_wins: number;
  draws: number;
  home_goals: number;
  away_goals: number;
  average_goals_per_match: number;
  win_percentage: {
    home: number;
    away: number;
    draw: number;
  };
  last_5_matches: Match[];
  form_guide: {
    home_team: string[];
    away_team: string[];
  };
}

export interface PredictionResult {
  home_win_probability: number;
  away_win_probability: number;
  draw_probability: number;
  predicted_score: {
    home: number;
    away: number;
  };
  confidence: number;
  key_factors: string[];
}

export interface LegendModeData {
  comeback_analysis: {
    home_comebacks: number;
    away_comebacks: number;
    biggest_comeback: {
      match: Match;
      deficit: number;
    };
  };
  performance_trends: {
    recent_form: number;
    home_advantage: number;
    away_performance: number;
  };
  head_to_head: {
    total_meetings: number;
    home_wins: number;
    away_wins: number;
    draws: number;
    goal_difference: number;
  };
}
