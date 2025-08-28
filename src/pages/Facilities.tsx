import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Trophy } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { tournamentService } from '../lib/database';
import { TournamentCard } from '../components/tournament/TournamentCard';
import { NEPAL_PROVINCES, SPORTS_TYPES } from '../types';

export const Facilities: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedSport, setSelectedSport] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    setLoading(true);
    try {
      console.log('🔍 Loading tournaments for Facilities page...');
      const data = await tournamentService.getApprovedTournaments();
      console.log('📊 Tournaments loaded:', data);
      console.log('📊 Number of tournaments:', data?.length || 0);
      
      if (data && data.length > 0) {
        console.log('🏆 First tournament sample:', data[0]);
        console.log('🖼️ First tournament images field:', data[0].images);
        console.log('🖼️ First tournament all fields:', Object.keys(data[0]));
        
        // Check for any image-related fields
        const imageFields = Object.keys(data[0]).filter(key => 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('banner') || 
          key.toLowerCase().includes('photo')
        );
        console.log('🖼️ Image-related fields found:', imageFields);
        
        // Check if images field exists and has content
        if (data[0].images) {
          console.log('🖼️ Images field type:', typeof data[0].images);
          console.log('🖼️ Images field value:', data[0].images);
          console.log('🖼️ Images array length:', Array.isArray(data[0].images) ? data[0].images.length : 'Not an array');
        } else {
          console.log('❌ No images field found in tournament data');
        }
        
        // Check if there are any other image-related fields
        const allFields = Object.keys(data[0]);
        const additionalImageFields = allFields.filter(key => 
          key.toLowerCase().includes('image') || 
          key.toLowerCase().includes('banner') || 
          key.toLowerCase().includes('photo') ||
          key.toLowerCase().includes('media')
        );
        console.log('🔍 All image-related fields found:', additionalImageFields);
        
        // Check the actual database query result
        console.log('🔍 Raw database result for first tournament:', data[0]);
        
        // Test direct database query to see if images exist
        try {
          const { supabase } = await import('../lib/supabase');
          const { data: directData, error: directError } = await supabase
            .from('tournaments')
            .select('id, name, images')
            .eq('id', data[0].id)
            .single();
          
          if (directError) {
            console.error('❌ Direct database query error:', directError);
          } else {
            console.log('🔍 Direct database query result:', directData);
            console.log('🔍 Direct query images field:', directData.images);
            console.log('🔍 Direct query images type:', typeof directData.images);
          }
        } catch (directQueryError) {
          console.error('❌ Direct database query failed:', directQueryError);
        }
      }
      
      setTournaments(data || []);
    } catch (error) {
      console.error('❌ Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTournaments = tournaments.filter((tournament: any) => {
    const matchesSearch = tournament.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.facility_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tournament.sport_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = !selectedProvince || tournament.province === selectedProvince;
    const matchesSport = !selectedSport || tournament.sport_type === selectedSport;
    
    return matchesSearch && matchesProvince && matchesSport;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Sports Facilities
          </h1>
          <p className="text-gray-600">
            Discover and book the perfect sports venue for your needs
          </p>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    type="text"
                    placeholder="Search facilities, locations, or sports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Sports</option>
                  {SPORTS_TYPES.map(sport => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
                
                <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Results */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-6"
        >
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tournaments...</p>
            </div>
          ) : (
            <p className="text-gray-600">
              Found {filteredTournaments.length} tournaments
              {tournaments.length > 0 && filteredTournaments.length === 0 && (
                <span className="text-orange-600 ml-2">
                  (filtered from {tournaments.length} total)
                </span>
              )}
            </p>
          )}
        </motion.div>

        {/* Tournaments Grid */}
        {!loading && (
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {filteredTournaments.map((tournament: any, index: number) => (
              <motion.div
                key={tournament.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="tournament-card-wrapper"
              >
                <TournamentCard
                  tournament={tournament}
                  index={index}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Empty State */}
        {filteredTournaments.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
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
            }}>
              Clear Filters
            </Button>
          </motion.div>
        )}


      </div>
    </div>
  );
};

