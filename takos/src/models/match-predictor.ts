import { v4 as uuidv4 } from 'uuid';
import { TeamModelManager } from './team-model';
import { Match, TeamStats, MatchPrediction, createMatchPrediction } from '../lib/supabase';

export interface MatchPredictionResult {
  matchId: number;
  homeTeam: string;
  awayTeam: string;
  date: string;
  predictions: {
    '1x2': {
      outcome: '1' | 'X' | '2';
      probabilities: {
        '1': number;
        'X': number;
        '2': number;
      };
      confidence: number;
      expectedRoi: number;
    };
    'ou25': {
      outcome: 'O' | 'U';
      probabilities: {
        'O': number;
        'U': number;
      };
      confidence: number;
      expectedRoi: number;
    };
    'btts': {
      outcome: 'yes' | 'no';
      probabilities: {
        'yes': number;
        'no': number;
      };
      confidence: number;
      expectedRoi: number;
    };
    'htft': {
      outcome: string;
      probabilities: Record<string, number>;
      confidence: number;
      expectedRoi: number;
    };
  };
  overallRoi: number;
  overallConfidence: number;
}

export class MatchPredictor {
  private homeTeamModel: TeamModelManager;
  private awayTeamModel: TeamModelManager;
  private historicalStats: {
    '1x2': { valoszinuseg: number; atlag_odds: number };
    'ou25': { valoszinuseg: number; atlag_odds: number };
    'btts': { valoszinuseg: number; atlag_odds: number };
    'htft': { valoszinuseg: number; atlag_odds: number };
  };
  
  constructor(
    homeTeamModel: TeamModelManager,
    awayTeamModel: TeamModelManager,
    historicalStats?: any
  ) {
    this.homeTeamModel = homeTeamModel;
    this.awayTeamModel = awayTeamModel;
    
    // Default historical stats if not provided
    this.historicalStats = historicalStats || {
      '1x2': { valoszinuseg: 0.45, atlag_odds: 2.3 },
      'ou25': { valoszinuseg: 0.55, atlag_odds: 1.9 },
      'btts': { valoszinuseg: 0.60, atlag_odds: 1.8 },
      'htft': { valoszinuseg: 0.25, atlag_odds: 4.5 }
    };
  }
  
  // Predict match outcomes
  predict(match: Match): MatchPredictionResult {
    // Get predictions from both team models
    const homePrediction = this.homeTeamModel.predict(match.away_team_id, true);
    const awayPrediction = this.awayTeamModel.predict(match.home_team_id, false);
    
    // Combine predictions from both models
    const combinedPredictions = this.combineTeamPredictions(homePrediction, awayPrediction);
    
    // Calculate 1X2 prediction
    const prediction1X2 = this.predict1X2(
      combinedPredictions.homeWin,
      combinedPredictions.draw,
      combinedPredictions.awayWin,
      match.odds_1,
      match.odds_x,
      match.odds_2
    );
    
    // Calculate Over/Under 2.5 prediction
    const predictionOU25 = this.predictOU25(
      combinedPredictions.totalGoals,
      match.odds_o25,
      match.odds_u25
    );
    
    // Calculate BTTS prediction
    const predictionBTTS = this.predictBTTS(
      combinedPredictions.bttsProb,
      match.odds_btts_yes,
      match.odds_btts_no
    );
    
    // Calculate HT/FT prediction
    const predictionHTFT = this.predictHTFT(
      combinedPredictions.homeWin,
      combinedPredictions.draw,
      combinedPredictions.awayWin,
      match.odds_htft
    );
    
    // Calculate overall ROI and confidence
    const overallRoi = (
      prediction1X2.expectedRoi +
      predictionOU25.expectedRoi +
      predictionBTTS.expectedRoi +
      predictionHTFT.expectedRoi
    ) / 4;
    
    const overallConfidence = (
      prediction1X2.confidence +
      predictionOU25.confidence +
      predictionBTTS.confidence +
      predictionHTFT.confidence
    ) / 4;
    
    return {
      matchId: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      date: match.match_date,
      predictions: {
        '1x2': prediction1X2,
        'ou25': predictionOU25,
        'btts': predictionBTTS,
        'htft': predictionHTFT
      },
      overallRoi,
      overallConfidence
    };
  }
  
