import { supabase } from './supabase';
import { isSupabaseConfigured } from './supabase';
import {
  Tournament,
  User,
  PlayerStats,
  PlayerAchievement,
  PlayerProfile,
  Team,
  TeamMember,
  ChatMessage,
  MatchInvite,
  GameSession,
  SessionParticipant,
  RecurrencePattern,
} from '../types';

// Tournament operations
export const tournamentService = {
  // Get all public tournaments (only approved by admin)
  async getPublicTournaments() {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to access tournaments.'
      );
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('visibility', 'public')
      .in('status', ['approved', 'active', 'completed']) // Only show approved tournaments
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get all approved tournaments (legacy method)
  async getApprovedTournaments() {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to access tournaments.'
      );
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['approved', 'active', 'completed'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get available tournaments for players
  async getAvailableTournaments() {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to access tournaments.'
      );
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['approved', 'active'])
      .order('start_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get tournaments by organizer
  async getTournamentsByOrganizer(organizerId: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to manage tournaments.'
      );
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('organizer_id', organizerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get tournament by ID
  async getTournamentById(id: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to view tournament details.'
      );
    }

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create tournament (now without admin approval)
  async createTournament(
    tournament: Omit<Tournament, 'id' | 'created_at' | 'updated_at'>
  ) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to create tournaments.'
      );
    }

    console.log('🔄 Starting tournament creation in database service...');

    // Validate tournament data
    const {
      validateTournamentData,
      sanitizeInput,
      sanitizePhoneNumber,
      sanitizeEmail,
    } = await import('../utils/dataValidation');

    const sanitizedTournament = {
      ...tournament,
      name: sanitizeInput(tournament.name),
      description: sanitizeInput(tournament.description || ''),
      venue_name: sanitizeInput((tournament as any).venue_name || ''),
      venue_address: sanitizeInput((tournament as any).venue_address || ''),
      contact_phone: sanitizePhoneNumber(
        (tournament as any).contact_phone || ''
      ),
      contact_email: sanitizeEmail((tournament as any).contact_email || ''),
      rules: sanitizeInput(tournament.rules || ''),
      requirements: sanitizeInput(tournament.requirements || ''),
      // Set default values for new fields
      requires_approval: true, // Admin approval is mandatory
      is_recurring: tournament.is_recurring || false,
      chat_enabled: true,
      visibility: 'public',
      status: 'pending_approval', // All tournaments start with pending approval
    };

    console.log('✅ Data validation completed');

    validateTournamentData(sanitizedTournament);

    console.log('🗄️ Inserting tournament into database...');

    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([sanitizedTournament])
        .select()
        .single();

      if (error) {
        console.error('❌ Database insertion failed:', error);
        throw new Error(`Database error: ${error.message}`);
      }

      if (!data) {
        throw new Error('No data returned from database insertion');
      }

      console.log('✅ Tournament successfully inserted into database');

      // Log the tournament creation (best-effort)
      try {
        const { auditLogService } = await import('../lib/auditLog');
        await auditLogService.logTournamentCreation(
          tournament.organizer_id || '',
          tournament.organizer_name || '',
          data
        );
        console.log('✅ Audit log created');
      } catch (auditError) {
        console.warn('⚠️ Audit logging failed (non-critical):', auditError);
      }

      return data;
    } catch (dbError) {
      console.error('❌ Database operation failed:', dbError);

      if (dbError instanceof Error) {
        if (dbError.message.includes('duplicate key')) {
          throw new Error(
            'A tournament with this name already exists. Please choose a different name.'
          );
        } else if (dbError.message.includes('foreign key')) {
          throw new Error(
            'Invalid organizer information. Please try logging out and back in.'
          );
        } else if (dbError.message.includes('check constraint')) {
          throw new Error(
            'Invalid tournament data. Please check all fields and try again.'
          );
        } else {
          throw dbError;
        }
      }

      throw new Error('Database operation failed. Please try again.');
    }
  },

  // Update tournament
  async updateTournament(id: string, updates: Partial<Tournament>) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to update tournaments.'
      );
    }

    const { data, error } = await supabase
      .from('tournaments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete tournament (hard delete with verification)
  async deleteTournament(id: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to delete tournaments.'
      );
    }

    console.log(
      '🗑️ ADMIN DELETION: Starting comprehensive tournament removal:',
      id
    );

    try {
      // Verify tournament exists before deletion
      console.log('🔍 Verifying tournament exists...');
      const { data: existingTournament, error: checkError } = await supabase
        .from('tournaments')
        .select('id, name, organizer_id')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new Error(`Tournament not found: ${checkError.message}`);
      }

      if (!existingTournament) {
        throw new Error('Tournament not found');
      }

      console.log('✅ Tournament verified:', existingTournament.name);

      // Delete related records first (cascade should handle this, but explicit for safety)
      console.log('🗑️ Deleting related records...');

      // Delete chat messages
      const { error: chatError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('tournament_id', id);

      if (chatError) {
        console.warn('⚠️ Chat messages deletion warning:', chatError);
      }

      // Delete teams and team members
      const { error: teamError } = await supabase
        .from('teams')
        .delete()
        .eq('tournament_id', id);

      if (teamError) {
        console.warn('⚠️ Teams deletion warning:', teamError);
      }

      // Delete match invites
      const { error: inviteError } = await supabase
        .from('match_invites')
        .delete()
        .eq('tournament_id', id);

      if (inviteError) {
        console.warn('⚠️ Match invites deletion warning:', inviteError);
      }

      // Delete recurring schedules
      const { error: scheduleError } = await supabase
        .from('recurring_schedules')
        .delete()
        .eq('tournament_id', id);

      if (scheduleError) {
        console.warn('⚠️ Recurring schedules deletion warning:', scheduleError);
      }

      // Delete game sessions
      const { error: sessionError } = await supabase
        .from('game_sessions')
        .delete()
        .eq('tournament_id', id);

      if (sessionError) {
        console.warn('⚠️ Game sessions deletion warning:', sessionError);
      }

      // Delete tournament registrations
      const { error: regError } = await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', id);

      if (regError) {
        console.warn('⚠️ Tournament registrations deletion warning:', regError);
      }

      // Finally, delete the tournament
      console.log('🗑️ Deleting tournament...');
      const { error: deleteError } = await supabase
        .from('tournaments')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw new Error(`Failed to delete tournament: ${deleteError.message}`);
      }

      console.log('✅ Tournament and all related records deleted successfully');

              // Log the deletion (best-effort)
        try {
          const { auditLogService } = await import('../lib/auditLog');
          await auditLogService.logTournamentCreation(
            existingTournament.organizer_id || '',
            existingTournament.name,
            { ...existingTournament, action: 'deleted' }
          );
          console.log('✅ Deletion audit log created');
        } catch (auditError) {
          console.warn('⚠️ Audit logging failed (non-critical):', auditError);
        }

      return { success: true, message: 'Tournament deleted successfully' };
    } catch (error) {
      console.error('❌ Tournament deletion failed:', error);
      throw error;
    }
  },

  // Join tournament directly (no approval required)
  async joinTournament(tournamentId: string, userId: string, userData: any) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('tournament_registrations')
      .insert([{
        tournament_id: tournamentId,
        player_id: userId,
        player_name: userData.full_name,
        email: userData.email,
        phone: userData.phone || '',
        age: userData.age || 18,
        experience_level: userData.experience_level || 'beginner',
        team_name: userData.team_name,
        emergency_contact: userData.emergency_contact || '',
        medical_conditions: userData.medical_conditions || '',
        status: 'registered',
        entry_fee_paid: false,
        payment_status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Leave tournament
  async leaveTournament(tournamentId: string, userId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { error } = await supabase
      .from('tournament_registrations')
      .delete()
      .eq('tournament_id', tournamentId)
      .eq('player_id', userId);

    if (error) throw error;
    return { success: true };
  },

  // Clear tournament cache across the application
  clearTournamentCache() {
    try {
      localStorage.removeItem('tournaments_cache');
      localStorage.removeItem('approved_tournaments');
      localStorage.removeItem('player_tournaments');
      sessionStorage.removeItem('tournaments');
      console.log('🧹 Tournament cache cleared');
    } catch (error) {
      console.warn('⚠️ Failed to clear cache:', error);
    }
  },

  // Broadcast tournament deletion to all connected clients
  broadcastTournamentDeletion(tournamentId: string) {
    try {
      window.dispatchEvent(
        new CustomEvent('tournamentDeleted', {
          detail: { tournamentId },
        })
      );
      console.log('📡 Tournament deletion broadcasted');
    } catch (error) {
      console.warn('⚠️ Failed to broadcast deletion:', error);
    }
  },

  // Get all tournaments for admin
  async getAllTournaments() {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to manage tournaments.'
      );
    }

    console.log(
      '📊 Admin fetching ALL tournaments (including pending, rejected, etc.)...'
    );

    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch tournaments for admin:', error);
      throw new Error(`Admin query failed: ${error.message}`);
    }

    console.log(
      `✅ Admin loaded ${data?.length || 0} tournaments (all statuses included)`
    );
    console.log('📊 Status breakdown:', {
      pending: data?.filter((t) => t.status === 'pending_approval').length || 0,
      approved: data?.filter((t) => t.status === 'approved').length || 0,
      rejected: data?.filter((t) => t.status === 'rejected').length || 0,
      completed: data?.filter((t) => t.status === 'completed').length || 0,
    });

    return data || [];
  },
};

