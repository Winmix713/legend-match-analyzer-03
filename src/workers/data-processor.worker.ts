// Web Worker for heavy data processing operations
import { calculateCalibratedConfidence, calculateRecencyFactor, calculateCompletenessFactor } from '../lib/prediction-utils';

interface WorkerMessage {
  id: string;
  type: 'CALCULATE_STATISTICS' | 'CALCULATE_LEGEND_MODE' | 'PROCESS_MATCHES' | 'SORT_MATCHES' | 'CALCULATE_PREDICTIONS';
  payload: any;
}

interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  payload?: any;
  error?: string;
  progress?: number;
}

// Statistics calculation logic (moved from main thread)
function calculateStatistics(matches: any[], homeTeam: string, awayTeam: string) {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  let totalHomeGoals = 0;
  let totalAwayGoals = 0;

  const processedMatches = matches.map((match, index) => {
    // Report progress for large datasets
    if (index % 100 === 0) {
      self.postMessage({
        type: 'PROGRESS',
        progress: (index / matches.length) * 50 // First 50% for processing
      });
    }

    const isHomeTeamActuallyHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase());

    if (isHomeTeamActuallyHome) {
      totalHomeGoals += match.full_time_home_goals;
      totalAwayGoals += match.full_time_away_goals;

      if (match.full_time_home_goals > match.full_time_away_goals) {
        homeWins++;
      } else if (match.full_time_home_goals < match.full_time_away_goals) {
        awayWins++;
      } else {
        draws++;
      }
    } else {
      totalHomeGoals += match.full_time_away_goals;
      totalAwayGoals += match.full_time_home_goals;

      if (match.full_time_away_goals > match.full_time_home_goals) {
        homeWins++;
      } else if (match.full_time_away_goals < match.full_time_home_goals) {
        awayWins++;
      } else {
        draws++;
      }
    }

    return {
      ...match,
      processed: true,
      result: isHomeTeamActuallyHome
        ? match.full_time_home_goals > match.full_time_away_goals
          ? 'HOME_WIN'
          : match.full_time_home_goals < match.full_time_away_goals
          ? 'AWAY_WIN'
          : 'DRAW'
        : match.full_time_away_goals > match.full_time_home_goals
        ? 'HOME_WIN'
        : match.full_time_away_goals < match.full_time_home_goals
        ? 'AWAY_WIN'
        : 'DRAW'
    };
  });

  // Calculate form guide
  const last5Matches = processedMatches.slice(0, 5);
  const homeTeamForm = last5Matches.map((match) => {
    const isHomeTeamActuallyHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase());
    if (isHomeTeamActuallyHome) {
      return match.full_time_home_goals > match.full_time_away_goals
        ? "W"
        : match.full_time_home_goals < match.full_time_away_goals
        ? "L"
        : "D";
    } else {
      return match.full_time_away_goals > match.full_time_home_goals
        ? "W"
        : match.full_time_away_goals < match.full_time_home_goals
        ? "L"
        : "D";
    }
  });

  const awayTeamForm = last5Matches.map((match) => {
    const isAwayTeamActuallyAway = match.away_team.toLowerCase().includes(awayTeam.toLowerCase());
    if (isAwayTeamActuallyAway) {
      return match.full_time_away_goals > match.full_time_home_goals
        ? "W"
        : match.full_time_away_goals < match.full_time_home_goals
        ? "L"
        : "D";
    } else {
      return match.full_time_home_goals > match.full_time_away_goals
        ? "W"
        : match.full_time_home_goals < match.full_time_away_goals
        ? "L"
        : "D";
    }
  });

  const totalMatches = matches.length;

  return {
    total_matches: totalMatches,
    home_wins: homeWins,
    away_wins: awayWins,
    draws: draws,
    home_goals: totalHomeGoals,
    away_goals: totalAwayGoals,
    average_goals_per_match: totalMatches > 0 ? (totalHomeGoals + totalAwayGoals) / totalMatches : 0,
    win_percentage: {
      home: totalMatches > 0 ? (homeWins / totalMatches) * 100 : 0,
      away: totalMatches > 0 ? (awayWins / totalMatches) * 100 : 0,
      draw: totalMatches > 0 ? (draws / totalMatches) * 100 : 0,
    },
    last_5_matches: last5Matches,
    form_guide: {
      home_team: homeTeamForm,
      away_team: awayTeamForm,
    },
    processed_matches: processedMatches
  };
}

