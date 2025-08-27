import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Trash2, ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  experience_level: 'beginner' | 'intermediate' | 'advanced' | 'professional';
}

interface TeamCreationWizardProps {
  tournament: any;
  onBack: () => void;
  onTeamCreated: (team: any) => void;
}

export const TeamCreationWizard: React.FC<TeamCreationWizardProps> = ({
  tournament,
  onBack,
  onTeamCreated
}) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Team details
  const [teamName, setTeamName] = useState('');
  const [teamDescription, setTeamDescription] = useState('');
  
  // Team members
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      name: user?.full_name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      age: 18,
      experience_level: 'intermediate'
    }
  ]);

  const totalSteps = 3;
  const minTeamSize = tournament.team_size_min || 1;
  const maxTeamSize = tournament.team_size_max || 10;

  const canProceed = () => {
    if (currentStep === 1) {
      return teamName.trim().length >= 3;
    } else if (currentStep === 2) {
      return teamMembers.length >= minTeamSize && teamMembers.length <= maxTeamSize;
    }
    return true;
  };

  const addTeamMember = () => {
    if (teamMembers.length >= maxTeamSize) {
      toast.error(`Maximum team size is ${maxTeamSize} players`);
      return;
    }

    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: '',
      email: '',
      phone: '',
      age: 18,
      experience_level: 'intermediate'
    };

    setTeamMembers([...teamMembers, newMember]);
  };

  const removeTeamMember = (id: string) => {
    if (teamMembers.length <= minTeamSize) {
      toast.error(`Minimum team size is ${minTeamSize} players`);
      return;
    }
    setTeamMembers(teamMembers.filter(member => member.id !== id));
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: any) => {
    setTeamMembers(teamMembers.map(member => 
      member.id === id ? { ...member, [field]: value } : member
    ));
  };

  const validateTeamMembers = () => {
    for (const member of teamMembers) {
      if (!member.name.trim() || !member.email.trim() || !member.phone.trim()) {
        toast.error('All team members must have complete information');
        return false;
      }
      if (member.age < 13 || member.age > 100) {
        toast.error('Team member age must be between 13 and 100');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }
    if (currentStep === 2 && !validateTeamMembers()) {
      return;
    }
    setCurrentStep(Math.min(currentStep + 1, totalSteps));
  };

  const handlePrevious = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const handleCreateTeam = async () => {
    if (!validateTeamMembers()) return;

    setLoading(true);
    try {
      // Create team object
      const team = {
        name: teamName,
        description: teamDescription,
        tournament_id: tournament.id,
        captain_id: user?.id,
        captain_name: user?.full_name,
        members: teamMembers,
        size: teamMembers.length,
        created_at: new Date().toISOString()
      };

      // For now, just pass the team data to parent
      // In a real app, you'd save this to the database
      onTeamCreated(team);
      
      toast.success('Team created successfully!');
    } catch (error) {
      console.error('Error creating team:', error);
      toast.error('Failed to create team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Information</h3>
        <p className="text-gray-600">Let's start by creating your team identity</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Team Name *
          </label>
          <Input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Enter your team name"
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Choose a unique and memorable name for your team
          </p>
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
            placeholder="Tell us about your team (optional)"
          />
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Tournament Requirements</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <div>• Team size: {minTeamSize} - {maxTeamSize} players</div>
          <div>• Entry fee: रू {tournament.entry_fee_type === 'per_team' ? tournament.entry_fee : tournament.entry_fee * minTeamSize}</div>
          <div>• Available spots: {tournament.max_teams - (tournament.current_teams || 0)} teams</div>
        </div>
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
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Team Members</h3>
        <p className="text-gray-600">
          Add your team members ({teamMembers.length}/{maxTeamSize})
        </p>
      </div>

      <div className="space-y-4">
        {teamMembers.map((member, index) => (
          <Card key={member.id} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">
                Player {index + 1} {index === 0 && '(Captain)'}
              </h4>
              {index > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeTeamMember(member.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <Input
                  value={member.name}
                  onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                  placeholder="Player name"
                  disabled={index === 0} // Captain name is pre-filled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <Input
                  value={member.email}
                  onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                  placeholder="player@email.com"
                  disabled={index === 0} // Captain email is pre-filled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <Input
                  value={member.phone}
                  onChange={(e) => updateTeamMember(member.id, 'phone', e.target.value)}
                  placeholder="Phone number"
                  disabled={index === 0} // Captain phone is pre-filled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <Input
                  type="number"
                  value={member.age}
                  onChange={(e) => updateTeamMember(member.id, 'age', parseInt(e.target.value))}
                  min="13"
                  max="100"
                  disabled={index === 0} // Captain age is pre-filled
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level *</label>
                <select
                  value={member.experience_level}
                  onChange={(e) => updateTeamMember(member.id, 'experience_level', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={index === 0} // Captain experience is pre-filled
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                  <option value="professional">Professional</option>
                </select>
              </div>
            </div>
          </Card>
        ))}

        <Button
          onClick={addTeamMember}
          variant="outline"
          className="w-full"
          disabled={teamMembers.length >= maxTeamSize}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Team Member
        </Button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Review & Confirm</h3>
        <p className="text-gray-600">Review your team details before finalizing</p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-gray-900">Team Details</h4>
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              <div><span className="font-medium">Name:</span> {teamName}</div>
              <div><span className="font-medium">Description:</span> {teamDescription || 'No description'}</div>
              <div><span className="font-medium">Size:</span> {teamMembers.length} players</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900">Team Members</h4>
            <div className="mt-2 space-y-2">
              {teamMembers.map((member, index) => (
                <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {member.name} {index === 0 && <span className="text-blue-600 text-xs">(Captain)</span>}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.email} • {member.phone} • Age: {member.age}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs bg-gray-200 px-2 py-1 rounded capitalize">
                    {member.experience_level}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900">Tournament Registration</h4>
            <div className="mt-2 space-y-2 text-sm text-gray-600">
              <div><span className="font-medium">Tournament:</span> {tournament.name}</div>
              <div><span className="font-medium">Entry Fee:</span> रू {tournament.entry_fee_type === 'per_team' ? tournament.entry_fee : tournament.entry_fee * teamMembers.length}</div>
              <div><span className="font-medium">Team Count:</span> {tournament.current_teams || 0} / {tournament.max_teams}</div>
            </div>
          </div>
        </div>
      </Card>
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
        return renderStep1();
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Registration Type
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Create Team for {tournament.name}
        </h1>
        
        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="mb-8">
        {renderCurrentStep()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep < totalSteps ? (
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
          >
            Next
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={handleCreateTeam}
            loading={loading}
            disabled={!canProceed()}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Create Team & Register
          </Button>
        )}
      </div>
    </div>
  );
};
