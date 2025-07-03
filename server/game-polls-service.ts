import { espnScoresAPI } from './live-scores-api';
import { storage } from './storage';
import type { InsertGamePoll, GamePoll } from '../shared/schema';

export class GamePollsService {
  
  async createDailyGamePolls(): Promise<GamePoll[]> {
    try {
      console.log('Creating daily game polls from ESPN games...');
      
      // Get today's and tomorrow's games from ESPN
      const liveGames = await espnScoresAPI.getLiveGames();
      
      if (liveGames.length === 0) {
        console.log('No games found for poll creation');
        return [];
      }

      const gamePolls: GamePoll[] = [];
      
      // Create polls for upcoming and live games only
      const eligibleGames = liveGames.filter(game => 
        game.status === 'upcoming' || game.status === 'live'
      );

      console.log(`Creating polls for ${eligibleGames.length} eligible games`);

      for (const game of eligibleGames.slice(0, 10)) { // Limit to 10 polls
        // Check if poll already exists for this game
        const existingPolls = await storage.getActiveGamePolls();
        const existingPoll = existingPolls.find(poll => 
          poll.homeTeam === game.homeTeam && 
          poll.awayTeam === game.awayTeam &&
          poll.sport === game.sport
        );

        if (existingPoll) {
          console.log(`Poll already exists for ${game.homeTeam} vs ${game.awayTeam}`);
          gamePolls.push(existingPoll);
          continue;
        }

        // Create expiration time (game start time + 3 hours, or now + 24 hours for live games)
        const expiresAt = new Date();
        if (game.status === 'upcoming' && game.startTime) {
          const gameStart = new Date(game.startTime);
          expiresAt.setTime(gameStart.getTime() + (3 * 60 * 60 * 1000)); // 3 hours after game start
        } else {
          expiresAt.setTime(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours from now
        }

        const gamePollData: InsertGamePoll = {
          gameId: game.id,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          sport: game.sport,
          league: game.league,
          gameDate: game.startTime ? new Date(game.startTime) : new Date(),
          status: game.status,
          homeScore: game.homeScore || null,
          awayScore: game.awayScore || null,
          winner: null, // TBD until game is final
          isActive: true,
          expiresAt
        };

        const createdPoll = await storage.createGamePoll(gamePollData);
        gamePolls.push(createdPoll);
        
        console.log(`Created poll for ${game.homeTeam} vs ${game.awayTeam} (${game.sport})`);
      }

      console.log(`Successfully created ${gamePolls.length} game polls`);
      return gamePolls;
      
    } catch (error) {
      console.error('Error creating daily game polls:', error);
      return [];
    }
  }

  async updateGamePollResults(): Promise<void> {
    try {
      console.log('Updating game poll results with latest scores...');
      
      const activePolls = await storage.getActiveGamePolls();
      const liveGames = await espnScoresAPI.getLiveGames();
      
      for (const poll of activePolls) {
        // Find corresponding ESPN game
        const espnGame = liveGames.find(game => 
          game.homeTeam === poll.homeTeam && 
          game.awayTeam === poll.awayTeam &&
          game.sport === poll.sport
        );

        if (!espnGame) continue;

        // Update poll with latest game info
        const updates: Partial<InsertGamePoll> = {
          status: espnGame.status,
          homeScore: espnGame.homeScore,
          awayScore: espnGame.awayScore
        };

        // If game is final, determine winner and award points
        if (espnGame.status === 'final') {
          if (espnGame.homeScore > espnGame.awayScore) {
            updates.winner = 'home';
          } else if (espnGame.awayScore > espnGame.homeScore) {
            updates.winner = 'away';
          }
          
          updates.isActive = false; // Deactivate poll

          // Award points to correct predictions
          await this.awardPointsForCorrectPredictions(poll.id, updates.winner);
        }

        await storage.updateGamePoll(poll.id, updates);
        console.log(`Updated poll for ${poll.homeTeam} vs ${poll.awayTeam}: ${espnGame.status}`);
      }
      
    } catch (error) {
      console.error('Error updating game poll results:', error);
    }
  }

  private async awardPointsForCorrectPredictions(gamePollId: number, winner: string | undefined): Promise<void> {
    if (!winner) return; // Tie games don't award points
    
    try {
      // Get all predictions for this game poll
      const allPredictions = await storage.getUserPredictions(0); // Get all users' predictions
      const gamePredictions = allPredictions.filter(p => p.gamePollId === gamePollId);
      
      console.log(`Awarding points for ${gamePredictions.length} predictions on game poll ${gamePollId}`);
      
      for (const prediction of gamePredictions) {
        const isCorrect = prediction.predictedWinner === winner;
        const pointsEarned = isCorrect ? 100 : 0;
        
        // Update prediction with result
        // Note: This would require a new method in storage to update predictions
        
        // Award points to user if prediction was correct
        if (isCorrect && prediction.userId) {
          await storage.updateUserPoints(prediction.userId, pointsEarned);
          console.log(`Awarded ${pointsEarned} coins to user ${prediction.userId} for correct prediction`);
        }
      }
      
    } catch (error) {
      console.error('Error awarding points for predictions:', error);
    }
  }

  async getTodaysGamePolls(): Promise<GamePoll[]> {
    try {
      const activePolls = await storage.getActiveGamePolls();
      
      // Filter for today's games
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      return activePolls.filter(poll => {
        const gameDate = new Date(poll.gameDate);
        return gameDate >= today && gameDate < tomorrow;
      });
      
    } catch (error) {
      console.error('Error getting today\'s game polls:', error);
      return [];
    }
  }
}

export const gamePollsService = new GamePollsService();