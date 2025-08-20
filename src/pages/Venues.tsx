import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Star, Plus, Filter } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface SimpleVenue {
  id: string;
  name: string;
  description: string;
  district: string;
  province: string;
  location: string;
  contact_phone: string;
  contact_email?: string;
  price_per_hour: number;
  images: string[];
  rating: number;
  total_reviews: number;
  is_active: boolean;
}

export const Venues: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [venues, setVenues] = useState<SimpleVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');

  useEffect(() => {
    loadVenues();
  }, []);

  const loadVenues = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading venues from database...');
      
      const { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Venues loaded:', data);
      setVenues(data || []);
    } catch (error) {
      console.error('❌ Error loading venues:', error);
      toast.error('Failed to load venues');
    } finally {
      setLoading(false);
    }
  };

  const filteredVenues = venues.filter((venue) => {
    const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         venue.district.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProvince = !selectedProvince || venue.province === selectedProvince;
    
    return matchesSearch && matchesProvince;
  });

  const handleVenueClick = (venue: SimpleVenue) => {
    navigate(`/venues/${venue.id}`);
  };

  const handleAddVenue = () => {
    if (!user) {
      toast.error('Please log in to add venues');
      navigate('/login');
      return;
    }

    if (user.role !== 'admin') {
      toast.error('Only administrators can add venues. Please contact support if you need to list your venue.');
      return;
    }

    navigate('/admin?tab=venues');
  };

  const provinces = ['Bagmati Province', 'Gandaki Province', 'Lumbini Province', 'Karnali Province', 'Sudurpaschim Province', 'Koshi Province', 'Madhesh Province'];

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Sports Venues
              </h1>
              <p className="text-gray-600">
                Find and explore sports facilities across Nepal
              </p>
            </div>
            <Button
              onClick={handleAddVenue}
              variant="outline"
              className="hidden md:flex"
            >
              <Plus className="h-4 w-4 mr-2" />
              {user?.role === 'admin' ? 'Add Venue' : 'List Your Venue'}
            </Button>
          </div>
        </motion.div>

        {/* Search and Filters */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search venues, locations, or sports..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Province Filter */}
              <div className="flex gap-4">
                <select
                  value={selectedProvince}
                  onChange={(e) => setSelectedProvince(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All Provinces</option>
                  {provinces.map(province => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedProvince('');
                  }}
                >
                  Clear Filters
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
          <p className="text-gray-600">
            Found {filteredVenues.length} venues
          </p>
        </motion.div>

        {/* Venues Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-48 rounded-t-lg"></div>
                <div className="bg-white p-6 rounded-b-lg space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVenues.map((venue, index) => (
              <motion.div
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="cursor-pointer"
                onClick={() => handleVenueClick(venue)}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                  {/* Venue Image */}
                  <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
                    {venue.images && venue.images.length > 0 ? (
                      <img
                        src={venue.images[0]}
                        alt={venue.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-white">
                        <div className="text-center">
                          <div className="text-4xl mb-2">🏟️</div>
                          <div className="text-sm opacity-80">Sports Venue</div>
                        </div>
                      </div>
                    )}
                    
                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-current" />
                      <span className="text-xs font-medium">{venue.rating || 0}</span>
                    </div>
                  </div>

                  {/* Venue Info */}
                  <div className="p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{venue.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{venue.description}</p>
                      
                      {/* Location */}
                      <div className="flex items-center text-gray-500 text-sm mb-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{venue.district}, {venue.province}</span>
                      </div>
                      
                      {/* Price */}
                      <div className="flex items-center text-green-600 font-semibold mb-3">
                        <span>रू {venue.price_per_hour || 0}/hr</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVenueClick(venue);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredVenues.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🏟️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No venues found
            </h3>
            <p className="text-gray-600 mb-4">
              {venues.length === 0 
                ? 'No venues are currently available. Check back later!'
                : 'Try adjusting your search criteria or filters'
              }
            </p>
            <Button variant="outline" onClick={() => {
              setSearchTerm('');
              setSelectedProvince('');
            }}>
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};
