import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  Star, 
  Plus, 
  X, 
  MoreVertical,
  Search,
  Trash2,
  Edit
} from 'lucide-react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface FavoriteTeam {
  id: string;
  name: string;
  addedAt: string;
  searchCount: number;
  lastSearched?: string;
}

interface FavoriteTeamsProps {
  onTeamSelect?: (teamName: string) => void;
  className?: string;
}

export function FavoriteTeams({ onTeamSelect, className }: FavoriteTeamsProps) {
  const { toast } = useToast();
  const [favorites, setFavorites] = useLocalStorage<FavoriteTeam[]>('favorite-teams', [], 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingTeam, setEditingTeam] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const filteredFavorites = favorites.filter(team =>
    team.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFavorite = (teamName: string) => {
    if (!teamName.trim()) return;

    const existingTeam = favorites.find(
      team => team.name.toLowerCase() === teamName.toLowerCase()
    );

    if (existingTeam) {
      toast({
        title: 'Team Already Added',
        description: `${teamName} is already in your favorites.`,
        variant: 'destructive',
      });
      return;
    }

    const newFavorite: FavoriteTeam = {
      id: crypto.randomUUID(),
      name: teamName.trim(),
      addedAt: new Date().toISOString(),
      searchCount: 0,
    };

    setFavorites(prev => [newFavorite, ...prev]);
    toast({
      title: 'Team Added',
      description: `${teamName} has been added to your favorites.`,
    });
  };

  const removeFavorite = (teamId: string) => {
    const team = favorites.find(t => t.id === teamId);
    setFavorites(prev => prev.filter(t => t.id !== teamId));
    
    if (team) {
      toast({
        title: 'Team Removed',
        description: `${team.name} has been removed from your favorites.`,
      });
    }
  };

  const updateTeamName = (teamId: string, newName: string) => {
    if (!newName.trim()) return;

    setFavorites(prev => prev.map(team =>
      team.id === teamId ? { ...team, name: newName.trim() } : team
    ));

    setEditingTeam(null);
    setEditName('');
    
    toast({
      title: 'Team Updated',
      description: 'Team name has been updated successfully.',
    });
  };

  const incrementSearchCount = (teamName: string) => {
    setFavorites(prev => prev.map(team =>
      team.name.toLowerCase() === teamName.toLowerCase()
        ? { 
            ...team, 
            searchCount: team.searchCount + 1,
            lastSearched: new Date().toISOString()
          }
        : team
    ));
  };

  const handleTeamSelect = (teamName: string) => {
    incrementSearchCount(teamName);
    onTeamSelect?.(teamName);
  };

  const clearAllFavorites = () => {
    setFavorites([]);
    toast({
      title: 'Favorites Cleared',
      description: 'All favorite teams have been removed.',
    });
  };

  const startEditing = (team: FavoriteTeam) => {
    setEditingTeam(team.id);
    setEditName(team.name);
  };

  const cancelEditing = () => {
    setEditingTeam(null);
    setEditName('');
  };

  const getMostSearchedTeams = () => {
    return [...favorites]
      .filter(team => team.searchCount > 0)
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, 3);
  };

  const getRecentlyAddedTeams = () => {
    return [...favorites]
      .sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime())
      .slice(0, 3);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn('gap-2', className)}
          aria-label="Manage favorite teams"
        >
          <Heart className="h-4 w-4" />
          Favorites
          {favorites.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {favorites.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Favorite Teams
          </DialogTitle>
          <DialogDescription>
            Save your favorite teams for quick access and track your search history.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add New Favorite */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter team name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addFavorite(searchQuery);
                    setSearchQuery('');
                  }
                }}
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={() => {
                  addFavorite(searchQuery);
                  setSearchQuery('');
                }}
                disabled={!searchQuery.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          {favorites.length > 0 && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-accent rounded-lg text-center">
                <div className="font-semibold">{favorites.length}</div>
                <div className="text-muted-foreground">Total Teams</div>
              </div>
              <div className="p-2 bg-accent rounded-lg text-center">
                <div className="font-semibold">
                  {favorites.reduce((sum, team) => sum + team.searchCount, 0)}
                </div>
                <div className="text-muted-foreground">Total Searches</div>
              </div>
            </div>
          )}

          {/* Most Searched Teams */}
          {getMostSearchedTeams().length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Star className="h-4 w-4" />
                Most Searched
              </h4>
              <div className="space-y-1">
                {getMostSearchedTeams().map(team => (
                  <button
                    key={`most-${team.id}`}
                    onClick={() => handleTeamSelect(team.name)}
                    className="w-full flex items-center justify-between p-2 hover:bg-accent rounded-lg transition-colors text-left"
                  >
                    <span className="font-medium">{team.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {team.searchCount}x
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}

          {favorites.length > 0 && <Separator />}

          {/* All Favorites */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">All Favorites</h4>
              {favorites.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFavorites}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              )}
            </div>

            {favorites.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No favorite teams yet</p>
                <p className="text-sm">Add teams above to get started</p>
              </div>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {filteredFavorites.map(team => (
                  <div
                    key={team.id}
                    className="flex items-center gap-2 p-2 hover:bg-accent rounded-lg transition-colors"
                  >
                    {editingTeam === team.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              updateTeamName(team.id, editName);
                            } else if (e.key === 'Escape') {
                              cancelEditing();
                            }
                          }}
                          className="text-sm"
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateTeamName(team.id, editName)}
                          disabled={!editName.trim()}
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          ✕
                        </Button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => handleTeamSelect(team.name)}
                          className="flex-1 text-left font-medium hover:text-primary transition-colors"
                        >
                          {team.name}
                        </button>
                        <div className="flex items-center gap-1">
                          {team.searchCount > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {team.searchCount}
                            </Badge>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEditing(team)}>
                                <Edit className="h-3 w-3 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => removeFavorite(team.id)}
                                className="text-destructive"
                              >
                                <X className="h-3 w-3 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}