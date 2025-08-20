import { tournamentService, registrationService, profileService } from '../lib/database';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

// Secure function to create only essential test users (no dummy tournaments)
const createSecureTestUsers = async () => {
  try {
    console.log('🔧 Creating secure test users...');
    
    // Check if admin profile already exists
    const { data: existingAdminProfile } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'admin')
      .eq('full_name', 'Admin Sabin')
      .maybeSingle();

    let adminData = null;
    if (!existingAdminProfile) {
      console.log('🔧 Creating admin user...');
      
      // Create admin user with secure credentials
      const { data: newAdminData, error: adminError } = await supabase.auth.signUp({
        email: 'adminsabin@gmail.com',
        password: 'windows8.1',
        options: {
          data: {
            full_name: 'Admin Sabin',
            role: 'admin'
          }
        }
      });

      if (newAdminData.user && !adminError) {
        console.log('✅ Admin user created successfully');
        await profileService.upsertProfile({
          id: newAdminData.user.id,
          full_name: 'Admin Sabin',
          role: 'admin'
        });
        adminData = newAdminData;
      } else {
        if (adminError?.message?.includes('User already registered')) {
          console.log('✅ Admin user already exists in auth');
        } else {
          console.error('❌ Failed to create admin user:', adminError);
        }
      }
    } else {
      console.log('✅ Admin profile already exists');
    }

    // Check if organizer already exists
    const { data: existingOrganizer } = await supabase
      .from('profiles')
      .select('id')
      .eq('full_name', 'Sabin Mahat')
      .eq('role', 'organizer')
      .maybeSingle();

    let organizerData = null;
    if (!existingOrganizer) {
      // Create organizer user
      const { data: newOrganizerData, error: organizerError } = await supabase.auth.signUp({
        email: 'organizer@khelkheleko.com',
        password: 'organizer123',
        options: {
          data: {
            full_name: 'Sabin Mahat',
            role: 'organizer'
          }
        }
      });

      if (newOrganizerData.user && !organizerError) {
        await profileService.upsertProfile({
          id: newOrganizerData.user.id,
          full_name: 'Sabin Mahat',
          role: 'organizer',
          phone: '+977-9841234567'
        });
        organizerData = newOrganizerData;

      } else if (organizerError?.message?.includes('User already registered')) {
        console.log('✅ Organizer user already exists in auth');
      } else {
        console.error('❌ Failed to create organizer user:', organizerError);
      }
    } else {
      console.log('✅ Organizer profile already exists');
    }

    // Check if player already exists
    const { data: existingPlayer } = await supabase
      .from('profiles')
      .select('id')
      .eq('full_name', 'Rajesh Shrestha')
      .eq('role', 'player')
      .maybeSingle();

    let playerData = null;
    if (!existingPlayer) {
      // Create player user
      const { data: newPlayerData, error: playerError } = await supabase.auth.signUp({
        email: 'player@khelkheleko.com',
        password: 'player123',
        options: {
          data: {
            full_name: 'Rajesh Shrestha',
            role: 'player'
          }
        }
      });

      if (newPlayerData.user && !playerError) {
        await profileService.upsertProfile({
          id: newPlayerData.user.id,
          full_name: 'Rajesh Shrestha',
          role: 'player',
          phone: '+977-9841111111',
          skill_level: 'intermediate',
          location: 'Kathmandu, Nepal'
        });
        playerData = newPlayerData;
      } else if (playerError?.message?.includes('User already registered')) {
        console.log('✅ Player user already exists in auth');
      } else {
        console.error('❌ Failed to create player user:', playerError);
      }
    } else {
      console.log('✅ Player profile already exists');
    }

    return {
      admin: adminData?.user,
      organizer: organizerData?.user,
      player: playerData?.user
    };
  } catch (error) {
    console.error('Error creating test users:', error);
    throw error;
  }
};

// Secure function to load only essential test data (no dummy content)
export const loadSampleData = async () => {
  try {
    toast.loading('Creating secure test users...');
    
    try {
      // Create only essential test users (no dummy tournaments)
      const users = await createSecureTestUsers();
      
      console.log('✅ Secure test users created successfully!');
      console.log('🔑 Test credentials available for development testing');
      
      toast.dismiss();
      toast.success('Test users created successfully!');
      
      return users;
    } catch (userError: any) {
      // If users already exist, that's fine
      if (userError.message?.includes('User already registered') || userError.message?.includes('user_already_exists')) {
        console.log('✅ Test users already exist');
        toast.dismiss();
        toast.success('Test users ready for development!');
        return null;
      }
      throw userError;
    }
    
  } catch (error) {
    toast.dismiss();
    toast.error('Failed to create test users. Check console for details.');
    console.error('Error loading test data:', error);
    throw error;
  }
};

// Function to clear all data
export const clearAllData = async () => {
  try {
    toast.loading('Clearing all data...');
    
    if (isSupabaseConfigured) {
      console.log('🗑️ Clearing Supabase data...');
      
      // Clear in proper order to avoid foreign key constraint errors
      const clearOperations = [
        { table: 'player_achievements', description: 'player achievements' },
        { table: 'player_stats', description: 'player statistics' },
        { table: 'notifications', description: 'notifications' },
        { table: 'tournament_registrations', description: 'tournament registrations' },
        { table: 'tournaments', description: 'tournaments' }
      ];
      
      for (const operation of clearOperations) {
        try {
          console.log(`🔄 Clearing ${operation.description}...`);
          const { error } = await supabase
            .from(operation.table)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000');
          
          if (error) {
            console.warn(`⚠️ Failed to clear ${operation.description}:`, error);
          } else {
            console.log(`✅ Cleared ${operation.description}`);
          }
        } catch (error) {
          console.warn(`⚠️ Error clearing ${operation.description}:`, error);
        }
      }
    } else {
      console.log('🗑️ Clearing localStorage data...');
      
      // Clear localStorage data
      const keysToRemove = [
        'tournaments',
        'organizer_registrations_organizer-001',
        'player_registrations_player-001',
        'organizer_badges',
        'performance_ratings',
        'organizer_ratings',
        'revenue_test_transactions',
        'dummy_payment_transactions',
        'audit_logs',
        'platform_settings',
        'system_settings'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`✅ Cleared ${key} from localStorage`);
      });
    }
    
    toast.dismiss();
    toast.success('All data cleared successfully!');
    console.log('🗑️ All data cleared successfully');
  } catch (error) {
    toast.dismiss();
    toast.error('Failed to clear data. Check console for details.');
    console.error('Error clearing data:', error);
  }
};