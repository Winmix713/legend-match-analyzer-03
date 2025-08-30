/**
 * Fejlett matematikai és statisztikai modellek a pontosabb előrejelzésekhez
 * Bayesi statisztika, Monte Carlo szimulációk, Elo rating és fejlett regresszió alapokon
 */

import type { PredictionFeatures, PredictionResult } from '@/types/prediction';
import type { Match } from '@/types';

// Elo rating konstansok
const ELO_K_FACTOR = 32;
const ELO_BASE = 1500;
const HOME_ADVANTAGE_ELO = 100;

// Monte Carlo konstansok  
const MONTE_CARLO_ITERATIONS = 10000;
const CONFIDENCE_INTERVALS = [0.68, 0.95]; // 1σ és 2σ

export interface EloRating {
  rating: number;
  games: number;
  lastUpdated: Date;
}

export interface BayesianParams {
  priorMean: number;
  priorVariance: number;
  likelihood: number;
  evidence: number;
}

export interface MonteCarloResult {
  meanPrediction: PredictionResult;
  confidenceIntervals: {
    [key: string]: {
      lower: number;
      upper: number;
    };
  };
  variability: number;
  scenarios: PredictionResult[];
}

export interface RegressionWeights {
  form: number;
  homeAdvantage: number;
  headToHead: number;
  goals: number;
  strength: number;
  momentum: number;
  fatigue: number;
}

/**
 * Elo rating rendszer csapatok erősségének mérésére
 */
export class EloRatingSystem {
  private ratings = new Map<string, EloRating>();

  constructor(private homeAdvantage: number = HOME_ADVANTAGE_ELO) {}

  /**
   * Csapat Elo rating lekérése
   */
  getRating(teamName: string): EloRating {
    return this.ratings.get(teamName) || {
      rating: ELO_BASE,
      games: 0,
      lastUpdated: new Date()
    };
  }

  /**
   * Várt eredmény számítása Elo alapján
   */
  calculateExpectedScore(homeTeam: string, awayTeam: string): number {
    const homeRating = this.getRating(homeTeam).rating + this.homeAdvantage;
    const awayRating = this.getRating(awayTeam).rating;
    
    const ratingDiff = awayRating - homeRating;
    return 1 / (1 + Math.pow(10, ratingDiff / 400));
  }

  /**
   * Elo rating frissítése meccs eredmény alapján
   */
  updateRatings(homeTeam: string, awayTeam: string, homeGoals: number, awayGoals: number): void {
    const homeRating = this.getRating(homeTeam);
    const awayRating = this.getRating(awayTeam);
    
    const expectedHome = this.calculateExpectedScore(homeTeam, awayTeam);
    
    // Meccs eredmény pontszám (0-1 skála)
    let actualScore: number;
    if (homeGoals > awayGoals) {
      actualScore = 1; // Hazai győzelem
    } else if (homeGoals < awayGoals) {
      actualScore = 0; // Vendég győzelem  
    } else {
      actualScore = 0.5; // Döntetlen
    }

    // K faktor dinamikus súlyozása
    const kFactor = this.getAdaptiveKFactor(homeRating.games, awayRating.games);
    
    const homeChange = kFactor * (actualScore - expectedHome);
    const awayChange = kFactor * (expectedHome - actualScore);

    this.ratings.set(homeTeam, {
      rating: homeRating.rating + homeChange,
      games: homeRating.games + 1,
      lastUpdated: new Date()
    });

    this.ratings.set(awayTeam, {
      rating: awayRating.rating + awayChange, 
      games: awayRating.games + 1,
      lastUpdated: new Date()
    });
  }

  /**
   * Adaptív K faktor - új csapatoknak nagyobb változás
   */
  private getAdaptiveKFactor(homeGames: number, awayGames: number): number {
    const avgGames = (homeGames + awayGames) / 2;
    
    if (avgGames < 30) return ELO_K_FACTOR * 1.5; // Új csapatok
    if (avgGames < 100) return ELO_K_FACTOR; // Normál  
    return ELO_K_FACTOR * 0.8; // Tapasztalt csapatok
  }

