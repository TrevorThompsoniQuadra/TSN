import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game } from "@shared/schema";

export function LiveScores() {
  const { data: games, isLoading } = useQuery<Game[]>({
    queryKey: ['/api/games/live'],
  });

  const getTeamColor = (team: string) => {
    const colors = {
      'Lakers': 'bg-purple-600',
      'Celtics': 'bg-green-600', 
      'Warriors': 'bg-yellow-500',
      'Mavericks': 'bg-blue-600',
      'Heat': 'bg-red-600',
      'Suns': 'bg-orange-600',
    };
    return colors[team as keyof typeof colors] || 'bg-gray-600';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Live Scores
            <Skeleton className="h-6 w-12" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Live Scores
          <Badge className="bg-red-600 text-white animate-pulse">LIVE</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {games && games.length > 0 ? (
          <div className="space-y-4">
            {games.map((game) => (
              <div key={game.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${getTeamColor(game.awayTeam)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                      {game.awayTeam.slice(0, 3).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{game.awayTeam}</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-gray-900">{game.awayScore}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 ${getTeamColor(game.homeTeam)} rounded-full flex items-center justify-center text-white text-xs font-bold`}>
                      {game.homeTeam.slice(0, 3).toUpperCase()}
                    </div>
                    <span className="font-medium text-gray-900">{game.homeTeam}</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-gray-900">{game.homeScore}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {game.quarter} {game.timeRemaining}
                  </span>
                  <Button variant="ghost" size="sm" className="text-tsn-blue text-xs">
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No live games at the moment</p>
            <p className="text-sm">Check back later for live scores</p>
          </div>
        )}
        
        <Button variant="ghost" className="w-full mt-4 text-tsn-blue">
          View All Scores
        </Button>
      </CardContent>
    </Card>
  );
}
