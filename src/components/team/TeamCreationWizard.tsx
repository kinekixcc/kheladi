import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, UserPlus, Mail, CheckCircle, XCircle, ArrowLeft, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';

interface TeamMember {
  id: string;
  email: string;
  name: string;
  status: 'pending' | 'accepted' | 'declined';
  role: 'captain' | 'player';
}

interface TeamCreationWizardProps {
  tournamentId: string;
  tournamentName: string;
  maxTeamSize: number;
  minTeamSize: number;
  onTeamCreated: (teamData: any) => void;
  onCancel: () => void;
}

export const TeamCreationWizard: React.FC<TeamCreationWizardProps> = ({
  tournamentId,
  tournamentName,
  maxTeamSize,
  minTeamSize,
  onTeamCreated,
  onCancel
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 3;

  const addMember = () => {
    if (!inviteEmail || !inviteName) return;
    
    const newMember: TeamMember = {
      id: Date.now().toString(),
      email: inviteEmail,
      name: inviteName,
      status: 'pending',
      role: 'player'
    };

    setMembers([...members, newMember]);
    setInviteEmail('');
    setInviteName('');
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(member => member.id !== id));
  };

  const updateMemberRole = (id: string, role: 'captain' | 'player') => {
    setMembers(members.map(member => 
      member.id === id ? { ...member, role } : member
    ));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return teamName.trim().length > 0;
      case 2:
        return members.length >= minTeamSize && members.length <= maxTeamSize;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed() && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { teamService } = await import('../../lib/database');
      const { useAuth } = await import('../../context/AuthContext');
      
      const teamData = {
        name: teamName,
        description: teamDescription,
        tournament_id: tournamentId,
        sport_type: 'Mixed', // Default sport type
        max_members: maxTeamSize || 10,
        captain_id: '', // Will be set by the service
      };

      // Create team using the real team service
      const createdTeam = await teamService.createTeam(teamData, ''); // User ID will be handled by service
      
      if (createdTeam) {
        // Send invitations to members
        for (const member of members) {
          if (member.email) {
            try {
              await teamService.sendTeamInvitation(
                createdTeam.id,
                '', // Inviter ID will be handled by service
                member.email,
                `You've been invited to join ${teamName} for ${tournamentName}`
              );
            } catch (inviteError) {
              console.warn(`Failed to send invitation to ${member.email}:`, inviteError);
            }
          }
        }
        
        onTeamCreated(createdTeam);
      }
    } catch (error) {
      console.error('Failed to create team:', error);
      // Show error to user
      if (error instanceof Error) {
        alert(`Failed to create team: ${error.message}`);
      } else {
        alert('Failed to create team. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {Array.from({ length: totalSteps }, (_, index) => (
        <div key={index} className="flex items-center">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            index + 1 < currentStep 
              ? 'bg-green-500 text-white' 
              : index + 1 === currentStep 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-600'
          }`}>
            {index + 1 < currentStep ? <CheckCircle className="w-4 h-4" /> : index + 1}
          </div>
          {index < totalSteps - 1 && (
            <div className={`w-16 h-1 mx-2 ${
              index + 1 < currentStep ? 'bg-green-500' : 'bg-gray-200'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <Trophy className="w-16 h-16 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Create Your Team</h2>
        <p className="text-gray-600">Join {tournamentName} with your team</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Name *
        </label>
        <Input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          placeholder="Enter your team name"
          className="w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Team Description
        </label>
        <textarea
          value={teamDescription}
          onChange={(e) => setTeamDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Tell us about your team..."
        />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Team Requirements</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Minimum team size: {minTeamSize} players</li>
          <li>• Maximum team size: {maxTeamSize} players</li>
          <li>• You'll be the team captain</li>
        </ul>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <Users className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Add Team Members</h2>
        <p className="text-gray-600">Invite your teammates to join</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Teammate Name
          </label>
          <Input
            type="text"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            placeholder="Enter name"
            className="w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address
          </label>
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="Enter email"
            className="w-full"
          />
        </div>
      </div>

      <Button
        onClick={addMember}
        disabled={!inviteEmail || !inviteName}
        className="w-full md:w-auto"
      >
        <UserPlus className="w-4 h-4 mr-2" />
        Add Teammate
      </Button>

      <div className="space-y-3">
        <h4 className="font-medium text-gray-900">Team Members ({members.length}/{maxTeamSize})</h4>
        
        {members.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-600">
                  {member.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-500">{member.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={member.role}
                onChange={(e) => updateMemberRole(member.id, e.target.value as 'captain' | 'player')}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="player">Player</option>
                <option value="captain">Captain</option>
              </select>
              
              <button
                onClick={() => removeMember(member.id)}
                className="text-red-500 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {members.length > 0 && (
        <div className={`p-3 rounded-lg ${
          members.length >= minTeamSize && members.length <= maxTeamSize
            ? 'bg-green-50 text-green-700'
            : 'bg-yellow-50 text-yellow-700'
        }`}>
          <p className="text-sm">
            {members.length >= minTeamSize && members.length <= maxTeamSize
              ? `✅ Team size is perfect! (${members.length} players)`
              : members.length < minTeamSize
                ? `⚠️ Need at least ${minTeamSize} players (currently ${members.length})`
                : `⚠️ Maximum ${maxTeamSize} players allowed (currently ${members.length})`
            }
          </p>
        </div>
      )}
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Review & Create</h2>
        <p className="text-gray-600">Review your team details before creating</p>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg space-y-4">
        <h4 className="font-medium text-gray-900">Team Information</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Team Name</p>
            <p className="font-medium">{teamName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Tournament</p>
            <p className="font-medium">{tournamentName}</p>
          </div>
        </div>

        {teamDescription && (
          <div>
            <p className="text-sm text-gray-500">Description</p>
            <p className="font-medium">{teamDescription}</p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500">Team Members ({members.length})</p>
          <div className="space-y-2 mt-2">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between p-2 bg-white rounded">
                <span className="font-medium">{member.name}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  member.role === 'captain' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {member.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Your team will be created</li>
          <li>• Invitations will be sent to all teammates</li>
          <li>• Teammates can accept/decline invitations</li>
          <li>• You can manage your team from the dashboard</li>
        </ul>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {renderStepIndicator()}
          
          <AnimatePresence mode="wait">
            {renderCurrentStep()}
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <Button
              variant="outline"
              onClick={currentStep === 1 ? onCancel : prevStep}
              disabled={loading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            {currentStep < totalSteps ? (
              <Button
                onClick={nextStep}
                disabled={!canProceed() || loading}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? 'Creating Team...' : 'Create Team'}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};
