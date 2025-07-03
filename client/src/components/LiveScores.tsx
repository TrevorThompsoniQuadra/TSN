import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface LiveGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: string;
  awayScore: string;
  quarter: string;
  timeRemaining: string;
  broadcasts: Array<{ name: string }>;
  // Baseball-specific fields
  pitchCount?: {
    balls: number;
    strikes: number;
  };
  outs?: number;
  inningState?: 'top' | 'bottom' | 'middle';
  baseRunners?: {
    first?: boolean;
    second?: boolean;
    third?: boolean;
  };
  situation?: string;
}

// Type definitions for ESPN API response
interface ESPNTeam {
  displayName: string;
}

interface ESPNCompetitor {
  homeAway: 'home' | 'away';
  team: ESPNTeam;
  score: string;
}

interface ESPNBroadcast {
  name: string;
}

interface ESPNSituation {
  shortDownDistanceText?: string;
  possessionText?: string;
  isRedZone?: boolean;
  downDistanceText?: string;
  // Baseball specific
  balls?: number;
  strikes?: number;
  outs?: number;
  onFirst?: boolean;
  onSecond?: boolean;
  onThird?: boolean;
}

interface ESPNCompetition {
  competitors: ESPNCompetitor[];
  broadcasts?: ESPNBroadcast[];
  situation?: ESPNSituation;
}

interface ESPNStatus {
  type: {
    name: string;
  };
  period?: number;
  displayClock?: string;
}

interface ESPNEvent {
  id: string;
  status: ESPNStatus;
  competitions: ESPNCompetition[];
}

interface ESPNResponse {
  events?: ESPNEvent[];
}

const ESPN_ENDPOINTS = {
  nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
  nhl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/scoreboard',
  ncaaf: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard',
  ncaam: 'https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard'
};