// Legend mode calculation (heavy computation)
function calculateLegendMode(matches: any[], homeTeam: string, awayTeam: string) {
  let homeComebacks = 0;
  let awayComebacks = 0;
  let biggestComeback = { match: matches[0] || {}, deficit: 0 };

  matches.forEach((match, index) => {
    // Progress reporting
    if (index % 50 === 0) {
      self.postMessage({
        type: 'PROGRESS',
        progress: (index / matches.length) * 100
      });
    }

    const isHomeTeamActuallyHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase());

    if (isHomeTeamActuallyHome) {
      // Check for home team comeback
      if (
        match.half_time_away_goals > match.half_time_home_goals &&
        match.full_time_home_goals > match.full_time_away_goals
      ) {
        homeComebacks++;
        const deficit = match.half_time_away_goals - match.half_time_home_goals;
        if (deficit > biggestComeback.deficit) {
          biggestComeback = { match, deficit };
        }
      }
      // Check for away team comeback
      if (
        match.half_time_home_goals > match.half_time_away_goals &&
        match.full_time_away_goals > match.full_time_home_goals
      ) {
        awayComebacks++;
      }
    } else {
      // Teams are swapped - adjust logic accordingly
      if (
        match.half_time_home_goals > match.half_time_away_goals &&
        match.full_time_away_goals > match.full_time_home_goals
      ) {
        homeComebacks++;
        const deficit = match.half_time_home_goals - match.half_time_away_goals;
        if (deficit > biggestComeback.deficit) {
          biggestComeback = { match, deficit };
        }
      }
      if (
        match.half_time_away_goals > match.half_time_home_goals &&
        match.full_time_home_goals > match.full_time_away_goals
      ) {
        awayComebacks++;
      }
    }
  });

  // Calculate performance trends
  const recentMatches = matches.slice(0, 10);
  const homeAdvantageMatches = matches.filter((m) =>
    m.home_team.toLowerCase().includes(homeTeam.toLowerCase())
  );
  const awayPerformanceMatches = matches.filter((m) =>
    m.away_team.toLowerCase().includes(homeTeam.toLowerCase())
  );

  const recentForm =
    recentMatches.length > 0
      ? (recentMatches.filter((m) => {
          const isHomeTeamActuallyHome = m.home_team.toLowerCase().includes(homeTeam.toLowerCase());
          return isHomeTeamActuallyHome
            ? m.full_time_home_goals > m.full_time_away_goals
            : m.full_time_away_goals > m.full_time_home_goals;
        }).length /
          recentMatches.length) *
        100
      : 0;

  const homeAdvantage =
    homeAdvantageMatches.length > 0
      ? (homeAdvantageMatches.filter((m) => m.full_time_home_goals > m.full_time_away_goals).length /
          homeAdvantageMatches.length) *
        100
      : 0;

  const awayPerformance =
    awayPerformanceMatches.length > 0
      ? (awayPerformanceMatches.filter((m) => m.full_time_away_goals > m.full_time_home_goals).length /
          awayPerformanceMatches.length) *
        100
      : 0;

  return {
    comeback_analysis: {
      home_comebacks: homeComebacks,
      away_comebacks: awayComebacks,
      biggest_comeback: biggestComeback,
    },
    performance_trends: {
      recent_form: Math.round(recentForm),
      home_advantage: Math.round(homeAdvantage),
      away_performance: Math.round(awayPerformance),
    },
    head_to_head: {
      total_meetings: matches.length,
      home_wins: matches.filter((m) => {
        const isHomeTeamActuallyHome = m.home_team.toLowerCase().includes(homeTeam.toLowerCase());
        return isHomeTeamActuallyHome
          ? m.full_time_home_goals > m.full_time_away_goals
          : m.full_time_away_goals > m.full_time_home_goals;
      }).length,
      away_wins: matches.filter((m) => {
        const isAwayTeamActuallyAway = m.away_team.toLowerCase().includes(awayTeam.toLowerCase());
        return isAwayTeamActuallyAway
          ? m.full_time_away_goals > m.full_time_home_goals
          : m.full_time_home_goals > m.full_time_away_goals;
      }).length,
      draws: matches.filter((m) => m.full_time_home_goals === m.full_time_away_goals).length,
      goal_difference: matches.reduce((acc, m) => {
        const isHomeTeamActuallyHome = m.home_team.toLowerCase().includes(homeTeam.toLowerCase());
        return (
          acc +
          (isHomeTeamActuallyHome
            ? m.full_time_home_goals - m.full_time_away_goals
            : m.full_time_away_goals - m.full_time_home_goals)
        );
      }, 0),
    },
  };
}

// Advanced sorting with different algorithms
function sortMatches(matches: any[], sortBy: string, direction: 'asc' | 'desc' = 'desc') {
  const sorted = [...matches].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.match_time).getTime() - new Date(b.match_time).getTime();
        break;
      case 'goals':
        const aGoals = a.full_time_home_goals + a.full_time_away_goals;
        const bGoals = b.full_time_home_goals + b.full_time_away_goals;
        comparison = aGoals - bGoals;
        break;
      case 'goalDifference':
        const aDiff = Math.abs(a.full_time_home_goals - a.full_time_away_goals);
        const bDiff = Math.abs(b.full_time_home_goals - b.full_time_away_goals);
        comparison = aDiff - bDiff;
        break;
      default:
        comparison = 0;
    }
    
    return direction === 'asc' ? comparison : -comparison;
  });
  
  return sorted;
}

