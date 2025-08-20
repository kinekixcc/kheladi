import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search,
  Trophy,
  Filter,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Clock,
  Star,
  Eye,
  UserPlus,
  Heart,
  Share2
} from 'lucide-react';
import { tournamentService, registrationService } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { ResponsiveGrid, ResponsiveCard, ResponsiveText } from '../layout/ResponsiveLayout';
import { TournamentCard } from '../tournament/TournamentCard';
import { NEPAL_PROVINCES, SPORTS_TYPES } from '../../types';
import toast from 'react-hot-toast';

export const PlayerTournamentBrowser: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Array<{
    id: string;
    name: string;
    sport_type: string;
    organizer_name: string;
    facility_name: string;
    start_date: string;
    end_date: string;
    entry_fee: number;
    max_participants: number;
    current_participants: number;
    status: string;
    description?: string;
    venue_name?: string;
    venue_address?: string;
    province?: string;
    district?: string;
    registration_deadline?: string;
    prize_pool?: number;
    organizer_id?: string;
    facility_id?: string;
    rules?: string;
    requirements?: string;
  }>>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<typeof tournaments>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [sortBy, setSortBy] = useState('start_date');
  const [registeredTournaments, setRegisteredTournaments] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadTournaments();
    loadUserRegistrations();
    
    // Listen for real-time tournament updates
    const handleTournamentDeleted = (event: CustomEvent) => {
      const { tournamentId } = event.detail;
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      console.log('🔄 Tournament removed from browser:', tournamentId);
    };
    
    window.addEventListener('tournamentDeleted', handleTournamentDeleted as EventListener);
    
    return () => {
      window.removeEventListener('tournamentDeleted', handleTournamentDeleted as EventListener);
    };
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [tournaments, searchTerm, selectedProvince, selectedSport, statusFilter, sortBy]);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const data = await tournamentService.getApprovedTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const loadUserRegistrations = async () => {
    if (!user?.id) return;
    
    try {
      const registrations = await registrationService.getPlayerRegistrations(user.id);
      const tournamentIds = new Set(registrations.map(reg => reg.tournament_id));
      setRegisteredTournaments(tournamentIds);
    } catch (error) {
      console.error('Error loading user registrations:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...tournaments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.sport_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.facility_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Province filter
    if (selectedProvince) {
      filtered = filtered.filter(tournament => tournament.province === selectedProvince);
    }

    // Sport filter
    if (selectedSport) {
      filtered = filtered.filter(tournament => tournament.sport_type === selectedSport);
    }

    // Status filter
    const now = new Date();
    if (statusFilter === 'open') {
      filtered = filtered.filter(tournament => {
        if (!tournament.registration_deadline) return false;
        const regDeadline = new Date(tournament.registration_deadline);
        return regDeadline > now && tournament.current_participants < tournament.max_participants;
      });
    } else if (statusFilter === 'upcoming') {
      filtered = filtered.filter(tournament => {
        const startDate = new Date(tournament.start_date);
        return startDate > now;
      });
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(tournament => {
        const startDate = new Date(tournament.start_date);
        const endDate = new Date(tournament.end_date);
        return startDate <= now && endDate >= now;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'start_date':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case 'entry_fee':
          return a.entry_fee - b.entry_fee;
        case 'participants':
          return (b.current_participants || 0) - (a.current_participants || 0);
        case 'prize_pool':
          return (b.prize_pool || 0) - (a.prize_pool || 0);
        default:
          return 0;
      }
    });

    setFilteredTournaments(filtered);
  };

  const handleRegister = (tournamentId: string) => {
    if (!user) {
      toast.error('Please login to register for tournaments');
      // navigate('/login'); // Removed as per new_code
      return;
    }
    // navigate(`/tournament/${tournamentId}/register`); // Removed as per new_code
    window.dispatchEvent(new CustomEvent('navigateToRegister', { detail: { tournamentId } }));
  };

  const handleFavorite = (tournamentId: string) => {
    // Implement favorite functionality
    toast.success('Tournament added to favorites!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Browse Tournaments</h2>
          <p className="text-gray-600">Discover and join tournaments near you</p>
        </div>
        <div className="text-sm text-gray-600">
          {filteredTournaments.length} of {tournaments.length} tournaments
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search tournaments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Provinces</option>
            {NEPAL_PROVINCES.map(province => (
              <option key={province.id} value={province.name}>
                {province.name}
              </option>
            ))}
          </select>
          
          <select
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sports</option>
            {SPORTS_TYPES.map(sport => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open for Registration</option>
            <option value="upcoming">Upcoming</option>
            <option value="active">Currently Active</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="start_date">Sort by Date</option>
            <option value="entry_fee">Sort by Entry Fee</option>
            <option value="participants">Sort by Participants</option>
            <option value="prize_pool">Sort by Prize Pool</option>
          </select>
        </div>
      </Card>

      {/* Tournament Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      ) : filteredTournaments.length === 0 ? (
        <Card className="p-12 text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
          <p className="text-gray-600 mb-4">Try adjusting your search criteria or filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm('');
              setSelectedProvince('');
              setSelectedSport('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTournaments.map((tournament, index) => (
            <div key={tournament.id} className="relative">
              <TournamentCard
                tournament={tournament}
                index={index}
                showActions={true}
                isRegistered={registeredTournaments.has(tournament.id)}
              />
              
              {/* Registration Status Overlay */}
              {registeredTournaments.has(tournament.id) && (
                <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                  Registered
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};