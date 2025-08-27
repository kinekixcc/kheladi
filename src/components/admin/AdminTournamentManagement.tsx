import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2, 
  RefreshCw,
  AlertTriangle,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  FileText,
  Download,
  X
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { tournamentService } from '../../lib/database';
import { auditLogService } from '../../lib/auditLog';
import toast from 'react-hot-toast';
import { Phone, Mail } from 'lucide-react';
import { notificationService } from '../../lib/database';
import { paymentService } from '../../lib/paymentService';
import { supabase } from '../../lib/supabase';

interface AdminTournamentManagementProps {
  tournaments: any[];
  onTournamentUpdate: () => void;
}

export const AdminTournamentManagement: React.FC<AdminTournamentManagementProps> = ({
  tournaments,
  onTournamentUpdate
}) => {
  const { user } = useAuth();
  const [filteredTournaments, setFilteredTournaments] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'active' | 'completed'>('all');
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, statusFilter, forceUpdate]);

  const filterTournaments = () => {
    console.log('🔍 Filtering tournaments:', {
      statusFilter,
      totalTournaments: tournaments.length,
      tournamentStatuses: tournaments.map(t => ({ id: t.id, name: t.name, status: t.status }))
    });
    
    if (statusFilter === 'all') {
      setFilteredTournaments(tournaments);
    } else {
      // Map filter values to actual tournament status values
      const statusMapping: Record<string, string> = {
        'pending': 'pending_approval',
        'approved': 'approved',
        'rejected': 'rejected',
        'active': 'active',
        'completed': 'completed'
      };
      
      const targetStatus = statusMapping[statusFilter];
      console.log('🎯 Filter mapping:', { statusFilter, targetStatus });
      
      const filtered = tournaments.filter(t => t.status === targetStatus);
      console.log('✅ Filtered results:', {
        targetStatus,
        filteredCount: filtered.length,
        filteredTournaments: filtered.map(t => ({ id: t.id, name: t.name, status: t.status }))
      });
      
      setFilteredTournaments(filtered);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'rejected':
        return <XCircle className="h-4 w-4" />;
      case 'active':
        return <Trophy className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleApproveTournament = async (tournamentId: string) => {
    setLoading(true);
    try {
      await tournamentService.updateTournament(tournamentId, { status: 'approved' });
      
      // Log the approval action
      await auditLogService.logTournamentApproval(
        user?.id || '',
        user?.full_name || 'Admin',
        tournamentId,
        true
      );

      // Send notification to organizer
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        await notificationService.createTournamentApprovalNotification(
          tournamentId,
          tournament.name,
          tournament.organizer_id,
          true
        );
      }
      
      // Update local filtered tournaments immediately
      setFilteredTournaments(prevFiltered => 
        prevFiltered.map(t => 
          t.id === tournamentId 
            ? { ...t, status: 'approved' }
            : t
        )
      );
      
      toast.success('Tournament approved successfully!');
      
      // Close modal
      setShowDetailsModal(false);
      
      // Notify parent to refresh data
      onTournamentUpdate();
      
      // Force re-render
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Error approving tournament:', error);
      toast.error('Failed to approve tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTournament = async (tournamentId: string, reason: string) => {
    setLoading(true);
    try {
      // 1. Update tournament status to rejected
      await tournamentService.updateTournament(tournamentId, { 
        status: 'rejected', 
        admin_notes: reason 
      });
      
      // 2. Create rejection record (preserves data)
      const tournament = tournaments.find(t => t.id === tournamentId);
      if (tournament) {
        try {
          await supabase
            .from('tournament_rejections')
            .insert([{
              tournament_id: tournamentId,
              organizer_id: tournament.organizer_id,
              rejection_reason: reason,
              admin_id: user?.id,
              admin_notes: reason
            }]);
        } catch (rejectionError) {
          console.error('Failed to create rejection record:', rejectionError);
          // Don't fail the rejection for this error
        }

        // 3. Check if commission was paid and create refund request
        try {
          console.log('🔍 Checking for commission payment for tournament:', tournamentId);
          console.log('🔍 Tournament organizer_id:', tournament.organizer_id);
          
          // First check if there's any commission record at all
          const { data: commissionCheck, error: checkError } = await supabase
            .from('tournament_commissions')
            .select('*')
            .eq('tournament_id', tournamentId);
          
          console.log('🔍 All commission records for tournament:', commissionCheck);
          if (checkError) console.error('❌ Error checking commission records:', checkError);
          
          const commission = await paymentService.getTournamentCommissionForRefund(tournamentId);
          console.log('💰 Commission data for refund:', commission);
          
          if (commission && commission.payment_status === 'paid') {
            console.log('💳 Commission paid, creating refund request...');
            await paymentService.createTournamentCommissionRefund({
              tournament_id: tournamentId,
              organizer_id: tournament.organizer_id,
              commission_amount: commission.commission_amount,
              reason: `Tournament rejected: ${reason}`,
              admin_notes: `Automatic refund request created for rejected tournament`
            });
            
            toast.success('Tournament rejected. Refund request created for commission payment.');
          } else {
            console.log('❌ No commission payment found or not paid');
            console.log('💡 This tournament may not have required commission payment');
            toast.success('Tournament rejected successfully. No commission payment to refund.');
          }
        } catch (refundError) {
          console.error('💥 Failed to create refund request:', refundError);
          toast.success('Tournament rejected, but refund request creation failed. Please process refund manually.');
        }
      }
      
      // 4. Log the rejection action
      await auditLogService.logTournamentApproval(
        user?.id || '',
        user?.full_name || 'Admin',
        tournamentId,
        false
      );

      // 5. Send notification to organizer
      if (tournament) {
        await notificationService.createTournamentApprovalNotification(
          tournamentId,
          tournament.name,
          tournament.organizer_id,
          false
        );
      }
      
      // Update local filtered tournaments immediately
      setFilteredTournaments(prevFiltered => 
        prevFiltered.map(t => 
          t.id === tournamentId 
            ? { ...t, status: 'rejected', admin_notes: reason }
            : t
        )
      );
      
      // Close modal
      setShowDetailsModal(false);
      
      // Notify parent to refresh data
      onTournamentUpdate();
      
      // Force re-render
      setForceUpdate(prev => prev + 1);
    } catch (error) {
      console.error('Error rejecting tournament:', error);
      toast.error('Failed to reject tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTournament = async (tournament: any, reason: string) => {
    try {
      console.log('🗑️ ADMIN ACTION: Initiating tournament deletion');
      
      const loadingToast = toast.loading('Deleting tournament and all related data...');
      
      await tournamentService.deleteTournament(tournament.id);
      
      toast.dismiss(loadingToast);
      
      // Log admin action
      await auditLogService.logAction(
        user?.id || '',
        user?.full_name || 'Admin',
        'DELETE_TOURNAMENT_ADMIN',
        'tournament',
        tournament.id,
        tournament,
        null,
        { reason, admin_override: true }
      );
      
      toast.success(`Tournament "${tournament.name}" deleted successfully`);
      onTournamentUpdate();
      setShowDeleteModal(false);
      setTournamentToDelete(null);
      setDeleteReason('');
      
    } catch (error) {
      console.error('❌ ADMIN DELETION FAILED:', error);
      toast.error('Failed to delete tournament');
    }
  };

  const pendingCount = tournaments.filter(t => t.status === 'pending_approval').length;
  const approvedCount = tournaments.filter(t => t.status === 'approved').length;
  const rejectedCount = tournaments.filter(t => t.status === 'rejected').length;
  const activeCount = tournaments.filter(t => t.status === 'active').length;

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Shield className="h-6 w-6 mr-2 text-red-600" />
          Tournament Management
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {filteredTournaments.length} tournaments
          </span>
          <Button variant="outline" onClick={onTournamentUpdate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Status Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-800">Pending Approval</p>
              <p className="text-2xl font-bold text-yellow-900">{pendingCount}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-800">Approved</p>
              <p className="text-2xl font-bold text-green-900">{approvedCount}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-800">Rejected</p>
              <p className="text-2xl font-bold text-red-900">{rejectedCount}</p>
            </div>
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800">Active</p>
              <p className="text-2xl font-bold text-blue-900">{activeCount}</p>
            </div>
            <Trophy className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'all', label: 'All Tournaments', count: tournaments.length },
            { key: 'pending', label: 'Pending Approval', count: pendingCount },
            { key: 'approved', label: 'Approved', count: approvedCount },
            { key: 'rejected', label: 'Rejected', count: rejectedCount },
            { key: 'active', label: 'Active', count: activeCount }
          ].map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                statusFilter === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{label}</span>
              <span className={`px-2 py-1 text-xs rounded-full ${
                statusFilter === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tournament List */}
      <div className="space-y-4">
        {filteredTournaments.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tournaments found with the selected filter.</p>
          </Card>
        ) : (
          filteredTournaments.map((tournament) => (
            <Card key={tournament.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full border ${getStatusColor(tournament.status)}`}>
                      {getStatusIcon(tournament.status)}
                      <span className="ml-1">{tournament.status.replace('_', ' ')}</span>
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      {(() => {
                        // Check if this is a team-based tournament
                        const isTeamBased = (tournament as any).max_teams && (tournament as any).max_teams > 0;
                        if (isTeamBased) {
                          return `${(tournament as any).current_teams || 0}/${(tournament as any).max_teams} teams`;
                        } else {
                          return `${tournament.current_participants || 0}/${tournament.max_participants} participants`;
                        }
                      })()}
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2" />
                      {new Date(tournament.start_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      {tournament.facility_name}
                    </div>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      रू {tournament.entry_fee}
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-600">
                    <strong>Organizer:</strong> {tournament.organizer_name}
                    {tournament.contact_phone && (
                      <span className="ml-4">
                        <strong>Phone:</strong> {tournament.contact_phone}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTournament(tournament);
                      setShowDetailsModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Review
                  </Button>
                  
                  {tournament.status === 'pending_approval' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproveTournament(tournament.id)}
                        disabled={loading}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-800 border-red-300"
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowDetailsModal(true);
                        }}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-800 border-red-300"
                    onClick={() => {
                      setTournamentToDelete(tournament);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Tournament Details Modal */}
      {showDetailsModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{selectedTournament.name}</h2>
                <p className="text-gray-600">Tournament Review & Approval</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)} 
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                    Tournament Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Sport:</span> {selectedTournament.sport_type}</div>
                    <div><span className="font-medium">Format:</span> {selectedTournament.tournament_type}</div>
                    <div><span className="font-medium">Max Participants:</span> {selectedTournament.max_participants}</div>
                    <div><span className="font-medium">Entry Fee:</span> रू {selectedTournament.entry_fee}</div>
                    <div><span className="font-medium">Prize Pool:</span> रू {selectedTournament.prize_pool}</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-green-600" />
                    Schedule
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Start:</span> {new Date(selectedTournament.start_date).toLocaleDateString()}</div>
                    <div><span className="font-medium">End:</span> {new Date(selectedTournament.end_date).toLocaleDateString()}</div>
                    <div><span className="font-medium">Registration Deadline:</span> {new Date(selectedTournament.registration_deadline).toLocaleDateString()}</div>
                  </div>
                </Card>
              </div>

              {/* Location & Contact */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <MapPin className="h-5 w-5 mr-2 text-red-600" />
                    Venue Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Venue:</span> {selectedTournament.facility_name}</div>
                    <div><span className="font-medium">Address:</span> {selectedTournament.venue_address}</div>
                    <div><span className="font-medium">Province:</span> {selectedTournament.province}</div>
                    <div><span className="font-medium">District:</span> {selectedTournament.district}</div>
                  </div>
                </Card>

                <Card className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Phone className="h-5 w-5 mr-2 text-purple-600" />
                    Organizer Contact
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedTournament.organizer_name}</div>
                    <div className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {selectedTournament.contact_phone}
                    </div>
                    <div className="flex items-center">
                      <Mail className="h-3 w-3 mr-1" />
                      {selectedTournament.contact_email}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Rules & Requirements */}
              <Card className="p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-indigo-600" />
                  Rules & Requirements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Tournament Rules</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {selectedTournament.rules || 'No rules specified'}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-2">Requirements</h4>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                      {selectedTournament.requirements || 'No requirements specified'}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Admin Notes */}
              {selectedTournament.admin_notes && (
                <Card className="p-4 bg-orange-50 border-orange-200">
                  <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Previous Admin Notes
                  </h3>
                  <p className="text-sm text-orange-800">{selectedTournament.admin_notes}</p>
                </Card>
              )}
            </div>

            {/* Actions */}
            {selectedTournament.status === 'pending_approval' && (
              <div className="sticky bottom-0 bg-white border-t p-6">
                <div className="flex justify-end space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowDetailsModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleRejectTournament(selectedTournament.id, 'Rejected by admin')}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={loading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Tournament
                  </Button>
                  <Button
                    onClick={() => handleApproveTournament(selectedTournament.id)}
                    className="bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Tournament
                  </Button>
                </div>
              </div>
            )}
            
            {/* View-only mode for other statuses */}
            {selectedTournament.status !== 'pending_approval' && (
              <div className="sticky bottom-0 bg-white border-t p-6">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-3">
                    Tournament Status: <span className="font-medium">{selectedTournament.status.replace('_', ' ')}</span>
                  </p>
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && tournamentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-red-600 mb-4">
              Confirm Tournament Deletion
            </h3>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Tournament:</strong> {tournamentToDelete.name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Organizer:</strong> {tournamentToDelete.organizer_name}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Status:</strong> {tournamentToDelete.status}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Participants:</strong> {tournamentToDelete.current_participants || 0}/{tournamentToDelete.max_participants}
              </p>
            </div>

            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>⚠️ PERMANENT DELETION:</strong> This will completely remove the tournament and all associated data including registrations, notifications, and statistics.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Administrative Reason for Deletion (Required)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                rows={3}
                placeholder="Provide detailed reason for this administrative action (required for audit trail)..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be logged for audit purposes and cannot be changed later.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setTournamentToDelete(null);
                  setDeleteReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!deleteReason.trim()) {
                    toast.error('Please provide a reason for deletion');
                    return;
                  }
                  handleDeleteTournament(tournamentToDelete, deleteReason);
                }}
                className="bg-red-600 hover:bg-red-700"
                disabled={!deleteReason.trim()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Permanently Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};