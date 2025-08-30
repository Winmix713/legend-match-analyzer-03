
-- 001_create_predictions_and_indexes.sql
-- Enhanced prediction system with comprehensive indexing

-- Drop existing tables if they exist to recreate with new structure
DROP TABLE IF EXISTS public.prediction_analysis CASCADE;
DROP TABLE IF EXISTS public.match_analysis_enterprise CASCADE;

-- Create enhanced predictions table (extending existing structure)
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS prediction_accuracy NUMERIC(5,4);
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS actual_home_goals INTEGER;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS actual_away_goals INTEGER;
ALTER TABLE public.predictions ADD COLUMN IF NOT EXISTS match_completed BOOLEAN DEFAULT FALSE;

-- Create prediction analysis table
CREATE TABLE public.prediction_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID REFERENCES public.predictions(id),
    match_id INTEGER,
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT NOT NULL,
    match_date DATE NOT NULL,
    home_win_probability NUMERIC(5,4) NOT NULL,
    draw_probability NUMERIC(5,4) NOT NULL,
    away_win_probability NUMERIC(5,4) NOT NULL,
    predicted_home_goals NUMERIC(4,2),
    predicted_away_goals NUMERIC(4,2),
    predicted_total_goals NUMERIC(4,2),
    confidence_score NUMERIC(5,4),
    features_used JSONB,
    comeback_probability_home NUMERIC(5,4),
    comeback_probability_away NUMERIC(5,4),
    resilience_factor_home NUMERIC(8,6),
    resilience_factor_away NUMERIC(8,6),
    mental_strength_home NUMERIC(8,6),
    mental_strength_away NUMERIC(8,6),
    legend_mode_features JSONB,
    prediction_correct BOOLEAN,
    probability_accuracy NUMERIC(5,4),
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    actual_result TEXT,
    predicted_result TEXT,
    model_version TEXT,
    prediction_type TEXT DEFAULT 'standard',
    cache_key TEXT
);

-- Create match analysis enterprise table
CREATE TABLE public.match_analysis_enterprise (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id INTEGER,
    prediction_id UUID REFERENCES public.predictions(id),
    home_team TEXT NOT NULL,
    away_team TEXT NOT NULL,
    league TEXT NOT NULL,
    season TEXT,
    match_time TIMESTAMP WITH TIME ZONE,
    predicted_outcome TEXT,
    actual_outcome TEXT,
    predicted_result TEXT,
    actual_result TEXT,
    home_win_probability NUMERIC(5,4),
    draw_probability NUMERIC(5,4),
    away_win_probability NUMERIC(5,4),
    predicted_home_goals NUMERIC(4,2),
    predicted_away_goals NUMERIC(4,2),
    actual_home_goals INTEGER,
    actual_away_goals INTEGER,
    predicted_goal_diff NUMERIC(4,2),
    actual_goal_diff INTEGER,
    confidence_score NUMERIC(5,4),
    prediction_correct BOOLEAN,
    probability_accuracy NUMERIC(5,4),
    comeback_probability_home NUMERIC(5,4),
    comeback_probability_away NUMERIC(5,4),
    resilience_factor_home NUMERIC(8,6),
    resilience_factor_away NUMERIC(8,6),
    mental_strength_home NUMERIC(8,6),
    mental_strength_away NUMERIC(8,6),
    match_status match_status_enum DEFAULT 'scheduled',
    prediction_type TEXT DEFAULT 'standard',
    model_version TEXT,
    predicted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create comprehensive indexes for optimal performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_predictions_team_league_date 
ON public.predictions(home_team, away_team, league, match_date);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_predictions_cache_expires 
ON public.predictions(cache_key, expires_at) WHERE expires_at IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_predictions_legend_features 
ON public.predictions USING GIN(legend_mode_features) WHERE legend_mode_features IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_analysis_match_team 
ON public.prediction_analysis(match_date, home_team, away_team);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_prediction_analysis_confidence 
ON public.prediction_analysis(confidence_score DESC) WHERE confidence_score IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_analysis_enterprise_accuracy 
ON public.match_analysis_enterprise(probability_accuracy DESC) WHERE probability_accuracy IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_team_time_lookup 
ON public.matches(home_team, away_team, match_time DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_matches_league_season_time 
ON public.matches(league, season, match_time DESC);

-- Create composite types for structured data
CREATE TYPE IF NOT EXISTS public.team_form_stats AS (
    matches_played BIGINT,
    avg_goals_scored NUMERIC,
    avg_goals_conceded NUMERIC,
    wins BIGINT,
    draws BIGINT,
    losses BIGINT,
    win_rate NUMERIC,
    form_score NUMERIC
);

CREATE TYPE IF NOT EXISTS public.h2h_stats AS (
    total_meetings INTEGER,
    home_wins INTEGER,
    away_wins INTEGER,
    draws INTEGER,
    avg_home_goals NUMERIC,
    avg_away_goals NUMERIC,
    last_meeting_date DATE
);

CREATE TYPE IF NOT EXISTS public.comeback_stats AS (
    total_matches INTEGER,
    comeback_wins INTEGER,
    comeback_draws INTEGER,
    blown_leads INTEGER,
    comeback_frequency NUMERIC
);

-- Enable RLS on new tables
ALTER TABLE public.prediction_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_analysis_enterprise ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prediction analysis
CREATE POLICY "Allow read access to prediction analysis" 
ON public.prediction_analysis FOR SELECT 
USING (true);

CREATE POLICY "Allow insert/update for service role on prediction analysis" 
ON public.prediction_analysis FOR ALL 
USING (auth.role() = 'service_role');

-- Create RLS policies for match analysis enterprise
CREATE POLICY "Allow read access to match analysis enterprise" 
ON public.match_analysis_enterprise FOR SELECT 
USING (true);

CREATE POLICY "Allow insert/update for service role on match analysis enterprise" 
ON public.match_analysis_enterprise FOR ALL 
USING (auth.role() = 'service_role');