// Message handler
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { id, type, payload } = event.data;
  
  try {
    let result: any;
    
    switch (type) {
      case 'CALCULATE_STATISTICS':
        result = calculateStatistics(payload.matches, payload.homeTeam, payload.awayTeam);
        break;
        
      case 'CALCULATE_LEGEND_MODE':
        result = calculateLegendMode(payload.matches, payload.homeTeam, payload.awayTeam);
        break;
        
      case 'SORT_MATCHES':
        result = sortMatches(payload.matches, payload.sortBy, payload.direction);
        break;
        
      case 'PROCESS_MATCHES':
        // Generic match processing
        result = payload.matches.map((match: any, index: number) => {
          if (index % 100 === 0) {
            self.postMessage({
              id,
              type: 'PROGRESS',
              progress: (index / payload.matches.length) * 100
            });
          }
          
          return {
            ...match,
            processed: true,
            processedAt: Date.now()
          };
        });
        break;

      case 'CALCULATE_PREDICTIONS':
        result = calculateBasicPredictions(payload.matches, payload.homeTeam, payload.awayTeam);
        // Send response in the format expected by usePredictions hook
        self.postMessage({
          type: 'CALCULATE_PREDICTIONS_RESULT',
          result
        });
        return; // Early return to avoid the standard response format
        break;
        
      default:
        throw new Error(`Unknown worker task type: ${type}`);
    }
    
    // Send success response
    const response: WorkerResponse = {
      id,
      type: 'SUCCESS',
      payload: result
    };
    
    self.postMessage(response);
    
  } catch (error) {
    // Send error response
    const response: WorkerResponse = {
      id,
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
    
    self.postMessage(response);
  }
};

// Calculate basic predictions using Poisson distribution and form analysis
function calculateBasicPredictions(matches: any[], homeTeam: string, awayTeam: string) {
  if (!matches || matches.length === 0) {
    return {
      home_win_probability: 0.33,
      draw_probability: 0.33,
      away_win_probability: 0.33,
      confidence_score: 0.1,
      calculation_method: 'client_baseline'
    };
  }

  // Calculate team form (last 5 matches)
  const homeForm = calculateTeamForm(matches, homeTeam, 5);
  const awayForm = calculateTeamForm(matches, awayTeam, 5);
  
  // Calculate average goals
  const homeGoals = calculateAverageGoals(matches, homeTeam, true);
  const awayGoals = calculateAverageGoals(matches, awayTeam, false);
  
  // Calculate head-to-head stats
  const h2hStats = calculateHeadToHead(matches, homeTeam, awayTeam);
  
  // Simple Poisson-based prediction
  const homeExpectedGoals = (homeGoals.scored * 0.6) + (awayGoals.conceded * 0.4);
  const awayExpectedGoals = (awayGoals.scored * 0.6) + (homeGoals.conceded * 0.4);
  
  // Apply form factor
  const formFactor = Math.max(0.5, Math.min(1.5, homeForm / awayForm));
  const adjustedHomeGoals = homeExpectedGoals * formFactor;
  const adjustedAwayGoals = awayExpectedGoals / formFactor;
  
  // Calculate probabilities using simplified Poisson
  const probabilities = calculatePoissonProbabilities(adjustedHomeGoals, adjustedAwayGoals);
  
  // Calculate calibrated confidence using the new utility
  const recency = calculateRecencyFactor(0, 24); // Assume fresh data for baseline
  const completeness = calculateCompletenessFactor(Math.min(matches.length, 10), 10, 3);
  const dataQuality = Math.min(1, matches.length / 20);
  
  const confidence = calculateCalibratedConfidence(
    { 
      home_win_probability: probabilities.home,
      draw_probability: probabilities.draw,
      away_win_probability: probabilities.away
    },
    { 
      recency, 
      completeness, 
      accuracy: dataQuality * 0.7 // Convert data quality to accuracy estimate
    }
  );
  
  return {
    home_win_probability: probabilities.home,
    draw_probability: probabilities.draw,
    away_win_probability: probabilities.away,
    btts_probability: calculateBTTSProbability(adjustedHomeGoals, adjustedAwayGoals),
    over25_probability: calculateOver25Probability(adjustedHomeGoals, adjustedAwayGoals),
    predicted_score: {
      home: Math.round(adjustedHomeGoals),
      away: Math.round(adjustedAwayGoals)
    },
    confidence_score: confidence,
    key_factors: generateKeyFactors(homeForm, awayForm, h2hStats, matches.length),
    calculation_method: 'client_baseline'
  };
}

