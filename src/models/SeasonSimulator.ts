import { supabase } from "@/integrations/supabase/client";

export interface SeasonTeam {
  id: number;
  name: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string[];
}

export interface SeasonMatch {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamId: number;
  awayTeamId: number;
  date: string;
  played: boolean;
  homeGoals?: number;
  awayGoals?: number;
  prediction?: {
    homeWin: number;
    draw: number;
    awayWin: number;
    expectedScore: { home: number; away: number };
  };
}

export interface SeasonSimulationResult {
  id: string;
  season: string;
  league: string;
  finalTable: SeasonTeam[];
  predictions: {
    champion: { team: string; probability: number };
    topFour: Array<{ team: string; probability: number }>;
    relegation: Array<{ team: string; probability: number }>;
  };
  matches: SeasonMatch[];
  accuracy: number;
  totalMatches: number;
  completedMatches: number;
  createdAt: string;
}

export class SeasonSimulator {
  private static instance: SeasonSimulator;

  private constructor() {}

  public static getInstance(): SeasonSimulator {
    if (!SeasonSimulator.instance) {
      SeasonSimulator.instance = new SeasonSimulator();
    }
    return SeasonSimulator.instance;
  }

  // Simulate entire season
  public async simulateSeason(
    league: string,
    season: string,
    simulations: number = 1000
  ): Promise<SeasonSimulationResult> {
    try {
      // Fetch existing matches for the season
      const matches = await this.fetchSeasonMatches(league, season);
      
      // Initialize teams
      const teams = this.initializeTeams(matches);
      
      // Run multiple simulations
      const simulationResults = [];
      for (let i = 0; i < simulations; i++) {
        const result = await this.runSingleSimulation(matches, teams);
        simulationResults.push(result);
      }
      
      // Aggregate results
      const aggregatedResults = this.aggregateSimulationResults(simulationResults);
      
      // Calculate final predictions
      const predictions = this.calculateSeasonPredictions(aggregatedResults);
      
      // Save simulation to database
      const simulationResult: SeasonSimulationResult = {
        id: crypto.randomUUID(),
        season,
        league,
        finalTable: aggregatedResults.averageTable,
        predictions,
        matches,
        accuracy: 0, // Will be calculated as season progresses
        totalMatches: matches.length,
        completedMatches: matches.filter(m => m.played).length,
        createdAt: new Date().toISOString()
      };
      
      await this.saveSimulation(simulationResult);
      
      return simulationResult;
    } catch (error) {
      console.error('Error in season simulation:', error);
      throw error;
    }
  }

  // Fetch season matches from database
  private async fetchSeasonMatches(league: string, season: string): Promise<SeasonMatch[]> {
    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .eq('league', league)
      .eq('season', season)
      .order('match_date');

    if (error) throw error;

    return data.map(match => ({
      id: match.id,
      homeTeam: match.home_team,
      awayTeam: match.away_team,
      homeTeamId: 0, // Will be derived from team name
      awayTeamId: 0, // Will be derived from team name  
      date: match.created_at,
      played: match.full_time_home_goals !== null,
      homeGoals: match.full_time_home_goals,
      awayGoals: match.full_time_away_goals
    }));
  }

  // Initialize teams from matches
  private initializeTeams(matches: SeasonMatch[]): SeasonTeam[] {
    const teamMap = new Map<string, SeasonTeam>();
    
    matches.forEach(match => {
      // Initialize home team
      if (!teamMap.has(match.homeTeam)) {
        teamMap.set(match.homeTeam, {
          id: match.homeTeamId,
          name: match.homeTeam,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          form: []
        });
      }
      
      // Initialize away team
      if (!teamMap.has(match.awayTeam)) {
        teamMap.set(match.awayTeam, {
          id: match.awayTeamId,
          name: match.awayTeam,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
          form: []
        });
      }
    });
    
    return Array.from(teamMap.values());
  }

