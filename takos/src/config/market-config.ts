import { Outcome } from "../lib/supabase";

// Market outcomes configuration
export const MARKET_OUTCOMES: Record<string, Outcome[]> = {
  '1X2': ['Home Win', 'Draw', 'Away Win'],
  'O/U': ['Over 2.5', 'Under 2.5'],
  'BTTS': ['BTTS Yes', 'BTTS No'],
  'HT/FT': ['HT/FT 1/1', 'HT/FT 1/X', 'HT/FT 1/2', 'HT/FT X/1', 'HT/FT X/X', 'HT/FT X/2', 'HT/FT 2/1', 'HT/FT 2/X', 'HT/FT 2/2']
};

// Market display names
export const MARKET_DISPLAY_NAMES: Record<string, string> = {
  '1X2': 'Match Result',
  'O/U': 'Over/Under 2.5',
  'BTTS': 'Both Teams To Score',
  'HT/FT': 'Half Time/Full Time'
};