// Registration operations
export const registrationService = {
  // Get registrations by player
  async getPlayerRegistrations(playerId: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to view registrations.'
      );
    }

    const { data, error } = await supabase
      .from('tournament_registrations')
      .select(
        `
        *,
        tournaments (
          name,
          sport_type,
          start_date,
          end_date,
          facility_name
        )
      `
      )
      .eq('player_id', playerId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get registrations by tournament
  async getTournamentRegistrations(tournamentId: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to view registrations.'
      );
    }

    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tournamentId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get registrations by organizer
  async getOrganizerRegistrations(organizerId: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to manage registrations.'
      );
    }

    const { data, error } = await supabase
      .from('tournament_registrations')
      .select(
        `
        *,
        tournaments!inner (
          organizer_id,
          name,
          sport_type
        ),
        profiles!inner (
          id,
          full_name,
          bio,
          favorite_sports,
          skill_level,
          location,
          date_of_birth,
          height,
          weight,
          preferred_position,
          social_links,
          notification_settings,
          privacy_settings,
          organization_name,
          organization_description,
          website,
          created_at,
          updated_at
        )
      `
      )
      .eq('tournaments.organizer_id', organizerId)
      .order('registration_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create registration
  async createRegistration(registration: any) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to register for tournaments.'
      );
    }

    const {
      validateRegistrationData,
      sanitizeInput,
      sanitizePhoneNumber,
      sanitizeEmail,
    } = await import('../utils/dataValidation');

    const sanitizedRegistration = {
      ...registration,
      player_name: sanitizeInput(registration.player_name),
      email: sanitizeEmail(registration.email),
      phone: sanitizePhoneNumber(registration.phone),
      emergency_contact: sanitizePhoneNumber(registration.emergency_contact),
      medical_conditions: registration.medical_conditions
        ? sanitizeInput(registration.medical_conditions)
        : null,
    };

    validateRegistrationData(sanitizedRegistration);

    const { data, error } = await supabase
      .from('tournament_registrations')
      .insert([sanitizedRegistration])
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Registration created successfully:', data);

    const { auditLogService } = await import('../lib/auditLog');
    await auditLogService.logRegistration(
      registration.player_id,
      registration.player_name,
      data
    );

    return data;
  },

  // Update registration
  async updateRegistration(id: string, updates: any) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase to update registrations.'
      );
    }

    const { data, error } = await supabase
      .from('tournament_registrations')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Check if player is registered
  async isPlayerRegistered(tournamentId: string, playerId: string) {
    if (!isSupabaseConfigured) {
      return false; // Safe fallback
    }

    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('tournament_id', tournamentId)
      .eq('player_id', playerId);

    if (error) {
      console.error('Error checking registration:', error);
      return false;
    }

    return !!(data && data.length > 0);
  },

  // Get all registrations (for analytics)
  async getAllRegistrations() {
    if (!isSupabaseConfigured) {
      return [];
    }

    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('*')
      .order('registration_date', { ascending: false });

    if (error) {
      console.error('Error fetching all registrations:', error);
      return [];
    }

    return data || [];
  },
};