export function LiveScores() {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);

  const fetchLiveGames = async () => {
    setIsLoading(true);
    const allLiveGames: LiveGame[] = [];

    try {
      // Fetch from all ESPN endpoints
      const promises = Object.entries(ESPN_ENDPOINTS).map(async ([sport, endpoint]): Promise<LiveGame[]> => {
        try {
          const response = await fetch(endpoint);
          if (!response.ok) throw new Error(`Failed to fetch ${sport}`);
          
          const data: ESPNResponse = await response.json();
          
          // Filter only live games (STATUS_IN_PROGRESS)
          const liveGames = data.events?.filter((event: ESPNEvent) => 
            event.status.type.name === 'STATUS_IN_PROGRESS'
          ).map((event: ESPNEvent) => {
            const competition = event.competitions[0];
            if (!competition) {
              return null;
            }

            const homeTeam = competition.competitors.find((team: ESPNCompetitor) => team.homeAway === 'home');
            const awayTeam = competition.competitors.find((team: ESPNCompetitor) => team.homeAway === 'away');
            
            // Get period info
            let quarter = '';
            let inningState: 'top' | 'bottom' | 'middle' | undefined;
            
            if (event.status.period) {
              if (sport === 'nba' || sport === 'ncaam') {
                quarter = `Q${event.status.period}`;
              } else if (sport === 'nfl' || sport === 'ncaaf') {
                quarter = `Q${event.status.period}`;
              } else if (sport === 'nhl') {
                quarter = `P${event.status.period}`;
              } else if (sport === 'mlb') {
                // For baseball, determine if it's top or bottom of inning
                const clock = event.status.displayClock || '';
                if (clock.includes('Top')) {
                  quarter = `T${event.status.period}`;
                  inningState = 'top';
                } else if (clock.includes('Bot')) {
                  quarter = `B${event.status.period}`;
                  inningState = 'bottom';
                } else {
                  quarter = `${event.status.period}`;
                  inningState = 'middle';
                }
              }
            }

            // Extract baseball-specific information
            let pitchCount: { balls: number; strikes: number } | undefined;
            let outs: number | undefined;
            let baseRunners: { first?: boolean; second?: boolean; third?: boolean } | undefined;
            let situation: string | undefined;

            if (sport === 'mlb' && competition.situation) {
              const sit = competition.situation;
              
              // Pitch count
              if (typeof sit.balls === 'number' && typeof sit.strikes === 'number') {
                pitchCount = {
                  balls: sit.balls,
                  strikes: sit.strikes
                };
              }
              
              // Outs
              if (typeof sit.outs === 'number') {
                outs = sit.outs;
              }
              
              // Base runners
              if (sit.onFirst || sit.onSecond || sit.onThird) {
                baseRunners = {
                  first: sit.onFirst,
                  second: sit.onSecond,
                  third: sit.onThird
                };
              }

              // Additional situation context
              if (sit.shortDownDistanceText || sit.possessionText) {
                situation = sit.shortDownDistanceText || sit.possessionText;
              }
            }

            const game: LiveGame = {
              id: event.id,
              sport: sport.toUpperCase(),
              homeTeam: homeTeam?.team?.displayName || 'Unknown',
              awayTeam: awayTeam?.team?.displayName || 'Unknown',
              homeScore: homeTeam?.score || '0',
              awayScore: awayTeam?.score || '0',
              quarter: quarter,
              timeRemaining: event.status.displayClock || '',
              broadcasts: competition.broadcasts || [],
              pitchCount,
              outs,
              inningState,
              baseRunners,
              situation
            };

            return game;
          }).filter((game): game is LiveGame => game !== null) || [];
          
          return liveGames;
        } catch (error) {
          console.error(`Error fetching ${sport}:`, error);
          return [];
        }
      });

      const results = await Promise.all(promises);
      const flattenedGames = results.flat();
      
      allLiveGames.push(...flattenedGames);
      
    } catch (error) {
      console.error('Error fetching live games:', error);
    }

    setGames(allLiveGames);
    setIsLoading(false);
  };

  // Helper function to safely get team abbreviation
  const getTeamAbbreviation = (teamName: string): string => {
    const parts = teamName.split(' ');
    const lastPart = parts[parts.length - 1];
    return lastPart ? lastPart.slice(0, 3).toUpperCase() : 'TBD';
  };

  // Baseball-specific UI components
  const renderBaseballDetails = (game: LiveGame) => {
    if (game.sport !== 'MLB') return null;

    return (
      <div className="mt-2 p-2 bg-green-50 rounded-md border border-green-200">
        <div className="flex items-center justify-between text-xs">
          {/* Pitch Count */}
          {game.pitchCount && (
            <div className="flex items-center space-x-2">
              <span className="font-medium text-green-800">Count:</span>
              <div className="flex items-center space-x-1">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded font-mono">
                  {game.pitchCount.balls}-{game.pitchCount.strikes}
                </span>
                <span className="text-gray-600 text-xs">B-S</span>
              </div>
            </div>
          )}

          {/* Outs */}
          {typeof game.outs === 'number' && (
            <div className="flex items-center space-x-1">
              <span className="font-medium text-green-800">Outs:</span>
              <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-mono">
                {game.outs}
              </span>
            </div>
          )}
        </div>

        {/* Base Runners */}
        {game.baseRunners && (
          <div className="mt-2 flex items-center justify-center">
            <div className="relative">
              {/* Baseball diamond visualization */}
              <div className="w-16 h-16 relative">
                {/* Second Base */}
                <div 
                  className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-3 h-3 rotate-45 border-2 ${
                    game.baseRunners.second ? 'bg-orange-400 border-orange-600' : 'bg-gray-200 border-gray-400'
                  }`}
                  title="Second Base"
                />
                
                {/* Third Base */}
                <div 
                  className={`absolute left-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rotate-45 border-2 ${
                    game.baseRunners.third ? 'bg-orange-400 border-orange-600' : 'bg-gray-200 border-gray-400'
                  }`}
                  title="Third Base"
                />
                
                {/* First Base */}
                <div 
                  className={`absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 rotate-45 border-2 ${
                    game.baseRunners.first ? 'bg-orange-400 border-orange-600' : 'bg-gray-200 border-gray-400'
                  }`}
                  title="First Base"
                />
                
                {/* Home Plate */}
                <div 
                  className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border-2 border-gray-600"
                  style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }}
                  title="Home Plate"
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional situation */}
        {game.situation && (
          <div className="mt-1 text-xs text-green-700 text-center">
            {game.situation}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchLiveGames();
    
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchLiveGames, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getTeamColor = (team: string) => {
    const colors = {
      'Lakers': 'bg-purple-600',
      'Celtics': 'bg-green-600', 
      'Warriors': 'bg-yellow-500',
      'Mavericks': 'bg-blue-600',
      'Heat': 'bg-red-600',
      'Suns': 'bg-orange-600',
      'Chiefs': 'bg-red-600',
      'Patriots': 'bg-blue-700',
      'Cowboys': 'bg-blue-800',
      'Packers': 'bg-green-700',
      'Yankees': 'bg-gray-700',
      'Dodgers': 'bg-blue-600',
      'Red Sox': 'bg-red-700',
    };
    return colors[team as keyof typeof colors] || 'bg-gray-600';
  };

  const getSportColor = (sport: string) => {
    const colors = {
      'Basketball': 'bg-orange-500',
      'Football': 'bg-brown-600',
      'Baseball': 'bg-green-600',
      'Hockey': 'bg-blue-600',
      'Soccer': 'bg-black',
    };
    return colors[sport as keyof typeof colors] || 'bg-gray-500';
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
          {games.length > 0 && (
            <Badge className="bg-red-600 text-white animate-pulse">
              {games.length} LIVE
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {games && games.length > 0 ? (
          <div className="space-y-4">
            {(showAll ? games : games.slice(0, 3)).map((game) => (
              <div key={game.id} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-1">
                  <Badge className="bg-blue-600 text-white text-xs">
                    {game.sport}
                  </Badge>
                  <Badge className="bg-red-600 text-white text-xs animate-pulse">
                    LIVE
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {getTeamAbbreviation(game.awayTeam)}
                    </div>
                    <span className="font-medium text-gray-900">{game.awayTeam}</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-gray-900">{game.awayScore}</span>
                </div>
                
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                      {getTeamAbbreviation(game.homeTeam)}
                    </div>
                    <span className="font-medium text-gray-900">{game.homeTeam}</span>
                  </div>
                  <span className="font-mono font-bold text-lg text-gray-900">{game.homeScore}</span>
                </div>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    {game.quarter} {game.timeRemaining}
                  </span>
                  {game.broadcasts && game.broadcasts.length > 0 && (
                    <span className="text-xs text-gray-500">
                      📺 {game.broadcasts.map(b => b.name).join(', ')}
                    </span>
                  )}
                </div>

                {/* Baseball-specific details */}
                {renderBaseballDetails(game)}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No live games at the moment</p>
            <p className="text-sm">Check back later for live scores</p>
          </div>
        )}
        <div className="flex gap-2 mt-4">
          <Button 
            variant="ghost" 
            className="flex-1 text-blue-600" 
            onClick={fetchLiveGames}
          >
            Refresh Live Scores
          </Button>
          {games.length > 3 && (
            <Button 
              variant="outline" 
              className="text-blue-600 border-blue-600" 
              onClick={() => setShowAll(!showAll)}
            >
              {showAll ? 'Show Less' : `Show All (${games.length})`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
