import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trophy, 
  Clock,
  Star,
  Eye,
  UserPlus,
  Share2
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { OrganizerBadgeDisplay } from '../admin/OrganizerBadgeSystem';
import { TournamentImageDisplay } from './TournamentImageDisplay';
import { Tournament } from '../../types';

interface TournamentCardProps {
  tournament: Tournament;
  index?: number;
  showActions?: boolean;
  isRegistered?: boolean;
}

export const TournamentCard: React.FC<TournamentCardProps> = ({ 
  tournament, 
  index = 0,
  showActions = true,
  isRegistered = false
}) => {
  const navigate = useNavigate();

  const getStatusBadge = () => {
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    const registrationDeadline = new Date(tournament.registration_deadline);
    
    // Reset time to start of day for date comparison
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    registrationDeadline.setHours(0, 0, 0, 0);
    
    if (now < registrationDeadline && tournament.current_participants < tournament.max_participants) {
      return { label: 'Registration Open', color: 'bg-green-100 text-green-800' };
    } else if (now < startDate) {
      return { label: 'Upcoming', color: 'bg-blue-100 text-blue-800' };
    } else if (now >= startDate && now <= endDate) {
      return { label: 'In Progress', color: 'bg-orange-100 text-orange-800' };
    } else {
      return { label: 'Completed', color: 'bg-gray-100 text-gray-800' };
    }
  };

  const canRegister = () => {
    const now = new Date();
    const registrationDeadline = new Date(tournament.registration_deadline);
    
    // Reset time to start of day for date comparison
    now.setHours(0, 0, 0, 0);
    registrationDeadline.setHours(0, 0, 0, 0);
    
    return now < registrationDeadline && tournament.current_participants < tournament.max_participants;
  };

  const handleViewDetails = () => {
    navigate(`/tournament/${tournament.id}`);
  };

  const handleRegister = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/tournament/${tournament.id}/register`);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/tournament/${tournament.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament.name,
          text: `Check out this ${tournament.sport_type} tournament!`,
          url: url,
        });
      } catch (error) {
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
    }
  };

  const status = getStatusBadge();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <Card hover className="overflow-hidden cursor-pointer" onClick={handleViewDetails}>
        {/* Tournament Image */}
        <div className="h-48 relative">
          {(tournament as any).images && (tournament as any).images.length > 0 ? (
            <TournamentImageDisplay
              images={(tournament as any).images}
              tournamentName={tournament.name}
              showControls={false}
              className="h-full"
            />
          ) : (
            <div className="h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm font-medium">{tournament.sport_type}</p>
                <p className="text-gray-400 text-xs">Tournament</p>
              </div>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.label}
            </span>
          </div>
          
          {/* Prize Pool Badge */}
          {tournament.prize_pool > 0 && (
            <div className="absolute top-4 left-4">
              <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <Trophy className="h-3 w-3 mr-1" />
                रू {tournament.prize_pool.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-6">
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-semibold text-gray-900 line-clamp-2">
                {tournament.name}
              </h3>
              <div className="flex items-center ml-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm text-gray-600 ml-1">4.8</span>
              </div>
            </div>
            
            <p className="text-gray-600 text-sm line-clamp-2 mb-3">
              {tournament.description}
            </p>
            
            {/* Sport Type */}
            <div className="flex items-center space-x-2 mb-3">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {tournament.sport_type}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {(tournament as any).tournament_type?.replace('_', ' ') || 'Single Elimination'}
              </span>
            </div>
          </div>
          
          {/* Tournament Details */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center text-gray-500 text-sm">
              <Calendar className="h-4 w-4 mr-2" />
              <span>{tournament.start_date} - {tournament.end_date}</span>
            </div>
            
            <div className="flex items-center text-gray-500 text-sm">
              <MapPin className="h-4 w-4 mr-2" />
              <span className="truncate">{tournament.facility_name}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center text-gray-500">
                <Users className="h-4 w-4 mr-2" />
                <span>{tournament.current_participants}/{tournament.max_participants} participants</span>
              </div>
              
              <div className="flex items-center text-gray-900 font-semibold">
                <DollarSign className="h-4 w-4 mr-1" />
                <span>रू {tournament.entry_fee}</span>
              </div>
            </div>
            
            {/* Registration Deadline */}
            <div className="flex items-center text-orange-600 text-sm">
              <Clock className="h-4 w-4 mr-2" />
              <span>Registration until {tournament.registration_deadline}</span>
            </div>
          </div>
          
          {/* Organizer */}
          <div className="text-sm text-gray-500 mb-4 pb-4 border-b">
            <div className="flex items-center justify-between">
              <span className="font-medium">Organized by: {tournament.organizer_name}</span>
              <OrganizerBadgeDisplay organizerId={tournament.organizer_id} compact={true} />
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Registration Progress</span>
              <span>{Math.round((tournament.current_participants / tournament.max_participants) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((tournament.current_participants / tournament.max_participants) * 100, 100)}%` }}
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
              ) : canRegister() ? (
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
                  {tournament.current_participants >= tournament.max_participants ? 'Full' : 'Closed'}
                </Button>
              )}
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewDetails();
                }}
              >
                <Eye className="h-4 w-4" />
              </Button>
              
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