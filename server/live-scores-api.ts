export interface LiveGameScore {
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

export interface TeamInfo {
  name: string;
  shortName: string;
  logo?: string;
}



/**
 * ESPN API integration using undocumented JSON endpoints
 * More reliable than RSS feeds or external APIs
 */
export class ESPNScoresAPI {
  private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';

  constructor() {
    // No API key needed for ESPN's public endpoints
  }

  async getLiveGames(sportFilter?: string): Promise<LiveGameScore[]> {
    try {
      console.log('Fetching upcoming and live games from ESPN API...');
      
      // Get today's date and tomorrow's date for upcoming games
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayStr = today.toISOString().split('T')[0].replace(/-/g, '');
      const tomorrowStr = tomorrow.toISOString().split('T')[0].replace(/-/g, '');
      
      // Get games from multiple sports with date parameters
      let sports = [
        { sport: 'football', league: 'nfl' },
        { sport: 'basketball', league: 'nba' },
        { sport: 'baseball', league: 'mlb' },
        { sport: 'basketball', league: 'mens-college-basketball' }
      ];

      // Filter sports if specific sport requested
      if (sportFilter) {
        sports = this.filterSportsByType(sports, sportFilter);
      }
      
      const allGames: LiveGameScore[] = [];

      for (const { sport, league } of sports) {
        try {
          // Try today's games first
          const todayUrl = `${this.baseUrl}/${sport}/${league}/scoreboard?dates=${todayStr}`;
          const tomorrowUrl = `${this.baseUrl}/${sport}/${league}/scoreboard?dates=${tomorrowStr}`;
          
          console.log(`Fetching ${sport}/${league} games for today and tomorrow...`);
          
          for (const url of [todayUrl, tomorrowUrl]) {
            const response = await fetch(url);
            if (!response.ok) {
              console.log(`ESPN API error for ${url}: ${response.status}`);
              continue;
            }
            
            const data = await response.json();
            if (data && data.events && data.events.length > 0) {
              console.log(`Found ${data.events.length} events for ${sport}/${league}`);
              const games = this.parseESPNResponse(data, sport, league);
              allGames.push(...games);
            }
          }
        } catch (error) {
          console.log(`Error fetching ${sport}/${league}:`, error);
        }
      }

      console.log(`Total games found: ${allGames.length}`);
      
      if (allGames.length > 0) {
        // Prioritize live games first, then upcoming, then final
        const sortedGames = allGames.sort((a, b) => {
          if (a.status === 'live' && b.status !== 'live') return -1;
          if (b.status === 'live' && a.status !== 'live') return 1;
          if (a.status === 'upcoming' && b.status === 'final') return -1;
          if (b.status === 'upcoming' && a.status === 'final') return 1;
          return 0;
        });
        
        return sortedGames.slice(0, 10); // Limit to 10 games for UI
      }

      throw new Error('No games found from ESPN API');
    } catch (error) {
      console.log('ESPN API error:', error);
      console.log('Using fallback message instead of mock games...');
      return this.getNoGamesMessage();
    }
  }

  private parseESPNResponse(data: any, sport: string, league: string): LiveGameScore[] {
    const games: LiveGameScore[] = [];
    
    try {
      const events = data?.events || [];
      
      events.forEach((event: any) => {
        const competition = event.competitions?.[0];
        if (!competition) return;

        const homeTeam = competition.competitors?.find((c: any) => c.homeAway === 'home');
        const awayTeam = competition.competitors?.find((c: any) => c.homeAway === 'away');
        
        if (!homeTeam || !awayTeam) return;

        // Map ESPN status to our status
        const espnStatus = competition.status?.type?.name || '';
        const espnState = competition.status?.type?.state || '';
        const espnDescription = competition.status?.type?.description || '';
        

        
        let gameStatus: 'live' | 'upcoming' | 'final' = 'upcoming';
        
        // More comprehensive status checking - including common ESPN status variations
        if (espnStatus.includes('STATUS_IN_PROGRESS') || 
            espnStatus.includes('STATUS_HALFTIME') ||
            espnStatus === 'STATUS_IN_PROGRESS' ||
            espnState === 'in' ||
            espnDescription?.toLowerCase().includes('in progress') ||
            espnDescription?.toLowerCase().includes('live')) {
          gameStatus = 'live';
        } else if (espnStatus.includes('STATUS_FINAL') || 
                   espnStatus === 'STATUS_FINAL' ||
                   espnState === 'post' ||
                   competition.status?.type?.completed === true) {
          gameStatus = 'final';
        }

        const game: LiveGameScore = {
          id: event.id?.toString() || Math.random().toString(),
          homeTeam: homeTeam.team?.displayName || homeTeam.team?.name || 'Home Team',
          awayTeam: awayTeam.team?.displayName || awayTeam.team?.name || 'Away Team',
          homeScore: parseInt(homeTeam.score) || 0,
          awayScore: parseInt(awayTeam.score) || 0,
          status: gameStatus,
          quarter: competition.status?.period ? `Q${competition.status.period}` : '',
          timeRemaining: competition.status?.displayClock || '',
          sport: this.mapESPNSportToDisplayName(sport),
          league: league.toUpperCase(),
          startTime: event.date,
          venue: competition.venue?.fullName
        };
        
        games.push(game);
      });

    } catch (error) {
      console.error('Error parsing ESPN response:', error);
    }

    return games;
  }

  private mapESPNSportToDisplayName(sport: string): string {
    switch (sport.toLowerCase()) {
      case 'football': return 'Football';
      case 'basketball': return 'Basketball';
      case 'baseball': return 'Baseball';
      case 'hockey': return 'Hockey';
      case 'soccer': return 'Soccer';
      default: return 'Sports';
    }
  }

  private getNoGamesMessage(): LiveGameScore[] {
    return [];
  }

  private filterSportsByType(sports: { sport: string; league: string }[], sportFilter: string): { sport: string; league: string }[] {
    const sportLower = sportFilter.toLowerCase();
    
    // Map navigation names to ESPN sport/league combinations
    const sportMappings: { [key: string]: { sport: string; league: string }[] } = {
      'nba': [{ sport: 'basketball', league: 'nba' }],
      'nfl': [{ sport: 'football', league: 'nfl' }],
      'mlb': [{ sport: 'baseball', league: 'mlb' }],
      'ncaam': [{ sport: 'basketball', league: 'mens-college-basketball' }],
      'cfb': [{ sport: 'football', league: 'college-football' }],
      'pga': [{ sport: 'golf', league: 'pga' }],
      'liv': [{ sport: 'golf', league: 'liv' }],
    };

    return sportMappings[sportLower] || sports.filter(s => 
      s.sport.toLowerCase().includes(sportLower) || 
      s.league.toLowerCase().includes(sportLower)
    );
  }
}

// Export service instance
export const espnScoresAPI = new ESPNScoresAPI();