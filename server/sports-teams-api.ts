interface Team {
    name: string;
    league: string;
    city: string;
    conference?: string;
    abbreviation?: string;
    logo?: string;
  }
  
  interface Player {
    name: string;
    team: string;
    position: string;
    league: string;
    jersey?: string;
    height?: string;
    weight?: string;
  }
  
  export class SportsTeamsAPI {
    private baseUrl = 'https://site.api.espn.com/apis/site/v2/sports';
  
    constructor() {}
  
    async getAllTeams(): Promise<Team[]> {
      const allTeams: Team[] = [];
  
      try {
        // Fetch NBA teams
        const nbaTeams = await this.getNBATeams();
        allTeams.push(...nbaTeams);
  
        // Fetch NFL teams
        const nflTeams = await this.getNFLTeams();
        allTeams.push(...nflTeams);
  
        // Fetch MLB teams
        const mlbTeams = await this.getMLBTeams();
        allTeams.push(...mlbTeams);
  
        // Fetch College Basketball teams (top programs)
        const ncaamTeams = await this.getNCAAMTeams();
        allTeams.push(...ncaamTeams);
  
        // Fetch College Football teams (top programs)
        const cfbTeams = await this.getCFBTeams();
        allTeams.push(...cfbTeams);
  
        console.log(`📊 SPORTS API: Successfully fetched ${allTeams.length} teams from all leagues`);
        return allTeams;
      } catch (error) {
        console.error('Error fetching teams from ESPN API:', error);
        return this.getFallbackTeams();
      }
    }
  
    async getAllPlayers(): Promise<Player[]> {
      const allPlayers: Player[] = [];
  
      try {
        // Fetch NBA players (top stars)
        const nbaPlayers = await this.getNBAPlayers();
        allPlayers.push(...nbaPlayers);
  
        // Fetch NFL players (top stars)
        const nflPlayers = await this.getNFLPlayers();
        allPlayers.push(...nflPlayers);
  
        // Fetch MLB players (top stars)
        const mlbPlayers = await this.getMLBPlayers();
        allPlayers.push(...mlbPlayers);
  
        // Add Golf players (PGA/LIV)
        const golfPlayers = await this.getGolfPlayers();
        allPlayers.push(...golfPlayers);
  
        console.log(`🏆 SPORTS API: Successfully fetched ${allPlayers.length} players from all leagues`);
        return allPlayers;
      } catch (error) {
        console.error('Error fetching players from ESPN API:', error);
        return this.getFallbackPlayers();
      }
    }
  
    private async getNBATeams(): Promise<Team[]> {
      try {
        const response = await fetch(`${this.baseUrl}/basketball/nba/teams`);
        if (!response.ok) throw new Error(`NBA teams API returned ${response.status}`);
        
        const data = await response.json();
        const teams: Team[] = [];
  
        if (data.sports?.[0]?.leagues?.[0]?.teams) {
          for (const teamData of data.sports[0].leagues[0].teams) {
            const team = teamData.team;
            teams.push({
              name: team.displayName || team.name,
              league: 'NBA',
              city: team.location,
              conference: teamData.group?.name || 'Unknown',
              abbreviation: team.abbreviation,
              logo: team.logos?.[0]?.href
            });
          }
        }
  
        console.log(`🏀 NBA: Fetched ${teams.length} teams`);
        return teams;
      } catch (error) {
        console.error('Error fetching NBA teams:', error);
        return [];
      }
    }
  
    private async getNFLTeams(): Promise<Team[]> {
      try {
        const response = await fetch(`${this.baseUrl}/football/nfl/teams`);
        if (!response.ok) throw new Error(`NFL teams API returned ${response.status}`);
        
        const data = await response.json();
        const teams: Team[] = [];
  
        if (data.sports?.[0]?.leagues?.[0]?.teams) {
          for (const teamData of data.sports[0].leagues[0].teams) {
            const team = teamData.team;
            teams.push({
              name: team.displayName || team.name,
              league: 'NFL',
              city: team.location,
              conference: teamData.group?.name || 'Unknown',
              abbreviation: team.abbreviation,
              logo: team.logos?.[0]?.href
            });
          }
        }
  
        console.log(`🏈 NFL: Fetched ${teams.length} teams`);
        return teams;
      } catch (error) {
        console.error('Error fetching NFL teams:', error);
        return [];
      }
    }
  
    private async getMLBTeams(): Promise<Team[]> {
      try {
        const response = await fetch(`${this.baseUrl}/baseball/mlb/teams`);
        if (!response.ok) throw new Error(`MLB teams API returned ${response.status}`);
        
        const data = await response.json();
        const teams: Team[] = [];
  
        if (data.sports?.[0]?.leagues?.[0]?.teams) {
          for (const teamData of data.sports[0].leagues[0].teams) {
            const team = teamData.team;
            teams.push({
              name: team.displayName || team.name,
              league: 'MLB',
              city: team.location,
              conference: teamData.group?.name || 'Unknown',
              abbreviation: team.abbreviation,
              logo: team.logos?.[0]?.href
            });
          }
        }
  
        console.log(`⚾ MLB: Fetched ${teams.length} teams`);
        return teams;
      } catch (error) {
        console.error('Error fetching MLB teams:', error);
        return [];
      }
    }
  
    private async getNCAAMTeams(): Promise<Team[]> {
      try {
        // Get top 25 college basketball teams
        const response = await fetch(`${this.baseUrl}/basketball/mens-college-basketball/teams?limit=50`);
        if (!response.ok) throw new Error(`NCAAM teams API returned ${response.status}`);
        
        const data = await response.json();
        const teams: Team[] = [];
  
        if (data.sports?.[0]?.leagues?.[0]?.teams) {
          // Take first 30 teams (major programs)
          const topTeams = data.sports[0].leagues[0].teams.slice(0, 30);
          
          for (const teamData of topTeams) {
            const team = teamData.team;
            teams.push({
              name: team.displayName || team.name,
              league: 'NCAAM',
              city: team.location,
              conference: teamData.group?.name || 'Unknown',
              abbreviation: team.abbreviation,
              logo: team.logos?.[0]?.href
            });
          }
        }
  
        console.log(`🏀 NCAAM: Fetched ${teams.length} teams`);
        return teams;
      } catch (error) {
        console.error('Error fetching NCAAM teams:', error);
        return [];
      }
    }
  
    private async getCFBTeams(): Promise<Team[]> {
      try {
        // Get top college football teams
        const response = await fetch(`${this.baseUrl}/football/college-football/teams?limit=50`);
        if (!response.ok) throw new Error(`CFB teams API returned ${response.status}`);
        
        const data = await response.json();
        const teams: Team[] = [];
  
        if (data.sports?.[0]?.leagues?.[0]?.teams) {
          // Take first 40 teams (major programs)
          const topTeams = data.sports[0].leagues[0].teams.slice(0, 40);
          
          for (const teamData of topTeams) {
            const team = teamData.team;
            teams.push({
              name: team.displayName || team.name,
              league: 'CFB',
              city: team.location,
              conference: teamData.group?.name || 'Unknown',
              abbreviation: team.abbreviation,
              logo: team.logos?.[0]?.href
            });
          }
        }
  
        console.log(`🏈 CFB: Fetched ${teams.length} teams`);
        return teams;
      } catch (error) {
        console.error('Error fetching CFB teams:', error);
        return [];
      }
    }
  
    private async getNBAPlayers(): Promise<Player[]> {
      const players: Player[] = [];
      const topTeams = ['lakers', 'warriors', 'celtics', 'bulls', 'heat', 'nets', 'mavericks', 'bucks'];
  
      try {
        for (const teamName of topTeams.slice(0, 4)) { // Limit to avoid too many requests
          try {
            const response = await fetch(`${this.baseUrl}/basketball/nba/teams/${teamName}/roster`);
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (data.athletes) {
              for (const athlete of data.athletes.slice(0, 3)) { // Top 3 players per team
                if (athlete.displayName) {
                  players.push({
                    name: athlete.displayName,
                    team: data.team?.displayName || teamName,
                    position: athlete.position?.abbreviation || 'Unknown',
                    league: 'NBA',
                    jersey: athlete.jersey,
                    height: athlete.height,
                    weight: athlete.weight
                  });
                }
              }
            }
          } catch (error) {
            continue; // Skip this team if error
          }
        }
  
        console.log(`🏀 NBA: Fetched ${players.length} players`);
        return players;
      } catch (error) {
        console.error('Error fetching NBA players:', error);
        return [];
      }
    }
  
    private async getNFLPlayers(): Promise<Player[]> {
      const players: Player[] = [];
      const topTeams = ['cowboys', 'patriots', 'packers', 'chiefs', '49ers', 'bills'];
  
      try {
        for (const teamName of topTeams.slice(0, 4)) { // Limit to avoid too many requests
          try {
            const response = await fetch(`${this.baseUrl}/football/nfl/teams/${teamName}/roster`);
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (data.athletes) {
              for (const athlete of data.athletes.slice(0, 3)) { // Top 3 players per team
                if (athlete.displayName) {
                  players.push({
                    name: athlete.displayName,
                    team: data.team?.displayName || teamName,
                    position: athlete.position?.abbreviation || 'Unknown',
                    league: 'NFL',
                    jersey: athlete.jersey,
                    height: athlete.height,
                    weight: athlete.weight
                  });
                }
              }
            }
          } catch (error) {
            continue; // Skip this team if error
          }
        }
  
        console.log(`🏈 NFL: Fetched ${players.length} players`);
        return players;
      } catch (error) {
        console.error('Error fetching NFL players:', error);
        return [];
      }
    }
  
    private async getMLBPlayers(): Promise<Player[]> {
      const players: Player[] = [];
      const topTeams = ['yankees', 'dodgers', 'red-sox', 'giants', 'cubs', 'astros'];
  
      try {
        for (const teamName of topTeams.slice(0, 4)) { // Limit to avoid too many requests
          try {
            const response = await fetch(`${this.baseUrl}/baseball/mlb/teams/${teamName}/roster`);
            if (!response.ok) continue;
            
            const data = await response.json();
            
            if (data.athletes) {
              for (const athlete of data.athletes.slice(0, 3)) { // Top 3 players per team
                if (athlete.displayName) {
                  players.push({
                    name: athlete.displayName,
                    team: data.team?.displayName || teamName,
                    position: athlete.position?.abbreviation || 'Unknown',
                    league: 'MLB',
                    jersey: athlete.jersey,
                    height: athlete.height,
                    weight: athlete.weight
                  });
                }
              }
            }
          } catch (error) {
            continue; // Skip this team if error
          }
        }
  
        console.log(`⚾ MLB: Fetched ${players.length} players`);
        return players;
      } catch (error) {
        console.error('Error fetching MLB players:', error);
        return [];
      }
    }
  
    private async getGolfPlayers(): Promise<Player[]> {
      // Golf players from PGA and LIV tours (manual since APIs are limited)
      return [
        { name: "Tiger Woods", team: "PGA Tour", position: "Golfer", league: "PGA" },
        { name: "Rory McIlroy", team: "PGA Tour", position: "Golfer", league: "PGA" },
        { name: "Scottie Scheffler", team: "PGA Tour", position: "Golfer", league: "PGA" },
        { name: "Viktor Hovland", team: "PGA Tour", position: "Golfer", league: "PGA" },
        { name: "Jon Rahm", team: "LIV Golf", position: "Golfer", league: "LIV" },
        { name: "Brooks Koepka", team: "LIV Golf", position: "Golfer", league: "LIV" },
        { name: "Dustin Johnson", team: "LIV Golf", position: "Golfer", league: "LIV" },
        { name: "Phil Mickelson", team: "LIV Golf", position: "Golfer", league: "LIV" }
      ];
    }
  
    private getFallbackTeams(): Team[] {
      // Fallback data if APIs fail
      return [
        { name: "Lakers", league: "NBA", city: "Los Angeles", conference: "Western" },
        { name: "Warriors", league: "NBA", city: "Golden State", conference: "Western" },
        { name: "Celtics", league: "NBA", city: "Boston", conference: "Eastern" },
        { name: "Cowboys", league: "NFL", city: "Dallas", conference: "NFC" },
        { name: "Patriots", league: "NFL", city: "New England", conference: "AFC" },
        { name: "Chiefs", league: "NFL", city: "Kansas City", conference: "AFC" },
        { name: "Yankees", league: "MLB", city: "New York", conference: "AL" },
        { name: "Dodgers", league: "MLB", city: "Los Angeles", conference: "NL" },
        { name: "Red Sox", league: "MLB", city: "Boston", conference: "AL" },
        { name: "Duke Blue Devils", league: "NCAAM", city: "Durham", conference: "ACC" },
        { name: "Kentucky Wildcats", league: "NCAAM", city: "Lexington", conference: "SEC" },
        { name: "Alabama Crimson Tide", league: "CFB", city: "Tuscaloosa", conference: "SEC" },
        { name: "Georgia Bulldogs", league: "CFB", city: "Athens", conference: "SEC" }
      ];
    }
  
    private getFallbackPlayers(): Player[] {
      // Fallback data if APIs fail
      return [
        { name: "LeBron James", team: "Lakers", position: "SF", league: "NBA" },
        { name: "Stephen Curry", team: "Warriors", position: "PG", league: "NBA" },
        { name: "Patrick Mahomes", team: "Chiefs", position: "QB", league: "NFL" },
        { name: "Josh Allen", team: "Bills", position: "QB", league: "NFL" },
        { name: "Aaron Judge", team: "Yankees", position: "OF", league: "MLB" },
        { name: "Mookie Betts", team: "Dodgers", position: "OF", league: "MLB" },
        { name: "Tiger Woods", team: "PGA Tour", position: "Golfer", league: "PGA" },
        { name: "Jon Rahm", team: "LIV Golf", position: "Golfer", league: "LIV" }
      ];
    }
  }
  
  export const sportsTeamsAPI = new SportsTeamsAPI();