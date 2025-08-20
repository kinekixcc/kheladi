import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Archive, 
  EyeOff, 
  Trash2, 
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trophy,
  Calendar,
  Users
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { tournamentService } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import { auditLogService } from '../../lib/auditLog';
import toast from 'react-hot-toast';

interface TournamentStatusManagerProps {
  tournaments: any[];
  onTournamentUpdate: () => void;
}

export const TournamentStatusManager: React.FC<TournamentStatusManagerProps> = ({
  tournaments,
  onTournamentUpdate
}) => {
  const { user } = useAuth();
  const [selectedAction, setSelectedAction] = useState<'archive' | 'hide' | 'delete' | null>(null);
  const [selectedTournament, setSelectedTournament] = useState<any>(null);
  const [actionReason, setActionReason] = useState('');
  const [showModal, setShowModal] = useState(false);

  // Filter tournaments that can be managed (completed or cancelled)
  const manageableTournaments = tournaments.filter(tournament => {
    const endDate = new Date(tournament.end_date);
    const now = new Date();
    return tournament.status === 'completed' || 
           tournament.status === 'cancelled' || 
           endDate < now;
  });

  const handleTournamentAction = async () => {
    if (!selectedTournament || !selectedAction || !actionReason.trim()) {
      toast.error('Please provide a reason for this action');
      return;
    }

    try {
      let newStatus = selectedAction;
      let actionDescription = '';

      switch (selectedAction) {
        case 'archive':
          newStatus = 'archived';
          actionDescription = 'ARCHIVE_TOURNAMENT';
          break;
        case 'hide':
          newStatus = 'hidden';
          actionDescription = 'HIDE_TOURNAMENT';
          break;
        case 'delete':
          await tournamentService.deleteTournament(selectedTournament.id);
          actionDescription = 'DELETE_TOURNAMENT';
          break;
      }

      if (selectedAction !== 'delete') {
        await tournamentService.updateTournament(selectedTournament.id, {
          status: newStatus,
          admin_notes: actionReason
        });
      }

      // Log the action
      await auditLogService.logAction(
        user?.id || '',
        user?.full_name || 'Organizer',
        actionDescription,
        'tournament',
        selectedTournament.id,
        { status: selectedTournament.status },
        selectedAction === 'delete' ? null : { status: newStatus },
        { reason: actionReason, user_initiated: true }
      );

      toast.success(`Tournament ${selectedAction}d successfully`);
      onTournamentUpdate();
      closeModal();
    } catch (error) {
      console.error(`Error ${selectedAction}ing tournament:`, error);
      toast.error(`Failed to ${selectedAction} tournament`);
    }
  };

  const openActionModal = (tournament: any, action: 'archive' | 'hide' | 'delete') => {
    setSelectedTournament(tournament);
    setSelectedAction(action);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedTournament(null);
    setSelectedAction(null);
    setActionReason('');
    setShowModal(false);
  };

  const getActionDescription = (action: string) => {
    switch (action) {
      case 'archive':
        return 'Archive this tournament to remove it from active listings while preserving data for historical records.';
      case 'hide':
        return 'Hide this tournament from public view while keeping it accessible to you and participants.';
      case 'delete':
        return 'Permanently delete this tournament and all associated data. This action cannot be undone.';
      default:
        return '';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'archive':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'hide':
        return 'bg-gray-600 hover:bg-gray-700';
      case 'delete':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const suggestCleanupActions = (tournament: any) => {
    const endDate = new Date(tournament.end_date);
    const now = new Date();
    const daysSinceEnd = Math.floor((now.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSinceEnd > 90) {
      return 'Consider archiving this old tournament to keep your dashboard clean.';
    } else if (daysSinceEnd > 30) {
      return 'This tournament ended recently. You can hide it from public view if needed.';
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Tournament Status Management</h2>
          <p className="text-gray-600">Manage completed and finished tournaments</p>
        </div>
        <div className="text-sm text-gray-600">
          {manageableTournaments.length} manageable tournaments
        </div>
      </div>

      {/* Manageable Tournaments */}
      {manageableTournaments.length === 0 ? (
        <Card className="p-8 text-center">
          <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments to manage</h3>
          <p className="text-gray-600">
            Completed or cancelled tournaments will appear here for management
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {manageableTournaments.map((tournament) => {
            const suggestion = suggestCleanupActions(tournament);
            
            return (
              <Card key={tournament.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Trophy className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{tournament.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        tournament.status === 'completed' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        tournament.status === 'archived' ? 'bg-gray-100 text-gray-800' :
                        tournament.status === 'hidden' ? 'bg-gray-100 text-gray-600' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {tournament.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {tournament.end_date}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {tournament.current_participants || 0} participants
                      </div>
                      <div className="flex items-center">
                        <Trophy className="h-3 w-3 mr-1" />
                        {tournament.sport_type}
                      </div>
                      <div>
                        रू {tournament.entry_fee} entry fee
                      </div>
                    </div>
                    
                    {suggestion && (
                      <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                          <p className="text-sm text-yellow-800">{suggestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-4">
                    {tournament.status !== 'archived' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActionModal(tournament, 'archive')}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Archive
                      </Button>
                    )}
                    
                    {tournament.status !== 'hidden' && tournament.status !== 'archived' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openActionModal(tournament, 'hide')}
                      >
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide
                      </Button>
                    )}
                    
                    <Button
                      size="sm"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => openActionModal(tournament, 'delete')}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Action Confirmation Modal */}
      {showModal && selectedTournament && selectedAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              {selectedAction === 'delete' ? (
                <AlertTriangle className="h-6 w-6 text-red-600 mr-2" />
              ) : selectedAction === 'archive' ? (
                <Archive className="h-6 w-6 text-blue-600 mr-2" />
              ) : (
                <EyeOff className="h-6 w-6 text-gray-600 mr-2" />
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Tournament
              </h3>
            </div>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">
                Tournament: <strong>{selectedTournament.name}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {getActionDescription(selectedAction)}
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for {selectedAction} (Required)
              </label>
              <textarea
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder={`Why are you ${selectedAction}ing this tournament?`}
              />
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                onClick={handleTournamentAction}
                className={getActionColor(selectedAction)}
                disabled={!actionReason.trim()}
              >
                {selectedAction === 'delete' ? (
                  <Trash2 className="h-4 w-4 mr-2" />
                ) : selectedAction === 'archive' ? (
                  <Archive className="h-4 w-4 mr-2" />
                ) : (
                  <EyeOff className="h-4 w-4 mr-2" />
                )}
                {selectedAction.charAt(0).toUpperCase() + selectedAction.slice(1)} Tournament
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};