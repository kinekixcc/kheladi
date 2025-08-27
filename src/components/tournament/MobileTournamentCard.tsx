import React from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trophy,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Tournament } from '../../types';

interface MobileTournamentCardProps {
  tournament: Tournament;
  onPress: () => void;
}

export const MobileTournamentCard: React.FC<MobileTournamentCardProps> = ({
  tournament,
  onPress
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'active':
        return <Trophy className="w-4 h-4 text-blue-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onPress}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 active:bg-gray-50 cursor-pointer touch-target"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 text-lg leading-tight mb-1">
            {tournament.name}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-2">
            {tournament.description}
          </p>
        </div>
        <div className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
          {tournament.status.replace('_', ' ')}
        </div>
      </div>

      {/* Tournament Image */}
      {tournament.images && tournament.images.length > 0 && (
        <div className="mb-3">
          <img
            src={tournament.images[0]}
            alt={tournament.name}
            className="w-full h-32 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            {new Date(tournament.start_date).toLocaleDateString()}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700 truncate">
            {tournament.venue_name}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            {tournament.current_teams || 0}/{tournament.max_teams || 0} teams
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <DollarSign className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-700">
            रू {tournament.entry_fee?.toLocaleString() || 0}
          </span>
        </div>
      </div>

      {/* Sport Type & Prize */}
      <div className="flex items-center justify-between mb-3">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
          {tournament.sport_type}
        </span>
        {tournament.prize_pool > 0 && (
          <div className="flex items-center space-x-1">
            <Trophy className="w-4 h-4 text-yellow-600" />
            <span className="text-sm font-medium text-gray-900">
              रू {tournament.prize_pool.toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors touch-target">
        View Details
      </button>
    </motion.div>
  );
};




