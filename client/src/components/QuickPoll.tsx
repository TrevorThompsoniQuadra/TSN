import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, Coins } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface GamePoll {
  id: number;
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league: string;
  gameDate: string;
  status: 'upcoming' | 'live' | 'final';
  homeScore?: number;
  awayScore?: number;
  winner?: string;
  isActive: boolean;
  expiresAt: string;
}

interface GamePrediction {
  id: number;
  userId: number;
  gamePollId: number;
  predictedWinner: 'home' | 'away';
  isCorrect?: boolean;
  pointsEarned: number;
}

interface UserPoints {
  points: number;
}

export function QuickPoll() {
  const [selectedPredictions, setSelectedPredictions] = useState<Record<number, 'home' | 'away'>>({});
  const queryClient = useQueryClient();
  
  // Mock user ID for now - in real app this would come from auth
  const userId = 1;

  const { data: gamePolls, isLoading: pollsLoading } = useQuery<GamePoll[]>({
    queryKey: ['/api/game-polls'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const { data: userPoints } = useQuery<UserPoints>({
    queryKey: ['/api/users', userId, 'points'],
    refetchInterval: 30 * 1000, // Refresh every 30 seconds
  });

  const { data: userPredictions } = useQuery<GamePrediction[]>({
    queryKey: ['/api/users', userId, 'predictions'],
    refetchInterval: 60 * 1000, // Refresh every minute
  });

  const makePredictionMutation = useMutation({
    mutationFn: async ({ pollId, predictedWinner }: { pollId: number, predictedWinner: 'home' | 'away' }) => {
      const response = await fetch(`/api/game-polls/${pollId}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, predictedWinner })
      });
      if (!response.ok) throw new Error('Failed to make prediction');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'predictions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'points'] });
    }
  });

  // Create daily polls on component mount
  useEffect(() => {
    const createDailyPolls = async () => {
      try {
        const response = await fetch('/api/game-polls/create-daily', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        if (response.ok) {
          queryClient.invalidateQueries({ queryKey: ['/api/game-polls'] });
        }
      } catch (error) {
        console.log('Daily polls already created or error creating them');
      }
    };
    createDailyPolls();
  }, [queryClient]);

  const handlePrediction = async (pollId: number, winner: 'home' | 'away') => {
    console.log('🎯 Making prediction:', pollId, winner);
    setSelectedPredictions(prev => ({ ...prev, [pollId]: winner }));
    
    try {
      await makePredictionMutation.mutateAsync({ pollId, predictedWinner: winner });
      console.log('✅ Prediction successful!');
    } catch (error) {
      console.error('❌ Prediction failed:', error);
      // Remove the selection if it failed
      setSelectedPredictions(prev => {
        const newState = { ...prev };
        delete newState[pollId];
        return newState;
      });
    }
  };

  const hasUserPredicted = (pollId: number) => {
    return userPredictions?.some(p => p.gamePollId === pollId) || false;
  };

  const getUserPrediction = (pollId: number) => {
    return userPredictions?.find(p => p.gamePollId === pollId);
  };

  const getTimeUntilGame = (gameDate: string) => {
    const now = new Date();
    const game = new Date(gameDate);
    const diff = game.getTime() - now.getTime();
    
    if (diff <= 0) return "Started";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <span>Game Predictions</span>
          </div>
          {userPoints && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 border-yellow-300">
              <Coins className="h-3 w-3 text-yellow-600" />
              {userPoints.points} coins
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pollsLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            ))}
          </div>
        ) : gamePolls && gamePolls.length > 0 ? (
          <div className="space-y-4">
            {gamePolls.slice(0, 5).map((poll) => {
              const userPrediction = getUserPrediction(poll.id);
              const hasPredicted = hasUserPredicted(poll.id);
              const timeUntil = getTimeUntilGame(poll.gameDate);
              
              return (
                <div key={poll.id} className="border border-gray-200 rounded-lg p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-900">
                        {poll.awayTeam} @ {poll.homeTeam}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {poll.league}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          {timeUntil}
                        </div>
                      </div>
                    </div>
                    {poll.status === 'final' && poll.winner && (
                      <Badge 
                        variant={userPrediction?.isCorrect ? "default" : "secondary"}
                        className={userPrediction?.isCorrect ? "bg-green-500" : ""}
                      >
                        {userPrediction?.isCorrect ? "✓ Correct" : "Incorrect"}
                      </Badge>
                    )}
                  </div>

                  {poll.status === 'final' && poll.homeScore !== null && poll.awayScore !== null ? (
                    <div className="text-sm text-gray-600 bg-gray-50 rounded p-2">
                      Final Score: {poll.awayTeam} {poll.awayScore} - {poll.homeScore} {poll.homeTeam}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant={userPrediction?.predictedWinner === 'away' ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handlePrediction(poll.id, 'away')}
                        disabled={hasPredicted || poll.status === 'final' || makePredictionMutation.isPending}
                      >
                        {poll.awayTeam}
                      </Button>
                      <Button
                        variant={userPrediction?.predictedWinner === 'home' ? "default" : "outline"}
                        size="sm"
                        className="text-xs"
                        onClick={() => handlePrediction(poll.id, 'home')}
                        disabled={hasPredicted || poll.status === 'final' || makePredictionMutation.isPending}
                      >
                        {poll.homeTeam}
                      </Button>
                    </div>
                  )}
                  
                  {hasPredicted && poll.status !== 'final' && (
                    <div className="text-xs text-green-600 bg-green-50 rounded p-2">
                      ✓ Prediction submitted for {userPrediction?.predictedWinner === 'home' ? poll.homeTeam : poll.awayTeam}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No games available for predictions today</p>
            <p className="text-xs text-gray-400 mt-1">Check back tomorrow for new games!</p>
          </div>
        )}
        
        {gamePolls && gamePolls.length > 5 && (
          <div className="text-center mt-4">
            <Button variant="ghost" size="sm" className="text-xs">
              View all {gamePolls.length} games →
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
