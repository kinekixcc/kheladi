import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, MapPin, Calendar, Users, Trophy, UserPlus, Eye } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { tournamentService } from '../../lib/database';
import { TournamentCard } from '../tournament/TournamentCard';
import { RegistrationTypeSelector } from '../tournament/RegistrationTypeSelector';
import { TeamCreationWizard } from '../tournament/TeamCreationWizard';
import { tournamentUtils } from '../../utils/tournamentUtils';
import { Tournament } from '../../types';
import toast from 'react-hot-toast';

export const PlayerTournamentBrowser: React.FC = () => {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filteredTournaments, setFilteredTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [statusFilter, setStatusFilter] = useState('open');
  const [sortBy, setSortBy] = useState('start_date');
  const [registeredTournaments, setRegisteredTournaments] = useState<Set<string>>(new Set());
  
  // New registration flow state
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [registrationStep, setRegistrationStep] = useState<'browse' | 'select-type' | 'create-team' | 'individual-form'>('browse');

  useEffect(() => {
    loadTournaments();
    loadUserRegistrations();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [tournaments, searchTerm, selectedProvince, selectedSport, statusFilter, sortBy]);

  const loadTournaments = async () => {
    try {
      setLoading(true);
      const data = await tournamentService.getPublicTournaments();
      
      // Filter out tournaments that are not visible to players
      const visibleTournaments = data.filter(tournament => tournamentUtils.isTournamentVisible(tournament));
      
      setTournaments(visibleTournaments);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserRegistrations = async () => {
    if (!user?.id) return;
    
    try {
      // This would load user's tournament registrations
      // For now, we'll use a placeholder
      const userRegistrations = new Set<string>();
      setRegisteredTournaments(userRegistrations);
    } catch (error) {
      console.error('Failed to load user registrations:', error);
    }
  };

  const processDemoPayment = async (amount: number) => {
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      transactionId: `TXN_${Date.now()}`,
      amount,
      status: 'completed'
    };
  };

  // Check if user is registered for a tournament
  const isRegistered = (tournamentId: string) => {
    return registeredTournaments.has(tournamentId);
  };

  // Check if tournament is full
  const isTournamentFull = (tournament: Tournament) => {
    return (tournament.current_participants || 0) >= tournament.max_participants;
  };

  // Check if registration is closed using the new utility
  const isRegistrationClosed = (tournament: Tournament) => {
    return !tournamentUtils.isRegistrationOpen(tournament);
  };

  const applyFilters = () => {
    let filtered = [...tournaments];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tournament =>
        tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tournament.sport_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tournament.facility_name || '').toLowerCase().includes(searchTerm.toLowerCase())
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

    // Status filter using the new utility functions
    if (statusFilter === 'open') {
      filtered = filtered.filter(tournament => tournamentUtils.isRegistrationOpen(tournament));
    } else if (statusFilter === 'upcoming') {
      filtered = filtered.filter(tournament => {
        const startDate = new Date(tournament.start_date);
        const now = new Date();
        return startDate > now;
      });
    } else if (statusFilter === 'active') {
      filtered = filtered.filter(tournament => {
        const startDate = new Date(tournament.start_date);
        const endDate = new Date(tournament.end_date);
        const now = new Date();
        return startDate <= now && endDate >= now;
      });
    }

    // Sort tournaments
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'start_date':
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
        case 'entry_fee':
          return a.entry_fee - b.entry_fee;
        case 'participants':
          return (b.current_participants || 0) - (a.current_participants || 0);
        default:
          return 0;
      }
    });

    setFilteredTournaments(filtered);
  };

  const handleTournamentSelect = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setRegistrationStep('select-type');
  };

  const handleBackToBrowse = () => {
    setRegistrationStep('browse');
    setSelectedTournament(null);
  };

  const handleRegistrationComplete = () => {
    toast.success('Registration completed successfully!');
    setRegistrationStep('browse');
    setSelectedTournament(null);
    loadUserRegistrations(); // Refresh user registrations
  };

  // Get unique provinces and sports for filters
  const provinces = useMemo(() => {
    const uniqueProvinces = [...new Set(tournaments.map(t => t.province).filter(Boolean))];
    return uniqueProvinces.sort();
  }, [tournaments]);

  const sports = useMemo(() => {
    const uniqueSports = [...new Set(tournaments.map(t => t.sport_type).filter(Boolean))];
    return uniqueSports.sort();
  }, [tournaments]);

  if (registrationStep !== 'browse') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="outline" onClick={handleBackToBrowse} className="mb-4">
              ← Back to Tournaments
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Register for Tournament</h1>
            <p className="text-gray-600">Complete your registration for {selectedTournament?.name}</p>
          </div>

          {registrationStep === 'select-type' && selectedTournament && (
            <RegistrationTypeSelector
              tournament={selectedTournament}
              onSelectType={(type) => {
                if (type === 'team') {
                  setRegistrationStep('create-team');
                } else {
                  setRegistrationStep('individual-form');
                }
              }}
              onBack={handleBackToBrowse}
            />
          )}

          {registrationStep === 'create-team' && selectedTournament && (
            <TeamCreationWizard
              tournament={selectedTournament}
              onTeamCreated={handleRegistrationComplete}
              onBack={() => setRegistrationStep('select-type')}
            />
          )}

          {registrationStep === 'individual-form' && (
            <div className="text-center py-12">
              <UserPlus className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Individual Registration</h3>
              <p className="text-gray-600">Individual registration form coming soon!</p>
              <Button onClick={() => setRegistrationStep('select-type')} className="mt-4">
                Back to Registration Type
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Tournaments</h1>
          <p className="text-gray-600">Discover and join exciting sports tournaments near you</p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search tournaments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Province Filter */}
            <div>
              <select
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Provinces</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>

            {/* Sport Filter */}
            <div>
              <select
                value={selectedSport}
                onChange={(e) => setSelectedSport(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Sports</option>
                {sports.map((sport) => (
                  <option key={sport} value={sport}>
                    {sport}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="open">Registration Open</option>
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
              </select>
            </div>

            {/* Sort By */}
            <div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="start_date">Start Date</option>
                <option value="name">Name</option>
                <option value="entry_fee">Entry Fee</option>
                <option value="participants">Participants</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="lg:col-span-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedProvince('');
                  setSelectedSport('');
                  setStatusFilter('open');
                  setSortBy('start_date');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {filteredTournaments.length} Tournament{filteredTournaments.length !== 1 ? 's' : ''} Found
            </h2>
            {filteredTournaments.length > 0 && (
              <p className="text-sm text-gray-600">
                Showing {filteredTournaments.length} of {tournaments.length} tournaments
              </p>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tournaments...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredTournaments.length === 0 && (
          <Card className="p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || selectedProvince || selectedSport || statusFilter !== 'open'
                ? 'Try adjusting your search criteria or filters'
                : 'There are no tournaments available at the moment'}
            </p>
            {(searchTerm || selectedProvince || selectedSport || statusFilter !== 'open') && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedProvince('');
                  setSelectedSport('');
                  setStatusFilter('open');
                }}
              >
                Clear Filters
              </Button>
            )}
          </Card>
        )}

        {/* Tournament Grid */}
        {!loading && filteredTournaments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament, index) => (
              <TournamentCard
                key={tournament.id}
                tournament={tournament}
                index={index}
                showActions={true}
                isRegistered={isRegistered(tournament.id)}
                onRegister={handleTournamentSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};