  // Save predictions to database
  async savePredictions(matchPrediction: MatchPredictionResult): Promise<boolean> {
    try {
      // Save 1X2 prediction
      const prediction1X2 = await createMatchPrediction({
        match_id: matchPrediction.matchId,
        prediction_type: '1x2',
        predicted_outcome: matchPrediction.predictions['1x2'].outcome,
        confidence: matchPrediction.predictions['1x2'].confidence,
        probability_distribution: matchPrediction.predictions['1x2'].probabilities,
        expected_roi: matchPrediction.predictions['1x2'].expectedRoi,
        model_id: this.homeTeamModel.getModelId() || 'unknown'
      });
      
      // Save OU2.5 prediction
      const predictionOU25 = await createMatchPrediction({
        match_id: matchPrediction.matchId,
        prediction_type: 'ou25',
        predicted_outcome: matchPrediction.predictions['ou25'].outcome,
        confidence: matchPrediction.predictions['ou25'].confidence,
        probability_distribution: matchPrediction.predictions['ou25'].probabilities,
        expected_roi: matchPrediction.predictions['ou25'].expectedRoi,
        model_id: this.homeTeamModel.getModelId() || 'unknown'
      });
      
      // Save BTTS prediction
      const predictionBTTS = await createMatchPrediction({
        match_id: matchPrediction.matchId,
        prediction_type: 'btts',
        predicted_outcome: matchPrediction.predictions['btts'].outcome,
        confidence: matchPrediction.predictions['btts'].confidence,
        probability_distribution: matchPrediction.predictions['btts'].probabilities,
        expected_roi: matchPrediction.predictions['btts'].expectedRoi,
        model_id: this.homeTeamModel.getModelId() || 'unknown'
      });
      
      // Save HT/FT prediction
      const predictionHTFT = await createMatchPrediction({
        match_id: matchPrediction.matchId,
        prediction_type: 'htft',
        predicted_outcome: matchPrediction.predictions['htft'].outcome,
        confidence: matchPrediction.predictions['htft'].confidence,
        probability_distribution: matchPrediction.predictions['htft'].probabilities,
        expected_roi: matchPrediction.predictions['htft'].expectedRoi,
        model_id: this.homeTeamModel.getModelId() || 'unknown'
      });
      
      return !!(prediction1X2 && predictionOU25 && predictionBTTS && predictionHTFT);
    } catch (error) {
      console.error('Error saving match predictions:', error);
      return false;
    }
  }
  
  // Combine predictions from home and away team models
  private combineTeamPredictions(homePrediction: any, awayPrediction: any) {
    // Weight the predictions (could be adjusted based on model confidence)
    const homeWeight = 0.6;
    const awayWeight = 0.4;
    
    // Combine win/draw/loss probabilities
    const homeWin = (homePrediction.win * homeWeight) + ((1 - awayPrediction.win - awayPrediction.draw) * awayWeight);
    const awayWin = (homePrediction.loss * homeWeight) + (awayPrediction.win * awayWeight);
    const draw = (homePrediction.draw * homeWeight) + (awayPrediction.draw * awayWeight);
    
    // Normalize probabilities to sum to 1
    const total = homeWin + draw + awayWin;
    const normalizedHomeWin = homeWin / total;
    const normalizedDraw = draw / total;
    const normalizedAwayWin = awayWin / total;
    
    // Combine expected goals
    const homeGoals = (homePrediction.goalsScored * homeWeight) + (awayPrediction.goalsConceded * awayWeight);
    const awayGoals = (homePrediction.goalsConceded * homeWeight) + (awayPrediction.goalsScored * awayWeight);
    const totalGoals = homeGoals + awayGoals;
    
    // Combine BTTS probability
    const bttsProb = (homePrediction.bttsProb * homeWeight) + (awayPrediction.bttsProb * awayWeight);
    
    // Combine over probability
    const overProb = (homePrediction.overProb * homeWeight) + (awayPrediction.overProb * awayWeight);
    
    // Calculate confidence as average of both models
    const confidence = (homePrediction.confidence + awayPrediction.confidence) / 2;
    
    return {
      homeWin: normalizedHomeWin,
      draw: normalizedDraw,
      awayWin: normalizedAwayWin,
      homeGoals,
      awayGoals,
      totalGoals,
      bttsProb,
      overProb,
      confidence
    };
  }
  
  // Predict 1X2 outcome
  private predict1X2(homeWinProb: number, drawProb: number, awayWinProb: number, odds1: number, oddsX: number, odds2: number) {
    // Determine most likely outcome
    const outcomes = [
      { outcome: '1', probability: homeWinProb, odds: odds1 },
      { outcome: 'X', probability: drawProb, odds: oddsX },
      { outcome: '2', probability: awayWinProb, odds: odds2 }
    ];
    
    // Sort by probability (highest first)
    outcomes.sort((a, b) => b.probability - a.probability);
    
    // Calculate expected ROI for each outcome
    outcomes.forEach(outcome => {
      outcome['roi'] = (outcome.probability * outcome.odds - 1) * 100;
    });
    
    // Sort by ROI (highest first)
    outcomes.sort((a, b) => b['roi'] - a['roi']);
    
    // Select the outcome with highest ROI
    const selectedOutcome = outcomes[0].outcome as '1' | 'X' | '2';
    const expectedRoi = outcomes[0]['roi'];
    
    // Calculate confidence based on probability difference
    const confidence = 0.5 + (outcomes[0].probability - outcomes[1].probability) * 2;
    
    return {
      outcome: selectedOutcome,
      probabilities: {
        '1': homeWinProb,
        'X': drawProb,
        '2': awayWinProb
      },
      confidence: Math.min(confidence, 0.95),
      expectedRoi
    };
  }
  