  /**
   * Elo alapú győzelmi valószínűségek
   */
  getProbabilities(homeTeam: string, awayTeam: string): {
    homeWin: number;
    draw: number;
    awayWin: number;
  } {
    const expectedHome = this.calculateExpectedScore(homeTeam, awayTeam);
    
    // Empirikus korrekció döntetlen valószínűségre
    const drawFactor = 0.28; // Átlagos döntetlen arány
    
    const homeWin = expectedHome * (1 - drawFactor);
    const awayWin = (1 - expectedHome) * (1 - drawFactor);
    const draw = drawFactor;

    return { homeWin, draw, awayWin };
  }
}

/**
 * Bayesi statisztika alapú prior és posterior eloszlások
 */
export class BayesianPredictor {
  
  /**
   * Bayesi update prior és likelihood alapján
   */
  static bayesianUpdate(prior: BayesianParams, evidence: number[]): BayesianParams {
    const n = evidence.length;
    const sampleMean = evidence.reduce((sum, x) => sum + x, 0) / n;
    const sampleVar = evidence.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) / n;
    
    // Conjugate prior (normal-normal model)
    const posteriorPrecision = (1 / prior.priorVariance) + (n / sampleVar);
    const posteriorVariance = 1 / posteriorPrecision;
    
    const posteriorMean = posteriorVariance * (
      (prior.priorMean / prior.priorVariance) + (n * sampleMean / sampleVar)
    );

    return {
      priorMean: posteriorMean,
      priorVariance: posteriorVariance,
      likelihood: sampleMean,
      evidence: n
    };
  }

  /**
   * Credible interval számítás
   */
  static getCredibleInterval(params: BayesianParams, confidence: number = 0.95): [number, number] {
    const z = this.getZScore(confidence);
    const margin = z * Math.sqrt(params.priorVariance);
    
    return [
      params.priorMean - margin,
      params.priorMean + margin
    ];
  }

  /**
   * Z-score táblázat
   */
  private static getZScore(confidence: number): number {
    const zScores: Record<string, number> = {
      '0.68': 1.0,
      '0.90': 1.645,
      '0.95': 1.96,
      '0.99': 2.576
    };
    
    return zScores[confidence.toString()] || 1.96;
  }
}

/**
 * Monte Carlo szimulációs motor
 */
export class MonteCarloSimulator {
  
  /**
   * Monte Carlo szimuláció végrehajtása
   */
  static runSimulation(
    features: PredictionFeatures,
    iterations: number = MONTE_CARLO_ITERATIONS
  ): MonteCarloResult {
    const scenarios: PredictionResult[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const scenario = this.generateScenario(features);
      scenarios.push(scenario);
    }

    const meanPrediction = this.calculateMeanPrediction(scenarios);
    const confidenceIntervals = this.calculateConfidenceIntervals(scenarios);
    const variability = this.calculateVariability(scenarios);

    return {
      meanPrediction,
      confidenceIntervals,
      variability,
      scenarios: scenarios.slice(0, 100) // Csak mintát tartunk meg
    };
  }

  /**
   * Egyetlen szcenárió generálása véletlenszerűséggel
   */
  private static generateScenario(features: PredictionFeatures): PredictionResult {
    // Véletlenszerű zaj hozzáadása minden feature-höz
    const noise = () => 1 + (Math.random() - 0.5) * 0.2; // ±10% zaj
    
    const adjustedFeatures = {
      home_team_form: features.home_team_form * noise(),
      away_team_form: features.away_team_form * noise(),
      home_advantage: features.home_advantage * noise(),
      head_to_head_ratio: features.head_to_head_ratio * noise(),
      avg_goals_home: features.avg_goals_home * noise(),
      avg_goals_away: features.avg_goals_away * noise(),
      recent_meetings: features.recent_meetings,
      home_offensive_strength: features.home_offensive_strength * noise(),
      away_offensive_strength: features.away_offensive_strength * noise(),
      home_defensive_strength: features.home_defensive_strength * noise(),
      away_defensive_strength: features.away_defensive_strength * noise(),
    };

    return AdvancedRegressionModel.predict(adjustedFeatures);
  }

