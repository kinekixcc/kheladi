import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, 
  Send, 
  Check, 
  X, 
  Clock, 
  UserPlus,
  Users,
  Trophy,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { matchInviteService } from '../../lib/database';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface MatchInvitesProps {
  tournamentId?: string;
  teamId?: string;
}

interface MatchInvite {
  id: string;
  tournament_id: string;
  sender_id: string;
  recipient_id: string;
  team_id?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at?: string;
  created_at: string;
  sender?: {
    full_name: string;
    email: string;
  };
  recipient?: {
    full_name: string;
    email: string;
  };
  tournament?: {
    name: string;
    sport_type: string;
    start_date: string;
  };
  team?: {
    name: string;
  };
}

export const MatchInvites: React.FC<MatchInvitesProps> = ({
  tournamentId,
  teamId
}) => {
  const { user } = useAuth();
  const [invites, setInvites] = useState<MatchInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSendInvite, setShowSendInvite] = useState(false);
  const [inviteData, setInviteData] = useState({
    recipientEmail: '',
    message: '',
    teamId: teamId || ''
  });

  useEffect(() => {
    loadInvites();
  }, [user?.id]);

  const loadInvites = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const userInvites = await matchInviteService.getUserInvites(user.id);
      setInvites(userInvites);
    } catch (error) {
      console.error('Error loading invites:', error);
      toast.error('Failed to load invites');
    } finally {
      setLoading(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteData.recipientEmail.trim() || !user) return;

    try {
      // In a real implementation, you would look up the user by email
      // and then create the invite. For now, we'll simulate this.
      const invite = {
        tournament_id: tournamentId || 'general',
        sender_id: user.id,
        recipient_id: 'recipient-user-id', // This would be looked up
        team_id: inviteData.teamId || undefined,
        message: inviteData.message.trim() || undefined,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      };

      await matchInviteService.sendInvite(invite);
      toast.success('Invitation sent successfully!');
      setShowSendInvite(false);
      setInviteData({ recipientEmail: '', message: '', teamId: teamId || '' });
      loadInvites();
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleRespondToInvite = async (inviteId: string, status: 'accepted' | 'declined') => {
    try {
      await matchInviteService.respondToInvite(inviteId, status);
      toast.success(`Invitation ${status}`);
      loadInvites();
    } catch (error) {
      console.error('Error responding to invite:', error);
      toast.error('Failed to respond to invitation');
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const getStatusColor = (status: string, expiresAt?: string) => {
    if (isExpired(expiresAt)) return 'bg-red-100 text-red-800';
    
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string, expiresAt?: string) => {
    if (isExpired(expiresAt)) return <Clock className="h-4 w-4 text-red-600" />;
    
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'accepted':
        return <Check className="h-4 w-4 text-green-600" />;
      case 'declined':
        return <X className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const pendingInvites = invites.filter(invite => invite.status === 'pending' && !isExpired(invite.expires_at));
  const otherInvites = invites.filter(invite => invite.status !== 'pending' || isExpired(invite.expires_at));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Mail className="h-5 w-5 mr-2 text-blue-600" />
          Match Invites ({invites.length})
        </h2>
        <Button onClick={() => setShowSendInvite(true)}>
          <Send className="h-4 w-4 mr-2" />
          Send Invite
        </Button>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Invites</h3>
          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status, invite.expires_at)}`}>
                        {getStatusIcon(invite.status, invite.expires_at)}
                        <span className="ml-1">
                          {isExpired(invite.expires_at) ? 'Expired' : 'Pending'}
                        </span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          From: <span className="font-medium">{invite.sender?.full_name || 'Unknown User'}</span>
                        </span>
                      </div>

                      {invite.tournament && (
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Tournament: <span className="font-medium">{invite.tournament.name}</span>
                          </span>
                        </div>
                      )}

                      {invite.team && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Team: <span className="font-medium">{invite.team.name}</span>
                          </span>
                        </div>
                      )}

                      {invite.message && (
                        <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          "{invite.message}"
                        </p>
                      )}

                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Sent {formatTime(invite.created_at)}</span>
                        {invite.expires_at && (
                          <>
                            <span>•</span>
                            <span>Expires {formatTime(invite.expires_at)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleRespondToInvite(invite.id, 'accepted')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRespondToInvite(invite.id, 'declined')}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Other Invites */}
      {otherInvites.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Other Invites</h3>
          <div className="space-y-3">
            {otherInvites.map((invite) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 opacity-75"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invite.status, invite.expires_at)}`}>
                        {getStatusIcon(invite.status, invite.expires_at)}
                        <span className="ml-1 capitalize">{invite.status}</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          From: <span className="font-medium">{invite.sender?.full_name || 'Unknown User'}</span>
                        </span>
                      </div>

                      {invite.tournament && (
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Tournament: <span className="font-medium">{invite.tournament.name}</span>
                          </span>
                        </div>
                      )}

                      {invite.team && (
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            Team: <span className="font-medium">{invite.team.name}</span>
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Sent {formatTime(invite.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* No Invites */}
      {invites.length === 0 && !loading && (
        <Card className="p-12 text-center">
          <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No invites yet</h3>
          <p className="text-gray-600 mb-6">You haven't received any match invitations yet</p>
          <Button onClick={() => setShowSendInvite(true)}>
            <Send className="h-4 w-4 mr-2" />
            Send Your First Invite
          </Button>
        </Card>
      )}

      {/* Send Invite Modal */}
      {showSendInvite && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Match Invite</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recipient Email *
                </label>
                <input
                  type="email"
                  value={inviteData.recipientEmail}
                  onChange={(e) => setInviteData({ ...inviteData, recipientEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="player@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={inviteData.message}
                  onChange={(e) => setInviteData({ ...inviteData, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a personal message..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowSendInvite(false);
                    setInviteData({ recipientEmail: '', message: '', teamId: teamId || '' });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={!inviteData.recipientEmail.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send Invite
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};



