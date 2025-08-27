import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Users, Calendar, MapPin, UserPlus, Share2, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TournamentImageDisplay } from './TournamentImageDisplay';
import { Tournament } from '../../types';
import { tournamentUtils } from '../../utils/tournamentUtils';

interface TournamentCardProps {
  tournament: Tournament;
  index?: number;
  showActions?: boolean;
  isRegistered?: boolean;
  onRegister?: (tournament: Tournament) => void;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ 
  tournament, 
  index = 0,
  showActions = true,
  isRegistered = false,
  onRegister
}) => {
  const navigate = useNavigate();

  // Use the new utility functions
  const status = tournamentUtils.getStatusBadge(tournament);
  const canRegister = tournamentUtils.canUserRegister(tournament, null, isRegistered);

  const handleViewDetails = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRegister) {
      onRegister(tournament);
    } else {
      navigate(`/tournament/${tournament.id}/register`);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: tournament.name,
        text: `Check out this ${tournament.sport_type} tournament!`,
        url: window.location.origin + `/tournament/${tournament.id}`
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.origin + `/tournament/${tournament.id}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="w-full"
    >
      <Card className="h-full hover:shadow-lg transition-all duration-300 cursor-pointer" onClick={handleViewDetails}>
        {/* Tournament Image */}
        <div className="relative h-48 overflow-hidden rounded-t-lg">
          <TournamentImageDisplay 
            images={tournament.images || []} 
            name={tournament.name}
            compact={true} 
          />
          
          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 ${status.color} text-xs font-medium rounded-full`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Tournament Info */}
        <div className="p-4">
          {/* Title and Sport */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
              {tournament.name}
            </h3>
            <div className="flex items-center text-sm text-gray-600">
              <Trophy className="h-4 w-4 mr-1" />
              {tournament.sport_type}
            </div>
          </div>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="h-4 w-4 mr-1" />
            <span className="line-clamp-1">
              {tournament.venue_name}, {tournament.district}
            </span>
          </div>

          {/* Dates */}
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <Calendar className="h-4 w-4 mr-1" />
            <span>
              {new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}
            </span>
          </div>

          {/* Organizer */}
          <div className="text-sm text-gray-600 mb-3">
            <span className="font-medium">Organizer:</span> {tournament.organizer_name}
          </div>

          {/* Entry Fee & Prize Pool */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Entry Fee</p>
              <p className="font-semibold text-gray-900">रू {tournament.entry_fee}</p>
            </div>
            <div className="text-center p-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-600">Prize Pool</p>
              <p className="font-semibold text-gray-900">रू {tournament.prize_pool.toLocaleString()}</p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Registration Progress</span>
              <span>
                {tournament.max_teams ? 
                  `${tournament.current_teams || 0}/${tournament.max_teams} teams` :
                  `${tournament.current_participants || 0}/${tournament.max_participants} participants`
                }
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${Math.min(
                    tournament.max_teams ? 
                      ((tournament.current_teams || 0) / tournament.max_teams) * 100 :
                      ((tournament.current_participants || 0) / tournament.max_participants) * 100, 
                    100
                  )}%` 
                }}
              ></div>
            </div>
          </div>
          
          {/* Action Buttons */}
          {showActions && (
            <div className="flex gap-2">
              {isRegistered ? (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  disabled
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Already Registered
                </Button>
              ) : canRegister.canRegister ? (
                <Button 
                  size="sm" 
                  className="flex-1"
                  onClick={handleRegister}
                >
                  <UserPlus className="h-4 w-4 mr-1" />
                  Register
                </Button>
              ) : (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  disabled
                >
                  {tournament.current_participants >= tournament.max_participants ? 'Full' : 
                   tournamentUtils.isRegistrationOpen(tournament) ? 'Register' : 'Registration Closed'}
                </Button>
              )}
              
              <Button 
                variant="outline"
                size="sm"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};