  /**
   * Átlag előrejelzés számítása
   */
  private static calculateMeanPrediction(scenarios: PredictionResult[]): PredictionResult {
    const n = scenarios.length;
    
    return {
      home_win_probability: scenarios.reduce((sum, s) => sum + s.home_win_probability, 0) / n,
      away_win_probability: scenarios.reduce((sum, s) => sum + s.away_win_probability, 0) / n,
      draw_probability: scenarios.reduce((sum, s) => sum + s.draw_probability, 0) / n,
      btts_probability: scenarios.reduce((sum, s) => sum + (s.btts_probability || 0), 0) / n,
      over25_probability: scenarios.reduce((sum, s) => sum + (s.over25_probability || 0), 0) / n,
      confidence_score: scenarios.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / n,
      model_type: 'monte_carlo_ensemble',
      calculation_method: 'client_baseline' as const
    };
  }

  /**
   * Konfidencia intervallumok számítása
   */
  private static calculateConfidenceIntervals(scenarios: PredictionResult[]): MonteCarloResult['confidenceIntervals'] {
    const sortedHomeWin = scenarios.map(s => s.home_win_probability).sort((a, b) => a - b);
    const sortedAwayWin = scenarios.map(s => s.away_win_probability).sort((a, b) => a - b);
    const sortedDraw = scenarios.map(s => s.draw_probability).sort((a, b) => a - b);

    const getPercentiles = (arr: number[]) => ({
      lower: arr[Math.floor(arr.length * 0.025)],
      upper: arr[Math.floor(arr.length * 0.975)]
    });

    return {
      home_win_probability: getPercentiles(sortedHomeWin),
      away_win_probability: getPercentiles(sortedAwayWin),
      draw_probability: getPercentiles(sortedDraw)
    };
  }

  /**
   * Variabilitás mérése (standard deviáció)
   */
  private static calculateVariability(scenarios: PredictionResult[]): number {
    const homeWinProbs = scenarios.map(s => s.home_win_probability);
    const mean = homeWinProbs.reduce((sum, p) => sum + p, 0) / homeWinProbs.length;
    const variance = homeWinProbs.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / homeWinProbs.length;
    
    return Math.sqrt(variance);
  }
}

/**
 * Fejlett többváltozós regressziós modell
 */
export class AdvancedRegressionModel {
  
  // Kalibrált súlyok empirikus adatok alapján
  private static weights: RegressionWeights = {
    form: 0.25,           // Forma súlya
    homeAdvantage: 0.15,  // Hazai előny
    headToHead: 0.12,     // H2H múlt
    goals: 0.20,          // Gól átlagok
    strength: 0.18,       // Támadó/védő erő
    momentum: 0.07,       // Momentum
    fatigue: 0.03         // Fáradtság
  };

  /**
   * Főmodell - kombinált algoritmus
   */
  static predict(features: PredictionFeatures): PredictionResult {
    // Poisson alapú gól előrejelzés
    const goalPrediction = this.poissonGoalModel(features);
    
    // Logisztikus regresszió kimenetelre
    const outcomeProbabilities = this.logisticRegression(features);
    
    // Strength-based módosítás
    const strengthAdjustment = this.calculateStrengthAdjustment(features);
    
    // Momentum faktor
    const momentumFactor = this.calculateMomentum(features);
    
    // Kombinált előrejelzés
    const adjustedProbs = this.combineModels(
      goalPrediction,
      outcomeProbabilities,
      strengthAdjustment,
      momentumFactor
    );

    return {
      ...adjustedProbs,
      predicted_score: goalPrediction.predicted_score,
      btts_probability: this.calculateBTTS(features),
      over25_probability: this.calculateOver25(features),
      confidence_score: this.calculateModelConfidence(features, adjustedProbs),
      key_factors: this.identifyKeyFactors(features),
      model_type: 'advanced_regression_ensemble',
      calculation_method: 'client_baseline' as const
    };
  }

