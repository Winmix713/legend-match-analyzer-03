import { v4 as uuidv4 } from 'uuid';
import { TeamModel, Match, TeamStats, createTeamModel, updateTeamModel } from '../lib/supabase';

// Feature engineering for team models
export interface TeamModelFeatures {
  avgGoalsScored: number;
  avgGoalsConceded: number;
  winRate: number;
  cleanSheetRate: number;
  failedToScoreRate: number;
  formPoints: number; // Points from last 5 matches
  homeAdvantage?: number; // For home models
  awayDisadvantage?: number; // For away models
}

// Model types
export type ModelAlgorithm = 'logistic_regression' | 'random_forest' | 'xgboost' | 'lightgbm';
export type ModelType = 'home' | 'away' | 'general';

export class TeamModelManager {
  private teamId: number;
  private teamName: string;
  private modelType: ModelType;
  private algorithm: ModelAlgorithm;
  private model: any; // This would be the actual ML model instance
  private modelId?: string;
  private version: number = 1;
  
  constructor(
    teamId: number, 
    teamName: string, 
    modelType: ModelType = 'general',
    algorithm: ModelAlgorithm = 'random_forest',
    modelId?: string,
    version?: number
  ) {
    this.teamId = teamId;
    this.teamName = teamName;
    this.modelType = modelType;
    this.algorithm = algorithm;
    this.modelId = modelId;
    if (version) this.version = version;
  }
  
  // Extract features from team statistics
  private extractFeatures(stats: TeamStats): TeamModelFeatures {
    const features: TeamModelFeatures = {
      avgGoalsScored: stats.avg_goals_scored,
      avgGoalsConceded: stats.avg_goals_conceded,
      winRate: stats.matches_played > 0 ? stats.wins / stats.matches_played : 0,
      cleanSheetRate: stats.matches_played > 0 ? stats.clean_sheets / stats.matches_played : 0,
      failedToScoreRate: stats.matches_played > 0 ? stats.failed_to_score / stats.matches_played : 0,
      formPoints: this.calculateFormPoints(stats.form_last_5)
    };
    
    // Add specific features based on model type
    if (this.modelType === 'home') {
      features.homeAdvantage = stats.home_matches_played && stats.home_matches_played > 0 
        ? stats.home_wins! / stats.home_matches_played 
        : 0;
    } else if (this.modelType === 'away') {
      features.awayDisadvantage = stats.away_matches_played && stats.away_matches_played > 0 
        ? 1 - (stats.away_wins! / stats.away_matches_played)
        : 0;
    }
    
    return features;
  }
  
  // Calculate points from form string (W=3, D=1, L=0)
  private calculateFormPoints(form: string): number {
    return form.split('').reduce((total, result) => {
      if (result === 'W') return total + 3;
      if (result === 'D') return total + 1;
      return total;
    }, 0);
  }
  
