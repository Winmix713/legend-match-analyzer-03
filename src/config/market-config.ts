// Market types
export type Market = '1X2' | 'O/U' | 'BTTS' | 'HT/FT';
export type Outcome = 'Home Win' | 'Draw' | 'Away Win' | 'Over 2.5' | 'Under 2.5' | 'BTTS Yes' | 'BTTS No' | string;

// Market outcomes configuration
export const MARKET_OUTCOMES: Record<Market, Outcome[]> = {
  '1X2': ['Home Win', 'Draw', 'Away Win'],
  'O/U': ['Over 2.5', 'Under 2.5'],
  'BTTS': ['BTTS Yes', 'BTTS No'],
  'HT/FT': ['HT/FT 1/1', 'HT/FT 1/X', 'HT/FT 1/2', 'HT/FT X/1', 'HT/FT X/X', 'HT/FT X/2', 'HT/FT 2/1', 'HT/FT 2/X', 'HT/FT 2/2']
};

// Market display names
export const MARKET_DISPLAY_NAMES: Record<Market, string> = {
  '1X2': 'Match Result',
  'O/U': 'Over/Under 2.5',
  'BTTS': 'Both Teams To Score',
  'HT/FT': 'Half Time/Full Time'
};

// Market icons
export const MARKET_ICONS: Record<Market, string> = {
  '1X2': 'target',
  'O/U': 'trending-up',
  'BTTS': 'goal',
  'HT/FT': 'clock'
};

// Risk levels based on confidence
export const getRiskLevel = (confidence: number): { level: 'low' | 'medium' | 'high'; color: string } => {
  if (confidence >= 75) return { level: 'low', color: 'success' };
  if (confidence >= 65) return { level: 'medium', color: 'warning' };
  return { level: 'high', color: 'danger' };
};

// ROI categories
export const getROICategory = (roi: number): { category: string; color: string } => {
  if (roi >= 20) return { category: 'Excellent', color: 'success' };
  if (roi >= 10) return { category: 'Good', color: 'primary' };
  if (roi >= 0) return { category: 'Positive', color: 'secondary' };
  return { category: 'Negative', color: 'danger' };
};