function calculateTeamForm(matches: any[], teamName: string, numMatches: number) {
  const recentMatches = matches.slice(0, numMatches);
  let points = 0;
  
  recentMatches.forEach(match => {
    const isHome = match.home_team.toLowerCase().includes(teamName.toLowerCase());
    const homeGoals = match.full_time_home_goals;
    const awayGoals = match.full_time_away_goals;
    
    if (isHome) {
      if (homeGoals > awayGoals) points += 3;
      else if (homeGoals === awayGoals) points += 1;
    } else {
      if (awayGoals > homeGoals) points += 3;
      else if (awayGoals === homeGoals) points += 1;
    }
  });
  
  return recentMatches.length > 0 ? points / (recentMatches.length * 3) * 10 : 5;
}

function calculateAverageGoals(matches: any[], teamName: string, isHome: boolean) {
  let scored = 0;
  let conceded = 0;
  let count = 0;
  
  matches.forEach(match => {
    const teamIsHome = match.home_team.toLowerCase().includes(teamName.toLowerCase());
    
    if ((isHome && teamIsHome) || (!isHome && !teamIsHome)) {
      if (teamIsHome) {
        scored += match.full_time_home_goals;
        conceded += match.full_time_away_goals;
      } else {
        scored += match.full_time_away_goals;
        conceded += match.full_time_home_goals;
      }
      count++;
    }
  });
  
  return {
    scored: count > 0 ? scored / count : 1.5,
    conceded: count > 0 ? conceded / count : 1.5
  };
}

function calculateHeadToHead(matches: any[], homeTeam: string, awayTeam: string) {
  let homeWins = 0;
  let awayWins = 0;
  let draws = 0;
  
  matches.forEach(match => {
    const isHomeTeamActuallyHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase());
    
    if (isHomeTeamActuallyHome) {
      if (match.full_time_home_goals > match.full_time_away_goals) homeWins++;
      else if (match.full_time_home_goals < match.full_time_away_goals) awayWins++;
      else draws++;
    } else {
      if (match.full_time_away_goals > match.full_time_home_goals) homeWins++;
      else if (match.full_time_away_goals < match.full_time_home_goals) awayWins++;
      else draws++;
    }
  });
  
  const total = homeWins + awayWins + draws;
  return {
    homeWins,
    awayWins,
    draws,
    total,
    homeWinRate: total > 0 ? homeWins / total : 0.33
  };
}

function calculatePoissonProbabilities(homeGoals: number, awayGoals: number) {
  // Simplified Poisson approximation
  const totalGoals = homeGoals + awayGoals;
  const homeAdvantage = homeGoals / totalGoals;
  
  // Basic probability calculation
  const homeProbability = Math.max(0.1, Math.min(0.8, homeAdvantage * 1.2));
  const awayProbability = Math.max(0.1, Math.min(0.8, (1 - homeAdvantage) * 1.1));
  const drawProbability = Math.max(0.1, 1 - homeProbability - awayProbability);
  
  // Normalize probabilities
  const total = homeProbability + drawProbability + awayProbability;
  
  return {
    home: homeProbability / total,
    draw: drawProbability / total,
    away: awayProbability / total
  };
}

function calculateBTTSProbability(homeGoals: number, awayGoals: number) {
  // Probability both teams score
  const homeScoreProbability = 1 - Math.exp(-homeGoals);
  const awayScoreProbability = 1 - Math.exp(-awayGoals);
  return homeScoreProbability * awayScoreProbability;
}

function calculateOver25Probability(homeGoals: number, awayGoals: number) {
  // Probability of over 2.5 goals
  const totalGoals = homeGoals + awayGoals;
  if (totalGoals < 1.5) return 0.2;
  if (totalGoals < 2.5) return 0.4;
  if (totalGoals < 3.5) return 0.7;
  return 0.85;
}

function generateKeyFactors(homeForm: number, awayForm: number, h2hStats: any, matchCount: number) {
  const factors = [];
  
  if (homeForm > 7) factors.push("Hazai csapat jó formában");
  else if (homeForm < 4) factors.push("Hazai csapat gyenge formában");
  
  if (awayForm > 7) factors.push("Vendég csapat jó formában");
  else if (awayForm < 4) factors.push("Vendég csapat gyenge formában");
  
  if (h2hStats.homeWinRate > 0.6) factors.push("Hazai csapat dominál a korábbi találkozókon");
  else if (h2hStats.homeWinRate < 0.3) factors.push("Vendég csapat jobb a korábbi mérkőzéseken");
  
  if (matchCount < 5) factors.push("Korlátozott adatmennyiség");
  else if (matchCount > 20) factors.push("Gazdag történelmi adatok");
  
  return factors.length > 0 ? factors : ["Alapszintű statisztikai elemzés"];
}

// Send ready signal
self.postMessage({ type: 'READY' });