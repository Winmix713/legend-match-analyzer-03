/**
 * Prediction utilities for calculating calibrated confidence scores
 * and normalized entropy measures to improve prediction quality assessment
 */

export interface ConfidenceFactors {
  sharpness: number;      // How decisive the probabilities are (0-1)
  recency: number;        // How recent the data is (0-1)
  completeness: number;   // How complete the data is (0-1)
  accuracy: number;       // Historical model accuracy (0-1)
}

export interface ProbabilityDistribution {
  home_win_probability: number;
  draw_probability: number;
  away_win_probability: number;
}

/**
 * Calculate normalized entropy for probability distribution
 * Lower entropy = more decisive prediction = higher confidence
 */
export function calculateNormalizedEntropy(probabilities: ProbabilityDistribution): number {
  const { home_win_probability, draw_probability, away_win_probability } = probabilities;
  
  // Normalize probabilities to ensure they sum to 1
  const total = home_win_probability + draw_probability + away_win_probability;
  if (total === 0) return 1; // Maximum entropy for zero probabilities
  
  const p1 = home_win_probability / total;
  const p2 = draw_probability / total;
  const p3 = away_win_probability / total;
  
  // Calculate Shannon entropy
  const entropy = -[p1, p2, p3].reduce((sum, p) => {
    return sum + (p > 0 ? p * Math.log2(p) : 0);
  }, 0);
  
  // Normalize to 0-1 range (max entropy for 3 outcomes is log2(3))
  const maxEntropy = Math.log2(3);
  return entropy / maxEntropy;
}

/**
 * Calculate sharpness score - how decisive the prediction is
 * Higher values indicate more confident, decisive predictions
 */
export function calculateSharpness(probabilities: ProbabilityDistribution): number {
  const normalizedEntropy = calculateNormalizedEntropy(probabilities);
  
  // Convert entropy to sharpness (inverse relationship)
  // Sharp prediction = low entropy = high sharpness
  return 1 - normalizedEntropy;
}

/**
 * Calculate recency factor based on data freshness
 * More recent data gets higher weight
 */
export function calculateRecencyFactor(
  dataAge: number = 0,
  maxAgeHours: number = 24
): number {
  if (dataAge <= 0) return 1.0; // Brand new data
  
  // Exponential decay for older data
  const decayRate = 0.1; // Adjust this to control how quickly confidence decreases
  const ageInHours = Math.min(dataAge, maxAgeHours * 2); // Cap at 2x max age
  
  return Math.exp(-decayRate * (ageInHours / maxAgeHours));
}

/**
 * Calculate data completeness factor
 * Based on available features and data quality
 */
export function calculateCompletenessFactor(
  availableFeatures: number,
  totalFeatures: number = 11,
  minRequiredFeatures: number = 5
): number {
  if (availableFeatures < minRequiredFeatures) {
    return 0.3; // Minimum confidence for incomplete data
  }
  
  const completeness = availableFeatures / totalFeatures;
  return Math.min(1.0, completeness);
}

/**
 * Calculate calibrated confidence score using multiple factors
 * This replaces simple fixed confidence values with a more sophisticated approach
 */
export function calculateCalibratedConfidence(
  probabilities: ProbabilityDistribution,
  factors: Partial<ConfidenceFactors> = {}
): number {
  // Calculate sharpness from probabilities
  const sharpness = calculateSharpness(probabilities);
  
  // Use provided factors or defaults
  const {
    recency = 0.8,      // Default to reasonably fresh data
    completeness = 0.7, // Default to mostly complete data
    accuracy = 0.75     // Default model accuracy
  } = factors;
  
  // Weighted combination of factors
  const weights = {
    sharpness: 0.4,     // How decisive the prediction is
    recency: 0.2,       // How fresh the data is
    completeness: 0.2,  // How complete the data is
    accuracy: 0.2       // Historical model performance
  };
  
  const calibratedConfidence = 
    (sharpness * weights.sharpness) +
    (recency * weights.recency) +
    (completeness * weights.completeness) +
    (accuracy * weights.accuracy);
  
  // Ensure result is within bounds and apply reasonable limits
  const bounded = Math.max(0.1, Math.min(0.95, calibratedConfidence));
  
  // Apply confidence curve to make the scale more intuitive
  // This makes mid-range values more common and extreme values rarer
  return applyConfidenceCurve(bounded);
}

/**
 * Apply a sigmoid-like curve to confidence values
 * This makes the confidence scale more intuitive and realistic
 */
function applyConfidenceCurve(rawConfidence: number): number {
  // Sigmoid transformation to create more realistic distribution
  const x = (rawConfidence - 0.5) * 6; // Scale and center
  const sigmoid = 1 / (1 + Math.exp(-x));
  
  // Map sigmoid output to reasonable confidence range (0.2 to 0.9)
  const minConf = 0.2;
  const maxConf = 0.9;
  
  return minConf + (sigmoid * (maxConf - minConf));
}

/**
 * Generate explanation text for confidence factors
 */
export function explainConfidenceFactors(
  probabilities: ProbabilityDistribution,
  factors: Partial<ConfidenceFactors> = {}
): string[] {
  const explanations: string[] = [];
  
  const sharpness = calculateSharpness(probabilities);
  const entropy = calculateNormalizedEntropy(probabilities);
  
  // Sharpness explanation
  if (sharpness > 0.7) {
    explanations.push("Egyértelmű előrejelzés (alacsony bizonytalanság)");
  } else if (sharpness > 0.4) {
    explanations.push("Mérsékelt bizonytalanság a kimenetelben");
  } else {
    explanations.push("Nagyfokú bizonytalanság, kiegyenlített esélyek");
  }
  
  // Data quality explanations
  if (factors.recency && factors.recency > 0.8) {
    explanations.push("Friss adatok alapján");
  } else if (factors.recency && factors.recency < 0.5) {
    explanations.push("Régebbi adatok, óvatosan kezelendő");
  }
  
  if (factors.completeness && factors.completeness > 0.8) {
    explanations.push("Teljes adatkészlet rendelkezésre áll");
  } else if (factors.completeness && factors.completeness < 0.6) {
    explanations.push("Korlátozott adatok alapján");
  }
  
  // Model accuracy
  if (factors.accuracy && factors.accuracy > 0.8) {
    explanations.push("Magas pontosságú modell");
  } else if (factors.accuracy && factors.accuracy < 0.6) {
    explanations.push("Modell pontossága javítható");
  }
  
  return explanations;
}

/**
 * Utility to format confidence percentage with appropriate precision
 */
export function formatConfidencePercentage(confidence: number): string {
  const percentage = confidence * 100;
  
  if (percentage >= 10) {
    return Math.round(percentage).toString();
  } else {
    return percentage.toFixed(1);
  }
}

/**
 * Get confidence level text based on numerical value
 */
export function getConfidenceLevel(confidence: number): {
  level: 'low' | 'medium' | 'high' | 'very_high';
  text: string;
  color: string;
} {
  if (confidence >= 0.8) {
    return { level: 'very_high', text: 'Nagyon magas', color: 'success' };
  } else if (confidence >= 0.65) {
    return { level: 'high', text: 'Magas', color: 'success' };
  } else if (confidence >= 0.45) {
    return { level: 'medium', text: 'Közepes', color: 'warning' };
  } else {
    return { level: 'low', text: 'Alacsony', color: 'destructive' };
  }
}