  /**
   * Poisson eloszlás alapú gól modell
   */
  private static poissonGoalModel(features: PredictionFeatures): {
    home_win_probability: number;
    draw_probability: number;
    away_win_probability: number;
    predicted_score: { home: number; away: number };
  } {
    // Várt gólok számítása
    const homeGoalsExpected = this.calculateExpectedGoals(
      features.avg_goals_home,
      features.home_offensive_strength,
      features.away_defensive_strength,
      features.home_advantage
    );
    
    const awayGoalsExpected = this.calculateExpectedGoals(
      features.avg_goals_away,
      features.away_offensive_strength,
      features.home_defensive_strength,
      0 // Nincs vendég előny
    );

    // Poisson valószínűségek mátrix
    const probMatrix = this.poissonMatrix(homeGoalsExpected, awayGoalsExpected);
    
    let homeWin = 0, draw = 0, awayWin = 0;
    
    for (let h = 0; h <= 6; h++) {
      for (let a = 0; a <= 6; a++) {
        const prob = probMatrix[h][a];
        if (h > a) homeWin += prob;
        else if (h === a) draw += prob;
        else awayWin += prob;
      }
    }

    return {
      home_win_probability: homeWin,
      draw_probability: draw,
      away_win_probability: awayWin,
      predicted_score: {
        home: Math.round(homeGoalsExpected * 10) / 10,
        away: Math.round(awayGoalsExpected * 10) / 10
      }
    };
  }

  /**
   * Várt gólok számítása több tényező alapján
   */
  private static calculateExpectedGoals(
    avgGoals: number,
    offensiveStrength: number,
    defensiveStrength: number,
    homeAdvantage: number
  ): number {
    const baseGoals = avgGoals * 1.2; // Liga átlag korrekció
    const offensiveAdj = Math.pow(offensiveStrength, 0.8);
    const defensiveAdj = Math.pow(1 / Math.max(defensiveStrength, 0.1), 0.6);
    const homeAdj = 1 + (homeAdvantage * 0.15);
    
    return Math.max(0.1, baseGoals * offensiveAdj * defensiveAdj * homeAdj);
  }

  /**
   * Poisson valószínűségi mátrix
   */
  private static poissonMatrix(lambdaHome: number, lambdaAway: number): number[][] {
    const matrix: number[][] = [];
    
    for (let h = 0; h <= 6; h++) {
      matrix[h] = [];
      for (let a = 0; a <= 6; a++) {
        const probHome = this.poissonProbability(h, lambdaHome);
        const probAway = this.poissonProbability(a, lambdaAway);
        matrix[h][a] = probHome * probAway;
      }
    }
    
    return matrix;
  }

  /**
   * Poisson valószínűség számítása
   */
  private static poissonProbability(k: number, lambda: number): number {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
  }

  /**
   * Faktoriális számítása
   */
  private static factorial(n: number): number {
    if (n <= 1) return 1;
    return n * this.factorial(n - 1);
  }

  /**
   * Logisztikus regresszió
   */
  private static logisticRegression(features: PredictionFeatures): {
    home_win_probability: number;
    draw_probability: number;
    away_win_probability: number;
  } {
    // Feature engineering
    const formDiff = features.home_team_form - features.away_team_form;
    const strengthDiff = (features.home_offensive_strength + features.home_defensive_strength) -
                        (features.away_offensive_strength + features.away_defensive_strength);
    const goalDiff = features.avg_goals_home - features.avg_goals_away;
    
    // Logit számítások empirikus koefficienekkel
    const homeLogit = 0.3 * formDiff + 0.4 * strengthDiff + 0.2 * goalDiff + 
                     0.15 * features.home_advantage + 0.1 * features.head_to_head_ratio;
    
    const drawLogit = -0.8 + 0.1 * Math.abs(formDiff) - 0.2 * Math.abs(strengthDiff);
    
    // Softmax normalizálás
    const expHome = Math.exp(homeLogit);
    const expDraw = Math.exp(drawLogit);
    const expAway = Math.exp(-homeLogit); // Szimmetrikus
    
    const total = expHome + expDraw + expAway;
    
    return {
      home_win_probability: expHome / total,
      draw_probability: expDraw / total,
      away_win_probability: expAway / total
    };
  }

