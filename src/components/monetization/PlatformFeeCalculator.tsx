import React from 'react';
import { Calculator, Info, Users } from 'lucide-react';
import { Card } from '../ui/Card';
import { PLATFORM_FEES } from '../../types';

interface PlatformFeeCalculatorProps {
  entryFee: number;
  maxTeams: number;
  teamSizeMax: number;
  entryFeeType: 'per_player' | 'per_team';
  registrationMode: 'individual' | 'team' | 'hybrid';
}

export const PlatformFeeCalculator: React.FC<PlatformFeeCalculatorProps> = ({
  entryFee,
  maxTeams,
  teamSizeMax,
  entryFeeType,
  registrationMode
}) => {
  // Calculate total revenue based on entry fee type
  let totalRevenue: number;
  let displayLabel: string;
  let displayValue: number;
  
  if (entryFeeType === 'per_team') {
    // Per team: entry fee × max teams
    totalRevenue = entryFee * maxTeams;
    displayLabel = "Entry Fee per Team:";
    displayValue = entryFee;
  } else {
    // Per player: entry fee × max teams × team size
    totalRevenue = entryFee * maxTeams * teamSizeMax;
    displayLabel = "Entry Fee per Player:";
    displayValue = entryFee;
  }
  
  const commissionRate = PLATFORM_FEES.find(f => f.type === 'tournament_commission')?.percentage || 5;
  const platformCommission = (totalRevenue * commissionRate) / 100;
  const organizerEarnings = totalRevenue - platformCommission;

  return (
    <Card className="p-6">
      <div className="flex items-center mb-4">
        <Calculator className="h-5 w-5 text-blue-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">Revenue Breakdown</h3>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">{displayLabel}</span>
          <span className="font-medium">रू {displayValue.toLocaleString()}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-gray-600">
            {entryFeeType === 'per_team' ? 'Max Teams:' : 'Expected Participants:'}
          </span>
          <span className="font-medium">
            {entryFeeType === 'per_team' ? maxTeams : maxTeams * teamSizeMax}
          </span>
        </div>
        
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-gray-600">Total Revenue:</span>
          <span className="text-semibold text-green-600">रू {totalRevenue.toLocaleString()}</span>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600 flex items-center">
              Platform Commission ({commissionRate}%)
              <Info className="h-3 w-3 ml-1 text-gray-400" />
            </span>
            <span className="text-red-600">-रू {platformCommission.toLocaleString()}</span>
          </div>
          
          <div className="flex justify-between items-center text-sm border-t pt-2">
            <span className="text-gray-600">Total Platform Fees:</span>
            <span className="text-red-600 font-medium">-रू {platformCommission.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex justify-between items-center border-t pt-2">
          <span className="text-lg font-semibold text-gray-900">Your Earnings:</span>
          <span className="text-xl font-bold text-green-600">रू {organizerEarnings.toLocaleString()}</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-800">
          <Info className="h-3 w-3 inline mr-1" />
          Platform fees help us maintain the service, provide customer support, and continuously improve the platform.
        </p>
      </div>
    </Card>
  );
};