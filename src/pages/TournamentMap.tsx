import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { 
  Map as MapIcon, 
  List, 
  Search, 
  Filter, 
  MapPin, 
  Trophy, 
  Calendar, 
  Users, 
  DollarSign,
  Eye,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { tournamentService } from '../lib/database';
import { TournamentCard } from '../components/tournament/TournamentCard';
import { NEPAL_PROVINCES, SPORTS_TYPES } from '../types';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export const TournamentMap: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
    
    // Listen for real-time tournament updates
    const handleTournamentDeleted = (event: CustomEvent) => {
      const { tournamentId } = event.detail;
      setTournaments(prev => prev.filter(t => t.id !== tournamentId));
      console.log('🔄 Tournament removed from map view:', tournamentId);
    };
    
    window.addEventListener('tournamentDeleted', handleTournamentDeleted as EventListener);
    
    return () => {
      window.removeEventListener('tournamentDeleted', handleTournamentDeleted as EventListener);
    };
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      const data = await tournamentService.getApprovedTournaments();
      setTournaments(data);
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter(tournament => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.sport_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = !selectedProvince || tournament.province === selectedProvince;
    const matchesSport = !selectedSport || tournament.sport_type === selectedSport;
    
    // Status filter based on registration deadline
    let matchesStatus = true;
    if (selectedStatus === 'open') {
      matchesStatus = new Date(tournament.registration_deadline) > new Date();
    } else if (selectedStatus === 'closed') {
      matchesStatus = new Date(tournament.registration_deadline) <= new Date();
    }
    
    return matchesSearch && matchesProvince && matchesSport && matchesStatus;
  });

  const handleRegister = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}/register`);
  };

  const handleViewDetails = (tournamentId: string) => {
    navigate(`/tournament/${tournamentId}`);
  };

  const getStatusBadge = (tournament: any) => {
    const isOpen = new Date(tournament.registration_deadline) > new Date();
    const isFull = (tournament.current_participants || 0) >= tournament.max_participants;
    
    if (isFull) {
      return <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">Full</span>;
    } else if (isOpen) {
      return <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Open</span>;
    } else {
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Closed</span>;
    }
  };

  const canRegister = (tournament: any) => {
    const isOpen = new Date(tournament.registration_deadline) > new Date();
    const isFull = (tournament.current_participants || 0) >= tournament.max_participants;
    return isOpen && !isFull;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Map</h1>
          <p className="text-gray-600">Discover tournaments near you</p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="p-6">
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'map' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('map')}
                  size="sm"
                >
                  <MapIcon className="h-4 w-4 mr-2" />
                  Map View
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline'}
                  onClick={() => setViewMode('list')}
                  size="sm"
                >
                  <List className="h-4 w-4 mr-2" />
                  List View
                </Button>
              </div>
              
              <div className="text-sm text-gray-600">
                {filteredTournaments.length} tournaments found
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sports</option>
                {SPORTS_TYPES.map(sport => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
              
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="open">Open for Registration</option>
                <option value="closed">Registration Closed</option>
              </select>
            </div>
          </Card>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {viewMode === 'map' ? (
            /* Map View */
            <Card className="overflow-hidden">
              <div className="h-[600px]">
                <MapContainer
                  center={[27.7172, 85.3240]} // Kathmandu center
                  zoom={7}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  
                  {filteredTournaments.map((tournament) => {
                    // Use default coordinates if not available
                    const lat = tournament.latitude || (27.7172 + (Math.random() - 0.5) * 0.1);
                    const lng = tournament.longitude || (85.3240 + (Math.random() - 0.5) * 0.1);
                    
                    return (
                      <Marker key={tournament.id} position={[lat, lng]}>
                        <Popup>
                          <div className="p-2 min-w-[250px]">
                            <h3 className="font-semibold text-gray-900 mb-2">
                              {tournament.name}
                            </h3>
                            
                            <div className="space-y-1 text-sm text-gray-600 mb-3">
                              <div className="flex items-center">
                                <Trophy className="h-3 w-3 mr-1" />
                                {tournament.sport_type}
                              </div>
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {tournament.facility_name}
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {tournament.start_date}
                              </div>
                              <div className="flex items-center">
                                <DollarSign className="h-3 w-3 mr-1" />
                                रू {tournament.entry_fee}
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between">
                              {getStatusBadge(tournament)}
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleViewDetails(tournament.id)}
                                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded"
                                >
                                  <Eye className="h-3 w-3" />
                                </button>
                                {canRegister(tournament) && (
                                  <button
                                    onClick={() => handleRegister(tournament.id)}
                                    className="px-2 py-1 text-xs bg-blue-600 text-white hover:bg-blue-700 rounded"
                                  >
                                    <UserPlus className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>
            </Card>
          ) : (
            /* List View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTournaments.map((tournament, index) => (
                <TournamentCard
                  key={tournament.id}
                  tournament={tournament}
                  index={index}
                />
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredTournaments.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tournaments found
              </h3>
              <p className="text-gray-600 mb-4">
                {tournaments.length === 0 
                  ? 'No tournaments are currently available. Check back later!'
                  : 'Try adjusting your search criteria or filters'
                }
              </p>
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedProvince('');
                setSelectedSport('');
                setSelectedStatus('all');
              }}>
                Clear Filters
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

