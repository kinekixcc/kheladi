import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Users, ArrowRight, Info } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface RegistrationTypeSelectorProps {
  tournament: any;
  onSelectType: (type: 'individual' | 'team') => void;
  onBack: () => void;
}

export const RegistrationTypeSelector: React.FC<RegistrationTypeSelectorProps> = ({
  tournament,
  onSelectType,
  onBack
}) => {
  const [selectedType, setSelectedType] = useState<'individual' | 'team' | null>(null);

  const getRegistrationInfo = () => {
    if (tournament.registration_mode === 'individual') {
      return {
        individual: {
          available: true,
          maxCount: tournament.max_participants,
          currentCount: tournament.current_participants || 0,
          fee: tournament.entry_fee_type === 'per_player' ? tournament.entry_fee : tournament.entry_fee / (tournament.team_size_max || 1),
          description: 'Register as an individual player'
        },
        team: {
          available: false,
          reason: 'This tournament only accepts individual players'
        }
      };
    } else if (tournament.registration_mode === 'team') {
      return {
        individual: {
          available: false,
          reason: 'This tournament only accepts team registrations'
        },
        team: {
          available: true,
          maxCount: tournament.max_teams,
          currentCount: tournament.current_teams || 0,
          fee: tournament.entry_fee_type === 'per_team' ? tournament.entry_fee : tournament.entry_fee * (tournament.team_size_min || 1),
          description: 'Register as a team captain'
        }
      };
    } else { // hybrid
      return {
        individual: {
          available: true,
          maxCount: tournament.max_participants,
          currentCount: tournament.current_participants || 0,
          fee: tournament.entry_fee_type === 'per_player' ? tournament.entry_fee : tournament.entry_fee / (tournament.team_size_max || 1),
          description: 'Register as an individual player'
        },
        team: {
          available: true,
          maxCount: tournament.max_teams,
          currentCount: tournament.current_teams || 0,
          fee: tournament.entry_fee_type === 'per_team' ? tournament.entry_fee : tournament.entry_fee * (tournament.team_size_min || 1),
          description: 'Register as a team captain'
        }
      };
    }
  };

  const info = getRegistrationInfo();

  const handleContinue = () => {
    if (selectedType) {
      onSelectType(selectedType);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="mb-4"
        >
          ← Back to Tournament
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Register for {tournament.name}
        </h1>
        <p className="text-gray-600">
          Choose how you want to participate in this tournament
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Individual Registration Option */}
        <Card 
          className={`p-6 cursor-pointer transition-all duration-200 ${
            selectedType === 'individual' 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:shadow-lg'
          }`}
          onClick={() => info.individual.available && setSelectedType('individual')}
        >
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              info.individual.available 
                ? selectedType === 'individual' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                : 'bg-gray-200 text-gray-400'
            }`}>
              <User className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Individual Player
            </h3>
            
            {info.individual.available ? (
              <>
                <p className="text-gray-600 mb-4">
                  {info.individual.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Available Spots:</span>
                    <span className="font-semibold">
                      {info.individual.maxCount - info.individual.currentCount} / {info.individual.maxCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Fee:</span>
                    <span className="font-semibold text-green-600">
                      रू {info.individual.fee}
                    </span>
                  </div>
                </div>
                
                {selectedType === 'individual' && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-center text-blue-700">
                      <Info className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500">
                <p className="mb-2">{info.individual.reason}</p>
                <div className="text-xs bg-gray-100 p-2 rounded">
                  This tournament is designed for team-based competition
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Team Registration Option */}
        <Card 
          className={`p-6 cursor-pointer transition-all duration-200 ${
            selectedType === 'team' 
              ? 'ring-2 ring-blue-500 bg-blue-50' 
              : 'hover:shadow-lg'
          }`}
          onClick={() => info.team.available && setSelectedType('team')}
        >
          <div className="text-center">
            <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
              info.team.available 
                ? selectedType === 'team' ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-600'
                : 'bg-gray-200 text-gray-400'
            }`}>
              <Users className="w-8 h-8" />
            </div>
            
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Team Captain
            </h3>
            
            {info.team.available ? (
              <>
                <p className="text-gray-600 mb-4">
                  {info.team.description}
                </p>
                
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Available Teams:</span>
                    <span className="font-semibold">
                      {info.team.maxCount - info.team.currentCount} / {info.team.maxCount}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Team Size:</span>
                    <span className="font-semibold">
                      {tournament.team_size_min} - {tournament.team_size_max} players
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entry Fee:</span>
                    <span className="font-semibold text-green-600">
                      रू {info.team.fee}
                    </span>
                  </div>
                </div>
                
                {selectedType === 'team' && (
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                    <div className="flex items-center text-blue-700">
                      <Info className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Selected</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-gray-500">
                <p className="mb-2">{info.team.reason}</p>
                <div className="text-xs bg-gray-100 p-2 rounded">
                  This tournament is designed for individual competition
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Tournament Info */}
      <Card className="p-6 bg-gray-50">
        <h4 className="font-semibold text-gray-900 mb-3">Tournament Details</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Registration Mode:</span>
            <div className="font-medium capitalize">{tournament.registration_mode}</div>
          </div>
          <div>
            <span className="text-gray-600">Entry Fee Type:</span>
            <div className="font-medium capitalize">{tournament.entry_fee_type?.replace('_', ' ')}</div>
          </div>
          <div>
            <span className="text-gray-600">Max Teams:</span>
            <div className="font-medium">{tournament.max_teams}</div>
          </div>
          <div>
            <span className="text-gray-600">Max Participants:</span>
            <div className="font-medium">{tournament.max_participants}</div>
          </div>
        </div>
      </Card>

      {/* Continue Button */}
      <div className="mt-8 text-center">
        <Button
          onClick={handleContinue}
          disabled={!selectedType}
          className="px-8 py-3 text-lg"
        >
          Continue with {selectedType === 'individual' ? 'Individual' : 'Team'} Registration
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    </div>
  );
};
