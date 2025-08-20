import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Edit, 
  Trash2, 
  Eye, 
  Users, 
  Calendar, 
  MapPin,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Plus,
  Download,
  Share2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { tournamentService } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import toast from 'react-hot-toast';

interface TournamentManagementProps {
  tournaments: any[];
  onTournamentUpdate: () => void;
}

export const TournamentManagement: React.FC<TournamentManagementProps> = ({
  tournaments,
  onTournamentUpdate
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'active':
        return <Trophy className="h-4 w-4 text-blue-600" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
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
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteTournament = async () => {
    if (!selectedTournament) return;
    
    setDeleting(true);
    try {
      await tournamentService.deleteTournament(selectedTournament.id);
      
      // Add notification for participants
      addNotification({
        type: 'tournament_deleted',
        title: 'Tournament Cancelled',
        message: `The tournament "${selectedTournament.name}" has been cancelled by the organizer.`,
        tournamentId: selectedTournament.id,
        tournamentName: selectedTournament.name,
        targetRole: 'player'
      });

      toast.success('Tournament deleted successfully');
      onTournamentUpdate();
      setShowDeleteModal(false);
      setSelectedTournament(null);
    } catch (error) {
      console.error('Error deleting tournament:', error);
      toast.error('Failed to delete tournament');
    } finally {
      setDeleting(false);
    }
  };

  const handleEditTournament = (tournament: any) => {
    // Navigate to edit page with tournament data
    navigate(`/edit-tournament/${tournament.id}`);
  };

  const handleViewDetails = (tournament: any) => {
    navigate(`/tournament/${tournament.id}`);
  };

  const handleShareTournament = async (tournament: any) => {
    const url = `${window.location.origin}/tournament/${tournament.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament.name,
          text: `Check out this ${tournament.sport_type} tournament!`,
          url: url,
        });
      } catch (error) {
        navigator.clipboard.writeText(url);
        toast.success('Tournament link copied to clipboard!');
      }
    } else {
      navigator.clipboard.writeText(url);
      toast.success('Tournament link copied to clipboard!');
    }
  };

  const exportTournamentData = (tournament: any) => {
    const csvContent = [
      ['Field', 'Value'],
      ['Tournament Name', tournament.name],
      ['Sport Type', tournament.sport_type],
      ['Start Date', tournament.start_date],
      ['End Date', tournament.end_date],
      ['Max Participants', tournament.max_participants],
      ['Current Participants', tournament.current_participants || 0],
      ['Entry Fee', `रू ${tournament.entry_fee}`],
      ['Prize Pool', `रू ${tournament.prize_pool}`],
      ['Status', tournament.status],
      ['Venue', tournament.facility_name],
      ['Organizer', tournament.organizer_name]
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tournament.name.replace(/[^a-zA-Z0-9]/g, '_')}_details.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Tournament data exported!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Tournament Management</h2>
        <Button onClick={() => navigate('/create-tournament')}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Tournament
        </Button>
      </div>

      {/* Tournaments List */}
      {tournaments.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h3>
          <p className="text-gray-600 mb-6">Create your first tournament to get started</p>
          <Button onClick={() => navigate('/create-tournament')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Tournament
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {tournaments.map((tournament, index) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Tournament Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      {getStatusIcon(tournament.status)}
                      <h3 className="text-xl font-semibold text-gray-900">{tournament.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
                        {tournament.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Tournament Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center space-x-2">
                        <Trophy className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-600">{tournament.sport_type}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-600">{tournament.start_date}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        <span className="text-sm text-gray-600">
                          {tournament.current_participants || 0}/{tournament.max_participants}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-gray-600">रू {tournament.entry_fee}</span>
                      </div>
                    </div>

                    {/* Venue Info */}
                    <div className="flex items-center space-x-2 mb-3">
                      <MapPin className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-gray-600">{tournament.facility_name}</span>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-2">{tournament.description}</p>

                    {/* Admin Notes (if rejected) */}
                    {tournament.status === 'rejected' && tournament.admin_notes && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {tournament.admin_notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(tournament)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                    
                    {tournament.status !== 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditTournament(tournament)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShareTournament(tournament)}
                    >
                      <Share2 className="h-4 w-4 mr-1" />
                      Share
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportTournamentData(tournament)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    
                    {tournament.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-800"
                        onClick={() => {
                          setSelectedTournament(tournament);
                          setShowDeleteModal(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedTournament && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Delete Tournament
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete "{selectedTournament.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteModal(false);
                  setSelectedTournament(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTournament}
                loading={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete Tournament
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};