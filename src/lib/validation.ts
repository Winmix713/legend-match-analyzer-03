import { z } from 'zod';
import { Match, StatisticsResult, LegendModeData } from '@/types';
import { SearchFormData, ValidationResult, ErrorType } from '@/types/api';

// Match validation schema
export const MatchSchema = z.object({
  id: z.number(),
  match_time: z.string(),
  home_team: z.string().min(1, "Hazai csapat neve kötelező"),
  away_team: z.string().min(1, "Vendég csapat neve kötelező"),
  half_time_home_goals: z.number().min(0, "Gólok száma nem lehet negatív"),
  half_time_away_goals: z.number().min(0, "Gólok száma nem lehet negatív"),
  full_time_home_goals: z.number().min(0, "Gólok száma nem lehet negatív"),
  full_time_away_goals: z.number().min(0, "Gólok száma nem lehet negatív"),
  league: z.string().min(1, "Liga neve kötelező"),
  season: z.string().min(1, "Évad kötelező"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

// Statistics validation schema
export const StatisticsSchema = z.object({
  total_matches: z.number().min(0),
  home_wins: z.number().min(0),
  away_wins: z.number().min(0),
  draws: z.number().min(0),
  home_goals: z.number().min(0),
  away_goals: z.number().min(0),
  average_goals_per_match: z.number().min(0),
  win_percentage: z.object({
    home: z.number().min(0).max(100),
    away: z.number().min(0).max(100),
    draw: z.number().min(0).max(100),
  }),
  last_5_matches: z.array(MatchSchema),
  form_guide: z.object({
    home_team: z.array(z.string()),
    away_team: z.array(z.string()),
  }),
});

// Legend mode validation schema
export const LegendModeSchema = z.object({
  comeback_analysis: z.object({
    home_comebacks: z.number().min(0),
    away_comebacks: z.number().min(0),
    biggest_comeback: z.object({
      match: MatchSchema,
      deficit: z.number().min(0),
    }),
  }),
  performance_trends: z.object({
    recent_form: z.number().min(0).max(100),
    home_advantage: z.number().min(0).max(100),
    away_performance: z.number().min(0).max(100),
  }),
  head_to_head: z.object({
    total_meetings: z.number().min(0),
    home_wins: z.number().min(0),
    away_wins: z.number().min(0),
    draws: z.number().min(0),
    goal_difference: z.number(),
  }),
});

// Search form validation schema
export const SearchFormSchema = z.object({
  homeTeam: z.string()
    .min(1, "Hazai csapat kiválasztása kötelező")
    .max(50, "Csapat neve túl hosszú"),
  awayTeam: z.string()
    .min(1, "Vendég csapat kiválasztása kötelező")
    .max(50, "Csapat neve túl hosszú"),
}).refine((data) => data.homeTeam !== data.awayTeam, {
  message: "A hazai és vendég csapat nem lehet ugyanaz",
  path: ["awayTeam"],
});

// Team names validation schema
export const TeamNamesSchema = z.array(z.string());

// Validation utility functions
export const validateMatch = (data: unknown): ValidationResult<Match> => {
  try {
    const match = MatchSchema.parse(data) as Match;
    return { success: true, data: match };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: ErrorType.VALIDATION
        }))
      };
    }
    return {
      success: false,
      errors: [{
        field: 'unknown',
        message: 'Ismeretlen validációs hiba',
        code: ErrorType.VALIDATION
      }]
    };
  }
};

export const validateMatches = (data: unknown): ValidationResult<Match[]> => {
  try {
    const matches = z.array(MatchSchema).parse(data) as Match[];
    return { success: true, data: matches };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: ErrorType.VALIDATION
        }))
      };
    }
    return {
      success: false,
      errors: [{
        field: 'matches',
        message: 'Meccsek validációja sikertelen',
        code: ErrorType.VALIDATION
      }]
    };
  }
};

export const validateStatistics = (data: unknown): ValidationResult<StatisticsResult> => {
  try {
    const statistics = StatisticsSchema.parse(data) as StatisticsResult;
    return { success: true, data: statistics };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: ErrorType.VALIDATION
        }))
      };
    }
    return {
      success: false,
      errors: [{
        field: 'statistics',
        message: 'Statisztikák validációja sikertelen',
        code: ErrorType.VALIDATION
      }]
    };
  }
};

export const validateLegendMode = (data: unknown): ValidationResult<LegendModeData> => {
  try {
    const legendData = LegendModeSchema.parse(data) as LegendModeData;
    return { success: true, data: legendData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: ErrorType.VALIDATION
        }))
      };
    }
    return {
      success: false,
      errors: [{
        field: 'legendMode',
        message: 'Legend mód validációja sikertelen',
        code: ErrorType.VALIDATION
      }]
    };
  }
};

export const validateSearchForm = (data: SearchFormData): ValidationResult<SearchFormData> => {
  try {
    const searchData = SearchFormSchema.parse(data) as SearchFormData;
    return { success: true, data: searchData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: ErrorType.VALIDATION
        }))
      };
    }
    return {
      success: false,
      errors: [{
        field: 'form',
        message: 'Keresési űrlap validációja sikertelen',
        code: ErrorType.VALIDATION
      }]
    };
  }
};

export const validateTeamNames = (data: unknown): ValidationResult<string[]> => {
  try {
    const teamNames = TeamNamesSchema.parse(data);
    return { success: true, data: teamNames };
  } catch (error) {
    return {
      success: false,
      errors: [{
        field: 'teamNames',
        message: 'Csapatnevek validációja sikertelen',
        code: ErrorType.VALIDATION
      }]
    };
  }
};

// Real-time validation for search inputs
export const validateTeamName = (teamName: string): { isValid: boolean; message?: string } => {
  if (!teamName.trim()) {
    return { isValid: false, message: "Csapat neve kötelező" };
  }
  
  if (teamName.length > 50) {
    return { isValid: false, message: "Csapat neve túl hosszú (max 50 karakter)" };
  }
  
  return { isValid: true };
};

export const validateTeamSelection = (homeTeam: string, awayTeam: string): { isValid: boolean; message?: string } => {
  const homeValidation = validateTeamName(homeTeam);
  if (!homeValidation.isValid) {
    return { isValid: false, message: `Hazai csapat: ${homeValidation.message}` };
  }
  
  const awayValidation = validateTeamName(awayTeam);
  if (!awayValidation.isValid) {
    return { isValid: false, message: `Vendég csapat: ${awayValidation.message}` };
  }
  
  if (homeTeam === awayTeam) {
    return { isValid: false, message: "A hazai és vendég csapat nem lehet ugyanaz" };
  }
  
  return { isValid: true };
};