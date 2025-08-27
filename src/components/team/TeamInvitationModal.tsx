import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Mail, CheckCircle, XCircle, UserPlus, Clock, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TeamInvitation {
  id: string;
  teamName: string;
  tournamentName: string;
  inviterName: string;
  inviterEmail: string;
  status: 'pending' | 'accepted' | 'declined';
  expiresAt: Date;
  teamSize: number;
  currentMembers: number;
}

interface TeamInvitationModalProps {
  invitations: TeamInvitation[];
  onAccept: (invitationId: string) => void;
  onDecline: (invitationId: string) => void;
  onClose: () => void;
}

export const TeamInvitationModal: React.FC<TeamInvitationModalProps> = ({
  invitations,
  onAccept,
  onDecline,
  onClose
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');

  const filteredInvitations = invitations.filter(invitation => {
    if (filter === 'all') return true;
    return invitation.status === filter;
  });

  const getStatusColor = (status: string) => {
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'accepted':
        return <CheckCircle className="w-4 h-4" />;
      case 'declined':
        return <XCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatExpiryDate = (date: Date) => {
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Expires today';
    if (diffDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffDays} days`;
  };

  const isExpired = (date: Date) => {
    return new Date() > date;
  };

  if (invitations.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Invitations</h3>
            <p className="text-gray-600 mb-6">
              You don't have any team invitations at the moment.
            </p>
            <Button onClick={onClose} className="w-full">
              Close
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Mail className="w-6 h-6 text-blue-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Team Invitations</h2>
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
            {(['all', 'pending', 'accepted', 'declined'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === tab
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'all' && (
                  <span className="ml-2 px-2 py-1 text-xs bg-gray-200 rounded-full">
                    {invitations.filter(inv => inv.status === tab).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Invitations List */}
          <div className="space-y-4">
            {filteredInvitations.map((invitation) => (
              <motion.div
                key={invitation.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{invitation.teamName}</h3>
                        <p className="text-sm text-gray-600">{invitation.tournamentName}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Invited by</p>
                        <p className="text-sm font-medium">{invitation.inviterName}</p>
                        <p className="text-xs text-gray-500">{invitation.inviterEmail}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Team Size</p>
                        <p className="text-sm font-medium">
                          {invitation.currentMembers}/{invitation.teamSize} players
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invitation.status)}`}>
                            {getStatusIcon(invitation.status)}
                            <span className="ml-1 capitalize">{invitation.status}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-500">
                        {formatExpiryDate(invitation.expiresAt)}
                      </div>
                      
                      {invitation.status === 'pending' && !isExpired(invitation.expiresAt) && (
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => onAccept(invitation.id)}
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            onClick={() => onDecline(invitation.id)}
                            variant="outline"
                            size="sm"
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isExpired(invitation.expiresAt) && invitation.status === 'pending' && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-red-700">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">This invitation has expired</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {filteredInvitations.length === 0 && (
            <div className="text-center py-8">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No {filter} invitations found.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};