// Profile operations
export const profileService = {
  // Get profile by user ID
  async getProfile(userId: string) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase first.'
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Create or update profile
  async upsertProfile(profile: any) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase first.'
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert([profile])
      .select()
      .single();

    if (error) {
      console.error('Profile upsert error:', error);
      throw error;
    }
    return data;
  },

  // Update profile
  async updateProfile(userId: string, updates: any) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase not connected. Please connect to Supabase first.'
      );
    }

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get all profiles (admin only)
  async getAllProfiles() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};

// Player stats operations
export const playerStatsService = {
  // Get player stats
  async getPlayerStats(playerId: string) {
    const { data, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', playerId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Failed to fetch approved tournaments:', error);
      throw error;
    }

    console.log(`✅ Fetched ${data?.length || 0} approved tournaments`);
    return data || [];
  },

  // Create player stat
  async createPlayerStat(stat: any) {
    const { data, error } = await supabase
      .from('player_stats')
      .insert([stat])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get aggregated stats
  async getAggregatedStats(playerId: string) {
    const stats = await this.getPlayerStats(playerId);

    const totalTournaments = stats.length;
    const totalMatches = stats.reduce(
      (sum, stat) => sum + (stat.matches_played || 0),
      0
    );
    const matchesWon = stats.reduce(
      (sum, stat) => sum + (stat.matches_won || 0),
      0
    );
    const hoursPlayed = stats.reduce(
      (sum, stat) => sum + (stat.hours_played || 0),
      0
    );
    const winRate = totalMatches > 0 ? (matchesWon / totalMatches) * 100 : 0;
    const overallRating = this.calculateOverallRating(
      stats,
      totalTournaments,
      matchesWon,
      totalMatches
    );

    return {
      totalTournaments,
      totalMatches,
      matchesWon,
      hoursPlayed,
      winRate,
      overallRating,
    };
  },

  // Calculate overall rating
  calculateOverallRating(
    stats: any[],
    tournaments: number,
    wins: number,
    matches: number
  ): number {
    if (tournaments === 0) return 0;

    const baseRating = 1000;
    const tournamentBonus = tournaments * 50;
    const winBonus = wins * 25;
    const participationBonus = matches * 5;

    const winRate = matches > 0 ? wins / matches : 0;
    const performanceMultiplier = 1 + winRate * 0.5;

    const totalRating =
      (baseRating + tournamentBonus + winBonus + participationBonus) *
      performanceMultiplier;

    return Math.min(Math.round(totalRating * 10) / 10, 5000);
  },
};

