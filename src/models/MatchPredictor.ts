import { supabase } from "@/integrations/supabase/client";

export interface MatchPredictionFeatures {
  homeTeamForm: number;
  awayTeamForm: number;
  homeAdvantage: number;
  headToHeadRatio: number;
  avgGoalsHome: number;
  avgGoalsAway: number;
  recentMeetings: number;
  homeOffensiveStrength: number;
  awayOffensiveStrength: number;
  homeDefensiveStrength: number;
  awayDefensiveStrength: number;
}

export interface PredictionResult {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  market: '1X2' | 'O/U' | 'BTTS' | 'HT/FT';
  prediction: string;
  probabilities: Record<string, number>;
  confidence: number;
  expectedRoi: number;
  features: MatchPredictionFeatures;
}

export class MatchPredictor {
  private static instance: MatchPredictor;

  private constructor() {}

  public static getInstance(): MatchPredictor {
    if (!MatchPredictor.instance) {
      MatchPredictor.instance = new MatchPredictor();
    }
    return MatchPredictor.instance;
  }

  // Predict 1X2 outcome using enhanced statistical methods
  public predict1X2(features: MatchPredictionFeatures, odds: { home: number; draw: number; away: number }): {
    prediction: 'Home Win' | 'Draw' | 'Away Win';
    probabilities: { home: number; draw: number; away: number };
    confidence: number;
    expectedRoi: number;
  } {
    // Calculate base probabilities using team form and strength
    const homeStrength = (features.homeTeamForm + features.homeOffensiveStrength + features.homeAdvantage) / 3;
    const awayStrength = (features.awayTeamForm + features.awayOffensiveStrength) / 2;
    
    // Adjust for head-to-head history
    const h2hAdjustment = features.headToHeadRatio - 0.5; // -0.5 to 0.5 range
    
    // Calculate raw probabilities
    let homeProb = 0.33 + (homeStrength - awayStrength) * 0.2 + h2hAdjustment * 0.1;
    let awayProb = 0.33 + (awayStrength - homeStrength) * 0.2 - h2hAdjustment * 0.1;
    let drawProb = 1 - homeProb - awayProb;
    
    // Ensure probabilities are within valid range and sum to 1
    homeProb = Math.max(0.15, Math.min(0.70, homeProb));
    awayProb = Math.max(0.15, Math.min(0.70, awayProb));
    drawProb = Math.max(0.15, Math.min(0.40, drawProb));
    
    // Normalize
    const total = homeProb + drawProb + awayProb;
    homeProb /= total;
    drawProb /= total;
    awayProb /= total;
    
    // Calculate expected values and select best bet
    const expectedValues = [
      { outcome: 'Home Win', prob: homeProb, odds: odds.home, ev: homeProb * odds.home - 1 },
      { outcome: 'Draw', prob: drawProb, odds: odds.draw, ev: drawProb * odds.draw - 1 },
      { outcome: 'Away Win', prob: awayProb, odds: odds.away, ev: awayProb * odds.away - 1 }
    ];
    
    // Sort by expected value
    expectedValues.sort((a, b) => b.ev - a.ev);
    
    const bestBet = expectedValues[0];
    const confidence = 50 + Math.abs(bestBet.ev) * 100; // Convert EV to confidence percentage
    
    return {
      prediction: bestBet.outcome as 'Home Win' | 'Draw' | 'Away Win',
      probabilities: { home: homeProb, draw: drawProb, away: awayProb },
      confidence: Math.min(95, Math.max(50, confidence)),
      expectedRoi: bestBet.ev * 100
    };
  }

  // Predict Over/Under 2.5 goals
  public predictOverUnder(features: MatchPredictionFeatures, odds: { over: number; under: number }): {
    prediction: 'Over 2.5' | 'Under 2.5';
    probabilities: { over: number; under: number };
    confidence: number;
    expectedRoi: number;
  } {
    // Calculate expected total goals
    const expectedGoals = features.avgGoalsHome + features.avgGoalsAway;
    
    // Use Poisson distribution approximation
    const overProb = 1 / (1 + Math.exp(-(expectedGoals - 2.5) * 1.5));
    const underProb = 1 - overProb;
    
    // Calculate expected values
    const overEV = overProb * odds.over - 1;
    const underEV = underProb * odds.under - 1;
    
    const bestBet = overEV > underEV ? 'over' : 'under';
    const expectedRoi = Math.max(overEV, underEV);
    
    // Calculate confidence based on how far expected goals is from 2.5
    const confidence = 50 + Math.min(Math.abs(expectedGoals - 2.5) * 20, 40);
    
    return {
      prediction: bestBet === 'over' ? 'Over 2.5' : 'Under 2.5',
      probabilities: { over: overProb, under: underProb },
      confidence: Math.min(95, Math.max(50, confidence)),
      expectedRoi: expectedRoi * 100
    };
  }

