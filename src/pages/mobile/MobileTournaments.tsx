import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  QrCode, 
  Trophy, 
  MapPin, 
  Calendar,
  Users,
  DollarSign,
  ChevronDown
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MobileTournamentCard } from '../../components/tournament/MobileTournamentCard';
import { QRCodeScanner } from '../../components/mobile/QRCodeScanner';
import { tournamentService } from '../../lib/database';
import toast from 'react-hot-toast';

export const MobileTournaments: React.FC = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filteredTournaments, setFilteredTournaments] = useState<any[]>([]);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchQuery, selectedSport, selectedStatus]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getPublicTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const filterTournaments = () => {
    let filtered = tournaments;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.sport_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tournament.venue_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by sport type
    if (selectedSport !== 'all') {
      filtered = filtered.filter(tournament =>
        tournament.sport_type === selectedSport
      );
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(tournament =>
        tournament.status === selectedStatus
      );
    }

    setFilteredTournaments(filtered);
  };

  const handleQRScan = (data: string) => {
    console.log('QR Code scanned:', data);
    toast.success('QR Code scanned successfully!');
    
    if (data.startsWith('tournament:')) {
      const tournamentId = data.split(':')[1];
      navigate(`/mobile/tournament/${tournamentId}`);
    }
  };

  const handleTournamentPress = (tournament: any) => {
    navigate(`/mobile/tournament/${tournament.id}`);
  };

  const getSportTypes = () => {
    const sports = ['all', ...new Set(tournaments.map(t => t.sport_type))];
    return sports;
  };

  const getStatusTypes = () => {
    const statuses = ['all', 'active', 'pending_approval', 'approved', 'completed'];
    return statuses;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport('all');
    setSelectedStatus('all');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournaments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Tournaments</h1>
            <p className="text-gray-600">{tournaments.length} tournaments available</p>
          </div>
          <Button
            onClick={() => setShowQRScanner(true)}
            variant="outline"
            className="p-2"
          >
            <QrCode className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mobile-input"
          />
        </div>

        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
          
          {(searchQuery || selectedSport !== 'all' || selectedStatus !== 'all') && (
            <Button
              onClick={clearFilters}
              variant="ghost"
              className="text-blue-600"
            >
              Clear All
            </Button>
          )}
        </div>

        {/* Filters */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-4"
          >
            {/* Sport Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sport Type</label>
              <div className="flex flex-wrap gap-2">
                {getSportTypes().map((sport) => (
                  <button
                    key={sport}
                    onClick={() => setSelectedSport(sport)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedSport === sport
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sport === 'all' ? 'All Sports' : sport}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {getStatusTypes().map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? 'All Status' : status.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-gray-600">
            {filteredTournaments.length} of {tournaments.length} tournaments
          </p>
          
          {filteredTournaments.length > 0 && (
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="ghost"
              className="text-blue-600"
            >
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          )}
        </div>

        {/* Tournaments List */}
        {filteredTournaments.length === 0 ? (
          <Card className="p-8 text-center">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedSport !== 'all' || selectedStatus !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Check back later for new tournaments'
              }
            </p>
            {(searchQuery || selectedSport !== 'all' || selectedStatus !== 'all') && (
              <Button
                onClick={clearFilters}
                variant="outline"
              >
                Clear Filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredTournaments.map((tournament, index) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <MobileTournamentCard
                  tournament={tournament}
                  onPress={() => handleTournamentPress(tournament)}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 space-y-3">
          <Button
            onClick={() => navigate('/mobile')}
            variant="outline"
            className="w-full touch-target"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Back to Home
          </Button>
          
          <Button
            onClick={() => navigate('/create-tournament')}
            className="w-full bg-blue-600 hover:bg-blue-700 touch-target"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Create Tournament
          </Button>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};