  // Predict Over/Under 2.5 outcome
  private predictOU25(expectedGoals: number, oddsOver: number, oddsUnder: number) {
    // Calculate probabilities based on expected goals
    const overProb = 1 / (1 + Math.exp(-(expectedGoals - 2.5) * 1.5));
    const underProb = 1 - overProb;
    
    // Calculate ROI for each outcome
    const roiOver = (overProb * oddsOver - 1) * 100;
    const roiUnder = (underProb * oddsUnder - 1) * 100;
    
    // Select outcome with highest ROI
    const isOver = roiOver > roiUnder;
    const selectedOutcome = isOver ? 'O' : 'U';
    const expectedRoi = isOver ? roiOver : roiUnder;
    
    // Calculate confidence based on how far expected goals is from 2.5
    const confidence = 0.5 + Math.min(Math.abs(expectedGoals - 2.5) * 0.2, 0.45);
    
    return {
      outcome: selectedOutcome,
      probabilities: {
        'O': overProb,
        'U': underProb
      },
      confidence,
      expectedRoi
    };
  }
  
  // Predict BTTS outcome
  private predictBTTS(bttsProb: number, oddsYes: number, oddsNo: number) {
    const noProb = 1 - bttsProb;
    
    // Calculate ROI for each outcome
    const roiYes = (bttsProb * oddsYes - 1) * 100;
    const roiNo = (noProb * oddsNo - 1) * 100;
    
    // Select outcome with highest ROI
    const isYes = roiYes > roiNo;
    const selectedOutcome = isYes ? 'yes' : 'no';
    const expectedRoi = isYes ? roiYes : roiNo;
    
    // Calculate confidence
    const confidence = 0.5 + Math.abs(bttsProb - 0.5) * 0.8;
    
    return {
      outcome: selectedOutcome,
      probabilities: {
        'yes': bttsProb,
        'no': noProb
      },
      confidence,
      expectedRoi
    };
  }
  
  // Predict HT/FT outcome
  private predictHTFT(homeWinProb: number, drawProb: number, awayWinProb: number, oddsHtFt: Record<string, number>) {
    // Define all possible HT/FT combinations
    const combinations = [
      '1/1', '1/X', '1/2', 'X/1', 'X/X', 'X/2', '2/1', '2/X', '2/2'
    ];
    
    // Calculate probabilities for each combination (simplified approach)
    const probabilities: Record<string, number> = {};
    
    // Home team leads at HT and wins
    probabilities['1/1'] = homeWinProb * 0.6;
    
    // Home team leads at HT but match ends in draw
    probabilities['1/X'] = homeWinProb * 0.1;
    
    // Home team leads at HT but away team wins
    probabilities['1/2'] = homeWinProb * 0.05;
    
    // Draw at HT, home team wins
    probabilities['X/1'] = homeWinProb * 0.25;
    
    // Draw at HT and FT
    probabilities['X/X'] = drawProb * 0.6;
    
    // Draw at HT, away team wins
    probabilities['X/2'] = awayWinProb * 0.25;
    
    // Away team leads at HT but home team wins
    probabilities['2/1'] = homeWinProb * 0.05;
    
    // Away team leads at HT but match ends in draw
    probabilities['2/X'] = drawProb * 0.15;
    
    // Away team leads at HT and wins
    probabilities['2/2'] = awayWinProb * 0.6;
    
    // Normalize probabilities to sum to 1
    const totalProb = Object.values(probabilities).reduce((sum, prob) => sum + prob, 0);
    combinations.forEach(combo => {
      probabilities[combo] = probabilities[combo] / totalProb;
    });
    
    // Calculate ROI for each combination
    const roiValues: Record<string, number> = {};
    combinations.forEach(combo => {
      roiValues[combo] = (probabilities[combo] * (oddsHtFt[combo] || 10) - 1) * 100;
    });
    
    // Find combination with highest ROI
    let bestCombo = combinations[0];
    let highestRoi = roiValues[bestCombo];
    
    combinations.forEach(combo => {
      if (roiValues[combo] > highestRoi) {
        bestCombo = combo;
        highestRoi = roiValues[combo];
      }
    });
    
    // Calculate confidence based on probability difference
    const sortedCombos = [...combinations].sort((a, b) => probabilities[b] - probabilities[a]);
    const confidence = 0.4 + (probabilities[sortedCombos[0]] - probabilities[sortedCombos[1]]) * 3;
    
    return {
      outcome: bestCombo,
      probabilities,
      confidence: Math.min(confidence, 0.9),
      expectedRoi: highestRoi
    };
  }
}
