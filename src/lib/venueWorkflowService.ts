import { supabase } from './supabase';
import { VenueLead, VenueClaimRequest, VenueWorkflowStats, SportsFacility } from '../types';

export const venueWorkflowService = {
  // Venue Status Management
  async updateVenueStatus(venueId: string, status: string, adminUserId: string) {
    try {
      const { data, error } = await supabase
        .from('sports_facilities')
        .update({ 
          status,
          last_verified_at: status === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', venueId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating venue status:', error);
      throw error;
    }
  },

  async deleteVenue(venueId: string, adminUserId: string) {
    try {
      // First check if user is admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', adminUserId)
        .single();

      if (profileError || profileData?.role !== 'admin') {
        throw new Error('Unauthorized: Only admins can delete venues');
      }

      // Delete the venue
      const { error } = await supabase
        .from('sports_facilities')
        .delete()
        .eq('id', venueId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting venue:', error);
      throw error;
    }
  },

  async claimVenue(venueId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('sports_facilities')
        .update({ 
          status: 'claimed',
          claimed_by: userId,
          updated_at: new Date().toISOString()
        })
        .eq('id', venueId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error claiming venue:', error);
      throw error;
    }
  },

  // Venue Leads Management
  async createVenueLead(leadData: {
    venue_id: string;
    user_id: string;
    requested_date: string;
    start_minute: number;
    duration_min: number;
    notes?: string;
    contact_phone: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('venue_leads')
        .insert([leadData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating venue lead:', error);
      throw error;
    }
  },

  async getUserLeads(userId: string) {
    try {
      const { data, error } = await supabase
        .from('venue_leads')
        .select(`
          *,
          venue:sports_facilities(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user leads:', error);
      return [];
    }
  },

  async getAllLeads() {
    try {
      const { data, error } = await supabase
        .from('venue_leads')
        .select(`
          *,
          venue:sports_facilities(*),
          user:auth.users(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all leads:', error);
      return [];
    }
  },

  async updateLeadStatus(leadId: string, status: string) {
    try {
      const { data, error } = await supabase
        .from('venue_leads')
        .update({ status })
        .eq('id', leadId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating lead status:', error);
      throw error;
    }
  },

  // Venue Claim Requests Management
  async createClaimRequest(claimData: {
    venue_id: string;
    contact_name: string;
    phone: string;
    email: string;
    proof_url?: string;
    message?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('venue_claim_requests')
        .insert([claimData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating claim request:', error);
      throw error;
    }
  },

  async getUserClaimRequests(userId: string) {
    try {
      const { data, error } = await supabase
        .from('venue_claim_requests')
        .select(`
          *,
          venue:sports_facilities(*)
        `)
        .eq('claimed_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user claim requests:', error);
      return [];
    }
  },

  async getAllClaimRequests() {
    try {
      const { data, error } = await supabase
        .from('venue_claim_requests')
        .select(`
          *,
          venue:sports_facilities(*),
          user:auth.users(id, email, full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all claim requests:', error);
      return [];
    }
  },

  async verifyClaimRequest(claimId: string, status: string, adminUserId: string) {
    try {
      const { data, error } = await supabase
        .from('venue_claim_requests')
        .update({ 
          status,
          claimed_by: status === 'verified' ? adminUserId : null
        })
        .eq('id', claimId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error verifying claim request:', error);
      throw error;
    }
  },

  // Data Quality Management
  async calculateDataQualityScore(venueId: string) {
    try {
      const { data: venue, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .eq('id', venueId)
        .single();

      if (error) throw error;

      let score = 0;
      
      // Photo score (20 points)
      if (venue.images && venue.images.length > 0) score += 20;
      
      // Description score (20 points)
      if (venue.description && venue.description.length > 200) score += 20;
      
      // Amenities score (10 points)
      if (venue.amenities && venue.amenities.length >= 5) score += 10;
      
      // Map link score (10 points)
      if (venue.google_maps_link && venue.google_maps_link !== '') score += 10;
      
      // Contact score (10 points)
      if (venue.contact_phone && venue.contact_phone !== '') score += 10;
      
      // Verification bonus (30 points)
      if (venue.status === 'verified') score += 30;

      // Update the score in the database
      await supabase
        .from('sports_facilities')
        .update({ data_quality_score: score })
        .eq('id', venueId);

      return score;
    } catch (error) {
      console.error('Error calculating data quality score:', error);
      return 0;
    }
  },

  // Statistics
  async getWorkflowStats(): Promise<VenueWorkflowStats> {
    try {
      // Get venue counts by status
      const { data: venues, error: venuesError } = await supabase
        .from('sports_facilities')
        .select('status, data_quality_score');

      if (venuesError) throw venuesError;

      // Get lead counts
      const { data: leads, error: leadsError } = await supabase
        .from('venue_leads')
        .select('status');

      if (leadsError) throw leadsError;

      // Get claim counts
      const { data: claims, error: claimsError } = await supabase
        .from('venue_claim_requests')
        .select('status');

      if (claimsError) throw claimsError;

      // Calculate statistics
      const venueStats = venues?.reduce((acc, venue) => {
        acc[venue.status as keyof typeof acc] = (acc[venue.status as keyof typeof acc] || 0) + 1;
        return acc;
      }, {} as any) || {};

      const leadStats = leads?.reduce((acc, lead) => {
        acc[lead.status as keyof typeof acc] = (acc[lead.status as keyof typeof acc] || 0) + 1;
        return acc;
      }, {} as any) || {};

      const claimStats = claims?.reduce((acc, claim) => {
        acc[claim.status as keyof typeof acc] = (acc[claim.status as keyof typeof acc] || 0) + 1;
        return acc;
      }, {} as any) || {};

      const totalQualityScore = venues?.reduce((sum, venue) => sum + (venue.data_quality_score || 0), 0) || 0;
      const averageQualityScore = venues && venues.length > 0 ? totalQualityScore / venues.length : 0;

      return {
        totalVenues: venues?.length || 0,
        seededVenues: venueStats.seeded || 0,
        verifiedVenues: venueStats.verified || 0,
        claimedVenues: venueStats.claimed || 0,
        bookableVenues: venueStats.bookable || 0,
        suspendedVenues: venueStats.suspended || 0,
        totalLeads: leads?.length || 0,
        newLeads: leadStats.new || 0,
        totalClaims: claims?.length || 0,
        pendingClaims: claimStats.new || 0,
        averageQualityScore: Math.round(averageQualityScore * 100) / 100
      };
    } catch (error) {
      console.error('Error getting workflow stats:', error);
      return {
        totalVenues: 0,
        seededVenues: 0,
        verifiedVenues: 0,
        claimedVenues: 0,
        bookableVenues: 0,
        suspendedVenues: 0,
        totalLeads: 0,
        newLeads: 0,
        totalClaims: 0,
        pendingClaims: 0,
        averageQualityScore: 0
      };
    }
  },

  // Venue Discovery with Workflow Status
  async getDiscoverableVenues(showOnlyBookable: boolean = false) {
    try {
      let query = supabase
        .from('sports_facilities')
        .select('*')
        .neq('status', 'suspended')
        .order('created_at', { ascending: false });

      if (showOnlyBookable) {
        query = query.eq('status', 'bookable');
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting discoverable venues:', error);
      return [];
    }
  }
};

