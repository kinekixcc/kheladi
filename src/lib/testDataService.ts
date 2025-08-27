import { supabase } from './supabase';
import { tournamentService } from './database';
import { paymentService } from './paymentService';

export interface TestTournamentData {
  name: string;
  description: string;
  sport_type: string;
  tournament_type: string;
  entry_fee: number;
  max_participants: number;
  start_date: string;
  end_date: string;
  registration_deadline: string;
  venue_name: string;
  venue_address: string;
  province: string;
  district: string;
  contact_phone: string;
  contact_email: string;
  rules: string;
  requirements: string;
  // Additional required fields from Tournament interface
  prize_pool: number;
  max_teams: number;
  team_size: number;
  requires_approval: boolean;
  is_recurring: boolean;
  allow_individual_players: boolean;
  chat_enabled: boolean;
  visibility: string;
  tags: string[];
}

export const testDataService = {
  // Generate random test tournament data
  generateTestTournament(): TestTournamentData {
    const tournamentNames = [
      'Test Football Championship',
      'Basketball Tournament Pro',
      'Cricket League Test',
      'Tennis Open Championship',
      'Volleyball Cup Test',
      'Badminton Masters',
      'Table Tennis Pro League',
      'Swimming Championship'
    ];

    const sportTypes = ['Football', 'Basketball', 'Cricket', 'Tennis', 'Volleyball', 'Badminton', 'Table Tennis', 'Swimming'];
    const tournamentTypes = ['single_elimination', 'double_elimination', 'round_robin', 'swiss', 'league'];
    const venues = ['Central Sports Complex', 'Elite Arena', 'Championship Stadium', 'Pro Sports Center'];
    const provinces = ['Province 1', 'Province 2', 'Province 3'];
    const districts = ['District A', 'District B', 'District C'];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 30); // 30 days from now
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2);
    
    const registrationDeadline = new Date(startDate);
    registrationDeadline.setDate(registrationDeadline.getDate() - 7);

    return {
      name: tournamentNames[Math.floor(Math.random() * tournamentNames.length)],
      description: 'This is a test tournament created for testing the commission payment system. It includes realistic tournament details and will be used to verify the payment flow.',
      sport_type: sportTypes[Math.floor(Math.random() * sportTypes.length)],
      tournament_type: tournamentTypes[Math.floor(Math.random() * tournamentTypes.length)],
      entry_fee: Math.floor(Math.random() * 5000) + 1000, // 1000-6000
      max_participants: Math.floor(Math.random() * 50) + 20, // 20-70
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      registration_deadline: registrationDeadline.toISOString().split('T')[0],
      venue_name: venues[Math.floor(Math.random() * venues.length)],
      venue_address: `${Math.floor(Math.random() * 999) + 1} Test Street, Test City`,
      province: provinces[Math.floor(Math.random() * provinces.length)],
      district: districts[Math.floor(Math.random() * districts.length)],
      contact_phone: `+977${Math.floor(Math.random() * 90000000) + 10000000}`, // 8 digits after +977
      contact_email: `test.organizer${Math.floor(Math.random() * 1000)}@example.com`,
      rules: 'Standard tournament rules apply. All participants must follow fair play guidelines. This includes proper sportsmanship, following referee decisions, and maintaining fair play throughout the tournament.',
      requirements: 'Participants must be 18+ years old and have basic sports equipment. All players must register before the deadline and provide valid identification.',
      // Additional required fields from Tournament interface
      prize_pool: Math.floor(Math.random() * 10000) + 5000, // 5000-15000
      max_teams: 16,
      team_size: 1,
      requires_approval: true,
      is_recurring: false,
      allow_individual_players: true,
      chat_enabled: true,
      visibility: 'public',
      tags: ['test', 'sports', 'tournament']
    };
  },

  // Create a complete test tournament with commission
  async createTestTournamentWithCommission(organizerId: string): Promise<{
    tournament: any;
    commission: any;
  }> {
    try {
      console.log('🧪 Creating test tournament with commission...');
      
      // 1. Generate test tournament data
      const testData = this.generateTestTournament();
      
      // 2. Create tournament in database (pending approval)
      const tournamentData = {
        // Only include fields that actually exist in the database schema
        name: testData.name,
        description: testData.description,
        sport_type: testData.sport_type,
        tournament_type: testData.tournament_type,
        organizer_id: organizerId,
        organizer_name: 'Test Organizer',
        facility_id: '', // Empty string for test
        facility_name: testData.venue_name, // Use venue name as facility name
        venue_name: testData.venue_name,
        venue_address: testData.venue_address,
        province: testData.province,
        district: testData.district,
        start_date: testData.start_date,
        end_date: testData.end_date,
        registration_deadline: testData.registration_deadline,
        max_participants: testData.max_participants,
        current_participants: 0,
        entry_fee: testData.entry_fee,
        prize_pool: testData.prize_pool,
        rules: testData.rules,
        requirements: testData.requirements,
        status: 'pending_approval',
        contact_phone: testData.contact_phone,
        contact_email: testData.contact_email
      };

      console.log('🧪 Tournament data to create:', tournamentData);

      let createdTournament;
      
      // Try to create tournament using the service first
      try {
        createdTournament = await tournamentService.createTournament(tournamentData);
        console.log('✅ Test tournament created via service:', createdTournament.id);
      } catch (validationError) {
        console.warn('⚠️ Service validation failed, trying direct database insertion...');
        console.error('Validation error details:', validationError);
        
        // Log the exact data that failed validation
        console.log('🧪 Data that failed validation:', JSON.stringify(tournamentData, null, 2));
        
        // Direct database insertion for testing
        const { data: directTournament, error: dbError } = await supabase
          .from('tournaments')
          .insert([tournamentData])
          .select()
          .single();
          
        if (dbError) {
          console.error('❌ Direct database insertion also failed:', dbError);
          throw new Error(`Database insertion failed: ${dbError.message}`);
        }
        
        if (!directTournament) {
          throw new Error('Direct database insertion returned no data');
        }
        
        createdTournament = directTournament;
        console.log('✅ Test tournament created directly:', createdTournament.id);
      }
      
      // Verify tournament was created
      if (!createdTournament || !createdTournament.id) {
        throw new Error('Failed to create tournament - no tournament data returned');
      }

      // 3. Calculate commission
      const totalRevenue = testData.entry_fee * testData.max_participants;
      const commissionAmount = (totalRevenue * 5) / 100; // 5% commission

      // 4. Create commission record
      const commissionData = {
        tournament_id: createdTournament.id,
        organizer_id: organizerId,
        commission_amount: commissionAmount,
        commission_percentage: 5,
        total_amount: totalRevenue,
        payment_status: 'pending',
        payment_method: null,
        payment_proof_url: null
      };

      const createdCommission = await paymentService.createTournamentCommission(commissionData);
      console.log('✅ Test commission created:', createdCommission.id);

      return {
        tournament: createdTournament,
        commission: createdCommission
      };

    } catch (error) {
      console.error('❌ Error creating test tournament:', error);
      throw error;
    }
  },

  // Create multiple test tournaments for bulk testing
  async createMultipleTestTournaments(organizerId: string, count: number = 3): Promise<{
    tournaments: any[];
    commissions: any[];
  }> {
    try {
      console.log(`🧪 Creating ${count} test tournaments...`);
      
      const results = await Promise.all(
        Array.from({ length: count }, () => this.createTestTournamentWithCommission(organizerId))
      );

      const tournaments = results.map(r => r.tournament);
      const commissions = results.map(r => r.commission);

      console.log(`✅ Created ${tournaments.length} test tournaments with commissions`);
      
      return { tournaments, commissions };
    } catch (error) {
      console.error('❌ Error creating multiple test tournaments:', error);
      throw error;
    }
  },

  // Clean up test data
  async cleanupTestData(organizerId: string): Promise<void> {
    try {
      console.log('🧹 Cleaning up test data...');
      
      // Get all test tournaments by this organizer
      const { data: testTournaments, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id')
        .eq('organizer_id', organizerId)
        .like('name', '%Test%');

      if (tournamentError) throw tournamentError;

      if (testTournaments && testTournaments.length > 0) {
        const tournamentIds = testTournaments.map(t => t.id);
        
        // Delete test commissions first
        const { error: commissionError } = await supabase
          .from('tournament_commissions')
          .delete()
          .in('tournament_id', tournamentIds);

        if (commissionError) throw commissionError;

        // Delete test tournaments
        const { error: deleteError } = await supabase
          .from('tournaments')
          .delete()
          .in('id', tournamentIds);

        if (deleteError) throw deleteError;

        console.log(`✅ Cleaned up ${testTournaments.length} test tournaments and their commissions`);
      } else {
        console.log('ℹ️ No test data found to clean up');
      }

    } catch (error) {
      console.error('❌ Error cleaning up test data:', error);
      throw error;
    }
  },

  // Get test data statistics
  async getTestDataStats(organizerId: string): Promise<{
    testTournaments: number;
    testCommissions: number;
    totalTestRevenue: number;
  }> {
    try {
      const { data: testTournaments, error: tournamentError } = await supabase
        .from('tournaments')
        .select('id, name, entry_fee, max_participants')
        .eq('organizer_id', organizerId)
        .like('name', '%Test%');

      if (tournamentError) throw tournamentError;

      const { data: testCommissions, error: commissionError } = await supabase
        .from('tournament_commissions')
        .select('commission_amount')
        .in('tournament_id', testTournaments?.map(t => t.id) || []);

      if (commissionError) throw commissionError;

      const totalTestRevenue = testTournaments?.reduce((sum, t) => 
        sum + (t.entry_fee * t.max_participants), 0) || 0;

      return {
        testTournaments: testTournaments?.length || 0,
        testCommissions: testCommissions?.length || 0,
        totalTestRevenue
      };

    } catch (error) {
      console.error('❌ Error getting test data stats:', error);
      throw error;
    }
  }
};
