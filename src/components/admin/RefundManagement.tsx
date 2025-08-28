import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  User,
  Trophy,
  Mail,
  Phone,
  Calendar,
  Search,
  Filter,
  Download
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { paymentService } from '../../lib/paymentService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface RefundRequest {
  id: string;
  status: string;
  refund_amount: number;
  reason: string;
  created_at: string;
  updated_at: string;
  player_name: string;
  player_email: string;
  player_phone: string;
  tournament_name: string;
  organizer_name: string;
  payment_method: string;
  payment_status: string;
}

interface TournamentCommissionRefund {
  id: string;
  tournament_id: string;
  organizer_id: string;
  tournament_name: string;
  organizer_name: string;
  organizer_email?: string;
  commission_amount: number;
  refund_amount: number;
  reason: string;
  status: string;
  created_at: string;
  updated_at: string;
  admin_notes?: string;
  refund_method?: string;
  refund_transaction_id?: string;
  refund_date?: string;
  completed_at?: string;
}

export const RefundManagement: React.FC = () => {
  const { user } = useAuth();
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([]);
  const [tournamentRefunds, setTournamentRefunds] = useState<TournamentCommissionRefund[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [selectedTournamentRefund, setSelectedTournamentRefund] = useState<TournamentCommissionRefund | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTournamentRefundModal, setShowTournamentRefundModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'player' | 'tournament'>('player');

  // Load refund requests
  const loadRefundRequests = async () => {
    try {
      setLoading(true);
      const [playerRequests, tournamentRequests] = await Promise.all([
        paymentService.getAllRefundRequests(),
        paymentService.getAllTournamentCommissionRefunds()
      ]);
      setRefundRequests(playerRequests);
      setTournamentRefunds(tournamentRequests);
    } catch (error) {
      console.error('Error loading refund requests:', error);
      toast.error('Failed to load refund requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRefundRequests();
  }, []);

  // Filter refund requests
  const filteredRequests = refundRequests.filter(request => {
    const matchesSearch = 
      request.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.tournament_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.player_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Handle refund request status update
  const handleStatusUpdate = async (
    requestId: string, 
    newStatus: 'approved' | 'rejected' | 'processing' | 'completed',
    adminNotes?: string,
    refundMethod?: string,
    refundTransactionId?: string
  ) => {
    try {
      setProcessing(requestId);
      
      const success = await paymentService.updateRefundRequestStatus(
        requestId,
        newStatus,
        adminNotes,
        refundMethod,
        refundTransactionId
      );

      if (success) {
        toast.success(`Refund request ${newStatus} successfully`);
        loadRefundRequests(); // Refresh the list
      } else {
        toast.error('Failed to update refund request status');
      }
    } catch (error) {
      console.error('Error updating refund request status:', error);
      toast.error('Failed to update refund request status');
    } finally {
      setProcessing(null);
    }
  };

  // Handle tournament commission refund status update
  const handleTournamentRefundStatusUpdate = async (
    refundId: string, 
    newStatus: 'approved' | 'rejected' | 'processing' | 'completed',
    adminNotes?: string,
    refundMethod?: string,
    refundTransactionId?: string
  ) => {
    try {
      setProcessing(refundId);
      
      const success = await paymentService.updateTournamentCommissionRefundStatus(
        refundId,
        newStatus,
        adminNotes,
        refundMethod,
        refundTransactionId
      );

      if (success) {
        toast.success(`Refund request ${newStatus} successfully`);
        loadRefundRequests(); // Reload data
      } else {
        toast.error('Failed to update refund request status');
      }
    } catch (error) {
      console.error('Error updating refund request:', error);
      toast.error('Failed to update refund request');
    } finally {
      setProcessing(null);
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      approved: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: XCircle },
      processing: { color: 'bg-purple-100 text-purple-800', icon: RefreshCw },
      completed: { color: 'bg-green-100 text-green-800', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span className={`px-2 py-1 text-xs rounded-full font-medium flex items-center gap-1 ${config.color}`}>
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Export refund requests to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Player Name', 'Email', 'Phone', 'Tournament', 'Organizer', 'Amount', 'Reason', 'Status', 'Created Date'],
      ...filteredRequests.map(request => [
        request.player_name,
        request.player_email,
        request.player_phone,
        request.tournament_name,
        request.organizer_name,
        `₹${request.refund_amount}`,
        request.reason,
        request.status,
        new Date(request.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'refund_requests.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading refund requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Refund Management</h2>
          <p className="text-gray-600">Manage refund requests for rejected tournament registrations</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button onClick={loadRefundRequests} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('player')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'player'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Player Registration Refunds
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
              {refundRequests.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('tournament')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'tournament'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Tournament Commission Refunds
            <span className="ml-2 bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full">
              {tournamentRefunds.length}
            </span>
          </button>
        </nav>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {refundRequests.filter(r => r.status === 'pending').length + 
                 tournamentRefunds.filter(r => r.status === 'pending').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <RefreshCw className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Processing</p>
              <p className="text-2xl font-bold text-gray-900">
                {refundRequests.filter(r => r.status === 'processing').length + 
                 tournamentRefunds.filter(r => r.status === 'processing').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {refundRequests.filter(r => r.status === 'completed').length + 
                 tournamentRefunds.filter(r => r.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total Amount</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{refundRequests.reduce((sum, r) => sum + r.refund_amount, 0) + 
                   tournamentRefunds.reduce((sum, r) => sum + r.refund_amount, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>



      {/* Tab Content */}
      {activeTab === 'player' && (
        <>
          {/* Player Refunds Content */}
          <div className="space-y-4">
            {/* Search and Filter */}
            <Card className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1">
                  <Input
                    type="text"
                    placeholder="Search by player name, email, or tournament..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Refund Requests List */}
            <div className="space-y-4">
              {filteredRequests.length === 0 ? (
                <Card className="p-8 text-center">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No refund requests found</h3>
                  <p className="text-gray-600">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Try adjusting your search or filters'
                      : 'All refund requests have been processed'
                    }
                  </p>
                </Card>
              ) : (
                filteredRequests.map((request) => (
                  <motion.div
                    key={request.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{request.player_name}</h4>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Mail className="h-3 w-3" />
                                {request.player_email}
                                <Phone className="h-3 w-3 ml-2" />
                                {request.player_phone}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Trophy className="h-3 w-3" />
                              {request.tournament_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {request.organizer_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ₹{request.refund_amount}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <strong>Reason:</strong> {request.reason}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            Created: {new Date(request.created_at).toLocaleDateString()}
                            {request.updated_at !== request.created_at && (
                              <>
                                <span>•</span>
                                Updated: {new Date(request.updated_at).toLocaleDateString()}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          {getStatusBadge(request.status)}
                          
                          <div className="flex gap-2">
                            {request.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleStatusUpdate(request.id, 'approved')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={processing === request.id}
                                >
                                  {processing === request.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleStatusUpdate(request.id, 'rejected')}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  disabled={processing === request.id}
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {request.status === 'approved' && (
                              <Button
                                onClick={() => handleStatusUpdate(request.id, 'processing')}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                disabled={processing === request.id}
                              >
                                <RefreshCw className="h-3 w-3" />
                                Start Processing
                              </Button>
                            )}
                            
                            {request.status === 'processing' && (
                              <Button
                                onClick={() => handleStatusUpdate(request.id, 'completed')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={processing === request.id}
                              >
                                <CheckCircle className="h-3 w-3" />
                                Mark Complete
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowDetailsModal(true);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'tournament' && (
        <>
          {/* Tournament Commission Refunds Content */}
          <div className="space-y-4">
            {/* Tournament Refunds List */}
            <div className="space-y-4">
              {tournamentRefunds.length === 0 ? (
                <Card className="p-8 text-center">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No tournament commission refunds found</h3>
                  <p className="text-gray-600">
                    Tournament commission refunds will appear here when tournaments are rejected
                  </p>
                </Card>
              ) : (
                tournamentRefunds.map((refund) => (
                  <motion.div
                    key={refund.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full"
                  >
                    <Card className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                              <Trophy className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{refund.tournament_name}</h4>
                                                             <div className="flex items-center gap-2 text-sm text-gray-600">
                                 <User className="h-3 w-3" />
                                 {refund.organizer_name}
                                 {refund.organizer_email && (
                                   <>
                                     <Mail className="h-3 w-3 ml-2" />
                                     {refund.organizer_email}
                                   </>
                                 )}
                               </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Commission: ₹{refund.commission_amount}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              Refund: ₹{refund.refund_amount}
                            </div>
                          </div>
                          
                          <div className="text-sm text-gray-600">
                            <strong>Reason:</strong> {refund.reason}
                          </div>
                          
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            Created: {new Date(refund.created_at).toLocaleDateString()}
                            {refund.updated_at !== refund.created_at && (
                              <>
                                <span>•</span>
                                Updated: {new Date(refund.updated_at).toLocaleDateString()}
                              </>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-3">
                          {getStatusBadge(refund.status)}
                          
                          <div className="flex gap-2">
                            {refund.status === 'pending' && (
                              <>
                                <Button
                                  onClick={() => handleTournamentRefundStatusUpdate(refund.id, 'approved')}
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={processing === refund.id}
                                >
                                  {processing === refund.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <CheckCircle className="h-3 w-3" />
                                  )}
                                  Approve
                                </Button>
                                <Button
                                  onClick={() => handleTournamentRefundStatusUpdate(refund.id, 'rejected')}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  disabled={processing === refund.id}
                                >
                                  <XCircle className="h-3 w-3" />
                                  Reject
                                </Button>
                              </>
                            )}
                            
                            {refund.status === 'approved' && (
                              <Button
                                onClick={() => handleTournamentRefundStatusUpdate(refund.id, 'processing')}
                                size="sm"
                                className="bg-purple-600 hover:bg-purple-700"
                                disabled={processing === refund.id}
                              >
                                <RefreshCw className="h-3 w-3" />
                                Start Processing
                              </Button>
                            )}
                            
                            {refund.status === 'processing' && (
                              <Button
                                onClick={() => handleTournamentRefundStatusUpdate(refund.id, 'completed')}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                disabled={processing === refund.id}
                              >
                                <CheckCircle className="h-3 w-3" />
                                Mark Complete
                              </Button>
                            )}
                            
                            <Button
                              onClick={() => {
                                setSelectedTournamentRefund(refund);
                                setShowTournamentRefundModal(true);
                              }}
                              size="sm"
                              variant="outline"
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Support Contact Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Support Contact</p>
            <p>
              Players should contact <strong>psychxccc@gmail.com</strong> for refund inquiries. 
              Include their registration details and refund request ID for faster processing.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};