  // Run single simulation
  private async runSingleSimulation(matches: SeasonMatch[], teams: SeasonTeam[]) {
    const simulatedTeams = teams.map(team => ({ ...team }));
    const simulatedMatches = [...matches];
    
    // Process already played matches
    matches.filter(m => m.played).forEach(match => {
      this.updateTeamStats(
        simulatedTeams,
        match.homeTeam,
        match.awayTeam,
        match.homeGoals!,
        match.awayGoals!
      );
    });
    
    // Simulate remaining matches
    const unplayedMatches = matches.filter(m => !m.played);
    for (const match of unplayedMatches) {
      const result = await this.simulateMatch(match);
      this.updateTeamStats(
        simulatedTeams,
        match.homeTeam,
        match.awayTeam,
        result.homeGoals,
        result.awayGoals
      );
    }
    
    // Sort final table
    simulatedTeams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    });
    
    return {
      table: simulatedTeams,
      champion: simulatedTeams[0].name,
      topFour: simulatedTeams.slice(0, 4).map(t => t.name),
      relegation: simulatedTeams.slice(-3).map(t => t.name)
    };
  }

  // Simulate individual match
  private async simulateMatch(match: SeasonMatch): Promise<{ homeGoals: number; awayGoals: number }> {
    // Simple Poisson-based simulation
    // In a real implementation, this would use team strengths and more sophisticated models
    const homeExpectedGoals = 1.5; // Would be calculated from team stats
    const awayExpectedGoals = 1.2; // Would be calculated from team stats
    
    const homeGoals = this.poissonRandom(homeExpectedGoals);
    const awayGoals = this.poissonRandom(awayExpectedGoals);
    
    return { homeGoals, awayGoals };
  }

  // Poisson random number generator
  private poissonRandom(lambda: number): number {
    const L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    
    return k - 1;
  }

  // Update team statistics
  private updateTeamStats(
    teams: SeasonTeam[],
    homeTeam: string,
    awayTeam: string,
    homeGoals: number,
    awayGoals: number
  ) {
    const home = teams.find(t => t.name === homeTeam);
    const away = teams.find(t => t.name === awayTeam);
    
    if (!home || !away) return;
    
    // Update home team
    home.played++;
    home.goalsFor += homeGoals;
    home.goalsAgainst += awayGoals;
    home.goalDifference = home.goalsFor - home.goalsAgainst;
    
    // Update away team
    away.played++;
    away.goalsFor += awayGoals;
    away.goalsAgainst += homeGoals;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
    
    // Determine result
    if (homeGoals > awayGoals) {
      home.won++;
      home.points += 3;
      home.form.push('W');
      away.lost++;
      away.form.push('L');
    } else if (homeGoals < awayGoals) {
      away.won++;
      away.points += 3;
      away.form.push('W');
      home.lost++;
      home.form.push('L');
    } else {
      home.drawn++;
      home.points += 1;
      home.form.push('D');
      away.drawn++;
      away.points += 1;
      away.form.push('D');
    }
    
    // Keep only last 5 form results
    if (home.form.length > 5) home.form = home.form.slice(-5);
    if (away.form.length > 5) away.form = away.form.slice(-5);
  }

  // Aggregate multiple simulation results
  private aggregateSimulationResults(results: any[]) {
    const teamStats = new Map<string, any>();
    
    // Initialize team statistics
    results[0].table.forEach((team: SeasonTeam) => {
      teamStats.set(team.name, {
        name: team.name,
        positions: [],
        championCount: 0,
        topFourCount: 0,
        relegationCount: 0,
        totalPoints: 0,
        totalGoalsFor: 0,
        totalGoalsAgainst: 0
      });
    });
    
    // Aggregate results
    results.forEach((result, index) => {
      result.table.forEach((team: SeasonTeam, position: number) => {
        const stats = teamStats.get(team.name);
        if (stats) {
          stats.positions.push(position + 1);
          stats.totalPoints += team.points;
          stats.totalGoalsFor += team.goalsFor;
          stats.totalGoalsAgainst += team.goalsAgainst;
          
          if (position === 0) stats.championCount++;
          if (position < 4) stats.topFourCount++;
          if (position >= result.table.length - 3) stats.relegationCount++;
        }
      });
    });
    
    // Calculate averages
    const averageTable = Array.from(teamStats.values()).map(stats => ({
      id: 0,
      name: stats.name,
      played: 38, // Assuming full season
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: Math.round(stats.totalGoalsFor / results.length),
      goalsAgainst: Math.round(stats.totalGoalsAgainst / results.length),
      goalDifference: Math.round(stats.totalGoalsFor / results.length) - Math.round(stats.totalGoalsAgainst / results.length),
      points: Math.round(stats.totalPoints / results.length),
      form: []
    }));
    
    // Sort by average points
    averageTable.sort((a, b) => b.points - a.points);
    
    return { averageTable, teamStats };
  }

  // Calculate season predictions
  private calculateSeasonPredictions(aggregatedResults: any) {
    const { teamStats } = aggregatedResults;
    const totalSimulations = 1000;
    
    // Champion predictions
    const championPredictions = Array.from(teamStats.entries())
      .map(([name, stats]) => ({
        team: name,
        probability: (stats.championCount / totalSimulations) * 100
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 5);
    
    // Top four predictions
    const topFourPredictions = Array.from(teamStats.entries())
      .map(([name, stats]) => ({
        team: name,
        probability: (stats.topFourCount / totalSimulations) * 100
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 8);
    
    // Relegation predictions
    const relegationPredictions = Array.from(teamStats.entries())
      .map(([name, stats]) => ({
        team: name,
        probability: (stats.relegationCount / totalSimulations) * 100
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 6);
    
    return {
      champion: championPredictions[0],
      topFour: topFourPredictions,
      relegation: relegationPredictions
    };
  }

  // Save simulation to database
  private async saveSimulation(simulation: SeasonSimulationResult): Promise<void> {
      const { error } = await supabase
      .from('season_predictions')
      .insert({
        season: simulation.season,
        league: simulation.league,
        status: 'completed',
        results: JSON.parse(JSON.stringify({
          finalTable: simulation.finalTable,
          predictions: simulation.predictions
        })),
        total_matches: simulation.totalMatches,
        processed_matches: simulation.completedMatches,
        progress_percentage: (simulation.completedMatches / simulation.totalMatches) * 100
      });

    if (error) {
      console.error('Error saving simulation:', error);
      throw error;
    }
  }

  // Get existing simulation
  public async getSeasonSimulation(league: string, season: string): Promise<SeasonSimulationResult | null> {
    const { data, error } = await supabase
      .from('season_predictions')
      .select('*')
      .eq('league', league)
      .eq('season', season)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) return null;

    return {
      id: data.id,
      season: data.season,
      league: data.league || '',
      finalTable: (data.results as any)?.finalTable || [],
      predictions: (data.results as any)?.predictions || { champion: { team: '', probability: 0 }, topFour: [], relegation: [] },
      matches: [],
      accuracy: 0,
      totalMatches: data.total_matches || 0,
      completedMatches: data.processed_matches || 0,
      createdAt: data.created_at
    };
  }
}