  // Train the model with historical match data
  async train(matches: Match[], teamStats: TeamStats): Promise<boolean> {
    try {
      console.log(`Training ${this.modelType} model for ${this.teamName} using ${this.algorithm}...`);
      
      // Extract features from team stats
      const features = this.extractFeatures(teamStats);
      
      // Filter matches based on model type
      const relevantMatches = matches.filter(match => {
        if (this.modelType === 'home') {
          return match.home_team_id === this.teamId;
        } else if (this.modelType === 'away') {
          return match.away_team_id === this.teamId;
        }
        return match.home_team_id === this.teamId || match.away_team_id === this.teamId;
      });
      
      if (relevantMatches.length < 10) {
        console.warn(`Not enough matches (${relevantMatches.length}) to train a reliable model for ${this.teamName}`);
        return false;
      }
      
      // In a real implementation, this is where we would:
      // 1. Prepare training data (X features, y labels)
      // 2. Split into training/validation sets
      // 3. Train the model using the appropriate algorithm
      // 4. Evaluate performance
      
      // For this example, we'll simulate training with mock performance metrics
      const performanceMetrics = {
        accuracy: 0.75 + Math.random() * 0.15,
        precision: 0.72 + Math.random() * 0.18,
        recall: 0.70 + Math.random() * 0.20,
        f1_score: 0.73 + Math.random() * 0.17,
        roc_auc: 0.78 + Math.random() * 0.12
      };
      
      // Store or update the model in the database
      if (this.modelId) {
        // Update existing model
        const updatedModel = await updateTeamModel(this.modelId, {
          performance_metrics: performanceMetrics,
          version: this.version + 1,
          last_trained: new Date().toISOString(),
          model_data: { features, algorithm: this.algorithm }
        });
        
        if (updatedModel) {
          this.modelId = updatedModel.id;
          this.version = updatedModel.version;
          console.log(`Updated model for ${this.teamName} (${this.modelType}), new version: ${this.version}`);
          return true;
        }
      } else {
        // Create new model
        const featuresList = Object.keys(features);
        const newModel = await createTeamModel({
          team_id: this.teamId,
          team_name: this.teamName,
          model_type: this.modelType,
          algorithm: this.algorithm,
          features: featuresList,
          performance_metrics: performanceMetrics,
          last_trained: new Date().toISOString(),
          version: 1,
          is_active: true,
          model_data: { features, algorithm: this.algorithm }
        });
        
        if (newModel) {
          this.modelId = newModel.id;
          console.log(`Created new model for ${this.teamName} (${this.modelType}), id: ${this.modelId}`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Error training model for ${this.teamName}:`, error);
      return false;
    }
  }
  
  // Make predictions for a match
  predict(opponentId: number, isHome: boolean): {
    win: number;
    draw: number;
    loss: number;
    goalsScored: number;
    goalsConceded: number;
    bttsProb: number;
    overProb: number;
    confidence: number;
  } {
    // In a real implementation, this would use the trained model to make predictions
    // For this example, we'll return simulated predictions
    
    // Base probabilities adjusted by home/away advantage
    let winProb = 0.33 + (Math.random() * 0.2);
    let drawProb = 0.28 + (Math.random() * 0.1);
    let lossProb = 1 - winProb - drawProb;
    
    // Adjust for home advantage
    if (isHome && this.modelType !== 'away') {
      winProb += 0.1;
      lossProb -= 0.1;
    } else if (!isHome && this.modelType !== 'home') {
      winProb -= 0.05;
      lossProb += 0.05;
    }
    
    // Normalize probabilities to sum to 1
    const total = winProb + drawProb + lossProb;
    winProb /= total;
    drawProb /= total;
    lossProb /= total;
    
    // Generate expected goals
    const goalsScored = isHome ? 1.2 + Math.random() * 0.8 : 0.8 + Math.random() * 0.7;
    const goalsConceded = isHome ? 0.7 + Math.random() * 0.6 : 1.1 + Math.random() * 0.7;
    
    // Calculate BTTS and Over 2.5 probabilities
    const bttsProb = 0.5 + (goalsScored * goalsConceded * 0.2);
    const overProb = 0.4 + ((goalsScored + goalsConceded) * 0.15);
    
    // Calculate confidence based on amount of data and model performance
    const confidence = 0.65 + Math.random() * 0.25;
    
    return {
      win: winProb,
      draw: drawProb,
      loss: lossProb,
      goalsScored,
      goalsConceded,
      bttsProb: Math.min(bttsProb, 0.95),
      overProb: Math.min(overProb, 0.95),
      confidence
    };
  }
  
  // Get model ID
  getModelId(): string | undefined {
    return this.modelId;
  }
  
  // Get model version
  getVersion(): number {
    return this.version;
  }
  
  // Get model type
  getModelType(): ModelType {
    return this.modelType;
  }
  
  // Get team ID
  getTeamId(): number {
    return this.teamId;
  }
  
  // Get team name
  getTeamName(): string {
    return this.teamName;
  }
}
