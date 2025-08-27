import { supabase } from './supabase';
import { Team, TeamMember, User } from '../types';

export interface TeamInvitation {
  id: string;
  team_id: string;
  inviter_id: string;
  invitee_id: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  team?: Team;
  inviter?: User;
  invitee?: User;
}

export interface CreateTeamData {
  name: string;
  description?: string;
  sport_type: string;
  max_members: number;
  logo_url?: string;
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
  captain: User;
}

export const teamService = {
  // Create a new team
  async createTeam(teamData: CreateTeamData, captainId: string): Promise<Team | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .insert([{
          ...teamData,
          captain_id: captainId,
          current_members: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Add captain as first team member
      await this.addTeamMember(captainId, data.id, 'captain');

      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      return null;
    }
  },

  // Get teams where user is a member
  async getUserTeams(userId: string): Promise<TeamWithMembers[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          team:teams(
            *,
            captain:user_profiles(*),
            members:team_members(
              *,
              user:user_profiles(*)
            )
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Transform the data to get teams
      const teams = data?.map(item => item.team).filter(Boolean) || [];
      return teams as unknown as TeamWithMembers[];
    } catch (error) {
      console.error('Error getting user teams:', error);
      return [];
    }
  },

  // Get team by ID with members
  async getTeamById(teamId: string): Promise<TeamWithMembers | null> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          captain:user_profiles(*),
          members:team_members(
            *,
            user:user_profiles(*)
          )
        `)
        .eq('id', teamId)
        .single();

      if (error) throw error;
      return data as TeamWithMembers;
    } catch (error) {
      console.error('Error getting team:', error);
      return null;
    }
  },

  // Send team invitation
  async sendTeamInvitation(
    teamId: string,
    inviterId: string,
    inviteeEmail: string,
    message?: string
  ): Promise<TeamInvitation | null> {
    try {
      // First, get the invitee user by email
      const { data: invitee, error: inviteeError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', inviteeEmail)
        .single();

      if (inviteeError || !invitee) {
        throw new Error('User not found');
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('team_id', teamId)
        .eq('invitee_id', invitee.id)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        throw new Error('Invitation already sent to this user');
      }

      // Create invitation
      const { data, error } = await supabase
        .from('team_invitations')
        .insert([{
          team_id: teamId,
          inviter_id: inviterId,
          invitee_id: invitee.id,
          message,
          status: 'pending',
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return data as TeamInvitation;
    } catch (error) {
      console.error('Error sending team invitation:', error);
      return null;
    }
  },

  // Get team invitations for a user
  async getUserTeamInvitations(userId: string): Promise<TeamInvitation[]> {
    try {
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          *,
          team:teams(
            *,
            captain:user_profiles(*)
          ),
          inviter:user_profiles(*)
        `)
        .eq('invitee_id', userId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as TeamInvitation[] || [];
    } catch (error) {
      console.error('Error getting team invitations:', error);
      return [];
    }
  },

  // Accept team invitation
  async acceptTeamInvitation(invitationId: string): Promise<boolean> {
    try {
      // Get invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from('team_invitations')
        .select('*')
        .eq('id', invitationId)
        .single();

      if (invitationError || !invitation) {
        throw new Error('Invitation not found');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new Error('Invitation has expired');
      }

      // Add user to team
      await this.addTeamMember(invitation.invitee_id, invitation.team_id, 'member');

      // Update invitation status
      const { error: updateError } = await supabase
        .from('team_invitations')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (updateError) throw updateError;

      return true;
    } catch (error) {
      console.error('Error accepting team invitation:', error);
      return false;
    }
  },

  // Decline team invitation
  async declineTeamInvitation(invitationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .update({
          status: 'declined',
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error declining team invitation:', error);
      return false;
    }
  },

  // Add team member
  async addTeamMember(userId: string, teamId: string, role: 'captain' | 'vice_captain' | 'member' = 'member'): Promise<boolean> {
    try {
      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', teamId)
        .eq('user_id', userId)
        .single();

      if (existingMember) {
        throw new Error('User is already a team member');
      }

      // Add team member
      const { error } = await supabase
        .from('team_members')
        .insert([{
          team_id: teamId,
          user_id: userId,
          role,
          joined_at: new Date().toISOString()
        }]);

      if (error) throw error;

      // Update team member count
      await supabase
        .from('teams')
        .update({ 
          current_members: supabase.rpc('increment'),
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      return true;
    } catch (error) {
      console.error('Error adding team member:', error);
      return false;
    }
  },

  // Remove team member
  async removeTeamMember(userId: string, teamId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update team member count
      await supabase
        .from('teams')
        .update({ 
          current_members: supabase.rpc('decrement'),
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      return true;
    } catch (error) {
      console.error('Error removing team member:', error);
      return false;
    }
  },

  // Leave team
  async leaveTeam(userId: string, teamId: string): Promise<boolean> {
    try {
      // Check if user is captain
      const { data: team } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (team?.captain_id === userId) {
        throw new Error('Captain cannot leave the team. Transfer captaincy first.');
      }

      return await this.removeTeamMember(userId, teamId);
    } catch (error) {
      console.error('Error leaving team:', error);
      return false;
    }
  },

  // Transfer captaincy
  async transferCaptaincy(teamId: string, newCaptainId: string, currentCaptainId: string): Promise<boolean> {
    try {
      // Verify current user is captain
      const { data: team } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (team?.captain_id !== currentCaptainId) {
        throw new Error('Only the current captain can transfer captaincy');
      }

      // Update team captain
      const { error: teamError } = await supabase
        .from('teams')
        .update({
          captain_id: newCaptainId,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (teamError) throw teamError;

      // Update member roles
      await supabase
        .from('team_members')
        .update({ role: 'member' })
        .eq('team_id', teamId)
        .eq('user_id', currentCaptainId);

      await supabase
        .from('team_members')
        .update({ role: 'captain' })
        .eq('team_id', teamId)
        .eq('user_id', newCaptainId);

      return true;
    } catch (error) {
      console.error('Error transferring captaincy:', error);
      return false;
    }
  },

  // Update team information
  async updateTeam(teamId: string, updates: Partial<CreateTeamData>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('teams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', teamId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating team:', error);
      return false;
    }
  },

  // Delete team (only captain can do this)
  async deleteTeam(teamId: string, captainId: string): Promise<boolean> {
    try {
      // Verify user is captain
      const { data: team } = await supabase
        .from('teams')
        .select('captain_id')
        .eq('id', teamId)
        .single();

      if (team?.captain_id !== captainId) {
        throw new Error('Only the captain can delete the team');
      }

      // Delete team members first
      await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId);

      // Delete team invitations
      await supabase
        .from('team_invitations')
        .delete()
        .eq('team_id', teamId);

      // Delete team
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      return false;
    }
  }
};
