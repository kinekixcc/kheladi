import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageCircle, 
  Users, 
  Search, 
  Filter,
  Pin,
  Volume2,
  VolumeX,
  Crown,
  Shield,
  User,
  Calendar,
  Trophy,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tournamentService } from '../../lib/database';
import { TournamentOrganizerChat } from './TournamentOrganizerChat';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface Tournament {
  id: string;
  name: string;
  sport_type: string;
  start_date: string;
  status: string;
  chat_enabled: boolean;
  participant_count: number;
  organizer_id: string;
}

interface OrganizerChatManagerProps {
  organizerId: string;
}

export const OrganizerChatManager: React.FC<OrganizerChatManagerProps> = ({
  organizerId
}) => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');
  const [chatFilter, setChatFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

  console.log('🔍 OrganizerChatManager rendered with organizerId:', organizerId);

  useEffect(() => {
    console.log('🔍 OrganizerChatManager useEffect triggered');
    loadTournaments();
  }, [organizerId]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const tournamentsData = await tournamentService.getTournamentsByOrganizer(organizerId);
      
      // Add participant count (this would need to be implemented in the service)
      const tournamentsWithCounts = tournamentsData.map(tournament => ({
        ...tournament,
        participant_count: 0 // Placeholder - would need to fetch actual count
      }));
      
      setTournaments(tournamentsWithCounts);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    // Search filter
    if (searchQuery && !tournament.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'active':
          if (tournament.status !== 'active') return false;
          break;
        case 'upcoming':
          if (tournament.status !== 'approved' && tournament.status !== 'pending_approval') return false;
          break;
        case 'completed':
          if (tournament.status !== 'completed') return false;
          break;
      }
    }
    
    // Chat filter
    if (chatFilter !== 'all') {
      if (chatFilter === 'enabled' && !tournament.chat_enabled) return false;
      if (chatFilter === 'disabled' && tournament.chat_enabled) return false;
    }
    
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'approved': return 'bg-blue-100 text-blue-800';
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Active';
      case 'approved': return 'Approved';
      case 'pending_approval': return 'Pending Approval';
      case 'completed': return 'Completed';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-2">Loading tournaments...</p>
      </div>
    );
  }

  if (selectedTournament) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => setSelectedTournament(null)}
            className="flex items-center space-x-2"
          >
            <Trophy className="h-4 w-4" />
            <span>Back to Tournaments</span>
          </Button>
          <div className="text-right">
            <h2 className="text-xl font-semibold text-gray-900">{selectedTournament.name}</h2>
            <p className="text-sm text-gray-600">Tournament Chat</p>
          </div>
        </div>
        
        <TournamentOrganizerChat
          tournamentId={selectedTournament.id}
          tournamentName={selectedTournament.name}
          organizerId={organizerId}
          isEnabled={selectedTournament.chat_enabled}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tournament Chat Management</h2>
          <p className="text-gray-600">Communicate with participants across all your tournaments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={loadTournaments}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="upcoming">Upcoming</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chat</label>
            <select
              value={chatFilter}
              onChange={(e) => setChatFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Chats</option>
              <option value="enabled">Enabled</option>
              <option value="disabled">Disabled</option>
            </select>
          </div>
          
          <div className="flex items-end">
            <Button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setChatFilter('all');
              }}
              variant="outline"
              className="w-full"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Tournaments List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTournaments.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tournaments found</h3>
            <p className="text-gray-600">
              {searchQuery || statusFilter !== 'all' || chatFilter !== 'all' 
                ? 'Try adjusting your filters or search terms.'
                : 'You haven\'t created any tournaments yet.'
              }
            </p>
          </div>
        ) : (
          filteredTournaments.map((tournament) => (
            <motion.div
              key={tournament.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -5 }}
              className="group"
            >
              <div onClick={() => setSelectedTournament(tournament)}>
                <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-300">
                
                {/* Tournament Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {tournament.name}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">{tournament.sport_type}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {tournament.chat_enabled ? (
                      <div className="flex items-center space-x-1 text-green-600">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">Chat</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1 text-gray-400">
                        <MessageCircle className="h-4 w-4" />
                        <span className="text-xs">No Chat</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tournament Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(tournament.start_date)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(tournament.status)}`}>
                      {getStatusText(tournament.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Participants:</span>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{tournament.participant_count}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTournament(tournament);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!tournament.chat_enabled}
                >
                  {tournament.chat_enabled ? (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open Chat
                    </>
                  ) : (
                    <>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat Disabled
                    </>
                  )}
                </Button>
                </Card>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{tournaments.length}</div>
            <div className="text-sm text-gray-600">Total Tournaments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {tournaments.filter(t => t.chat_enabled).length}
            </div>
            <div className="text-sm text-gray-600">Chats Enabled</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {tournaments.filter(t => t.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Tournaments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {tournaments.reduce((sum, t) => sum + t.participant_count, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Participants</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