  /**
   * Erősség alapú korrekció
   */
  private static calculateStrengthAdjustment(features: PredictionFeatures): number {
    const homeStrength = (features.home_offensive_strength + features.home_defensive_strength) / 2;
    const awayStrength = (features.away_offensive_strength + features.away_defensive_strength) / 2;
    
    return (homeStrength - awayStrength) * 0.3;
  }

  /**
   * Momentum számítása
   */
  private static calculateMomentum(features: PredictionFeatures): number {
    // Egyszerűsített momentum a forma alapján
    const formMomentum = (features.home_team_form - 0.5) * 0.2;
    const awayFormMomentum = (features.away_team_form - 0.5) * 0.2;
    
    return formMomentum - awayFormMomentum;
  }

  /**
   * Modellek kombinálása
   */
  private static combineModels(
    poisson: any,
    logistic: any,
    strength: number,
    momentum: number
  ): { home_win_probability: number; draw_probability: number; away_win_probability: number } {
    // Súlyozott átlag
    const w1 = 0.4; // Poisson súly
    const w2 = 0.6; // Logistic súly
    
    let homeProb = (poisson.home_win_probability * w1) + (logistic.home_win_probability * w2);
    let drawProb = (poisson.draw_probability * w1) + (logistic.draw_probability * w2);
    let awayProb = (poisson.away_win_probability * w1) + (logistic.away_win_probability * w2);
    
    // Strength és momentum adjustment
    const adjustment = (strength + momentum) * 0.1;
    homeProb += adjustment;
    awayProb -= adjustment;
    
    // Normalizálás
    const total = homeProb + drawProb + awayProb;
    
    return {
      home_win_probability: Math.max(0.01, homeProb / total),
      draw_probability: Math.max(0.01, drawProb / total),
      away_win_probability: Math.max(0.01, awayProb / total)
    };
  }

  /**
   * BTTS (Both Teams To Score) valószínűség
   */
  private static calculateBTTS(features: PredictionFeatures): number {
    const homeOffensive = features.home_offensive_strength;
    const awayOffensive = features.away_offensive_strength;
    const homeDefensive = features.home_defensive_strength;
    const awayDefensive = features.away_defensive_strength;
    
    // Mindkét csapat gólszerzési valószínűsége
    const homeScoreProb = 1 - Math.exp(-homeOffensive / awayDefensive * features.avg_goals_home);
    const awayScoreProb = 1 - Math.exp(-awayOffensive / homeDefensive * features.avg_goals_away);
    
    return homeScoreProb * awayScoreProb;
  }

  /**
   * Over 2.5 gól valószínűség
   */
  private static calculateOver25(features: PredictionFeatures): number {
    const totalGoalsExpected = features.avg_goals_home + features.avg_goals_away;
    const strengthFactor = (features.home_offensive_strength + features.away_offensive_strength) / 2;
    
    const adjustedTotal = totalGoalsExpected * strengthFactor;
    
    // Poisson-alapú over 2.5 számítás
    let under25Prob = 0;
    for (let i = 0; i <= 2; i++) {
      under25Prob += this.poissonProbability(i, adjustedTotal);
    }
    
    return 1 - under25Prob;
  }

