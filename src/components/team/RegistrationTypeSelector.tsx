import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, User, Trophy, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface TournamentInfo {
  id: string;
  name: string;
  registrationMode: 'individual' | 'team' | 'hybrid';
  maxParticipants: number;
  maxTeams: number;
  teamSizeMin: number;
  teamSizeMax: number;
  entryFee: number;
  entryFeeType: 'per_player' | 'per_team';
  currentParticipants: number;
  currentTeams: number;
}

interface RegistrationTypeSelectorProps {
  tournament: TournamentInfo;
  onSelectIndividual: () => void;
  onSelectTeam: () => void;
  onClose: () => void;
}

export const RegistrationTypeSelector: React.FC<RegistrationTypeSelectorProps> = ({
  tournament,
  onSelectIndividual,
  onSelectTeam,
  onClose
}) => {
  const [selectedType, setSelectedType] = useState<'individual' | 'team' | null>(null);

  const canRegisterIndividual = tournament.registrationMode === 'individual' || tournament.registrationMode === 'hybrid';
  const canRegisterTeam = tournament.registrationMode === 'team' || tournament.registrationMode === 'hybrid';
  
  const individualSlotsAvailable = tournament.maxParticipants - tournament.currentParticipants;
  const teamSlotsAvailable = tournament.maxTeams - tournament.currentTeams;
  
  const individualFee = tournament.entryFeeType === 'per_player' ? tournament.entryFee : tournament.entryFee;
  const teamFee = tournament.entryFeeType === 'per_team' ? tournament.entryFee : tournament.entryFee * tournament.teamSizeMax;

  const handleContinue = () => {
    if (selectedType === 'individual') {
      onSelectIndividual();
    } else if (selectedType === 'team') {
      onSelectTeam();
    }
  };

  const getRegistrationModeDescription = () => {
    switch (tournament.registrationMode) {
      case 'individual':
        return 'This tournament only accepts individual player registrations.';
      case 'team':
        return 'This tournament only accepts team registrations. Team captains register and pay for the entire team.';
      case 'hybrid':
        return 'This tournament accepts both individual players and teams. Choose your preferred registration method.';
      default:
        return '';
    }
  };

  const getAvailabilityStatus = (type: 'individual' | 'team') => {
    if (type === 'individual') {
      if (individualSlotsAvailable <= 0) {
        return { available: false, message: 'No individual slots available', color: 'text-red-600' };
      } else if (individualSlotsAvailable <= 5) {
        return { available: true, message: `Only ${individualSlotsAvailable} slots left!`, color: 'text-yellow-600' };
      } else {
        return { available: true, message: `${individualSlotsAvailable} slots available`, color: 'text-green-600' };
      }
    } else {
      if (teamSlotsAvailable <= 0) {
        return { available: false, message: 'No team slots available', color: 'text-red-600' };
      } else if (teamSlotsAvailable <= 2) {
        return { available: true, message: `Only ${teamSlotsAvailable} team slots left!`, color: 'text-yellow-600' };
      } else {
        return { available: true, message: `${teamSlotsAvailable} team slots available`, color: 'text-green-600' };
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="text-center mb-8">
            <Trophy className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Tournament</h2>
            <h3 className="text-xl text-gray-600 mb-4">{tournament.name}</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {getRegistrationModeDescription()}
            </p>
          </div>

          {/* Registration Options */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Individual Registration */}
            {canRegisterIndividual && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedType === 'individual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedType('individual')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Individual Player</h3>
                  </div>
                  {selectedType === 'individual' && (
                    <CheckCircle className="w-6 h-6 text-blue-500" />
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-semibold text-gray-900">रू {individualFee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Available Slots:</span>
                    <span className={`font-semibold ${getAvailabilityStatus('individual').color}`}>
                      {getAvailabilityStatus('individual').message}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Perfect for:</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Solo players</li>
                    <li>• Players without a team</li>
                    <li>• Quick registration</li>
                    <li>• Individual performance tracking</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Team Registration */}
            {canRegisterTeam && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`border-2 rounded-lg p-6 cursor-pointer transition-all ${
                  selectedType === 'team'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedType('team')}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">Team Registration</h3>
                  </div>
                  {selectedType === 'team' && (
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  )}
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-semibold text-gray-900">रू {teamFee}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Team Size:</span>
                    <span className="font-semibold text-gray-900">
                      {tournament.teamSizeMin}-{tournament.teamSizeMax} players
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Available Slots:</span>
                    <span className={`font-semibold ${getAvailabilityStatus('team').color}`}>
                      {getAvailabilityStatus('team').message}
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 p-3 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">Perfect for:</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Pre-formed teams</li>
                    <li>• Friends playing together</li>
                    <li>• Team strategy games</li>
                    <li>• Shared payment (captain pays)</li>
                  </ul>
                </div>
              </motion.div>
            )}
          </div>

          {/* Important Notes */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900 mb-2">Important Information</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• <strong>Entry Fee:</strong> {tournament.entryFeeType === 'per_team' ? 'Team captains pay one fee for the entire team' : 'Each player pays individually'}</li>
                  <li>• <strong>Team Management:</strong> Team captains can invite, remove, and manage team members</li>
                  <li>• <strong>Registration Deadline:</strong> Make sure to complete registration before the deadline</li>
                  <li>• <strong>Payment:</strong> Payment is required to confirm your registration</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>

            <Button
              onClick={handleContinue}
              disabled={!selectedType}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {/* Selection Summary */}
          {selectedType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="font-medium text-blue-900">
                    You've selected: <strong>{selectedType === 'individual' ? 'Individual Player' : 'Team Registration'}</strong>
                  </p>
                  <p className="text-sm text-blue-700">
                    {selectedType === 'individual' 
                      ? `You'll pay रू ${individualFee} and register as an individual player.`
                      : `You'll pay रू ${teamFee} and create/manage a team of ${tournament.teamSizeMin}-${tournament.teamSizeMax} players.`
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </Card>
    </div>
  );
};
