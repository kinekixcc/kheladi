import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  Eye,
  Download,
  RefreshCw,
  Search,
  Building2,
  FileText,
  Calendar
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { paymentService } from '../../lib/paymentService';
import { RevenueStats, TournamentCommission, PlayerRegistrationFee, EnrichedTournamentCommission, EnrichedPlayerRegistrationFee } from '../../types';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { PaymentProofViewer } from './PaymentProofViewer';

export const RevenueDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<RevenueStats>({
    totalRevenue: 0,
    totalCommissions: 0,
    totalRegistrationFees: 0,
    pendingPayments: 0,
    verifiedPayments: 0,
    monthlyRevenue: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    topTournaments: []
  });
  const [pendingPayments, setPendingPayments] = useState<{
    commissions: EnrichedTournamentCommission[];
    fees: EnrichedPlayerRegistrationFee[];
  }>({ commissions: [], fees: [] });
  const [verifiedPayments, setVerifiedPayments] = useState<{
    commissions: EnrichedTournamentCommission[];
    fees: EnrichedPlayerRegistrationFee[];
  }>({ commissions: [], fees: [] });
  const [loading, setLoading] = useState(true);
  const [enriching, setEnriching] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'verified'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtered data for search
  const filteredCommissions = pendingPayments.commissions.filter(commission => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      commission.tournament?.name?.toLowerCase().includes(searchLower) ||
      commission.organizer?.full_name?.toLowerCase().includes(searchLower) ||
      commission.commission_amount.toString().includes(searchTerm)
    );
  });

  const filteredVerifiedCommissions = verifiedPayments.commissions.filter(commission => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      commission.tournament?.name?.toLowerCase().includes(searchLower) ||
      commission.organizer?.full_name?.toLowerCase().includes(searchLower) ||
      commission.commission_amount.toString().includes(searchTerm)
    );
  });
  
  // Payment proof viewer state
  const [proofViewerOpen, setProofViewerOpen] = useState(false);
  const [selectedProof, setSelectedProof] = useState<{
    proofUrl: string;
    paymentDetails: {
      amount: number;
      tournamentName: string;
      organizerName: string;
      paymentMethod: string;
      paymentDate: string;
      commissionPercentage: number;
    };
  } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, pendingData, verifiedData] = await Promise.all([
        paymentService.getRevenueStats(),
        paymentService.getPendingPayments(),
        paymentService.getVerifiedPayments()
      ]);
      
      // Calculate platform revenue (commissions earned by the platform)
      // Deduplicate by tournament_id to avoid counting duplicate commission records
      const uniqueCommissions = new Map();
      [...pendingData.commissions, ...verifiedData.commissions].forEach(comm => {
        if (!uniqueCommissions.has(comm.tournament_id)) {
          uniqueCommissions.set(comm.tournament_id, comm);
        }
      });
      
      // Platform revenue = commissions earned (not total tournament amounts)
      const totalTournamentCommissions = Array.from(uniqueCommissions.values())
        .reduce((sum, comm) => sum + (comm.commission_amount || 0), 0);
      const totalPlayerCommissions = pendingData.fees.reduce((sum, fee) => sum + (fee.commission_amount || 0), 0) + 
                                     verifiedData.fees.reduce((sum, fee) => sum + (fee.commission_amount || 0), 0);
      
      const totalRevenue = totalTournamentCommissions + totalPlayerCommissions;
      
      // Use deduplicated commissions for stats
      const totalCommissions = totalTournamentCommissions;
      const totalFees = totalPlayerCommissions;
      
      // Debug logging for revenue calculation
      console.log('💰 RevenueDashboard: Revenue calculation breakdown:', {
        totalCommissions,
        totalFees,
        totalTournamentCommissions,
        totalPlayerCommissions,
        totalRevenue,
        pendingCommissions: pendingData.commissions.length,
        verifiedCommissions: verifiedData.commissions.length,
        sampleCommission: pendingData.commissions[0] || verifiedData.commissions[0]
      });
      
      // Detailed breakdown of each commission
      console.log('🔍 RevenueDashboard: Individual commission breakdown:');
      [...pendingData.commissions, ...verifiedData.commissions].forEach((comm, index) => {
        console.log(`  Commission ${index + 1}:`, {
          id: comm.id,
          tournament_id: comm.tournament_id,
          commission_amount: comm.commission_amount,
          commission_percentage: comm.commission_percentage,
          total_amount: comm.total_amount,
          payment_status: comm.payment_status,
          calculated_tournament_revenue: comm.total_amount || (comm.commission_amount / (comm.commission_percentage / 100))
        });
      });
      
      // Calculate pending vs verified payments
      const pendingCommissions = pendingData.commissions.length;
      const pendingFees = pendingData.fees.length;
      const verifiedCommissions = verifiedData.commissions.length;
      const verifiedFees = verifiedData.fees.length;
      
      const updatedStats = {
        ...statsData,
        totalRevenue, // This now represents platform revenue (commissions earned)
        totalCommissions,
        totalRegistrationFees: totalFees,
        pendingPayments: pendingCommissions + pendingFees,
        verifiedPayments: verifiedCommissions + verifiedFees
      };
      
      setStats(updatedStats);
      setPendingPayments(pendingData);
      setVerifiedPayments(verifiedData);
    } catch (error) {
      console.error('Error loading revenue data:', error);
      toast.error('Failed to load revenue data');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadAllDetails = async () => {
    try {
      setEnriching(true);
      
      const updatedCommissions = await Promise.all(
        pendingPayments.commissions.map(async (commission) => {
          if (commission.tournament?.name && commission.organizer?.full_name) {
            return commission;
          }
          
          const details = await paymentService.getCommissionDetails(commission.id);
          if (details) {
            return {
              ...commission,
              tournament: details.tournament,
              organizer: details.organizer
            };
          }
          return commission;
        })
      );
      
      setPendingPayments(prev => ({
        ...prev,
        commissions: updatedCommissions
      }));
      
      toast.success(`Details loaded for ${updatedCommissions.length} commissions!`);
    } catch (error) {
      console.error('Error loading all details:', error);
      toast.error('Failed to load some commission details');
    } finally {
      setEnriching(false);
    }
  };

  const handleLoadDetails = async (commissionId: string) => {
    try {
      const details = await paymentService.getCommissionDetails(commissionId);
      
      if (details) {
        setPendingPayments(prev => ({
          ...prev,
          commissions: prev.commissions.map(comm => 
            comm.id === commissionId 
              ? { 
                  ...comm, 
                  tournament: details.tournament, 
                  organizer: details.organizer 
                }
              : comm
          )
        }));
        
        toast.success('Tournament and organizer details loaded successfully!');
      } else {
        toast.error('Failed to load commission details');
      }
    } catch (error) {
      console.error('Error loading details:', error);
      toast.error('Failed to load commission details');
    }
  };

  const handleViewPaymentDetails = (commission: EnrichedTournamentCommission) => {
    // For now, just show a toast with basic info
    // In the future, this could open a detailed modal
    toast.success(`Viewing details for ${commission.tournament?.name || 'Tournament'} commission`);
    console.log('Commission details:', commission);
  };

  const handleExportVerifiedPayments = () => {
    try {
      // Create CSV data
      const csvData = [
        ['Tournament', 'Organizer', 'Commission %', 'Amount', 'Verified Date', 'Verified By'],
        ...verifiedPayments.commissions.map(comm => [
          comm.tournament?.name || 'Unknown',
          comm.organizer?.full_name || 'Unknown',
          `${comm.commission_percentage || 5}%`,
          `रु ${comm.commission_amount.toLocaleString()}`,
          comm.verified_at ? new Date(comm.verified_at).toLocaleDateString() : 'N/A',
          comm.verified_by ? 'Admin' : 'System'
        ])
      ];

      // Convert to CSV string
      const csvContent = csvData.map(row => row.join(',')).join('\n');
      
      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `verified_payments_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Verified payments exported successfully!');
    } catch (error) {
      console.error('Error exporting verified payments:', error);
      toast.error('Failed to export verified payments');
    }
  };

  const handleVerifyPayment = async (
    paymentId: string,
    paymentType: 'tournament_commission' | 'player_registration',
    status: 'approved' | 'rejected',
    notes?: string
  ) => {
    if (!user) return;

    try {
      const success = await paymentService.verifyPayment(
        paymentId,
        paymentType,
        status,
        user.id,
        notes
      );

      if (success) {
        toast.success(`Payment ${status} successfully`);
        loadData();
      } else {
        toast.error(`Failed to ${status} payment`);
      }
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const exportRevenueData = () => {
    toast.success('Revenue data exported successfully!');
  };

  // Open payment proof viewer
  const openProofViewer = (commission: EnrichedTournamentCommission) => {
    if (!commission.payment_proof_url) {
      toast.error('No payment proof available for this commission');
      return;
    }

    setSelectedProof({
      proofUrl: commission.payment_proof_url,
      paymentDetails: {
        amount: commission.commission_amount,
        tournamentName: commission.tournament?.name || 'Unknown Tournament',
        organizerName: commission.organizer?.full_name || 'Unknown Organizer',
        paymentMethod: commission.payment_method || 'Unknown',
        paymentDate: commission.payment_date || commission.created_at,
        commissionPercentage: commission.commission_percentage || 5
      }
    });
    setProofViewerOpen(true);
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading revenue data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
              <p className="text-gray-600">Monitor payments, commissions, and revenue</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={exportRevenueData}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button
                onClick={loadData}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </Button>
              <Button
                onClick={handleLoadAllDetails}
                disabled={enriching}
                variant="outline"
                className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              >
                {enriching ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
                {enriching ? 'Loading Details...' : 'Load All Details'}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: TrendingUp },
                { id: 'pending', label: 'Pending Payments', icon: Clock, count: stats.pendingPayments },
                { id: 'verified', label: 'Verified Payments', icon: CheckCircle, count: stats.verifiedPayments }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900">रु {stats.totalRevenue.toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tournament Commissions</p>
                    <p className="text-2xl font-bold text-gray-900">रु {stats.totalCommissions.toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Registration Fees</p>
                    <p className="text-2xl font-bold text-gray-900">रु {stats.totalRegistrationFees.toLocaleString()}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent Commission Payments */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">Recent Commission Payments</h3>
                  {enriching && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Loading details...
                    </div>
                  )}
                </div>
                <Button
                  onClick={() => setActiveTab('pending')}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                >
                  View All
                </Button>
              </div>
              {pendingPayments.commissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No recent commission payments
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.commissions.slice(0, 5).map((commission) => (
                    <div key={commission.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {commission.tournament?.name || `Tournament ID: ${commission.tournament_id || 'Unknown'}`}
                            </h4>
                            <p className="text-sm text-gray-600">
                              by {commission.organizer?.full_name || `Organizer ID: ${commission.organizer_id || 'Unknown'}`}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          रु {commission.commission_amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {commission.commission_percentage || 5}% commission
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Pending Payments Tab */}
        {activeTab === 'pending' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Verified</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {verifiedPayments.commissions.length + verifiedPayments.fees.length}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Amount</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      रु {verifiedPayments.commissions.reduce((sum, comm) => sum + comm.commission_amount, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Tournaments</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {verifiedPayments.commissions.length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Search by tournament name or organizer name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Tournament Commissions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pending Tournament Commissions</h3>
              {filteredCommissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending tournament commissions
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tournament
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organizer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Proof
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredCommissions.map((commission) => (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commission.tournament?.name || `Tournament ID: ${commission.tournament_id || 'Unknown'}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commission.tournament ? (
                                (() => {
                                  // Check if this is a team-based tournament
                                  const isTeamBased = commission.tournament.max_teams && commission.tournament.max_teams > 0;
                                  if (isTeamBased) {
                                    return `Entry Fee: रु ${commission.tournament.entry_fee?.toLocaleString() || '0'} × ${commission.tournament.max_teams || '0'} teams`;
                                  } else {
                                    return `Entry Fee: रु ${commission.tournament.entry_fee?.toLocaleString() || '0'} × ${commission.tournament.max_participants || '0'} participants`;
                                  }
                                })()
                              ) : (
                                <span className="text-orange-600 font-medium">Click "Load Details" to see tournament info</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commission.organizer?.full_name || `Organizer ID: ${commission.organizer_id || 'Unknown'}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commission.organizer?.full_name ? (
                                'Organizer details loaded'
                              ) : (
                                <span className="text-orange-600 font-medium">Click "Load Details" to see organizer info</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commission.commission_percentage || 5}%
                            </div>
                            <div className="text-xs text-gray-500">
                              of total revenue
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              रु {commission.commission_amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {commission.payment_proof_url ? (
                              <div className="flex flex-col gap-2">
                                <Button
                                  onClick={() => openProofViewer(commission)}
                                  size="sm"
                                  variant="outline"
                                  className="text-blue-600 hover:text-blue-700 border-blue-200"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View Receipt
                                </Button>
                                <span className="text-xs text-gray-500">Receipt Available</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">No receipt</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {new Date(commission.created_at).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(commission.created_at).toLocaleTimeString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleLoadDetails(commission.id)}
                                size="sm"
                                variant="outline"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                Load Details
                              </Button>
                              <Button
                                onClick={() => handleVerifyPayment(
                                  commission.id,
                                  'tournament_commission',
                                  'approved'
                                )}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Approve
                              </Button>
                              <Button
                                onClick={() => handleVerifyPayment(
                                  commission.id,
                                  'tournament_commission',
                                  'rejected'
                                )}
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                Reject
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Verified Payments Tab */}
        {activeTab === 'verified' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Search verified payments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={loadData}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    Refresh
                  </Button>
                  <Button
                    onClick={() => handleExportVerifiedPayments()}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </div>
            </Card>

            {/* Verified Tournament Commissions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Verified Tournament Commissions</h3>
              {filteredVerifiedCommissions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {verifiedPayments.commissions.length === 0 
                    ? 'No verified tournament commissions found' 
                    : 'No verified commissions match your search'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tournament
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organizer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verified By
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verified Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredVerifiedCommissions.map((commission) => (
                        <tr key={commission.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commission.tournament?.name || `Tournament ID: ${commission.tournament_id || 'Unknown'}`}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commission.tournament ? (
                                (() => {
                                  // Check if this is a team-based tournament
                                  const isTeamBased = commission.tournament.max_teams && commission.tournament.max_teams > 0;
                                  if (isTeamBased) {
                                    return `Entry Fee: रु ${commission.tournament.entry_fee?.toLocaleString() || '0'} × ${commission.tournament.max_teams || '0'} teams`;
                                  } else {
                                    return `Entry Fee: रु ${commission.tournament.entry_fee?.toLocaleString() || '0'} × ${commission.tournament.max_participants || '0'} participants`;
                                  }
                                })()
                              ) : (
                                <span className="text-gray-400">Tournament details not available</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commission.organizer?.full_name || `Organizer ID: ${commission.organizer_id || 'Unknown'}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {commission.commission_percentage || 5}%
                            </div>
                            <div className="text-xs text-gray-500">
                              of total revenue
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              रु {commission.commission_amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {commission.verified_by ? 'Admin' : 'System'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {commission.verified_at ? new Date(commission.verified_at).toLocaleDateString() : 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {commission.verified_at ? new Date(commission.verified_at).toLocaleTimeString() : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleViewPaymentDetails(commission)}
                                size="sm"
                                variant="outline"
                                className="text-blue-600 hover:text-blue-700 border-blue-200"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            {/* Verified Player Registration Fees */}
            {verifiedPayments.fees.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Verified Player Registration Fees</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tournament
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Player
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fee Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Commission
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Verified Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {verifiedPayments.fees.map((fee) => (
                        <tr key={fee.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {fee.tournament?.name || `Tournament ID: ${fee.tournament_id || 'Unknown'}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {fee.player?.full_name || `Player ID: ${fee.player_id || 'Unknown'}`}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              रु {fee.registration_fee.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              रु {fee.commission_amount.toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {fee.verified_at ? new Date(fee.verified_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </motion.div>
        )}
      </div>

      {/* Payment Proof Viewer */}
      {proofViewerOpen && selectedProof && (
        <PaymentProofViewer
          isOpen={proofViewerOpen}
          onClose={() => {
            setProofViewerOpen(false);
            setSelectedProof(null);
          }}
          proofUrl={selectedProof.proofUrl}
          paymentDetails={selectedProof.paymentDetails}
        />
      )}
    </div>
  );
};
