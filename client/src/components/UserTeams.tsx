import { useState } from "react";
import { Plus, X, Heart, Star, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';

interface Team {
  name: string;
  league: string;
  city: string;
  conference?: string;
}

interface Player {
  name: string;
  team: string;
  position: string;
  league: string;
}

export function UserTeams() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch fresh user data to get updated favorites
  const { data: currentUser, refetch: refetchUser } = useQuery({
    queryKey: ['/api/users', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`/api/users/${user.id}`, {
        cache: 'no-cache', // Ensure fresh data
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      if (!response.ok) throw new Error('Failed to fetch user data');
      return response.json();
    },
    enabled: !!user?.id,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache data (TanStack Query v5)
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Sports leagues data
  const leagues = [
    { id: "NBA", name: "NBA", color: "bg-orange-600" },
    { id: "NFL", name: "NFL", color: "bg-blue-600" },
    { id: "MLB", name: "MLB", color: "bg-red-600" },
    { id: "NCAAM", name: "March Madness", color: "bg-purple-600" },
    { id: "CFB", name: "College Football", color: "bg-green-600" },
    { id: "PGA", name: "PGA Tour", color: "bg-yellow-600" },
    { id: "LIV", name: "LIV Golf", color: "bg-gray-800" }
  ];

  // Fetch teams and players from sports API
  const { data: allTeams = [], isLoading: teamsLoading } = useQuery<Team[]>({
    queryKey: ['/api/sports/teams'],
    queryFn: async () => {
      const response = await fetch('/api/sports/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  const { data: allPlayers = [], isLoading: playersLoading } = useQuery<Player[]>({
    queryKey: ['/api/sports/players'],
    queryFn: async () => {
      const response = await fetch('/api/sports/players');
      if (!response.ok) throw new Error('Failed to fetch players');
      return response.json();
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes
  });

  // Mutations for managing favorites
  const addTeamMutation = useMutation({
    mutationFn: async (team: string) => {
      console.log('🏀 Adding team:', team);
      const response = await fetch(`/api/users/${user?.id}/favorite-teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ team })
      });
      if (!response.ok) throw new Error('Failed to add team');
      return response.json();
    },
    onSuccess: (updatedUser) => {
      console.log('✅ Team added successfully, updating cache...', updatedUser);
      // Clear cache and set fresh data
      queryClient.removeQueries({ queryKey: ['/api/users', user?.id] });
      queryClient.setQueryData(['/api/users', user?.id], updatedUser);
      // Force refetch
      refetchUser();
      setIsDialogOpen(false);
    }
  });

  const removeTeamMutation = useMutation({
    mutationFn: async (team: string) => {
      const response = await fetch(`/api/users/${user?.id}/favorite-teams/${encodeURIComponent(team)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove team');
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update cache immediately with fresh data
      queryClient.setQueryData(['/api/users', user?.id], updatedUser);
      // Force refetch to ensure consistency
      queryClient.refetchQueries({ queryKey: ['/api/users', user?.id] });
    }
  });

  const addPlayerMutation = useMutation({
    mutationFn: async (player: string) => {
      const response = await fetch(`/api/users/${user?.id}/favorite-players`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player })
      });
      if (!response.ok) throw new Error('Failed to add player');
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update cache immediately with fresh data
      queryClient.setQueryData(['/api/users', user?.id], updatedUser);
      // Force refetch to ensure consistency
      queryClient.refetchQueries({ queryKey: ['/api/users', user?.id] });
      setIsDialogOpen(false);
    }
  });

  const removePlayerMutation = useMutation({
    mutationFn: async (player: string) => {
      const response = await fetch(`/api/users/${user?.id}/favorite-players/${encodeURIComponent(player)}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to remove player');
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update cache immediately with fresh data
      queryClient.setQueryData(['/api/users', user?.id], updatedUser);
      // Force refetch to ensure consistency
      queryClient.refetchQueries({ queryKey: ['/api/users', user?.id] });
    }
  });

  // Filter teams and players based on search and league
  const filteredTeams = allTeams.filter(team => {
    const matchesSearch = team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         team.city.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === "all" || team.league === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  const filteredPlayers = allPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLeague = selectedLeague === "all" || player.league === selectedLeague;
    return matchesSearch && matchesLeague;
  });

  const getLeagueColor = (league: string) => {
    const leagueData = leagues.find(l => l.id === league);
    return leagueData?.color || 'bg-gray-600';
  };

  const getTeamColor = (team: string) => {
    const colors: Record<string, string> = {
      'Lakers': 'bg-purple-600',
      'Warriors': 'bg-yellow-500',
      'Celtics': 'bg-green-600',
      'Cowboys': 'bg-blue-600',
      'Patriots': 'bg-red-600',
      'Chiefs': 'bg-red-600',
      'Yankees': 'bg-blue-800',
      'Dodgers': 'bg-blue-600'
    };
    return colors[team] || 'bg-gray-600';
  };

  // Use currentUser data for up-to-date favorites, fallback to auth user
  const userData = currentUser || user;
  const currentFavoriteTeams = userData?.favoriteTeams || [];
  const currentFavoritePlayers = userData?.favoritePlayers || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-red-500" />
          <span>Your Favorites</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Current Favorite Teams */}
        {currentFavoriteTeams.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Teams ({currentFavoriteTeams.length})</h3>
            <div className="space-y-2">
              {currentFavoriteTeams.map((team: string) => (
                <div key={team} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${getTeamColor(team)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                      {team.slice(0, 3).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{team}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeTeamMutation.mutate(team)}
                    disabled={removeTeamMutation.isPending}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Favorite Players */}
        {currentFavoritePlayers.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Players ({currentFavoritePlayers.length})</h3>
            <div className="space-y-2">
              {currentFavoritePlayers.map((player: string) => (
                <div key={player} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      <Star className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-gray-900">{player}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removePlayerMutation.mutate(player)}
                    disabled={removePlayerMutation.isPending}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {currentFavoriteTeams.length === 0 && currentFavoritePlayers.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Heart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm font-medium">No favorites yet</p>
            <p className="text-xs">Add your favorite teams and players to get personalized content</p>
          </div>
        )}
        
        {/* Add Favorites Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full mt-4 text-blue-600 border-blue-600 hover:bg-blue-600 hover:text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Favorites
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Your Favorite Teams & Players</DialogTitle>
            </DialogHeader>

            {/* Search and Filter Controls */}
            <div className="space-y-4 mb-6">
              <div className="flex space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search teams, players, or cities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Leagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leagues</SelectItem>
                    {leagues.map(league => (
                      <SelectItem key={league.id} value={league.id}>
                        {league.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* League Filter Badges */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={selectedLeague === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLeague("all")}
                >
                  All Sports
                </Button>
                {leagues.map(league => (
                  <Button
                    key={league.id}
                    variant={selectedLeague === league.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLeague(league.id)}
                    className={selectedLeague === league.id ? league.color + " text-white" : ""}
                  >
                    {league.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Teams and Players Tabs */}
            <Tabs defaultValue="teams" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="teams">
                  Teams ({teamsLoading ? '...' : filteredTeams.length})
                </TabsTrigger>
                <TabsTrigger value="players">
                  Players ({playersLoading ? '...' : filteredPlayers.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="teams" className="space-y-2 max-h-96 overflow-y-auto">
                {filteredTeams.map((team) => (
                  <div key={`${team.name}-${team.league}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${getLeagueColor(team.league)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                        {team.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{team.name}</div>
                        <div className="text-sm text-gray-500">{team.city} • {team.league} • {team.conference}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addTeamMutation.mutate(team.name)}
                      disabled={currentFavoriteTeams.includes(team.name) || addTeamMutation.isPending}
                      variant={currentFavoriteTeams.includes(team.name) ? "secondary" : "default"}
                    >
                      {currentFavoriteTeams.includes(team.name) ? (
                        <>
                          <Heart className="h-4 w-4 mr-1 fill-current" />
                          Following
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                ))}
                {filteredTeams.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">No teams found matching your search</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="players" className="space-y-2 max-h-96 overflow-y-auto">
                {filteredPlayers.map((player) => (
                  <div key={`${player.name}-${player.league}`} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 ${getLeagueColor(player.league)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                        <Star className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{player.name}</div>
                        <div className="text-sm text-gray-500">{player.team} • {player.position} • {player.league}</div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => addPlayerMutation.mutate(player.name)}
                      disabled={currentFavoritePlayers.includes(player.name) || addPlayerMutation.isPending}
                      variant={currentFavoritePlayers.includes(player.name) ? "secondary" : "default"}
                    >
                      {currentFavoritePlayers.includes(player.name) ? (
                        <>
                          <Star className="h-4 w-4 mr-1 fill-current" />
                          Following
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Follow
                        </>
                      )}
                    </Button>
                  </div>
                ))}
                {filteredPlayers.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <p className="text-sm">No players found matching your search</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
