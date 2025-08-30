export interface AnalyticsMetrics {
  page_views: number;
  unique_visitors: number;
  session_duration: number;
  bounce_rate: number;
  api_requests: number;
  error_rate: number;
  response_time: number;
  concurrent_users: number;
}

export interface UserActivity {
  user_id: string;
  session_id: string;
  action: string;
  page: string;
  timestamp: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export interface PerformanceMetric {
  id: string;
  metric_name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface RealTimeMetrics {
  active_users: number;
  requests_per_minute: number;
  errors_per_minute: number;
  database_connections: number;
  memory_usage: number;
  cpu_usage: number;
  cache_hit_rate: number;
}

export interface ChartData {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AnalyticsFilter {
  start_date: string;
  end_date: string;
  metric_types?: string[];
  user_roles?: string[];
  aggregation?: 'hour' | 'day' | 'week' | 'month';
}

export interface PredictionMetrics {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  total_predictions: number;
  correct_predictions: number;
  model_version: string;
  last_updated: string;
}

export interface DataQualityMetrics {
  completeness: number;
  accuracy: number;
  consistency: number;
  timeliness: number;
  validity: number;
  total_records: number;
  error_records: number;
  last_check: string;
}