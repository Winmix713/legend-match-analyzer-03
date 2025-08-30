"use client"
import { Search, Users, AlertTriangle, Target, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { validateTeamSelection } from "@/lib/validation"
import { ValidationErrorDisplay } from "@/components/ErrorDisplay"
import { useNetworkStatus } from "@/hooks/useNetworkStatus"
import { SearchInterfaceSkeleton } from "@/components/ui/skeleton-variants"
import { matchService } from "@/services/matchService"

interface SearchInterfaceProps {
  homeTeam: string
  awayTeam: string
  onHomeTeamChange: (value: string) => void
  onAwayTeamChange: (value: string) => void
  onSearch: () => void
  loading: boolean
  error?: string | null
  searchMode?: "pairing" | "return-matches"
  onSearchModeChange?: (mode: "pairing" | "return-matches") => void
}


export const SearchInterface = ({
  homeTeam,
  awayTeam,
  onHomeTeamChange,
  onAwayTeamChange,
  onSearch,
  loading,
  error,
  searchMode = "return-matches",
  onSearchModeChange,
}: SearchInterfaceProps) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [teamNames, setTeamNames] = useState<string[]>([]);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const { isOnline, shouldShowOfflineWarning, shouldShowSlowConnectionWarning } = useNetworkStatus();

  // Fetch team names from matches table
  useEffect(() => {
    if (isOnline) {
      setLoadingTeams(true);
      matchService.getTeamNames()
        .then(names => setTeamNames(names))
        .catch(error => console.error('Failed to load team names:', error))
        .finally(() => setLoadingTeams(false));
    }
  }, [isOnline]);

  // Real-time validation
  useEffect(() => {
    if (homeTeam && awayTeam) {
      const validation = validateTeamSelection(homeTeam, awayTeam);
      setValidationError(validation.isValid ? null : validation.message || null);
    } else {
      setValidationError(null);
    }
  }, [homeTeam, awayTeam]);

  const isSearchDisabled = !homeTeam || !awayTeam || loading || !isOnline || !!validationError;

  if (loading && !homeTeam && !awayTeam) {
    return <SearchInterfaceSkeleton className="animate-slide-up" />;
  }
  return (
    <Card className="glass p-8 animate-slide-up">
      <div className="text-center mb-8">
        <h1 className="text-hero text-gradient mb-4">Futballmeccsek Adatbázis</h1>
        <p className="text-muted-foreground text-lg">Keress statisztikákat és elemzéseket csapatok között</p>
      </div>

      {/* Network Status Warnings */}
      {shouldShowOfflineWarning && (
        <div className="mb-6">
          <ValidationErrorDisplay 
            message="Nincs internetkapcsolat. Ellenőrizd a kapcsolatot és próbáld újra." 
            className="border-orange-500/20"
          />
        </div>
      )}

      {shouldShowSlowConnectionWarning && (
        <div className="mb-6 flex items-center gap-2 p-3 glass-light rounded-lg border border-yellow-500/20">
          <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          <p className="text-sm text-yellow-600">
            Lassú internetkapcsolat észlelve. A keresés tovább tarthat.
          </p>
        </div>
      )}

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Hazai csapat
            </label>
            <Select
              value={homeTeam}
              onValueChange={onHomeTeamChange}
              disabled={!isOnline || loadingTeams}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Válassz hazai csapatot..." />
              </SelectTrigger>
              <SelectContent>
                {teamNames
                  .filter(name => name !== awayTeam) // Prevent selecting same team
                  .map(name => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground flex items-center gap-2">
              <Users className="w-4 h-4 text-secondary" />
              Vendég csapat
            </label>
            <Select
              value={awayTeam}
              onValueChange={onAwayTeamChange}
              disabled={!isOnline || loadingTeams}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Válassz vendég csapatot..." />
              </SelectTrigger>
              <SelectContent>
                {teamNames
                  .filter(name => name !== homeTeam) // Prevent selecting same team
                  .map(name => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search mode selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" />
            Keresési mód
          </label>
          <Select
            value={searchMode}
            onValueChange={onSearchModeChange}
            disabled={!isOnline}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Válassz keresési módot..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pairing">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Párosítás</div>
                    <div className="text-xs text-muted-foreground">Csak a pontosan megegyező meccseket keresi (Hazai vs Vendég)</div>
                  </div>
                </div>
              </SelectItem>
              <SelectItem value="return-matches">
                <div className="flex items-center gap-2">
                  <RefreshCcw className="w-4 h-4" />
                  <div>
                    <div className="font-medium">Visszavágó meccsek</div>
                    <div className="text-xs text-muted-foreground">Mindkét irányú meccseket keresi (Hazai vs Vendég + Vendég vs Hazai)</div>
                  </div>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Validation Error Display */}
        {validationError && (
          <ValidationErrorDisplay message={validationError} />
        )}

        {/* API Error Display */}
        {error && (
          <ValidationErrorDisplay message={error} />
        )}

        <div className="flex justify-center">
          <Button
            onClick={onSearch}
            disabled={isSearchDisabled}
            className="btn-hero min-w-[200px] animate-glow"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {isOnline ? "Keresés..." : "Offline"}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                {isOnline ? "Elemzés indítása" : "Nincs kapcsolat"}
              </div>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
