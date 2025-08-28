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
  Star,
  TrendingUp
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { MobileTournamentCard } from '../../components/tournament/MobileTournamentCard';
import { QRCodeScanner } from '../../components/mobile/QRCodeScanner';
import { tournamentService } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const MobileHome: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [filteredTournaments, setFilteredTournaments] = useState<any[]>([]);

  useEffect(() => {
    loadTournaments();
  }, []);

  useEffect(() => {
    filterTournaments();
  }, [tournaments, searchQuery, selectedSport]);

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
        tournament.sport_type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by sport type
    if (selectedSport !== 'all') {
      filtered = filtered.filter(tournament =>
        tournament.sport_type === selectedSport
      );
    }

    setFilteredTournaments(filtered);
  };

  const handleQRScan = (data: string) => {
    console.log('QR Code scanned:', data);
    toast.success('QR Code scanned successfully!');
    
    if (data.startsWith('tournament:')) {
      const tournamentId = data.split(':')[1];
      navigate(`/tournament/${tournamentId}`);
    }
  };

  const handleTournamentPress = (tournament: any) => {
    navigate(`/tournament/${tournament.id}`);
  };

  const getSportTypes = () => {
    const sports = ['all', ...new Set(tournaments.map(t => t.sport_type))];
    return sports;
  };

  const getFeaturedTournaments = () => {
    return tournaments
      .filter(t => t.status === 'active' || t.status === 'approved')
      .slice(0, 3);
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
            <h1 className="text-2xl font-bold text-gray-900">Discover Tournaments</h1>
            <p className="text-gray-600">Find and join amazing tournaments</p>
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

        {/* Sport Filter */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {getSportTypes().map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
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

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Featured Tournaments */}
        {getFeaturedTournaments().length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <Star className="w-5 h-5 text-yellow-500 mr-2" />
                Featured Tournaments
              </h2>
              <Button
                variant="ghost"
                onClick={() => navigate('/tournaments')}
                className="text-blue-600"
              >
                View All
              </Button>
            </div>
            
            <div className="space-y-4">
              {getFeaturedTournaments().map((tournament) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MobileTournamentCard
                    tournament={tournament}
                    onPress={() => handleTournamentPress(tournament)}
                  />
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4 text-center">
            <Trophy className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{tournaments.length}</p>
            <p className="text-sm text-gray-600">Total</p>
          </Card>
          
          <Card className="p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {tournaments.filter(t => t.status === 'active').length}
            </p>
            <p className="text-sm text-gray-600">Active</p>
          </Card>
          
          <Card className="p-4 text-center">
            <MapPin className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">
              {new Set(tournaments.map(t => t.venue_name)).size}
            </p>
            <p className="text-sm text-gray-600">Venues</p>
          </Card>
        </div>

        {/* Recent Tournaments */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Tournaments</h2>
          
          {filteredTournaments.length === 0 ? (
            <Card className="p-8 text-center">
              <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedSport !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Check back later for new tournaments'
                }
              </p>
              {(searchQuery || selectedSport !== 'all') && (
                <Button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedSport('all');
                  }}
                  variant="outline"
                >
                  Clear Filters
                </Button>
              )}
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTournaments.map((tournament) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <MobileTournamentCard
                    tournament={tournament}
                    onPress={() => handleTournamentPress(tournament)}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate('/create-tournament')}
            className="w-full bg-blue-600 hover:bg-blue-700 touch-target"
          >
            <Trophy className="w-5 h-5 mr-2" />
            Create Tournament
          </Button>
          
          <Button
            onClick={() => navigate('/tournament-map')}
            variant="outline"
            className="w-full touch-target"
          >
            <MapPin className="w-5 h-5 mr-2" />
            View Tournament Map
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







