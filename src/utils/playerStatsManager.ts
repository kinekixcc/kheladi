import { playerStatsService, achievementService, profileService } from '../lib/database';
import { PlayerStats, PlayerAchievement, PlayerProfile } from '../types';

export class PlayerStatsManager {
  private static instance: PlayerStatsManager;
  
  static getInstance(): PlayerStatsManager {
    if (!PlayerStatsManager.instance) {
      PlayerStatsManager.instance = new PlayerStatsManager();
    }
    return PlayerStatsManager.instance;
  }

  // Get player statistics (now uses database)
  async getPlayerStats(playerId: string): Promise<{
    totalTournaments: number;
    totalMatches: number;
    matchesWon: number;
    hoursPlayed: number;
    overallRating: number;
    winRate: number;
  }> {
    try {
      return await playerStatsService.getAggregatedStats(playerId);
    } catch (error) {
      console.error('Error getting player stats:', error);
      return {
        totalTournaments: 0,
        totalMatches: 0,
        matchesWon: 0,
        hoursPlayed: 0,
        overallRating: 0,
        winRate: 0
      };
    }
  }

  // Add tournament result (now uses database)
  async addTournamentResult(playerId: string, tournamentId: string, tournamentName: string, sportType: string, result: {
    matchesPlayed: number;
    matchesWon: number;
    hoursPlayed: number;
    position?: number;
    performanceRating?: number;
  }): Promise<void> {
    try {
      const newStat = {
        player_id: playerId,
        tournament_id: tournamentId,
        tournament_name: tournamentName,
        sport_type: sportType,
        matches_played: result.matchesPlayed,
        matches_won: result.matchesWon,
        matches_lost: result.matchesPlayed - result.matchesWon,
        hours_played: result.hoursPlayed,
        performance_rating: result.performanceRating || 0
      };

      await playerStatsService.createPlayerStat(newStat);

      // Check for achievements
      await this.checkAndAwardAchievements(playerId, newStat, result.position);
    } catch (error) {
      console.error('Error adding tournament result:', error);
    }
  }

  // Check and award achievements (now uses database)
  private async checkAndAwardAchievements(playerId: string, stat: any, position?: number): Promise<void> {
    const achievements: any[] = [];

    // Tournament Winner
    if (position === 1) {
      achievements.push({
        player_id: playerId,
        type: 'tournament_winner',
        title: 'Tournament Champion',
        description: `Won ${stat.tournament_name}`,
        tournament_id: stat.tournament_id,
        tournament_name: stat.tournament_name,
        badge_color: 'gold'
      });
    }

    // Runner-up
    if (position === 2) {
      achievements.push({
        player_id: playerId,
        type: 'tournament_runner_up',
        title: 'Tournament Runner-up',
        description: `Finished 2nd in ${stat.tournament_name}`,
        tournament_id: stat.tournament_id,
        tournament_name: stat.tournament_name,
        badge_color: 'silver'
      });
    }

    // Perfect Record
    if (stat.matches_played > 0 && stat.matches_won === stat.matches_played && stat.matches_played >= 3) {
      achievements.push({
        player_id: playerId,
        type: 'fair_play',
        title: 'Perfect Record',
        description: `Won all ${stat.matches_played} matches in ${stat.tournament_name}`,
        tournament_id: stat.tournament_id,
        tournament_name: stat.tournament_name,
        badge_color: 'purple'
      });
    }

    // Save achievements to database
    for (const achievement of achievements) {
      try {
        await achievementService.createAchievement(achievement);
      } catch (error) {
        console.error('Error creating achievement:', error);
      }
    }
  }

  // Get player achievements (now uses database)
  async getPlayerAchievements(playerId: string): Promise<PlayerAchievement[]> {
    try {
      return await achievementService.getPlayerAchievements(playerId);
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  // Get player profile (now uses database)
  async getPlayerProfile(playerId: string): Promise<PlayerProfile | null> {
    try {
      return await profileService.getProfile(playerId);
    } catch (error) {
      console.error('Error getting player profile:', error);
      return null;
    }
  }

  // Update player profile (now uses database)
  async updatePlayerProfile(playerId: string, profileData: Partial<PlayerProfile>): Promise<void> {
    try {
      await profileService.updateProfile(playerId, profileData);
    } catch (error) {
      console.error('Error updating player profile:', error);
    }
  }

  // Get sport-specific stats (simplified for database version)
  async getSportStats(playerId: string, sportType: string): Promise<{
    tournaments: number;
    matches: number;
    wins: number;
    hours: number;
    rating: number;
  }> {
    try {
      // For now, return basic stats - this could be enhanced with sport-specific queries
      const allStats = await playerStatsService.getAggregatedStats(playerId);
      return {
        tournaments: Math.floor(allStats.totalTournaments / 3), // Rough estimate
        matches: Math.floor(allStats.totalMatches / 3),
        wins: Math.floor(allStats.matchesWon / 3),
        hours: Math.floor(allStats.hoursPlayed / 3),
        rating: allStats.overallRating
      };
    } catch (error) {
      console.error('Error getting sport stats:', error);
      return { tournaments: 0, matches: 0, wins: 0, hours: 0, rating: 0 };
    }
  }

  // Generate sample data for testing (now uses database)
  async generateSampleData(playerId: string): Promise<void> {
    // This method is now deprecated since we use real database data
    console.log('Sample data generation is now handled by the database seeding process');
  }
}

export const playerStatsManager = PlayerStatsManager.getInstance();