// Player achievements operations
export const achievementService = {
  // Get player achievements
  async getPlayerAchievements(playerId: string) {
    const { data, error } = await supabase
      .from('player_achievements')
      .select('*')
      .eq('player_id', playerId)
      .order('earned_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create achievement
  async createAchievement(achievement: any) {
    const { data, error } = await supabase
      .from('player_achievements')
      .insert([achievement])
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Notification operations
export const notificationService = {
  // Get user notifications
  async getUserNotifications(userId?: string, userRole?: string) {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not connected, returning empty notifications');
      return [];
    }

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.or(
          `user_id.eq.${userId},and(user_id.is.null,target_role.eq.${userRole})`
        );
      } else if (userRole) {
        query = query.or(`user_id.is.null,target_role.eq.${userRole}`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching notifications:', error);
        throw error;
      }
      
      console.log(`✅ Loaded ${data?.length || 0} notifications for user ${userId} (role: ${userRole})`);
      return data || [];
    } catch (error) {
      console.error('Failed to load notifications:', error);
      return [];
    }
  },

  // Create notification
  async createNotification(notification: any) {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not connected, skipping notification creation');
      return null;
    }

    try {
      console.log('🔔 Creating notification:', notification);
      
      // Try using RPC function first
      const { data, error } = await supabase.rpc(
        'create_notification_as_admin',
        {
          notification_type: notification.type,
          notification_title: notification.title,
          notification_message: notification.message,
          notification_user_id: notification.user_id,
          notification_tournament_id: notification.tournament_id,
          notification_tournament_name: notification.tournament_name,
          notification_target_role: notification.target_role,
        }
      );

      if (error) {
        console.warn('RPC function not available, using direct insert:', error);

        // Fallback to direct insert (may fail due to RLS)
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('notifications')
          .insert([
            {
              type: notification.type,
              title: notification.title,
              message: notification.message,
              user_id: notification.user_id,
              tournament_id: notification.tournament_id,
              tournament_name: notification.tournament_name,
              target_role: notification.target_role,
              read: false,
            },
          ])
          .select()
          .single();

        if (fallbackError) {
          console.warn(
            'Notification creation failed, continuing without notification:',
            fallbackError
          );
          return null;
        }

        console.log('✅ Notification created via fallback method:', fallbackData);
        return fallbackData;
      }

      console.log('✅ Notification created via RPC:', data);
      return data;
    } catch (error) {
      console.warn(
        'Notification creation failed, continuing without notification:',
        error
      );
      return null;
    }
  },

  // Mark notification as read
  async markAsRead(notificationId: string) {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not connected, skipping mark as read');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Notification marked as read:', notificationId);
      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  // Mark all notifications as read
  async markAllAsRead(userId: string) {
    if (!isSupabaseConfigured) {
      console.warn('Supabase not connected, skipping mark all as read');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId);

      if (error) throw error;
      console.log(`✅ Marked all notifications as read for user: ${userId}`);
      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  // Create system notification for all users
  async createSystemNotification(title: string, message: string, targetRole: 'admin' | 'organizer' | 'player' | 'all' = 'all') {
    return this.createNotification({
      type: 'system',
      title,
      message,
      user_id: null,
      tournament_id: null,
      tournament_name: null,
      target_role: targetRole,
    });
  },

  // Create tournament approval notification
  async createTournamentApprovalNotification(tournamentId: string, tournamentName: string, organizerId: string, approved: boolean) {
    const notificationData = {
      type: approved ? 'tournament_approved' : 'tournament_rejected',
      title: approved ? 'Tournament Approved!' : 'Tournament Rejected',
      message: approved 
        ? `Your tournament "${tournamentName}" has been approved and is now live!`
        : `Your tournament "${tournamentName}" has been rejected. Please review and resubmit.`,
      user_id: organizerId,
      tournament_id: tournamentId,
      tournament_name: tournamentName,
      target_role: 'organizer',
    };

    return this.createNotification(notificationData);
  },

  // Create tournament submission notification for admins
  async createTournamentSubmissionNotification(tournamentId: string, tournamentName: string, organizerName: string) {
    const notificationData = {
      type: 'tournament_submitted',
      title: 'New Tournament Submitted',
      message: `${tournamentName} has been submitted for approval by ${organizerName}`,
      user_id: null,
      tournament_id: tournamentId,
      tournament_name: tournamentName,
      target_role: 'admin',
    };

    return this.createNotification(notificationData);
  },
};

// Utility functions
export const dbUtils = {
  // Test database connection
  async testConnection() {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true });
      return !error;
    } catch {
      return false;
    }
  },

  // Get database stats
  async getStats() {
    const [tournaments, registrations, profiles] = await Promise.all([
      supabase.from('tournaments').select('id', { count: 'exact', head: true }),
      supabase
        .from('tournament_registrations')
        .select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    return {
      tournaments: (tournaments as any)?.count || 0,
      registrations: (registrations as any)?.count || 0,
      users: (profiles as any)?.count || 0,
    };
  },
};

// Team operations
export const teamService = {
  // Create team
  async createTeam(team: Omit<Team, 'id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('teams')
      .insert([team])
      .select()
      .single();

    if (error) throw error;

    // Add captain as first team member
    await this.addTeamMember(team.captain_id, data.id, 'captain');

    return data;
  },

  // Get teams by tournament
  async getTeamsByTournament(tournamentId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('teams')
      .select(`
        *,
        captain:user_profiles!teams_captain_id_fkey(*),
        members:team_members(
          *,
          user:user_profiles(*)
        )
      `)
      .eq('tournament_id', tournamentId);

    if (error) throw error;
    return data || [];
  },

  // Add team member
  async addTeamMember(userId: string, teamId: string, role: string = 'member') {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('team_members')
      .insert([{
        team_id: teamId,
        user_id: userId,
        role
      }])
      .select()
      .single();

    if (error) throw error;

    // Update team member count
    await supabase
      .from('teams')
      .update({ current_members: supabase.rpc('increment') })
      .eq('id', teamId);

    return data;
  },

  // Remove team member
  async removeTeamMember(userId: string, teamId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update team member count
    await supabase
      .from('teams')
      .update({ current_members: supabase.rpc('decrement') })
      .eq('id', teamId);

    return { success: true };
  },
};

// Chat operations
export const chatService = {
  // Check if user can access tournament chat
  async canAccessTournamentChat(userId: string, tournamentId: string) {
    const { data, error } = await supabase
      .from('tournament_registrations')
      .select('id')
      .eq('player_id', userId)
      .eq('tournament_id', tournamentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    // Also check if user is the organizer
    const { data: tournamentData, error: tournamentError } = await supabase
      .from('tournaments')
      .select('organizer_id')
      .eq('id', tournamentId)
      .single();

    if (tournamentError) {
      throw tournamentError;
    }

    return data !== null || tournamentData?.organizer_id === userId;
  },
  async sendMessage(messageData: Omit<ChatMessage, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([messageData])
      .select(`
        *,
        sender:profiles(
          id,
          full_name,
          role
        )
      `)
      .single();

    if (error) throw error;
    return data;
  },

  async getTournamentMessages(tournamentId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles(
          id,
          full_name,
          role
        )
      `)
      .eq('tournament_id', tournamentId)
      .is('team_id', null)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getTeamMessages(teamId: string, limit: number = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select(`
        *,
        sender:profiles(
          id,
          full_name,
          role
        )
      `)
      .eq('team_id', teamId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async updateMessage(messageId: string, updates: Partial<ChatMessage>) {
    const { data, error } = await supabase
      .from('chat_messages')
      .update({
        ...updates,
        is_edited: true,
        edited_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMessage(messageId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return true;
  }
};

// Match invite operations
export const matchInviteService = {
  // Send invite
  async sendInvite(invite: Omit<MatchInvite, 'id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('match_invites')
      .insert([invite])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get user's invites
  async getUserInvites(userId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('match_invites')
      .select(`
        *,
        sender:user_profiles(*),
        tournament:tournaments(*),
        team:teams(*)
      `)
      .eq('recipient_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Accept/decline invite
  async respondToInvite(inviteId: string, status: 'accepted' | 'declined') {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('match_invites')
      .update({ status })
      .eq('id', inviteId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// Recurring schedule operations
export const recurringScheduleService = {
  // Create recurring schedule
  async createSchedule(schedule: Omit<any, 'id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('recurring_schedules')
      .insert([schedule])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Generate recurring sessions
  async generateSessions() {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { error } = await supabase.rpc('generate_recurring_sessions');
    if (error) throw error;
    return { success: true };
  },
};

// Game session operations
export const gameSessionService = {
  // Create game session
  async createSession(session: Omit<GameSession, 'id' | 'created_at' | 'updated_at'>) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .insert([session])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get tournament sessions
  async getTournamentSessions(tournamentId: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('game_sessions')
      .select(`
        *,
        participants:session_participants(
          *,
          user:user_profiles(*),
          team:teams(*)
        )
      `)
      .eq('tournament_id', tournamentId)
      .order('session_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Join session
  async joinSession(sessionId: string, userId: string, teamId?: string) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase not connected.');
    }

    const { data, error } = await supabase
      .from('session_participants')
      .insert([{
        session_id: sessionId,
        user_id: userId,
        team_id: teamId,
        status: 'confirmed'
      }])
      .select()
      .single();

    if (error) throw error;

    // Update participant count
    await supabase
      .from('game_sessions')
      .update({ current_participants: supabase.rpc('increment') })
      .eq('id', sessionId);

    return data;
  },
};
