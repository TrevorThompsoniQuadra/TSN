import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RefreshCw } from "lucide-react";

interface LiveGameScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'upcoming' | 'final';
  quarter?: string;
  timeRemaining?: string;
  sport: string;
  league: string;
  startTime?: string;
  venue?: string;
}

export default function Scores() {
  const { data: allScores, isLoading, refetch } = useQuery<LiveGameScore[]>({
    queryKey: ['/api/games/live'],
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  // Prioritize live games, then upcoming, then final
  const liveScores = allScores?.sort((a, b) => {
    if (a.status === 'live' && b.status !== 'live') return -1;
    if (b.status === 'live' && a.status !== 'live') return 1;
    if (a.status === 'upcoming' && b.status === 'final') return -1;
    if (b.status === 'upcoming' && a.status === 'final') return 1;
    return 0;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'bg-red-500 text-white animate-pulse';
      case 'final': return 'bg-gray-500 text-white';
      case 'upcoming': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'live': return 'LIVE';
      case 'final': return 'FINAL';
      case 'upcoming': return 'UPCOMING';
      default: return status.toUpperCase();
    }
  };

  const formatTime = (startTime?: string) => {
    if (!startTime) return '';
    const date = new Date(startTime);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      timeZoneName: 'short'
    });
  };

  if (isLoading) {
    return (
      <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Live Scores</h1>
          <p className="text-gray-600 mt-2">Real-time sports scores and game updates</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-12" />
                  <Skeleton className="h-5 w-16" />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-6 w-8" />
                </div>
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Scores</h1>
          <p className="text-gray-600 mt-2">Real-time sports scores and game updates</p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {liveScores && liveScores.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {liveScores.map((game) => (
            <Card key={game.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {game.league}
                  </Badge>
                  <Badge className={`text-xs ${getStatusColor(game.status)}`}>
                    {getStatusText(game.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* Away Team */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{game.awayTeam}</span>
                  <span className="font-bold text-xl text-gray-900">{game.awayScore}</span>
                </div>
                
                {/* Home Team */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">{game.homeTeam}</span>
                  <span className="font-bold text-xl text-gray-900">{game.homeScore}</span>
                </div>
                
                {/* Game Info */}
                <div className="pt-2 border-t border-gray-100 space-y-1">
                  {game.status === 'live' && game.quarter && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{game.quarter}</span>
                      {game.timeRemaining && (
                        <span className="text-red-600 font-medium">{game.timeRemaining}</span>
                      )}
                    </div>
                  )}
                  
                  {game.status === 'upcoming' && game.startTime && (
                    <div className="text-sm text-gray-500">
                      {formatTime(game.startTime)}
                    </div>
                  )}
                  
                  {game.venue && (
                    <div className="text-xs text-gray-400 truncate">
                      {game.venue}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No games available</h3>
            <p className="text-gray-500 mb-4">
              There are no live or upcoming games at the moment
            </p>
            <Button variant="outline" onClick={() => refetch()}>
              Check for updates
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}