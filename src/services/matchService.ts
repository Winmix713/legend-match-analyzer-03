import { supabase } from "@/integrations/supabase/client"
import type { Database } from "@/integrations/supabase/types"
import type { Match, StatisticsResult, LegendModeData } from "@/types"
import { matchesCache, statisticsCache, legendModeCache, teamNamesCache, cacheKeys } from "@/lib/cache-utils"

// Error types for better error handling
export class MatchServiceError extends Error {
  constructor(message: string, public code: string, public originalError?: Error) {
    super(message)
    this.name = 'MatchServiceError'
  }
}

export class NetworkError extends MatchServiceError {
  constructor(originalError?: Error) {
    super('Hálózati hiba történt. Ellenőrizd az internetkapcsolatot.', 'NETWORK_ERROR', originalError)
  }
}

export class ValidationError extends MatchServiceError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR')
  }
}

export class DataNotFoundError extends MatchServiceError {
  constructor() {
    super('Nem találtunk meccseket a megadott csapatok között.', 'DATA_NOT_FOUND')
  }
}

type SupabaseMatch = Database["public"]["Tables"]["matches"]["Row"]

// Convert Supabase match to our Match type
const convertSupabaseMatch = (supabaseMatch: SupabaseMatch): Match => ({
  id: supabaseMatch.id,
  match_time: supabaseMatch.match_time,
  home_team: supabaseMatch.home_team,
  away_team: supabaseMatch.away_team,
  half_time_home_goals: supabaseMatch.half_time_home_goals || 0,
  half_time_away_goals: supabaseMatch.half_time_away_goals || 0,
  full_time_home_goals: supabaseMatch.full_time_home_goals,
  full_time_away_goals: supabaseMatch.full_time_away_goals,
  league: supabaseMatch.league,
  season: supabaseMatch.season || "Unknown Season",
  created_at: supabaseMatch.created_at,
  updated_at: supabaseMatch.updated_at,
})

