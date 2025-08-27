import { supabase } from './supabase';
import { 
  PaymentMethod, 
  TournamentCommission, 
  PlayerRegistrationFee, 
  RevenueStats,
  PaymentVerification 
} from '../types';

export const paymentService = {
  // Get available payment methods
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting payment methods:', error);
      return [];
    }
  },

  // Create tournament commission record
  async createTournamentCommission(commissionData: {
    tournament_id: string;
    organizer_id: string;
    commission_amount: number;
    commission_percentage: number;
    total_amount: number;
    payment_proof_url?: string;
  }): Promise<TournamentCommission | null> {
    try {
      const { data, error } = await supabase
        .from('tournament_commissions')
        .insert([{
          ...commissionData,
          payment_status: 'pending',
          payment_method: 'qr_code',
          payment_proof_url: commissionData.payment_proof_url || null
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating tournament commission:', error);
      return null;
    }
  },

  // Create player registration fee record
  async createPlayerRegistrationFee(feeData: {
    tournament_id: string;
    player_id: string;
    registration_fee: number;
    commission_amount: number;
    total_amount: number;
  }): Promise<PlayerRegistrationFee | null> {
    try {
      const { data, error } = await supabase
        .from('player_registration_fees')
        .insert([{
          ...feeData,
          payment_status: 'pending',
          payment_method: 'qr_code'
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating player registration fee:', error);
      return null;
    }
  },

  // Update payment status with proof
  async updatePaymentStatus(
    paymentId: string, 
    paymentType: 'tournament_commission' | 'player_registration',
    status: 'paid' | 'verified' | 'failed',
    proofUrl?: string
  ): Promise<boolean> {
    try {
      const table = paymentType === 'tournament_commission' ? 'tournament_commissions' : 'player_registration_fees';
      
      const updateData: any = {
        payment_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString();
        if (proofUrl) {
          updateData.payment_proof_url = proofUrl;
        }
      }

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  },

  // Update payment status by tournament ID for tournament commissions
  async updateTournamentCommissionStatus(
    tournamentId: string,
    status: 'paid' | 'verified' | 'failed',
    proofUrl?: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        payment_status: status,
        updated_at: new Date().toISOString()
      };

      if (status === 'paid') {
        updateData.payment_date = new Date().toISOString();
        if (proofUrl) {
          updateData.payment_proof_url = proofUrl;
        }
      }

      const { error } = await supabase
        .from('tournament_commissions')
        .update(updateData)
        .eq('tournament_id', tournamentId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating tournament commission status:', error);
      return false;
    }
  },

  // Get revenue statistics for admin
  async getRevenueStats(): Promise<RevenueStats> {
    try {
      console.log('🔄 PaymentService: Getting revenue stats...');
      
      // Get total commissions
      const { data: commissions, error: commError } = await supabase
        .from('tournament_commissions')
        .select('id, commission_amount, payment_status, tournament_id');

      if (commError) throw commError;

      console.log('📊 PaymentService: Commissions data:', commissions);
      console.log('🔍 PaymentService: Commission details:', commissions?.map(c => ({
        id: c.id,
        amount: c.commission_amount,
        status: c.payment_status,
        tournament_id: c.tournament_id
      })));

      // Get total registration fees
      const { data: fees, error: feeError } = await supabase
        .from('player_registration_fees')
        .select('id, commission_amount, payment_status');

      if (feeError) throw feeError;

      console.log('📊 PaymentService: Fees data:', fees);

      // Calculate totals - include both 'paid' and 'verified' statuses
      const totalCommissions = commissions?.reduce((sum, c) => 
        (c.payment_status === 'verified' || c.payment_status === 'paid') ? sum + c.commission_amount : sum, 0) || 0;
      
      const totalRegistrationFees = fees?.reduce((sum, f) => 
        (f.payment_status === 'verified' || f.payment_status === 'paid') ? sum + f.commission_amount : sum, 0) || 0;

      const totalRevenue = totalCommissions + totalRegistrationFees;

      // Get pending payments count
      const pendingCommissions = commissions?.filter(c => c.payment_status === 'pending').length || 0;
      const pendingFees = fees?.filter(f => f.payment_status === 'pending').length || 0;
      const pendingPayments = pendingCommissions + pendingFees;

      // Get verified/paid payments count
      const verifiedCommissions = commissions?.filter(c => c.payment_status === 'verified' || c.payment_status === 'paid').length || 0;
      const verifiedFees = fees?.filter(f => f.payment_status === 'verified' || f.payment_status === 'paid').length || 0;
      const verifiedPayments = verifiedCommissions + verifiedFees;

      const result = {
        totalRevenue,
        totalCommissions,
        totalRegistrationFees,
        pendingPayments,
        verifiedPayments,
        monthlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Placeholder
        topTournaments: [] // Placeholder
      };
      
      console.log('📈 PaymentService: Final revenue stats result:', result);
      return result;
    } catch (error) {
      console.error('Error getting revenue stats:', error);
      return {
        totalRevenue: 0,
        totalCommissions: 0,
        totalRegistrationFees: 0,
        pendingPayments: 0,
        verifiedPayments: 0,
        monthlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        topTournaments: []
      };
    }
  },

  // Get active payments (pending, paid, verified) for admin verification
  async getPendingPayments(): Promise<{
    commissions: TournamentCommission[];
    fees: PlayerRegistrationFee[];
  }> {
    try {
      console.log('🔄 PaymentService: Getting pending payments...');
      
      // First, get basic commission data without joins
      const { data: commissions, error: commError } = await supabase
        .from('tournament_commissions')
        .select('*')
        .or('payment_status.eq.paid,payment_status.eq.pending,payment_status.eq.verified')
        .order('created_at', { ascending: false });

      if (commError) {
        console.error('❌ PaymentService: Basic commissions query failed:', commError);
        return { commissions: [], fees: [] };
      }

      console.log('✅ PaymentService: Basic commissions loaded:', commissions?.length);

      // Get basic fees data
      const { data: fees, error: feeError } = await supabase
        .from('player_registration_fees')
        .select('*')
        .or('payment_status.eq.paid,payment_status.eq.pending,payment_status.eq.verified')
        .order('created_at', { ascending: false });

      if (feeError) {
        console.error('❌ PaymentService: Basic fees query failed:', feeError);
        // Continue with just commissions
      }

      console.log('✅ PaymentService: Basic fees loaded:', fees?.length);

      // Now enrich the data with tournament and organizer details
      const enrichedCommissions = await this.enrichCommissionsWithDetails(commissions || []);
      const enrichedFees = await this.enrichFeesWithDetails(fees || []);

      return {
        commissions: enrichedCommissions,
        fees: enrichedFees
      };
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return { commissions: [], fees: [] };
    }
  },

  // Enrich commission data with tournament and organizer details
  async enrichCommissionsWithDetails(commissions: TournamentCommission[]): Promise<TournamentCommission[]> {
    try {
      console.log('🔍 PaymentService: Enriching commissions with details...');
      
      const enrichedCommissions = await Promise.all(
        commissions.map(async (commission) => {
          try {
            // Get tournament details
            const { data: tournament } = await supabase
              .from('tournaments')
              .select('id, name, entry_fee, max_participants, status')
              .eq('id', commission.tournament_id)
              .single();

            // Get organizer details - use profiles table (email comes from auth context)
            const { data: organizer } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', commission.organizer_id)
              .single();

            return {
              ...commission,
              tournament: tournament || null,
              organizer: organizer || null
            };
          } catch (error) {
            console.warn(`⚠️ PaymentService: Failed to enrich commission ${commission.id}:`, error);
            return commission;
          }
        })
      );

      console.log('✅ PaymentService: Commissions enriched successfully');
      return enrichedCommissions;
    } catch (error) {
      console.error('❌ PaymentService: Error enriching commissions:', error);
      return commissions;
    }
  },

  // Enrich fees data with tournament and player details
  async enrichFeesWithDetails(fees: PlayerRegistrationFee[]): Promise<PlayerRegistrationFee[]> {
    try {
      console.log('🔍 PaymentService: Enriching fees with details...');
      
      const enrichedFees = await Promise.all(
        fees.map(async (fee) => {
          try {
            // Get tournament details
            const { data: tournament } = await supabase
              .from('tournaments')
              .select('id, name, entry_fee, status')
              .eq('id', fee.tournament_id)
              .single();

            // Get player details - use profiles table (email comes from auth context)
            const { data: player } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', fee.player_id)
              .single();

            return {
              ...fee,
              tournament: tournament || null,
              player: player || null
            };
          } catch (error) {
            console.warn(`⚠️ PaymentService: Failed to enrich fee ${fee.id}:`, error);
            return fee;
          }
        })
      );

      console.log('✅ PaymentService: Fees enriched successfully');
      return enrichedFees;
    } catch (error) {
      console.error('❌ PaymentService: Error enriching fees:', error);
      return fees;
    }
  },

  // Get verified payments (commissions and fees with verified status)
  async getVerifiedPayments(): Promise<{
    commissions: TournamentCommission[];
    fees: PlayerRegistrationFee[];
  }> {
    try {
      console.log('🔍 PaymentService: Getting verified payments...');
      
      // Get verified commissions (without joins)
      const { data: commissions, error: commissionError } = await supabase
        .from('tournament_commissions')
        .select('*')
        .eq('payment_status', 'verified')
        .order('verified_at', { ascending: false });

      if (commissionError) {
        console.error('❌ PaymentService: Failed to get verified commissions:', commissionError);
        throw commissionError;
      }

      // Get verified fees (without joins)
      const { data: fees, error: feeError } = await supabase
        .from('player_registration_fees')
        .select('*')
        .eq('payment_status', 'verified')
        .order('verified_at', { ascending: false });

      if (feeError) {
        console.error('❌ PaymentService: Failed to get verified fees:', feeError);
        throw feeError;
      }

      // Enrich commissions with tournament and organizer details
      const enrichedCommissions = await Promise.all(
        (commissions || []).map(async (commission) => {
          try {
            const details = await this.getCommissionDetails(commission.id);
            return {
              ...commission,
              tournament: details?.tournament || null,
              organizer: details?.organizer || null
            };
          } catch (error) {
            console.warn('⚠️ Failed to enrich commission:', commission.id, error);
            return commission;
          }
        })
      );

      // Enrich fees with tournament and player details
      const enrichedFees = await Promise.all(
        (fees || []).map(async (fee) => {
          try {
            // Get tournament details
            const { data: tournament } = await supabase
              .from('tournaments')
              .select('id, name, entry_fee, status')
              .eq('id', fee.tournament_id)
              .single();

            // Get player details from profiles
            const { data: player } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', fee.player_id)
              .single();

            return {
              ...fee,
              tournament: tournament || null,
              player: player || null
            };
          } catch (error) {
            console.warn('⚠️ Failed to enrich fee:', fee.id, error);
            return fee;
          }
        })
      );

      console.log('✅ PaymentService: Verified payments loaded:', {
        commissions: enrichedCommissions?.length || 0,
        fees: enrichedFees?.length || 0
      });

      return {
        commissions: enrichedCommissions || [],
        fees: enrichedFees || []
      };
    } catch (error) {
      console.error('❌ PaymentService: Error getting verified payments:', error);
      throw error;
    }
  },

  // Get tournament and organizer details for a commission
  async getCommissionDetails(commissionId: string): Promise<{
    tournament: any;
    organizer: any;
  } | null> {
    try {
      console.log('🔍 PaymentService: Getting commission details for:', commissionId);
      
      // Get basic commission data
      const { data: commission, error } = await supabase
        .from('tournament_commissions')
        .select('tournament_id, organizer_id')
        .eq('id', commissionId)
        .single();

      if (error) {
        console.error('❌ PaymentService: Failed to get commission:', error);
        return null;
      }

      // Get tournament details separately
      const { data: tournament } = await supabase
        .from('tournaments')
        .select('id, name, entry_fee, max_participants, status, created_at')
        .eq('id', commission.tournament_id)
        .single();

      // Get organizer details separately - use profiles table (email comes from auth context)
      const { data: organizer } = await supabase
        .from('profiles')
        .select('id, full_name, created_at')
        .eq('id', commission.organizer_id)
        .single();

      const result = {
        tournament: tournament || null,
        organizer: organizer || null
      };

      console.log('✅ PaymentService: Commission details loaded:', result);
      return result;
    } catch (error) {
      console.error('❌ PaymentService: Error getting commission details:', error);
      return null;
    }
  },

  // Verify payment (admin only)
  async verifyPayment(
    paymentId: string,
    paymentType: 'tournament_commission' | 'player_registration',
    status: 'approved' | 'rejected',
    verifiedBy: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const table = paymentType === 'tournament_commission' ? 'tournament_commissions' : 'player_registration_fees';
      
      const updateData: any = {
        payment_status: status === 'approved' ? 'verified' : 'failed',
        verified_by: verifiedBy,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from(table)
        .update(updateData)
        .eq('id', paymentId);

      if (error) throw error;

      // Create verification record
      await supabase
        .from('payment_verifications')
        .insert([{
          payment_id: paymentId,
          payment_type: paymentType,
          verified_by: verifiedBy,
          verified_at: new Date().toISOString(),
          status,
          notes
        }]);

      return true;
    } catch (error) {
      console.error('Error verifying payment:', error);
      return false;
    }
  },

  // ===== REFUND MANAGEMENT FUNCTIONS =====

  // Get player payment by registration
  async getPlayerPaymentByRegistration(tournamentId: string, playerId: string) {
    try {
      const { data, error } = await supabase
        .from('player_registration_fees')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('player_id', playerId)
        .eq('payment_status', 'verified')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting player payment:', error);
      return null;
    }
  },

  // Create refund request
  async createRefundRequest(refundData: {
    player_id: string;
    tournament_id: string;
    registration_id: string;
    payment_id: string;
    refund_amount: number;
    reason: string;
    player_explanation?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .insert([{
          ...refundData,
          player_explanation: refundData.player_explanation || 'Registration rejected by organizer'
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Refund request created:', data);
      return data;
    } catch (error) {
      console.error('Error creating refund request:', error);
      return null;
    }
  },

  // Get all pending refund requests (admin only)
  async getPendingRefundRequests() {
    try {
      const { data, error } = await supabase
        .from('admin_refund_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending refund requests:', error);
      return [];
    }
  },

  // Get all refund requests (admin only)
  async getAllRefundRequests() {
    try {
      const { data, error } = await supabase
        .from('admin_refund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all refund requests:', error);
      return [];
    }
  },

  // Update refund request status
  async updateRefundRequestStatus(
    refundId: string,
    status: 'approved' | 'rejected' | 'processing' | 'completed',
    adminNotes?: string,
    refundMethod?: string,
    refundTransactionId?: string
  ) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminNotes) {
        updateData.admin_notes = adminNotes;
      }

      if (status === 'approved') {
        updateData.admin_decision = 'approved';
        updateData.admin_decision_date = new Date().toISOString();
      } else if (status === 'rejected') {
        updateData.admin_decision = 'rejected';
        updateData.admin_decision_date = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.refund_date = new Date().toISOString();
        if (refundMethod) updateData.refund_method = refundMethod;
        if (refundTransactionId) updateData.refund_transaction_id = refundTransactionId;
      }

      const { error } = await supabase
        .from('refund_requests')
        .update(updateData)
        .eq('id', refundId);

      if (error) throw error;

      // If refund is completed, update the payment record
      if (status === 'completed') {
        const { data: refundRequest } = await supabase
          .from('refund_requests')
          .select('payment_id')
          .eq('id', refundId)
          .single();

        if (refundRequest) {
          await supabase
            .from('player_registration_fees')
            .update({
              refund_status: 'completed',
              updated_at: new Date().toISOString()
            })
            .eq('id', refundRequest.payment_id);
        }
      }

      console.log(`✅ Refund request ${refundId} status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating refund request status:', error);
      return false;
    }
  },

  // Get refund request by ID
  async getRefundRequestById(refundId: string) {
    try {
      const { data, error } = await supabase
        .from('refund_requests')
        .select(`
          *,
          profiles!inner (full_name, email, phone),
          tournaments!inner (name, organizer_name),
          player_registration_fees!inner (payment_method, payment_status)
        `)
        .eq('id', refundId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting refund request:', error);
      return null;
    }
  },

  // Update refund status in player_registration_fees table
  async updateRefundStatus(paymentId: string, refundStatus: 'none' | 'pending' | 'processing' | 'completed' | 'failed') {
    try {
      const { error } = await supabase
        .from('player_registration_fees')
        .update({
          refund_status: refundStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId);

      if (error) throw error;
      console.log(`✅ Refund status updated to: ${refundStatus} for payment: ${paymentId}`);
      return true;
    } catch (error) {
      console.error('Error updating refund status:', error);
      return false;
    }
  },

  // ===== TOURNAMENT COMMISSION REFUND METHODS =====

  // Get tournament commission payment for refund processing
  async getTournamentCommissionForRefund(tournamentId: string) {
    try {
      const { data, error } = await supabase
        .from('tournament_commissions')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('payment_status', 'paid')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('Error getting tournament commission:', error);
      return null;
    }
  },

  // Create tournament commission refund request
  async createTournamentCommissionRefund(refundData: {
    tournament_id: string;
    organizer_id: string;
    commission_amount: number;
    reason: string;
    admin_notes?: string;
  }) {
    try {
      const { data, error } = await supabase
        .from('tournament_commission_refunds')
        .insert([{
          ...refundData,
          refund_amount: refundData.commission_amount,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('✅ Tournament commission refund request created:', data);
      return data;
    } catch (error) {
      console.error('Error creating tournament commission refund:', error);
      return null;
    }
  },

  // Get all pending tournament commission refunds (admin only)
  async getPendingTournamentCommissionRefunds() {
    try {
      const { data, error } = await supabase
        .from('tournament_commission_refunds')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting pending tournament commission refunds:', error);
      return [];
    }
  },

  // Get all tournament commission refunds (admin only)
  async getAllTournamentCommissionRefunds() {
    try {
      const { data, error } = await supabase
        .from('tournament_commission_refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting all tournament commission refunds:', error);
      return [];
    }
  },

  // Update tournament commission refund status
  async updateTournamentCommissionRefundStatus(
    refundId: string,
    status: 'approved' | 'rejected' | 'processing' | 'completed',
    adminNotes?: string,
    refundMethod?: string,
    refundTransactionId?: string
  ) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (adminNotes) updateData.admin_notes = adminNotes;
      if (refundMethod) updateData.refund_method = refundMethod;
      if (refundTransactionId) updateData.refund_transaction_id = refundTransactionId;

      if (status === 'completed') {
        updateData.refund_date = new Date().toISOString();
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('tournament_commission_refunds')
        .update(updateData)
        .eq('id', refundId);

      if (error) throw error;

      // If refund is completed, update the commission record
      if (status === 'completed') {
        const { data: refundRequest } = await supabase
          .from('tournament_commission_refunds')
          .select('*')
          .eq('id', refundId)
          .single();

        if (refundRequest) {
          await supabase
            .from('tournament_commissions')
            .update({ 
              refund_status: 'completed',
              refund_amount: refundRequest.refund_amount,
              refund_date: new Date().toISOString()
            })
            .eq('tournament_id', refundRequest.tournament_id);
        }
      }

      console.log(`✅ Tournament commission refund ${refundId} status updated to: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating tournament commission refund status:', error);
      return false;
    }
  }
};


