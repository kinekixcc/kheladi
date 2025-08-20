import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Star, Award, CheckCircle, AlertTriangle, Info, Crown, Medal } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface OrganizerBadge {
  id: string;
  organizer_id: string;
  badge_type: 'verified' | 'trusted' | 'new_organizer' | 'premium' | 'elite';
  awarded_by: string;
  awarded_date: string;
  criteria_met: string[];
  notes?: string;
}

interface OrganizerBadgeSystemProps {
  organizerId: string;
  organizerName: string;
  organizerStats: {
    tournaments_hosted: number;
    total_participants: number;
    average_rating: number;
    completion_rate: number;
  };
  onBadgeUpdate?: () => void;
}

const BADGE_CRITERIA = {
  verified: {
    name: 'Verified Organizer',
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    description: 'Identity and contact information verified by admin',
    criteria: [
      'Valid contact information provided',
      'Identity verification completed',
      'Admin approval granted'
    ]
  },
  trusted: {
    name: 'Trusted Organizer',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    description: 'Proven track record of successful tournaments',
    criteria: [
      'Hosted at least 5 tournaments',
      'Average rating of 4.0 or higher',
      '95% tournament completion rate',
      'No major complaints in last 6 months'
    ]
  },
  new_organizer: {
    name: 'New Organizer',
    icon: <Star className="h-5 w-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    description: 'New to the platform, building reputation',
    criteria: [
      'Recently joined the platform',
      'First few tournaments',
      'Building track record'
    ]
  },
  premium: {
    name: 'Premium Organizer',
    icon: <Crown className="h-5 w-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    description: 'Premium subscriber with enhanced features',
    criteria: [
      'Active premium subscription',
      'Access to advanced features',
      'Priority support'
    ]
  },
  elite: {
    name: 'Elite Organizer',
    icon: <Medal className="h-5 w-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    description: 'Top-tier organizer with exceptional performance',
    criteria: [
      'Hosted 20+ tournaments',
      'Average rating of 4.5 or higher',
      '98% completion rate',
      'Community recognition'
    ]
  }
};

