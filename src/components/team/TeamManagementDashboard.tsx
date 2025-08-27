import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  UserPlus, 
  Settings, 
  Trophy, 
  Calendar, 
  MapPin, 
  DollarSign,
  Edit,
  Trash2,
  Crown,
  User,
  Mail,
  Phone,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'captain' | 'player';
  status: 'active' | 'inactive' | 'pending';
  joinedAt: Date;
  avatar?: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  tournamentName: string;
  tournamentId: string;
  maxTeamSize: number;
  currentMembers: number;
  status: 'active' | 'pending' | 'disqualified';
  createdAt: Date;
  entryFee: number;
  entryFeeType: 'per_player' | 'per_team';
  paymentStatus: 'pending' | 'paid' | 'failed';
}

interface TeamManagementDashboardProps {
  team: Team;
  members: TeamMember[];
  onUpdateTeam: (teamData: Partial<Team>) => void;
  onRemoveMember: (memberId: string) => void;
  onInviteMember: (email: string, name: string) => void;
  onUpdateMemberRole: (memberId: string, role: 'captain' | 'player') => void;
}

export const TeamManagementDashboard: React.FC<TeamManagementDashboardProps> = ({
  team,
  members,
  onUpdateTeam,
  onRemoveMember,
  onInviteMember,
  onUpdateMemberRole
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: ''
  });

  const handleEditSubmit = () => {
    onUpdateTeam(editForm);
    setIsEditing(false);
  };

  const handleInviteSubmit = () => {
    if (inviteEmail && inviteName) {
      onInviteMember(inviteEmail, inviteName);
      setInviteEmail('');
      setInviteName('');
      setShowInviteForm(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'disqualified':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMemberStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-600" />;
    }
  };

  const canInviteMore = team.currentMembers < team.maxTeamSize;

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Trophy className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{team.name}</h1>
              <p className="text-gray-600">{team.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(team.status)}`}>
                  {team.status.charAt(0).toUpperCase() + team.status.slice(1)}
                </span>
                <span className="text-sm text-gray-500">
                  {team.currentMembers}/{team.maxTeamSize} members
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditForm({ name: team.name, description: team.description });
                setIsEditing(true);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Team
            </Button>
            <Button
              onClick={() => setShowInviteForm(true)}
              disabled={!canInviteMore}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Member
            </Button>
          </div>
        </div>

        {/* Team Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Trophy className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{team.tournamentName}</p>
            <p className="text-sm text-gray-600">Tournament</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{team.currentMembers}</p>
            <p className="text-sm text-gray-600">Members</p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {team.entryFeeType === 'per_team' ? team.entryFee : team.entryFee * team.currentMembers}
            </p>
            <p className="text-sm text-gray-600">
              {team.entryFeeType === 'per_team' ? 'Team Fee' : 'Total Fees'}
            </p>
          </div>
          
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {new Date(team.createdAt).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-600">Created</p>
          </div>
        </div>
      </Card>

      {/* Team Members */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Team Members</h2>
          <div className="text-sm text-gray-500">
            {team.currentMembers}/{team.maxTeamSize} members
          </div>
        </div>

        <div className="space-y-4">
          {members.map((member) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <span className="text-lg font-medium text-gray-600">
                      {member.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900">{member.name}</h3>
                    {member.role === 'captain' && (
                      <Crown className="w-4 h-4 text-yellow-500" />
                    )}
                    {getMemberStatusIcon(member.status)}
                  </div>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  {member.phone && (
                    <p className="text-sm text-gray-500">{member.phone}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    Joined {new Date(member.joinedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <select
                  value={member.role}
                  onChange={(e) => onUpdateMemberRole(member.id, e.target.value as 'captain' | 'player')}
                  className="text-sm border border-gray-300 rounded px-2 py-1"
                  disabled={member.role === 'captain'}
                >
                  <option value="player">Player</option>
                  <option value="captain">Captain</option>
                </select>
                
                {member.role !== 'captain' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveMember(member.id)}
                    className="text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {!canInviteMore && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center text-yellow-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="text-sm font-medium">
                Team is at maximum capacity ({team.maxTeamSize} members)
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Payment Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Status</h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="font-medium text-gray-900">Entry Fee</p>
            <p className="text-sm text-gray-600">
              {team.entryFeeType === 'per_team' 
                ? `रू ${team.entryFee} per team` 
                : `रू ${team.entryFee} per player`
              }
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(team.paymentStatus)}`}>
            {team.paymentStatus.charAt(0).toUpperCase() + team.paymentStatus.slice(1)}
          </span>
        </div>
      </Card>

      {/* Edit Team Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Team</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Team Name
                  </label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    placeholder="Enter team name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter team description"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleEditSubmit}>
                  Save Changes
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Invite Member Modal */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite Team Member</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <Input
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="Enter member name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                  Cancel
                </Button>
                <Button onClick={handleInviteSubmit} disabled={!inviteEmail || !inviteName}>
                  Send Invitation
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
