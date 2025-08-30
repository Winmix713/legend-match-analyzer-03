-- 003_legend_mode_monitoring.sql
-- Advanced monitoring and performance tracking system

-- Create performance metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id BIGSERIAL PRIMARY KEY,
    function_name TEXT NOT NULL,
    execution_time INTERVAL NOT NULL,
    matches_processed INTEGER NOT NULL,
    cpu_usage NUMERIC(5,2),
    memory_usage NUMERIC(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create advanced system logs table
CREATE TABLE IF NOT EXISTS public.advanced_system_logs (
    id BIGSERIAL PRIMARY KEY,
    event_type TEXT NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    user_context JSONB,
    stack_trace TEXT,
    server_hostname TEXT DEFAULT inet_client_addr()::TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create feature calculation config table
CREATE TABLE IF NOT EXISTS public.feature_calculation_config (
    id SERIAL PRIMARY KEY,
    config_group TEXT NOT NULL,
    param_name TEXT NOT NULL,
    param_value JSONB NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(config_group, param_name)
);

-- Create materialized view for performance monitoring
CREATE MATERIALIZED VIEW IF NOT EXISTS public.materialized_view_monitoring AS
SELECT 
    schemaname,
    matviewname,
    matviewowner,
    tablespace,
    hasindexes,
    ispopulated
FROM pg_matviews;

-- Create view for feature calculation performance summary
CREATE VIEW IF NOT EXISTS public.feature_calculation_performance_summary AS
SELECT 
    DATE_TRUNC('day', created_at) as calculation_date,
    function_name as performance_category,
    COUNT(*) as total_events,
    AVG(EXTRACT(EPOCH FROM execution_time)) as avg_processing_time_seconds,
    MAX(EXTRACT(EPOCH FROM execution_time)) as max_processing_time_seconds
FROM public.performance_metrics
GROUP BY DATE_TRUNC('day', created_at), function_name
ORDER BY calculation_date DESC, performance_category;

-- Enhanced monitoring functions
CREATE OR REPLACE FUNCTION public.log_performance_metric(
    p_function_name TEXT,
    p_execution_time INTERVAL,
    p_matches_processed INTEGER,
    p_cpu_usage NUMERIC DEFAULT NULL,
    p_memory_usage NUMERIC DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.performance_metrics (
        function_name, 
        execution_time, 
        matches_processed, 
        cpu_usage, 
        memory_usage
    )
    VALUES (
        p_function_name, 
        p_execution_time, 
        p_matches_processed, 
        p_cpu_usage, 
        p_memory_usage
    );
END;
$$;

-- Advanced logging function
CREATE OR REPLACE FUNCTION public.log_advanced_system_event(
    p_event_type TEXT,
    p_message TEXT,
    p_details JSONB DEFAULT NULL,
    p_user_context JSONB DEFAULT NULL,
    p_stack_trace TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.advanced_system_logs (
        event_type, 
        message, 
        details, 
        user_context, 
        stack_trace
    )
    VALUES (
        p_event_type, 
        p_message, 
        p_details, 
        p_user_context, 
        p_stack_trace
    );
END;
$$;

-- Configuration management functions
CREATE OR REPLACE FUNCTION public.get_config_value(
    p_config_group TEXT,
    p_param_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    config_value JSONB;
BEGIN
    SELECT param_value INTO config_value
    FROM public.feature_calculation_config
    WHERE config_group = p_config_group 
      AND param_name = p_param_name 
      AND is_active = true;
    
    RETURN COALESCE(config_value, 'null'::JSONB);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_config_value(
    p_config_group TEXT,
    p_param_name TEXT,
    p_param_value JSONB,
    p_description TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.feature_calculation_config (
        config_group, 
        param_name, 
        param_value, 
        description
    )
    VALUES (
        p_config_group, 
        p_param_name, 
        p_param_value, 
        p_description
    )
    ON CONFLICT (config_group, param_name)
    DO UPDATE SET 
        param_value = EXCLUDED.param_value,
        description = COALESCE(EXCLUDED.description, feature_calculation_config.description),
        updated_at = now();
END;
$$;

-- System health check function
CREATE OR REPLACE FUNCTION public.system_health_check()
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
    health_report JSONB;
    table_counts JSONB;
    recent_errors INTEGER;
    avg_response_time NUMERIC;
BEGIN
    -- Count records in main tables
    SELECT jsonb_build_object(
        'matches', (SELECT COUNT(*) FROM public.matches),
        'predictions', (SELECT COUNT(*) FROM public.predictions),
        'teams', (SELECT COUNT(*) FROM public.teams),
        'system_logs', (SELECT COUNT(*) FROM public.system_logs WHERE created_at > now() - INTERVAL '24 hours')
    ) INTO table_counts;
    
    -- Check for recent errors
    SELECT COUNT(*) INTO recent_errors
    FROM public.advanced_system_logs
    WHERE event_type = 'ERROR' 
      AND created_at > now() - INTERVAL '1 hour';
    
    -- Calculate average response time
    SELECT AVG(EXTRACT(EPOCH FROM execution_time)) INTO avg_response_time
    FROM public.performance_metrics
    WHERE created_at > now() - INTERVAL '1 hour';
    
    health_report := jsonb_build_object(
        'status', CASE 
            WHEN recent_errors > 10 THEN 'critical'
            WHEN recent_errors > 5 THEN 'warning'
            ELSE 'healthy'
        END,
        'timestamp', now(),
        'table_counts', table_counts,
        'recent_errors', recent_errors,
        'avg_response_time_seconds', COALESCE(avg_response_time, 0),
        'database_size', pg_database_size(current_database())
    );
    
    RETURN health_report;
END;
$$;

-- Insert default configuration values
INSERT INTO public.feature_calculation_config (config_group, param_name, param_value, description) VALUES
('legend_mode', 'default_lookback_days', '90', 'Default lookback period for legend mode analysis'),
('legend_mode', 'min_goal_diff_threshold', '1', 'Minimum goal difference for comeback analysis'),
('legend_mode', 'confidence_level', '0.95', 'Statistical confidence level for calculations'),
('performance', 'max_execution_time_seconds', '30', 'Maximum allowed execution time for functions'),
('performance', 'enable_detailed_logging', 'true', 'Enable detailed performance logging'),
('batch_processing', 'max_batch_size', '1000', 'Maximum number of matches to process in one batch'),
('batch_processing', 'parallel_workers', '4', 'Number of parallel workers for batch processing')
ON CONFLICT (config_group, param_name) DO NOTHING;

-- Create indexes for monitoring tables
CREATE INDEX IF NOT EXISTS idx_performance_metrics_function_time 
ON public.performance_metrics(function_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_advanced_system_logs_event_time 
ON public.advanced_system_logs(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_feature_config_group_active 
ON public.feature_calculation_config(config_group, is_active) WHERE is_active = true;

-- Enable RLS on monitoring tables
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advanced_system_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_calculation_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for monitoring tables
CREATE POLICY "Allow service role access to performance metrics" 
ON public.performance_metrics FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role access to advanced system logs" 
ON public.advanced_system_logs FOR ALL 
USING (auth.role() = 'service_role');

CREATE POLICY "Allow read access to feature config" 
ON public.feature_calculation_config FOR SELECT 
USING (true);

CREATE POLICY "Allow service role access to feature config" 
ON public.feature_calculation_config FOR ALL 
USING (auth.role() = 'service_role');