export const OrganizerBadgeSystem: React.FC<OrganizerBadgeSystemProps> = ({
  organizerId,
  organizerName,
  organizerStats,
  onBadgeUpdate
}) => {
  const [currentBadges, setCurrentBadges] = useState<OrganizerBadge[]>([]);
  const [selectedBadgeType, setSelectedBadgeType] = useState<string>('');
  const [badgeNotes, setBadgeNotes] = useState('');
  const [awarding, setAwarding] = useState(false);

  useEffect(() => {
    loadOrganizerBadges();
  }, [organizerId]);

  const loadOrganizerBadges = () => {
    try {
      const allBadges = JSON.parse(localStorage.getItem('organizer_badges') || '[]');
      const organizerBadges = allBadges.filter((badge: OrganizerBadge) => badge.organizer_id === organizerId);
      setCurrentBadges(organizerBadges);
    } catch (error) {
      console.error('Error loading badges:', error);
    }
  };

  const checkBadgeEligibility = (badgeType: string) => {
    const criteria = BADGE_CRITERIA[badgeType as keyof typeof BADGE_CRITERIA];
    if (!criteria) return false;

    switch (badgeType) {
      case 'verified':
        return true; // Admin can manually verify
      case 'trusted':
        return organizerStats.tournaments_hosted >= 5 && 
               organizerStats.average_rating >= 4.0 && 
               organizerStats.completion_rate >= 95;
      case 'new_organizer':
        return organizerStats.tournaments_hosted <= 2;
      case 'premium':
        return true; // Based on subscription status
      case 'elite':
        return organizerStats.tournaments_hosted >= 20 && 
               organizerStats.average_rating >= 4.5 && 
               organizerStats.completion_rate >= 98;
      default:
        return false;
    }
  };

  const awardBadge = async () => {
    if (!selectedBadgeType) {
      toast.error('Please select a badge type');
      return;
    }

    // Check if badge already exists
    const existingBadge = currentBadges.find(badge => badge.badge_type === selectedBadgeType);
    if (existingBadge) {
      toast.error('Organizer already has this badge');
      return;
    }

    setAwarding(true);
    try {
      const newBadge: OrganizerBadge = {
        id: `badge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        organizer_id: organizerId,
        badge_type: selectedBadgeType as any,
        awarded_by: 'admin',
        awarded_date: new Date().toISOString(),
        criteria_met: BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].criteria,
        notes: badgeNotes.trim() || undefined
      };

      // Save to localStorage and simulate database save
      const allBadges = JSON.parse(localStorage.getItem('organizer_badges') || '[]');
      allBadges.push(newBadge);
      localStorage.setItem('organizer_badges', JSON.stringify(allBadges));

      setCurrentBadges([...currentBadges, newBadge]);
      setSelectedBadgeType('');
      setBadgeNotes('');
      
      // Log the badge award action
      const { auditLogService } = await import('../../lib/auditLog');
      await auditLogService.logBadgeAward(
        'admin',
        'Admin',
        organizerId,
        selectedBadgeType
      );
      
      toast.success(`${BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].name} badge awarded!`);
      
      if (onBadgeUpdate) {
        onBadgeUpdate();
      }
    } catch (error) {
      console.error('Error awarding badge:', error);
      toast.error('Failed to award badge');
    } finally {
      setAwarding(false);
    }
  };

  const revokeBadge = async (badgeId: string) => {
    if (!confirm('Are you sure you want to revoke this badge?')) {
      return;
    }
    
    try {
      const allBadges = JSON.parse(localStorage.getItem('organizer_badges') || '[]');
      const badgeToRevoke = allBadges.find((badge: OrganizerBadge) => badge.id === badgeId);
      const updatedBadges = allBadges.filter((badge: OrganizerBadge) => badge.id !== badgeId);
      localStorage.setItem('organizer_badges', JSON.stringify(updatedBadges));

      setCurrentBadges(currentBadges.filter(badge => badge.id !== badgeId));
      
      // Log the badge revocation
      if (badgeToRevoke) {
        const { auditLogService } = await import('../../lib/auditLog');
        await auditLogService.logAction(
          'admin',
          'Admin',
          'REVOKE_BADGE',
          'badge',
          badgeId,
          badgeToRevoke,
          null,
          { badge_type: badgeToRevoke.badge_type }
        );
      }
      
      toast.success('Badge revoked successfully');
      
      if (onBadgeUpdate) {
        onBadgeUpdate();
      }
    } catch (error) {
      console.error('Error revoking badge:', error);
      toast.error('Failed to revoke badge');
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Badges */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Current Badges for {organizerName}
        </h3>
        
        {currentBadges.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No badges awarded yet</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentBadges.map((badge) => {
              const badgeInfo = BADGE_CRITERIA[badge.badge_type];
              return (
                <div
                  key={badge.id}
                  className={`p-4 rounded-lg border-2 ${badgeInfo.bgColor} ${badgeInfo.borderColor}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={badgeInfo.color}>
                        {badgeInfo.icon}
                      </div>
                      <h4 className="font-semibold text-gray-900">{badgeInfo.name}</h4>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => revokeBadge(badge.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{badgeInfo.description}</p>
                  <p className="text-xs text-gray-500">
                    Awarded: {new Date(badge.awarded_date).toLocaleDateString()}
                  </p>
                  {badge.notes && (
                    <p className="text-xs text-gray-600 mt-2 italic">
                      Note: {badge.notes}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Award New Badge */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Award New Badge
        </h3>
        
        {/* Organizer Stats */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Organizer Performance</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Tournaments Hosted</p>
              <p className="font-semibold">{organizerStats.tournaments_hosted}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Participants</p>
              <p className="font-semibold">{organizerStats.total_participants}</p>
            </div>
            <div>
              <p className="text-gray-600">Average Rating</p>
              <p className="font-semibold">{organizerStats.average_rating.toFixed(1)}/5.0</p>
            </div>
            <div>
              <p className="text-gray-600">Completion Rate</p>
              <p className="font-semibold">{organizerStats.completion_rate}%</p>
            </div>
          </div>
        </div>

        {/* Badge Selection */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Badge Type
            </label>
            <select
              value={selectedBadgeType}
              onChange={(e) => setSelectedBadgeType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Choose a badge...</option>
              {Object.entries(BADGE_CRITERIA).map(([type, info]) => {
                const hasThisBadge = currentBadges.some(badge => badge.badge_type === type);
                const isEligible = checkBadgeEligibility(type);
                
                return (
                  <option 
                    key={type} 
                    value={type}
                    disabled={hasThisBadge}
                  >
                    {info.name} {hasThisBadge ? '(Already Awarded)' : isEligible ? '(Eligible)' : '(Not Eligible)'}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Badge Preview */}
          {selectedBadgeType && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-full ${BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].bgColor}`}>
                  <div className={BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].color}>
                    {BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-blue-900">
                    {BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].name}
                  </h4>
                  <p className="text-sm text-blue-800 mb-2">
                    {BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].description}
                  </p>
                  <div className="text-xs text-blue-700">
                    <p className="font-medium mb-1">Criteria:</p>
                    <ul className="list-disc list-inside space-y-1">
                      {BADGE_CRITERIA[selectedBadgeType as keyof typeof BADGE_CRITERIA].criteria.map((criterion, index) => (
                        <li key={index}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Eligibility Check */}
                  <div className="mt-2">
                    {checkBadgeEligibility(selectedBadgeType) ? (
                      <div className="flex items-center space-x-1 text-green-700">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Eligible for this badge</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-red-700">
                        <AlertTriangle className="h-3 w-3" />
                        <span className="text-xs">Does not meet criteria (admin override available)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Admin Notes (Optional)
            </label>
            <textarea
              value={badgeNotes}
              onChange={(e) => setBadgeNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Add any notes about why this badge is being awarded..."
              maxLength={500}
            />
          </div>

          {/* Award Button */}
          <Button
            onClick={awardBadge}
            loading={awarding}
            disabled={!selectedBadgeType}
            className="w-full"
          >
            Award Badge
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Helper function to get organizer badges for display
export const getOrganizerBadges = (organizerId: string): OrganizerBadge[] => {
  try {
    const allBadges = JSON.parse(localStorage.getItem('organizer_badges') || '[]');
    return allBadges.filter((badge: OrganizerBadge) => badge.organizer_id === organizerId);
  } catch (error) {
    console.error('Error loading organizer badges:', error);
    return [];
  }
};

// Helper function to display badge in UI components
export const OrganizerBadgeDisplay: React.FC<{ organizerId: string; compact?: boolean }> = ({ 
  organizerId, 
  compact = false 
}) => {
  const badges = getOrganizerBadges(organizerId);
  
  if (badges.length === 0) return null;

  return (
    <div className={`flex items-center space-x-1 ${compact ? 'flex-wrap' : ''}`}>
      {badges.map((badge) => {
        const badgeInfo = BADGE_CRITERIA[badge.badge_type];
        return (
          <div
            key={badge.id}
            className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${badgeInfo.bgColor} ${badgeInfo.color} border ${badgeInfo.borderColor}`}
            title={`${badgeInfo.name}: ${badgeInfo.description}`}
          >
            {badgeInfo.icon}
            {!compact && <span>{badgeInfo.name}</span>}
          </div>
        );
      })}
    </div>
  );
};