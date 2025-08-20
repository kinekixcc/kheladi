import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Crown, 
  UserPlus, 
  UserMinus, 
  Edit, 
  Trash2,
  Shield,
  Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { teamService } from '../../lib/database';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import toast from 'react-hot-toast';

interface TeamManagementProps {
  tournamentId: string;
  tournament: any;
  onTeamUpdate: () => void;
}

export const TeamManagement: React.FC<TeamManagementProps> = ({
  tournamentId,
  tournament,
  onTeamUpdate
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    loadTeams();
  }, [tournamentId]);

  const loadTeams = async () => {
    try {
      const tournamentTeams = await teamService.getTeamsByTournament(tournamentId);
      setTeams(tournamentTeams);
    } catch (error) {
      console.error('Error loading teams:', error);
    }
  };

  const handleCreateTeam = async (teamData: any) => {
    setLoading(true);
    try {
      const newTeam = await teamService.createTeam({
        ...teamData,
        tournament_id: tournamentId,
        captain_id: user?.id!,
        max_members: teamData.max_members || tournament.team_size || 1,
        current_members: 1
      });

      toast.success('Team created successfully!');
      setShowCreateTeam(false);
      onTeamUpdate();
      loadTeams();
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    try {
      await teamService.addTeamMember(user?.id!, teamId, 'member');
      toast.success('Joined team successfully!');
      onTeamUpdate();
      loadTeams();
    } catch (error) {
      console.error('Error joining team:', error);
      toast.error('Failed to join team');
    }
  };

  const handleLeaveTeam = async (teamId: string) => {
    try {
      await teamService.removeTeamMember(user?.id!, teamId);
      toast.success('Left team successfully!');
      onTeamUpdate();
      loadTeams();
    } catch (error) {
      console.error('Error leaving team:', error);
      toast.error('Failed to leave team');
    }
  };

  const handleRemoveMember = async (teamId: string, memberId: string) => {
    try {
      await teamService.removeTeamMember(memberId, teamId);
      toast.success('Member removed successfully!');
      onTeamUpdate();
      loadTeams();
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    }
  };

  const handleInvitePlayer = async (teamId: string) => {
    if (!inviteEmail.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      // This would integrate with the match invite system
      // For now, just show a success message
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setShowInviteModal(false);
    } catch (error) {
      console.error('Error sending invite:', error);
      toast.error('Failed to send invitation');
    }
  };

  const isUserInTeam = (team: any) => {
    return team.members?.some((member: any) => member.user_id === user?.id);
  };

  const isUserTeamCaptain = (team: any) => {
    return team.captain_id === user?.id;
  };

  const canJoinTeam = (team: any) => {
    return !isUserInTeam(team) && team.current_members < team.max_members;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 flex items-center">
          <Users className="h-5 w-5 mr-2 text-blue-600" />
          Teams ({teams.length})
        </h2>
        <Button onClick={() => setShowCreateTeam(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Team
        </Button>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No teams yet</h3>
          <p className="text-gray-600 mb-6">Be the first to create a team for this tournament</p>
          <Button onClick={() => setShowCreateTeam(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create First Team
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {teams.map((team, index) => (
            <motion.div
              key={team.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Team Header */}
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
                      {isUserTeamCaptain(team) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Crown className="h-3 w-3 mr-1" />
                          Captain
                        </span>
                      )}
                      {isUserInTeam(team) && !isUserTeamCaptain(team) && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <Shield className="h-3 w-3 mr-1" />
                          Member
                        </span>
                      )}
                    </div>

                    {/* Team Description */}
                    {team.description && (
                      <p className="text-gray-600 text-sm mb-3">{team.description}</p>
                    )}

                    {/* Team Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{team.current_members}</div>
                        <div className="text-xs text-gray-500">Members</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{team.max_members}</div>
                        <div className="text-xs text-gray-500">Max Size</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Math.round((team.current_members / team.max_members) * 100)}%
                        </div>
                        <div className="text-xs text-gray-500">Full</div>
                      </div>
                    </div>

                    {/* Team Members */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Team Members</h4>
                      <div className="space-y-2">
                        {team.members?.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              {member.role === 'captain' && <Crown className="h-4 w-4 text-yellow-600" />}
                              {member.role === 'vice_captain' && <Star className="h-4 w-4 text-blue-600" />}
                              <span className="text-sm font-medium text-gray-900">
                                {member.user?.full_name || 'Unknown Player'}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">({member.role})</span>
                            </div>
                            {isUserTeamCaptain(team) && member.user_id !== user?.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveMember(team.id, member.user_id)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Captain Info */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Crown className="h-4 w-4 text-yellow-600" />
                      <span>Captain: {team.captain?.full_name || 'Unknown'}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col space-y-2 ml-6">
                    {canJoinTeam(team) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleJoinTeam(team.id)}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Join Team
                      </Button>
                    )}

                    {isUserInTeam(team) && !isUserTeamCaptain(team) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleLeaveTeam(team.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Leave Team
                      </Button>
                    )}

                    {isUserTeamCaptain(team) && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTeam(team);
                            setShowInviteModal(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Invite Player
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTeam(team)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit Team
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <CreateTeamModal
          tournament={tournament}
          onSubmit={handleCreateTeam}
          onClose={() => setShowCreateTeam(false)}
          loading={loading}
        />
      )}

      {/* Invite Player Modal */}
      {showInviteModal && selectedTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Invite Player to {selectedTeam.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Player Email
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="player@example.com"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowInviteModal(false);
                    setSelectedTeam(null);
                    setInviteEmail('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={() => handleInvitePlayer(selectedTeam.id)}>
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

// Create Team Modal Component
interface CreateTeamModalProps {
  tournament: any;
  onSubmit: (teamData: any) => void;
  onClose: () => void;
  loading: boolean;
}

const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  tournament,
  onSubmit,
  onClose,
  loading
}) => {
  const [teamName, setTeamName] = useState('');
  const [description, setDescription] = useState('');
  const [maxMembers, setMaxMembers] = useState(tournament.team_size || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    onSubmit({
      name: teamName.trim(),
      description: description.trim(),
      max_members: maxMembers
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Team</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter team name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe your team..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Team Size
            </label>
            <input
              type="number"
              value={maxMembers}
              onChange={(e) => setMaxMembers(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              min="1"
              max={tournament.max_participants || 100}
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum {tournament.max_participants || 100} players allowed
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Team
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};



