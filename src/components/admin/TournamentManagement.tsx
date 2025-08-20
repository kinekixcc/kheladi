import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Edit, 
  Trash2, 
  Eye, 
  Archive,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Filter,
  Search,
  MoreHorizontal,
  Shield,
  Lock
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { tournamentService } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import { auditLogService } from '../../lib/auditLog';
import toast from 'react-hot-toast';

interface AdminTournamentManagementProps {
  onTournamentUpdate?: () => void;
}

export const AdminTournamentManagement: React.FC<AdminTournamentManagementProps> = ({
  onTournamentUpdate
}) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTournaments, setSelectedTournaments] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tournamentToDelete, setTournamentToDelete] = useState<any>(null);
  const [deleteReason, setDeleteReason] = useState('');

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const data = await tournamentService.getAllTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.organizer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.sport_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleDeleteTournament = async (tournament: any, reason: string) => {
    try {
      await tournamentService.deleteTournament(tournament.id);
      
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
      
      setTournaments(prev => prev.filter(t => t.id !== tournament.id));
      toast.success('Tournament deleted successfully');
      
      if (onTournamentUpdate) {
        onTournamentUpdate();
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast.error('Failed to delete tournament');
    }
  };

  const handleArchiveTournament = async (tournamentId: string) => {
    try {
      await tournamentService.updateTournament(tournamentId, { 
        status: 'archived',
        admin_notes: 'Archived by admin'
      });
      
      // Log admin action
      await auditLogService.logAction(
        user?.id || '',
        user?.full_name || 'Admin',
        'ARCHIVE_TOURNAMENT',
        'tournament',
        tournamentId,
        { status: 'completed' },
        { status: 'archived' }
      );
      
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? { ...t, status: 'archived' } : t
      ));
      
      toast.success('Tournament archived successfully');
    } catch (error) {
      console.error('Error archiving tournament:', error);
      toast.error('Failed to archive tournament');
    }
  };

  const handleHideTournament = async (tournamentId: string) => {
    try {
      await tournamentService.updateTournament(tournamentId, { 
        status: 'hidden',
        admin_notes: 'Hidden by admin'
      });
      
      // Log admin action
      await auditLogService.logAction(
        user?.id || '',
        user?.full_name || 'Admin',
        'HIDE_TOURNAMENT',
        'tournament',
        tournamentId,
        { status: 'completed' },
        { status: 'hidden' }
      );
      
      setTournaments(prev => prev.map(t => 
        t.id === tournamentId ? { ...t, status: 'hidden' } : t
      ));
      
      toast.success('Tournament hidden successfully');
    } catch (error) {
      console.error('Error hiding tournament:', error);
      toast.error('Failed to hide tournament');
    }
  };

  const handleBulkAction = async (action: 'delete' | 'archive' | 'hide') => {
    if (selectedTournaments.length === 0) return;
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedTournaments.length} tournament(s)?`;
    if (!confirm(confirmMessage)) return;

    try {
      for (const tournamentId of selectedTournaments) {
        switch (action) {
          case 'delete':
            await tournamentService.deleteTournament(tournamentId);
            break;
          case 'archive':
            await tournamentService.updateTournament(tournamentId, { status: 'archived' });
            break;
          case 'hide':
            await tournamentService.updateTournament(tournamentId, { status: 'hidden' });
            break;
        }
      }
      
      toast.success(`Successfully ${action}d ${selectedTournaments.length} tournament(s)`);
      setSelectedTournaments([]);
      loadTournaments();
    } catch (error) {
      toast.error(`Failed to ${action} tournaments`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'archived':
        return <Archive className="h-4 w-4 text-gray-600" />;
      case 'hidden':
        return <EyeOff className="h-4 w-4 text-gray-600" />;
      default:
        return <Trophy className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      case 'hidden':
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Shield className="h-6 w-6 mr-2 text-red-600" />
            Admin Tournament Management
          </h2>
          <p className="text-gray-600">Full administrative control over all tournaments</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {filteredTournaments.length} tournaments
          </span>
          <Button variant="outline" onClick={() => loadTournaments()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
            <option value="hidden">Hidden</option>
          </select>
          
          <Button variant="outline" onClick={() => {
            setSearchTerm('');
            setStatusFilter('all');
          }}>
            Clear Filters
          </Button>
        </div>

        {/* Bulk Actions */}
        {selectedTournaments.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-red-800">
                {selectedTournaments.length} tournament(s) selected
              </span>
              <div className="flex space-x-2">
                <Button size="sm" onClick={() => handleBulkAction('archive')}>
                  <Archive className="h-4 w-4 mr-1" />
                  Archive
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleBulkAction('hide')}>
                  <EyeOff className="h-4 w-4 mr-1" />
                  Hide
                </Button>
                <Button 
                  size="sm" 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tournaments List */}
      <div className="space-y-4">
        {filteredTournaments.map((tournament) => (
          <Card key={tournament.id} className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedTournaments.includes(tournament.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTournaments([...selectedTournaments, tournament.id]);
                    } else {
                      setSelectedTournaments(selectedTournaments.filter(id => id !== tournament.id));
                    }
                  }}
                  className="mt-1 h-4 w-4 text-red-600 rounded"
                />
                
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getStatusIcon(tournament.status)}
                    <h3 className="text-xl font-semibold text-gray-900">{tournament.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                      {tournament.status.replace('_', ' ')}
                    </span>
                    <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                      ADMIN CONTROL
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div>Sport: {tournament.sport_type}</div>
                    <div>Organizer: {tournament.organizer_name}</div>
                    <div>Participants: {tournament.current_participants || 0}/{tournament.max_participants}</div>
                    <div>Entry Fee: रू {tournament.entry_fee}</div>
                  </div>
                  
                  <p className="text-gray-600 text-sm line-clamp-2">{tournament.description}</p>
                  
                  {tournament.admin_notes && (
                    <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <p className="text-sm text-orange-800">
                        <strong>Admin Notes:</strong> {tournament.admin_notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Admin Actions */}
              <div className="flex flex-col space-y-2 ml-4">
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                
                {tournament.status === 'completed' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleArchiveTournament(tournament.id)}
                    >
                      <Archive className="h-4 w-4 mr-1" />
                      Archive
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleHideTournament(tournament.id)}
                    >
                      <EyeOff className="h-4 w-4 mr-1" />
                      Hide
                    </Button>
                  </>
                )}
                
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => {
                    setTournamentToDelete(tournament);
                    setShowDeleteModal(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && tournamentToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Admin Delete Tournament
              </h3>
            </div>
            
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action will permanently delete the tournament and all associated data.
              </p>
            </div>
            
            <p className="text-gray-600 mb-4">
              Tournament: <strong>{tournamentToDelete.name}</strong>
            </p>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Deletion (Required)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Provide reason for administrative deletion..."
              />
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
                  setShowDeleteModal(false);
                  setTournamentToDelete(null);
                  setDeleteReason('');
                }}
                className="bg-red-600 hover:bg-red-700"
                disabled={!deleteReason.trim()}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Tournament
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};