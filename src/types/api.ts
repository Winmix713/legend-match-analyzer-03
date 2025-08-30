import { Match, StatisticsResult, LegendModeData } from './index';

// API Response wrapper types
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
  loading: boolean;
  success: boolean;
}

// Error types for comprehensive error handling
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  timestamp: string;
  requestId?: string;
  retryable: boolean;
}

// Error categories for better error handling
export enum ErrorType {
  VALIDATION = 'VALIDATION_ERROR',
  NETWORK = 'NETWORK_ERROR',
  SERVER = 'SERVER_ERROR',
  NOT_FOUND = 'DATA_NOT_FOUND',
  TIMEOUT = 'TIMEOUT_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  RATE_LIMIT = 'RATE_LIMIT_EXCEEDED',
  UNEXPECTED = 'UNEXPECTED_ERROR'
}

// Network status types
export interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  effectiveType: string;
}

// Loading states for different operations
export interface LoadingStates {
  search: boolean;
  statistics: boolean;
  matches: boolean;
  legends: boolean;
  teams: boolean;
}

// Validation schemas result type
export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Search interface validation types
export interface SearchFormData {
  homeTeam: string;
  awayTeam: string;
}

// API endpoint types
export type MatchSearchResponse = ApiResponse<Match[]>;
export type StatisticsResponse = ApiResponse<StatisticsResult>;
export type LegendModeResponse = ApiResponse<LegendModeData>;
export type TeamNamesResponse = ApiResponse<string[]>;

// Error handler hook types
export interface ErrorHandlerConfig {
  showToast?: boolean;
  logError?: boolean;
  retryable?: boolean;
  fallbackValue?: any;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter: boolean;
}