import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Mail,
  CheckCircle,
  XCircle,
  Plus,
  Settings,
  Crown,
  User,
  Edit,
  Trash2,
  LogOut,
  Trophy,
  Calendar,
  MapPin
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { teamService, TeamInvitation, TeamWithMembers, CreateTeamData } from '../../lib/teamService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface PlayerTeamManagementProps {
  onClose?: () => void;
}

export const PlayerTeamManagement: React.FC<PlayerTeamManagementProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<TeamWithMembers[]>([]);
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'invitations'>('overview');
  
  // Team creation state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormData, setCreateFormData] = useState<CreateTeamData>({
    name: '',
    description: '',
    sport_type: '',
    max_members: 5
  });
  
  // Team management state
  const [selectedTeam, setSelectedTeam] = useState<TeamWithMembers | null>(null);
  const [showTeamDetails, setShowTeamDetails] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [userTeams, userInvitations] = await Promise.all([
        teamService.getUserTeams(user.id),
        teamService.getUserTeamInvitations(user.id)
      ]);
      
      setTeams(userTeams);
      setInvitations(userInvitations);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!user || !createFormData.name.trim() || !createFormData.sport_type.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const newTeam = await teamService.createTeam(createFormData, user.id);
      if (newTeam) {
        toast.success('Team created successfully!');
        setCreateFormData({
          name: '',
          description: '',
          sport_type: '',
          max_members: 5
        });
        setShowCreateForm(false);
        loadData(); // Refresh data
      } else {
        toast.error('Failed to create team');
      }
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  const handleAcceptInvitation = async (invitationId: string) => {
    try {
      const success = await teamService.acceptTeamInvitation(invitationId);
      if (success) {
        toast.success('Team invitation accepted!');
        loadData(); // Refresh data
      } else {
        toast.error('Failed to accept invitation');
      }
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    }
  };

  const handleDeclineInvitation = async (invitationId: string) => {
    try {
      const success = await teamService.declineTeamInvitation(invitationId);
      if (success) {
        toast.success('Team invitation declined');
        loadData(); // Refresh data
      } else {
        toast.error('Failed to decline invitation');
      }
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast.error('Failed to decline invitation');
    }
  };

  const handleSendInvitation = async (teamId: string) => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      const invitation = await teamService.sendTeamInvitation(
        teamId,
        user!.id,
        inviteEmail,
        inviteMessage
      );
      
      if (invitation) {
        toast.success('Team invitation sent successfully!');
        setInviteEmail('');
        setInviteMessage('');
      } else {
        toast.error('Failed to send invitation');
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to leave this team?')) return;

    try {
      const success = await teamService.leaveTeam(user.id, teamId);
      if (success) {
        toast.success('You have left the team');
        loadData(); // Refresh data
      } else {
        toast.error('Failed to leave team');
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    if (!user) return;
    
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) return;

    try {
      const success = await teamService.deleteTeam(teamId, user.id);
      if (success) {
        toast.success('Team deleted successfully');
        loadData(); // Refresh data
        setShowTeamDetails(false);
        setSelectedTeam(null);
      } else {
        toast.error('Failed to delete team');
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  const getMemberRole = (team: TeamWithMembers, userId: string) => {
    const member = team.members.find(m => m.user_id === userId);
    return member?.role || 'member';
  };

  const isCaptain = (team: TeamWithMembers, userId: string) => {
    return team.captain_id === userId;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading teams...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Team Management</h2>
          <p className="text-gray-600">Manage your teams and invitations</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setActiveTab('overview')}
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            size="sm"
          >
            <Users className="h-4 w-4 mr-2" />
            My Teams
          </Button>
          <Button
            onClick={() => setActiveTab('invitations')}
            variant={activeTab === 'invitations' ? 'default' : 'outline'}
            size="sm"
          >
            <Mail className="h-4 w-4 mr-2" />
            Invitations ({invitations.length})
          </Button>
          <Button
            onClick={() => setActiveTab('create')}
            variant={activeTab === 'create' ? 'default' : 'outline'}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Team
          </Button>
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Teams Grid */}
          {teams.length === 0 ? (
            <Card className="p-8 text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Teams Yet</h3>
              <p className="text-gray-600 mb-4">
                You haven't joined any teams yet. Create a new team or accept team invitations to get started.
              </p>
              <Button onClick={() => setActiveTab('create')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Team
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teams.map((team) => (
                <Card key={team.id} className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{team.name}</h3>
                      {team.description && (
                        <p className="text-sm text-gray-600 mb-3">{team.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {team.current_members}/{team.max_members}
                        </span>
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {team.sport_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCaptain(team, user?.id || '') && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Captain
                        </span>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedTeam(team);
                          setShowTeamDetails(true);
                        }}
                        size="sm"
                        variant="outline"
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        Captain: {team.captain?.full_name || 'Unknown'}
                      </span>
                      {!isCaptain(team, user?.id || '') && (
                        <Button
                          onClick={() => handleLeaveTeam(team.id)}
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                        >
                          <LogOut className="h-4 w-4 mr-1" />
                          Leave
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Create Team Tab */}
      {activeTab === 'create' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Team</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Name *
                </label>
                <Input
                  value={createFormData.name}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sport Type *
                </label>
                <Input
                  value={createFormData.sport_type}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, sport_type: e.target.value }))}
                  placeholder="e.g., Football, Basketball, Cricket"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={createFormData.description}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your team..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Members
                </label>
                <Input
                  type="number"
                  value={createFormData.max_members}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, max_members: parseInt(e.target.value) || 5 }))}
                  min={2}
                  max={20}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button onClick={handleCreateTeam} className="flex-1">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Team
                </Button>
                <Button
                  onClick={() => setActiveTab('overview')}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {invitations.length === 0 ? (
            <Card className="p-8 text-center">
              <Mail className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Team Invitations</h3>
              <p className="text-gray-600">
                You don't have any pending team invitations at the moment.
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {invitations.map((invitation) => (
                <Card key={invitation.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">
                        Invitation to join {invitation.team?.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        Invited by: {invitation.inviter?.full_name || 'Unknown'}
                      </p>
                      {invitation.message && (
                        <p className="text-sm text-gray-700 mb-3 italic">"{invitation.message}"</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Trophy className="h-4 w-4" />
                          {invitation.team?.sport_type || 'Unknown Sport'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {invitation.team?.current_members || 0}/{invitation.team?.max_members || 0} members
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Expires: {new Date(invitation.expires_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        onClick={() => handleAcceptInvitation(invitation.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        onClick={() => handleDeclineInvitation(invitation.id)}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Decline
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Team Details Modal */}
      <AnimatePresence>
        {showTeamDetails && selectedTeam && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {selectedTeam.name} - Team Details
                  </h3>
                  <Button
                    onClick={() => setShowTeamDetails(false)}
                    variant="outline"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                {/* Team Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Team Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p><span className="font-medium">Sport:</span> {selectedTeam.sport_type}</p>
                      <p><span className="font-medium">Members:</span> {selectedTeam.current_members}/{selectedTeam.max_members}</p>
                      <p><span className="font-medium">Captain:</span> {selectedTeam.captain?.full_name}</p>
                      {selectedTeam.description && (
                        <p><span className="font-medium">Description:</span> {selectedTeam.description}</p>
                      )}
                    </div>
                  </div>

                  {/* Invite New Member */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Invite New Member</h4>
                    <div className="space-y-3">
                      <Input
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="Enter email address"
                        type="email"
                      />
                      <textarea
                        value={inviteMessage}
                        onChange={(e) => setInviteMessage(e.target.value)}
                        placeholder="Optional message..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                      />
                      <Button
                        onClick={() => handleSendInvitation(selectedTeam.id)}
                        size="sm"
                        className="w-full"
                      >
                        <Mail className="h-4 w-4 mr-2" />
                        Send Invitation
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Team Members */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Team Members</h4>
                  <div className="space-y-2">
                    {selectedTeam.members.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.user?.full_name || 'Unknown User'}
                            </p>
                            <p className="text-sm text-gray-500">
                              {member.role === 'captain' ? 'Captain' : 
                               member.role === 'vice_captain' ? 'Vice Captain' : 'Member'}
                            </p>
                          </div>
                        </div>
                        
                        {isCaptain(selectedTeam, user?.id || '') && member.user_id !== user?.id && (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => {
                                // TODO: Implement transfer captaincy
                                toast.info('Transfer captaincy feature coming soon');
                              }}
                              size="sm"
                              variant="outline"
                            >
                              <Crown className="h-4 w-4 mr-1" />
                              Make Captain
                            </Button>
                            <Button
                              onClick={() => {
                                // TODO: Implement remove member
                                toast.info('Remove member feature coming soon');
                              }}
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Actions */}
                <div className="flex gap-3 pt-4 border-t">
                  {isCaptain(selectedTeam, user?.id || '') ? (
                    <>
                      <Button
                        onClick={() => {
                          // TODO: Implement edit team
                          toast.info('Edit team feature coming soon');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Team
                      </Button>
                      <Button
                        onClick={() => handleDeleteTeam(selectedTeam.id)}
                        variant="outline"
                        className="text-red-600 hover:text-red-700 flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Team
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => handleLeaveTeam(selectedTeam.id)}
                      variant="outline"
                      className="text-red-600 hover:text-red-700 flex-1"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Leave Team
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