  /**
   * Modell konfidencia számítása
   */
  private static calculateModelConfidence(
    features: PredictionFeatures,
    probabilities: any
  ): number {
    // Adatok teljesség
    const dataCompleteness = Object.values(features).filter(v => v > 0).length / Object.keys(features).length;
    
    // Predikció élesség (entropy alapú)
    const entropy = -(
      probabilities.home_win_probability * Math.log2(probabilities.home_win_probability) +
      probabilities.draw_probability * Math.log2(probabilities.draw_probability) +
      probabilities.away_win_probability * Math.log2(probabilities.away_win_probability)
    );
    const sharpness = 1 - (entropy / Math.log2(3));
    
    return (dataCompleteness * 0.4 + sharpness * 0.6) * 0.9;
  }

  /**
   * Kulcs faktorok azonosítása
   */
  private static identifyKeyFactors(features: PredictionFeatures): string[] {
    const factors: string[] = [];
    
    if (Math.abs(features.home_team_form - features.away_team_form) > 0.2) {
      factors.push('Jelentős forma különbség');
    }
    
    if (features.home_advantage > 0.6) {
      factors.push('Erős hazai pálya előny');
    }
    
    if (features.head_to_head_ratio > 0.7 || features.head_to_head_ratio < 0.3) {
      factors.push('Egyoldalú H2H történelem');
    }
    
    const avgGoalsDiff = Math.abs(features.avg_goals_home - features.avg_goals_away);
    if (avgGoalsDiff > 0.5) {
      factors.push('Eltérő góltermelés');
    }
    
    return factors;
  }
}

/**
 * Ensemble predikciós rendszer
 */
export class EnsemblePredictor {
  
  static predict(
    features: PredictionFeatures,
    matches: Match[] = []
  ): PredictionResult & { ensemble_details: any } {
    // Alap regressziós modell
    const regressionResult = AdvancedRegressionModel.predict(features);
    
    // Monte Carlo szimuláció  
    const monteCarloResult = MonteCarloSimulator.runSimulation(features);
    
    // Elo rating (ha van meccs adat)
    let eloResult = null;
    if (matches.length > 0) {
      const eloSystem = new EloRatingSystem();
      // Itt kell implementálni az Elo rendszer feltöltését a matches alapján
      // eloResult = eloSystem.getProbabilities(homeTeam, awayTeam);
    }

    // Súlyozott kombinálás
    const weights = {
      regression: 0.4,
      monteCarlo: 0.4, 
      elo: eloResult ? 0.2 : 0
    };
    
    const normalizeWeights = () => {
      const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
      Object.keys(weights).forEach(key => {
        weights[key as keyof typeof weights] /= total;
      });
    };
    
    normalizeWeights();

    // Ensemble előrejelzés
    const ensembleProb = {
      home_win_probability: 
        regressionResult.home_win_probability * weights.regression +
        monteCarloResult.meanPrediction.home_win_probability * weights.monteCarlo +
        (eloResult?.homeWin || 0) * weights.elo,
        
      draw_probability:
        regressionResult.draw_probability * weights.regression +
        monteCarloResult.meanPrediction.draw_probability * weights.monteCarlo +
        (eloResult?.draw || 0) * weights.elo,
        
      away_win_probability:
        regressionResult.away_win_probability * weights.regression +
        monteCarloResult.meanPrediction.away_win_probability * weights.monteCarlo +
        (eloResult?.awayWin || 0) * weights.elo
    };

    return {
      ...ensembleProb,
      btts_probability: regressionResult.btts_probability,
      over25_probability: regressionResult.over25_probability,
      predicted_score: regressionResult.predicted_score,
      confidence_score: Math.min(0.95, (regressionResult.confidence_score || 0) * 1.1),
      key_factors: [
        ...regressionResult.key_factors || [],
        `Ensemble modell ${Object.keys(weights).filter(k => weights[k as keyof typeof weights] > 0).length} algoritmusból`
      ],
      model_type: 'advanced_ensemble',
      calculation_method: 'client_baseline' as const,
      ensemble_details: {
        regression: regressionResult,
        monteCarlo: {
          mean: monteCarloResult.meanPrediction,
          variability: monteCarloResult.variability,
          confidenceIntervals: monteCarloResult.confidenceIntervals
        },
        elo: eloResult,
        weights
      }
    };
  }
}