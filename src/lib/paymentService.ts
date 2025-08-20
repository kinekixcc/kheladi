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
  }): Promise<TournamentCommission | null> {
    try {
      const { data, error } = await supabase
        .from('tournament_commissions')
        .insert([{
          ...commissionData,
          payment_status: 'pending',
          payment_method: 'qr_code'
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

  // Get revenue statistics for admin
  async getRevenueStats(): Promise<RevenueStats> {
    try {
      // Get total commissions
      const { data: commissions, error: commError } = await supabase
        .from('tournament_commissions')
        .select('commission_amount, payment_status');

      if (commError) throw commError;

      // Get total registration fees
      const { data: fees, error: feeError } = await supabase
        .from('player_registration_fees')
        .select('commission_amount, payment_status');

      if (feeError) throw feeError;

      // Calculate totals
      const totalCommissions = commissions?.reduce((sum, c) => 
        c.payment_status === 'verified' ? sum + c.commission_amount : sum, 0) || 0;
      
      const totalRegistrationFees = fees?.reduce((sum, f) => 
        f.payment_status === 'verified' ? sum + f.commission_amount : sum, 0) || 0;

      const totalRevenue = totalCommissions + totalRegistrationFees;

      // Get pending payments count
      const pendingCommissions = commissions?.filter(c => c.payment_status === 'pending').length || 0;
      const pendingFees = fees?.filter(f => f.payment_status === 'pending').length || 0;
      const pendingPayments = pendingCommissions + pendingFees;

      // Get verified payments count
      const verifiedCommissions = commissions?.filter(c => c.payment_status === 'verified').length || 0;
      const verifiedFees = fees?.filter(f => f.payment_status === 'verified').length || 0;
      const verifiedPayments = verifiedCommissions + verifiedFees;

      return {
        totalRevenue,
        totalCommissions,
        totalRegistrationFees,
        pendingPayments,
        verifiedPayments,
        monthlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], // Placeholder
        topTournaments: [] // Placeholder
      };
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

  // Get pending payments for admin verification
  async getPendingPayments(): Promise<{
    commissions: TournamentCommission[];
    fees: PlayerRegistrationFee[];
  }> {
    try {
      const [commissionsResult, feesResult] = await Promise.all([
        supabase
          .from('tournament_commissions')
          .select('*, tournament:tournaments(name), organizer:auth.users(email)')
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false }),
        
        supabase
          .from('player_registration_fees')
          .select('*, tournament:tournaments(name), player:auth.users(email)')
          .eq('payment_status', 'paid')
          .order('created_at', { ascending: false })
      ]);

      if (commissionsResult.error) throw commissionsResult.error;
      if (feesResult.error) throw feesResult.error;

      return {
        commissions: commissionsResult.data || [],
        fees: feesResult.data || []
      };
    } catch (error) {
      console.error('Error getting pending payments:', error);
      return { commissions: [], fees: [] };
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
  }
};


