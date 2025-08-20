import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Star, Trophy, Clock, Shield, Calendar, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { tournamentService } from '../lib/database';
import { venueDiscoveryService } from '../lib/venueService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [publicTournaments, setPublicTournaments] = useState<any[]>([]);
  const [featuredVenues, setFeaturedVenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [venuesLoading, setVenuesLoading] = useState(false);

  useEffect(() => {
    loadPublicTournaments();
    loadFeaturedVenues();
  }, []);

  const loadPublicTournaments = async () => {
    try {
      setLoading(true);
      const tournaments = await tournamentService.getPublicTournaments();
      setPublicTournaments(tournaments.slice(0, 6)); // Show only 6 tournaments
    } catch (error) {
      console.error('Error loading tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeaturedVenues = async () => {
    try {
      setVenuesLoading(true);
      const venues = await venueDiscoveryService.getFeatured();
      setFeaturedVenues(venues);
    } catch (error) {
      console.error('Error loading venues:', error);
    } finally {
      setVenuesLoading(false);
    }
  };

  const handleJoinTournament = async (tournamentId: string) => {
    if (!user) {
      toast.error('Please log in to join tournaments');
      navigate('/login');
      return;
    }

    try {
      await tournamentService.joinTournament(tournamentId, user.id, {
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        age: 18,
        experience_level: 'beginner'
      });
      toast.success('Successfully joined tournament!');
      loadPublicTournaments(); // Refresh the list
    } catch (error) {
      console.error('Error joining tournament:', error);
      toast.error('Failed to join tournament');
    }
  };

  const features = [
    {
      icon: <Search className="h-6 w-6" />,
      title: 'Easy Discovery',
      description: 'Find sports facilities near you with advanced search and filters'
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: 'Location-Based',
      description: 'Discover facilities across all 7 provinces and 77 districts of Nepal'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Real-time Booking',
      description: 'Book facilities instantly with real-time availability updates'
    },
    {
      icon: <Star className="h-6 w-6" />,
      title: 'Reviews & Ratings',
      description: 'Make informed decisions with user reviews and ratings'
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: 'Secure Platform',
      description: 'Safe and secure booking with verified facility owners'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Community Driven',
      description: 'Connect with fellow sports enthusiasts in your area'
    }
  ];

  const stats = [
    { number: '500+', label: 'Sports Facilities' },
    { number: '10K+', label: 'Happy Users' },
    { number: '77', label: 'Districts Covered' },
    { number: '15+', label: 'Sports Types' }
  ];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Find Your Perfect
              <span className="text-orange-400 block">Sports Venue</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
              Discover and book the best sports facilities across Nepal. From football fields to swimming pools, we've got you covered.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/facilities')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg"
              >
                <Search className="mr-2 h-5 w-5" />
                Find Facilities
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/register')}
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
              >
                <Trophy className="mr-2 h-5 w-5" />
                Join Now
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Public Tournaments Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Join Live Tournaments
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover and join tournaments happening near you. No approval needed - jump right in and start playing!
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading tournaments...</p>
            </div>
          ) : publicTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {publicTournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      {/* Tournament Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                            {tournament.name}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Trophy className="h-4 w-4 text-blue-600" />
                            <span>{tournament.sport_type}</span>
                          </div>
                        </div>
                        {tournament.is_recurring && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Clock className="h-3 w-3 mr-1" />
                            Recurring
                          </span>
                        )}
                      </div>

                      {/* Tournament Details */}
                      <div className="space-y-3 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>Starts {formatDate(tournament.start_date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Users className="h-4 w-4 text-gray-500" />
                          <span>
                            {tournament.current_participants || 0}/{tournament.max_participants} participants
                          </span>
                        </div>
                        {tournament.entry_fee > 0 && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="font-medium text-green-600">
                              Entry Fee: रू {tournament.entry_fee}
                            </span>
                          </div>
                        )}
                        {tournament.venue_name && (
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4 text-gray-500" />
                            <span className="line-clamp-1">{tournament.venue_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {tournament.tags && tournament.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {tournament.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                          {tournament.tags.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              +{tournament.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => navigate(`/tournament/${tournament.id}`)}
                          variant="outline"
                          className="flex-1"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleJoinTournament(tournament.id)}
                          className="flex-1"
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Join Now
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments available</h3>
              <p className="text-gray-600 mb-6">Be the first to create a tournament in your area!</p>
              <Button onClick={() => navigate('/create-tournament')}>
                <Trophy className="h-4 w-4 mr-2" />
                Create Tournament
              </Button>
            </div>
          )}

          {/* View All Tournaments Button */}
          {publicTournaments.length > 0 && (
            <div className="text-center">
              <Button
                onClick={() => navigate('/tournaments')}
                variant="outline"
                size="lg"
              >
                View All Tournaments
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Venues Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Featured Sports Venues
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the best sports facilities across Nepal
            </p>
          </motion.div>

          {venuesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading venues...</p>
            </div>
          ) : featuredVenues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {featuredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/venues/${venue.id}`)}>
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
                            <div className="text-sm opacity-80">{venue.sports_types[0]}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Rating Badge */}
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">{venue.rating}</span>
                      </div>
                    </div>

                    {/* Venue Info */}
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{venue.name}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{venue.description}</p>
                      
                      {/* Location */}
                      <div className="flex items-center text-gray-500 text-sm mb-3">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{venue.district}, {venue.province}</span>
                      </div>
                      
                      {/* Google Maps Link */}
                      {venue.googleMapsLink && (
                        <div className="mb-3">
                          <a
                            href={venue.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 text-xs rounded-full hover:bg-blue-100 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MapPin className="h-3 w-3" />
                            View on Google Maps
                          </a>
                        </div>
                      )}

                      {/* Sports Types */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {venue.sports_types.slice(0, 2).map((sport, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {sport}
                          </span>
                        ))}
                        {venue.sports_types.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{venue.sports_types.length - 2} more
                          </span>
                        )}
                      </div>

                      {/* Pricing */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center text-green-600">
                          <span className="font-semibold">रू {venue.price_per_hour}/hr</span>
                        </div>
                        <div className="flex items-center text-gray-500 text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{venue.total_reviews} reviews</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/venues/${venue.id}`);
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
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🏟️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No venues available</h3>
              <p className="text-gray-600 mb-6">Check back later for featured venues!</p>
            </div>
          )}

          {/* View All Venues Button */}
          {featuredVenues.length > 0 && (
            <div className="text-center">
              <Button
                onClick={() => navigate('/venues')}
                variant="outline"
                size="lg"
              >
                View All Venues
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose खेल खेलेको?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              We make it easy to discover, book, and enjoy sports facilities across Nepal
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of sports enthusiasts who are already using our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg"
              >
                Sign Up Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/facilities')}
                className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg"
              >
                Explore Facilities
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};