  // Predict Both Teams to Score
  public predictBTTS(features: MatchPredictionFeatures, odds: { yes: number; no: number }): {
    prediction: 'BTTS Yes' | 'BTTS No';
    probabilities: { yes: number; no: number };
    confidence: number;
    expectedRoi: number;
  } {
    // Calculate BTTS probability based on both teams' scoring rates
    const homeScoreProb = Math.min(0.9, features.homeOffensiveStrength * 0.8 + 0.1);
    const awayScoreProb = Math.min(0.9, features.awayOffensiveStrength * 0.8 + 0.1);
    
    const bttsYesProb = homeScoreProb * awayScoreProb;
    const bttsNoProb = 1 - bttsYesProb;
    
    // Calculate expected values
    const yesEV = bttsYesProb * odds.yes - 1;
    const noEV = bttsNoProb * odds.no - 1;
    
    const bestBet = yesEV > noEV ? 'yes' : 'no';
    const expectedRoi = Math.max(yesEV, noEV);
    
    // Calculate confidence
    const confidence = 50 + Math.abs(bttsYesProb - 0.5) * 80;
    
    return {
      prediction: bestBet === 'yes' ? 'BTTS Yes' : 'BTTS No',
      probabilities: { yes: bttsYesProb, no: bttsNoProb },
      confidence: Math.min(95, Math.max(50, confidence)),
      expectedRoi: expectedRoi * 100
    };
  }

  // Generate comprehensive match prediction
  public async generatePrediction(
    homeTeam: string,
    awayTeam: string,
    league: string,
    matchDate: string,
    odds: {
      home: number;
      draw: number;
      away: number;
      over25: number;
      under25: number;
      bttsYes: number;
      bttsNo: number;
    }
  ): Promise<PredictionResult[]> {
    try {
      // Calculate features (in a real implementation, this would fetch from database)
      const features = await this.calculateFeatures(homeTeam, awayTeam, league);
      
      const predictions: PredictionResult[] = [];
      
      // Generate 1X2 prediction
      const prediction1X2 = this.predict1X2(features, {
        home: odds.home,
        draw: odds.draw,
        away: odds.away
      });
      
      predictions.push({
        matchId: Date.now(), // Temporary ID
        homeTeam,
        awayTeam,
        date: matchDate,
        market: '1X2',
        prediction: prediction1X2.prediction,
        probabilities: prediction1X2.probabilities,
        confidence: prediction1X2.confidence,
        expectedRoi: prediction1X2.expectedRoi,
        features
      });
      
      // Generate O/U prediction
      const predictionOU = this.predictOverUnder(features, {
        over: odds.over25,
        under: odds.under25
      });
      
      predictions.push({
        matchId: Date.now() + 1,
        homeTeam,
        awayTeam,
        date: matchDate,
        market: 'O/U',
        prediction: predictionOU.prediction,
        probabilities: predictionOU.probabilities,
        confidence: predictionOU.confidence,
        expectedRoi: predictionOU.expectedRoi,
        features
      });
      
      // Generate BTTS prediction
      const predictionBTTS = this.predictBTTS(features, {
        yes: odds.bttsYes,
        no: odds.bttsNo
      });
      
      predictions.push({
        matchId: Date.now() + 2,
        homeTeam,
        awayTeam,
        date: matchDate,
        market: 'BTTS',
        prediction: predictionBTTS.prediction,
        probabilities: predictionBTTS.probabilities,
        confidence: predictionBTTS.confidence,
        expectedRoi: predictionBTTS.expectedRoi,
        features
      });
      
      return predictions;
    } catch (error) {
      console.error('Error generating predictions:', error);
      throw error;
    }
  }

  private async calculateFeatures(homeTeam: string, awayTeam: string, league: string): Promise<MatchPredictionFeatures> {
    // In a real implementation, this would fetch and calculate from database
    // For now, return mock features
    return {
      homeTeamForm: 0.65,
      awayTeamForm: 0.58,
      homeAdvantage: 0.15,
      headToHeadRatio: 0.6,
      avgGoalsHome: 1.8,
      avgGoalsAway: 1.3,
      recentMeetings: 0.7,
      homeOffensiveStrength: 0.72,
      awayOffensiveStrength: 0.61,
      homeDefensiveStrength: 0.68,
      awayDefensiveStrength: 0.73
    };
  }
}