export const matchService = {
  // Get matches between two teams with enhanced error handling and AbortController support
  async getMatchesBetweenTeams(
    homeTeam: string, 
    awayTeam: string, 
    options: { signal?: AbortSignal; timeout?: number; searchMode?: "pairing" | "return-matches" } = {}
  ): Promise<Match[]> {
    const { signal, timeout = 30000, searchMode = "return-matches" } = options;
    
    // Input validation
    if (!homeTeam?.trim() || !awayTeam?.trim()) {
      throw new ValidationError("Mindkét csapat nevét meg kell adni")
    }

    // Check cache first
    const cacheKey = cacheKeys.matches(homeTeam, awayTeam);
    const cachedData = await matchesCache.get(cacheKey);
    if (cachedData) {
      console.log("Cache hit for matches:", homeTeam, "vs", awayTeam);
      return cachedData;
    }

    console.log("Searching for matches between:", homeTeam, "and", awayTeam)
    
    // Create timeout promise
    const timeoutPromise = new Promise<never>((_, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);
      
      signal?.addEventListener('abort', () => {
        clearTimeout(timeoutId);
        reject(new Error('Request aborted'));
      });
    });
    
    try {
      let queryPromise;
      
      if (searchMode === "pairing") {
        // Only search for exact pairing: homeTeam vs awayTeam
        queryPromise = supabase
          .from("matches")
          .select("*")
          .ilike("home_team", `*${homeTeam}*`)
          .ilike("away_team", `*${awayTeam}*`)
          .order("match_time", { ascending: false })
          .limit(50);
      } else {
        // Search for both directions: homeTeam vs awayTeam + awayTeam vs homeTeam
        queryPromise = supabase
          .from("matches")
          .select("*")
          .or(
            `and(home_team.ilike.*${homeTeam}*,away_team.ilike.*${awayTeam}*),and(home_team.ilike.*${awayTeam}*,away_team.ilike.*${homeTeam}*)`
          )
          .order("match_time", { ascending: false })
          .limit(50);
      }

      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      console.log("Supabase query result:", data, "Error:", error)

      if (error) {
        console.error("Error fetching matches:", error)
        
        // Check if it's a network/connection error
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          throw new NetworkError(error)
        }
        
        throw new MatchServiceError(
          "Hiba történt az adatok lekérése során",
          "SUPABASE_ERROR",
          error
        )
      }

      const matches = data ? data.map(convertSupabaseMatch) : []
      
      if (matches.length === 0) {
        throw new DataNotFoundError()
      }

      // Cache the results
      await matchesCache.set(cacheKey, matches);

      return matches
    } catch (error) {
      // Handle timeout and abort errors
      if (error instanceof Error) {
        if (error.message === 'Request timeout') {
          throw new MatchServiceError(
            "A kérés túl sokáig tartott",
            "TIMEOUT_ERROR",
            error
          );
        }
        if (error.message === 'Request aborted') {
          throw new MatchServiceError(
            "A kérés megszakítva",
            "ABORTED_ERROR",
            error
          );
        }
      }
      
      // Re-throw our custom errors
      if (error instanceof MatchServiceError) {
        throw error
      }
      
      // Handle unexpected errors
      console.error("Unexpected error fetching matches:", error)
      throw new NetworkError(error instanceof Error ? error : undefined)
    }
  },

  // Calculate statistics from matches
  calculateStatistics(matches: Match[], homeTeam: string, awayTeam: string): StatisticsResult {
    let homeWins = 0
    let awayWins = 0
    let draws = 0
    let totalHomeGoals = 0
    let totalAwayGoals = 0

    matches.forEach((match) => {
      // Determine if this team is playing home or away in this match
      const isHomeTeamActuallyHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase())

      if (isHomeTeamActuallyHome) {
        totalHomeGoals += match.full_time_home_goals
        totalAwayGoals += match.full_time_away_goals

        if (match.full_time_home_goals > match.full_time_away_goals) {
          homeWins++
        } else if (match.full_time_home_goals < match.full_time_away_goals) {
          awayWins++
        } else {
          draws++
        }
      } else {
        // Teams are swapped in this match
        totalHomeGoals += match.full_time_away_goals
        totalAwayGoals += match.full_time_home_goals

        if (match.full_time_away_goals > match.full_time_home_goals) {
          homeWins++
        } else if (match.full_time_away_goals < match.full_time_home_goals) {
          awayWins++
        } else {
          draws++
        }
      }
    })

    const totalMatches = matches.length

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
      last_5_matches: matches.slice(0, 5),
      form_guide: {
        home_team: matches.slice(0, 5).map((m) => {
          const isHomeTeamActuallyHome = m.home_team.toLowerCase().includes(homeTeam.toLowerCase())
          if (isHomeTeamActuallyHome) {
            return m.full_time_home_goals > m.full_time_away_goals
              ? "W"
              : m.full_time_home_goals < m.full_time_away_goals
                ? "L"
                : "D"
          } else {
            return m.full_time_away_goals > m.full_time_home_goals
              ? "W"
              : m.full_time_away_goals < m.full_time_home_goals
                ? "L"
                : "D"
          }
        }),
        away_team: matches.slice(0, 5).map((m) => {
          const isAwayTeamActuallyAway = m.away_team.toLowerCase().includes(awayTeam.toLowerCase())
          if (isAwayTeamActuallyAway) {
            return m.full_time_away_goals > m.full_time_home_goals
              ? "W"
              : m.full_time_away_goals < m.full_time_home_goals
                ? "L"
                : "D"
          } else {
            return m.full_time_home_goals > m.full_time_away_goals
              ? "W"
              : m.full_time_home_goals < m.full_time_away_goals
                ? "L"
                : "D"
          }
        }),
      },
    }
  },

  // Calculate legend mode data from real matches
  calculateLegendMode(matches: Match[], homeTeam: string, awayTeam: string): LegendModeData {
    let homeComebacks = 0
    let awayComebacks = 0
    let biggestComeback = { match: matches[0] || ({} as Match), deficit: 0 }

    matches.forEach((match) => {
      const isHomeTeamActuallyHome = match.home_team.toLowerCase().includes(homeTeam.toLowerCase())

      if (isHomeTeamActuallyHome) {
        // Check for home team comeback
        if (
          match.half_time_away_goals > match.half_time_home_goals &&
          match.full_time_home_goals > match.full_time_away_goals
        ) {
          homeComebacks++
          const deficit = match.half_time_away_goals - match.half_time_home_goals
          if (deficit > biggestComeback.deficit) {
            biggestComeback = { match, deficit }
          }
        }
        // Check for away team comeback
        if (
          match.half_time_home_goals > match.half_time_away_goals &&
          match.full_time_away_goals > match.full_time_home_goals
        ) {
          awayComebacks++
        }
      } else {
        // Teams are swapped - adjust logic accordingly
        if (
          match.half_time_home_goals > match.half_time_away_goals &&
          match.full_time_away_goals > match.full_time_home_goals
        ) {
          homeComebacks++
          const deficit = match.half_time_home_goals - match.half_time_away_goals
          if (deficit > biggestComeback.deficit) {
            biggestComeback = { match, deficit }
          }
        }
        if (
          match.half_time_away_goals > match.half_time_home_goals &&
          match.full_time_home_goals > match.full_time_away_goals
        ) {
          awayComebacks++
        }
      }
    })

    // Calculate performance trends based on recent matches
    const recentMatches = matches.slice(0, 10)
    const homeAdvantageMatches = matches.filter((m) => m.home_team.toLowerCase().includes(homeTeam.toLowerCase()))
    const awayPerformanceMatches = matches.filter((m) => m.away_team.toLowerCase().includes(homeTeam.toLowerCase()))

    const recentForm =
      recentMatches.length > 0
        ? (recentMatches.filter((m) => {
            const isHomeTeamActuallyHome = m.home_team.toLowerCase().includes(homeTeam.toLowerCase())
            return isHomeTeamActuallyHome
              ? m.full_time_home_goals > m.full_time_away_goals
              : m.full_time_away_goals > m.full_time_home_goals
          }).length /
            recentMatches.length) *
          100
        : 0

    const homeAdvantage =
      homeAdvantageMatches.length > 0
        ? (homeAdvantageMatches.filter((m) => m.full_time_home_goals > m.full_time_away_goals).length /
            homeAdvantageMatches.length) *
          100
        : 0

    const awayPerformance =
      awayPerformanceMatches.length > 0
        ? (awayPerformanceMatches.filter((m) => m.full_time_away_goals > m.full_time_home_goals).length /
            awayPerformanceMatches.length) *
          100
        : 0

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
          const isHomeTeamActuallyHome = m.home_team.toLowerCase().includes(homeTeam.toLowerCase())
          return isHomeTeamActuallyHome
            ? m.full_time_home_goals > m.full_time_away_goals
            : m.full_time_away_goals > m.full_time_home_goals
        }).length,
        away_wins: matches.filter((m) => {
          const isAwayTeamActuallyAway = m.away_team.toLowerCase().includes(awayTeam.toLowerCase())
          return isAwayTeamActuallyAway
            ? m.full_time_away_goals > m.full_time_home_goals
            : m.full_time_home_goals > m.full_time_away_goals
        }).length,
        draws: matches.filter((m) => m.full_time_home_goals === m.full_time_away_goals).length,
        goal_difference: matches.reduce((acc, m) => {
          const isHomeTeamActuallyHome = m.home_team.toLowerCase().includes(homeTeam.toLowerCase())
          return (
            acc +
            (isHomeTeamActuallyHome
              ? m.full_time_home_goals - m.full_time_away_goals
              : m.full_time_away_goals - m.full_time_home_goals)
          )
        }, 0),
      },
    }
  },

  // Get unique team names for search suggestions with error handling
  async getTeamNames(options: { signal?: AbortSignal; timeout?: number } = {}): Promise<string[]> {
    const { signal, timeout = 10000 } = options;
    
    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        const timeoutId = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, timeout);
        
        signal?.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Request aborted'));
        });
      });

      const queryPromise = supabase.from("matches").select("home_team, away_team").limit(1000);
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

      if (error) {
        console.error("Error fetching team names:", error)
        
        if (error.message?.includes('fetch') || error.message?.includes('network')) {
          throw new NetworkError(error)
        }
        
        throw new MatchServiceError(
          "Hiba történt a csapatnevek lekérése során",
          "TEAM_NAMES_ERROR",
          error
        )
      }

      const teamSet = new Set<string>()
      data?.forEach((match) => {
        teamSet.add(match.home_team)
        teamSet.add(match.away_team)
      })

      return Array.from(teamSet).sort()
    } catch (error) {
      // Handle timeout and abort errors
      if (error instanceof Error) {
        if (error.message === 'Request timeout' || error.message === 'Request aborted') {
          console.warn("Team names request cancelled or timed out");
          return []; // Return empty array as fallback
        }
      }
      
      if (error instanceof MatchServiceError) {
        throw error
      }
      
      console.error("Unexpected error fetching team names:", error)
      // Return empty array for team names as fallback
      return []
    }
  },
}
