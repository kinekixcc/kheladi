import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  X, 
  CheckCircle, 
  XCircle, 
  Trophy, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Phone,
  Mail,
  FileText,
  Download,
  AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Tournament } from '../../types';

interface TournamentApprovalModalProps {
  tournament: Tournament | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

export const TournamentApprovalModal: React.FC<TournamentApprovalModalProps> = ({
  tournament,
  isOpen,
  onClose,
  onApprove,
  onReject
}) => {
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);

  if (!isOpen || !tournament) return null;

  const handleApprove = () => {
    onApprove(tournament.id);
    onClose();
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      return;
    }
    onReject(tournament.id, rejectReason);
    setShowRejectForm(false);
    setRejectReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{tournament.name}</h2>
            <p className="text-gray-600">Tournament Review & Approval</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
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
                <div><span className="font-medium">Sport:</span> {tournament.sport_type}</div>
                <div><span className="font-medium">Format:</span> {(tournament as any).tournament_type}</div>
                {(() => {
                  // Check if this is a team-based tournament
                  const isTeamBased = (tournament as any).max_teams && (tournament as any).max_teams > 0;
                  if (isTeamBased) {
                    return (
                      <>
                        <div><span className="font-medium">Max Teams:</span> {(tournament as any).max_teams}</div>
                        <div><span className="font-medium">Team Size:</span> {(tournament as any).team_size_min || 0}-{(tournament as any).team_size || 0} players</div>
                      </>
                    );
                  } else {
                    return <div><span className="font-medium">Max Participants:</span> {tournament.max_participants}</div>;
                  }
                })()}
                <div><span className="font-medium">Entry Fee:</span> रू {tournament.entry_fee}</div>
                <div><span className="font-medium">Prize Pool:</span> रू {tournament.prize_pool}</div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                Schedule
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Start:</span> {tournament.start_date}</div>
                <div><span className="font-medium">End:</span> {tournament.end_date}</div>
                <div><span className="font-medium">Registration Deadline:</span> {tournament.registration_deadline}</div>
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
                <div><span className="font-medium">Venue:</span> {tournament.facility_name}</div>
                <div><span className="font-medium">Address:</span> {(tournament as any).venue_address}</div>
                <div><span className="font-medium">Province:</span> {(tournament as any).province}</div>
                <div><span className="font-medium">District:</span> {(tournament as any).district}</div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Phone className="h-5 w-5 mr-2 text-purple-600" />
                Organizer Contact
              </h3>
              <div className="space-y-2 text-sm">
                <div><span className="font-medium">Name:</span> {tournament.organizer_name}</div>
                <div className="flex items-center">
                  <Phone className="h-3 w-3 mr-1" />
                  {(tournament as any).contact_phone}
                </div>
                <div className="flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  {(tournament as any).contact_email}
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
                  {tournament.rules}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Requirements</h4>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded whitespace-pre-wrap">
                  {tournament.requirements}
                </p>
              </div>
            </div>
          </Card>

          {/* Admin Notes */}
          {(tournament as any).admin_notes && (
            <Card className="p-4 bg-orange-50 border-orange-200">
              <h4 className="font-medium text-gray-700 mb-3">Tournament Images</h4>
              <h3 className="font-semibold text-orange-900 mb-2 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Previous Admin Notes
              </h3>
              <p className="text-sm text-orange-800">{(tournament as any).admin_notes}</p>
            </Card>
          )}
        </div>

        {/* Actions */}
        {(tournament.status === 'pending_approval' || tournament.status === 'draft') && (
          <div className="sticky bottom-0 bg-white border-t p-6">
            {showRejectForm ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Rejection
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Provide detailed reason for rejection..."
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <Button variant="outline" onClick={() => setShowRejectForm(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleReject}
                    className="bg-red-600 hover:bg-red-700"
                    disabled={!rejectReason.trim()}
                  >
                    Confirm Rejection
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                  className="text-red-600 hover:text-red-800 border-red-300"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject Tournament
                </Button>
                <Button
                  onClick={handleApprove}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve Tournament
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* View-only mode for other statuses */}
        {tournament.status !== 'pending_approval' && tournament.status !== 'draft' && (
          <div className="sticky bottom-0 bg-white border-t p-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">
                Tournament Status: <span className="font-medium">{tournament.status.replace('_', ' ')}</span>
              </p>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};