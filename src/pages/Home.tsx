import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Users, Star, Trophy, Clock, Shield, Calendar, UserPlus, ArrowRight, Play, Award, Zap } from 'lucide-react';
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

  // Hero background images - you can replace these with your actual venue images
  const heroImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200&h=800&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&h=800&fit=crop'
  ];

  // Featured venue showcase images
  const showcaseImages = [
    'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&h=400&fit=crop'
  ];

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
      // For now, just show success message since joinTournament method doesn't exist
      // You can implement this functionality later
      toast.success('Tournament join functionality coming soon!');
      // TODO: Implement tournament joining logic
      // loadPublicTournaments(); // Refresh the list
    } catch (error) {
      console.error('Error joining tournament:', error);
      toast.error('Failed to join tournament');
    }
  };

  const features = [
    {
      icon: <Search className="h-8 w-8" />,
      title: 'Easy Discovery',
      description: 'Find sports facilities near you with advanced search and filters',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: <MapPin className="h-8 w-8" />,
      title: 'Location-Based',
      description: 'Discover facilities across all 7 provinces and 77 districts of Nepal',
      color: 'from-green-500 to-green-600'
    },
    {
      icon: <Clock className="h-8 w-8" />,
      title: 'Real-time Booking',
      description: 'Book facilities instantly with real-time availability updates',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: <Star className="h-8 w-8" />,
      title: 'Reviews & Ratings',
      description: 'Make informed decisions with user reviews and ratings',
      color: 'from-yellow-500 to-yellow-600'
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: 'Secure Platform',
      description: 'Safe and secure booking with verified facility owners',
      color: 'from-red-500 to-red-600'
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: 'Community Driven',
      description: 'Connect with fellow sports enthusiasts in your area',
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const stats = [
    { number: '500+', label: 'Sports Facilities', icon: '🏟️' },
    { number: '10K+', label: 'Happy Users', icon: '😊' },
    { number: '77', label: 'Districts Covered', icon: '🗺️' },
    { number: '15+', label: 'Sports Types', icon: '⚽' }
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
      {/* Enhanced Hero Section with Background Images */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image Carousel */}
        <div className="absolute inset-0">
          {heroImages.map((image, index) => (
            <motion.div
              key={index}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: index === 0 ? 1 : 0 }}
              transition={{ duration: 2, delay: index * 3 }}
            >
              <img
                src={image}
                alt={`Hero background ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/50"></div>
            </motion.div>
          ))}
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            <div className="mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.8, delay: 1 }}
                className="inline-block p-4 bg-white/20 backdrop-blur-sm rounded-full mb-6"
              >
                <Trophy className="h-16 w-16 text-yellow-400" />
              </motion.div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              <span className="block">Find Your Perfect</span>
              <span className="block bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Sports Venue
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-4xl mx-auto leading-relaxed">
              Discover and book the best sports facilities across Nepal. From football fields to swimming pools, 
              we've got you covered with stunning venues and seamless booking.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button
                size="lg"
                onClick={() => navigate('/facilities')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-5 text-xl font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Search className="mr-3 h-6 w-6" />
                Find Facilities
                <ArrowRight className="ml-3 h-5 w-5" />
              </Button>
              
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/register')}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 text-xl font-semibold rounded-full backdrop-blur-sm bg-white/10 transition-all duration-300"
              >
                <Trophy className="mr-3 h-6 w-6" />
                Join Now
              </Button>
            </div>

            {/* Scroll Indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            >
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-6 h-10 border-2 border-white rounded-full flex justify-center"
              >
                <motion.div
                  animate={{ y: [0, 12, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-1 h-3 bg-white rounded-full mt-2"
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Stats Section with Icons */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Trusted by Sports Enthusiasts
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Join thousands of players who trust our platform for their sports needs
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="text-center group"
              >
                <div className="mb-4">
                  <span className="text-4xl">{stat.icon}</span>
                </div>
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Image Showcase Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Stunning Sports Venues
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Experience the best sports facilities across Nepal
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {showcaseImages.map((image, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative overflow-hidden rounded-2xl shadow-lg group-hover:shadow-2xl transition-all duration-500">
                  <img
                    src={image}
                    alt={`Venue showcase ${index + 1}`}
                    className="w-full h-64 object-cover transform group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 text-white">
                      <h3 className="font-semibold">Premium Venue</h3>
                      <p className="text-sm opacity-90">Click to explore</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Public Tournaments Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block p-4 bg-blue-100 rounded-full mb-6">
              <Trophy className="h-12 w-12 text-blue-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Join Live Tournaments
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover and join tournaments happening near you. No approval needed - jump right in and start playing!
            </p>
          </motion.div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading tournaments...</p>
            </div>
          ) : publicTournaments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {publicTournaments.map((tournament, index) => (
                <motion.div
                  key={tournament.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 bg-white/80 backdrop-blur-sm">
                    {/* Tournament Header with Background */}
                    <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-t-xl overflow-hidden">
                      <div className="absolute inset-0 bg-black/20"></div>
                      <div className="absolute top-4 right-4">
                        {tournament.is_recurring && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 backdrop-blur-sm">
                            <Clock className="h-3 w-3 mr-1" />
                            Recurring
                          </span>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <h3 className="text-xl font-bold">{tournament.sport_type}</h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                        {tournament.name}
                      </h3>

                      {/* Tournament Details */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center space-x-3 text-gray-600">
                          <Calendar className="h-5 w-5 text-blue-500" />
                          <span>Starts {formatDate(tournament.start_date)}</span>
                        </div>
                        <div className="flex items-center space-x-3 text-gray-600">
                          <Users className="h-5 w-5 text-green-500" />
                          <span>
                            {tournament.current_participants || 0}/{tournament.max_participants} participants
                          </span>
                        </div>
                        {tournament.entry_fee > 0 && (
                          <div className="flex items-center space-x-3">
                            <span className="font-bold text-green-600 text-lg">
                              Entry Fee: रू {tournament.entry_fee}
                            </span>
                          </div>
                        )}
                        {tournament.venue_name && (
                          <div className="flex items-center space-x-3 text-gray-600">
                            <MapPin className="h-5 w-5 text-red-500" />
                            <span className="line-clamp-1">{tournament.venue_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Tags */}
                      {tournament.tags && tournament.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-6">
                          {tournament.tags.slice(0, 3).map((tag: string, tagIndex: number) => (
                            <span
                              key={tagIndex}
                              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex space-x-3">
                        <Button
                          onClick={() => navigate(`/tournament/${tournament.id}`)}
                          variant="outline"
                          className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50"
                        >
                          View Details
                        </Button>
                        <Button
                          onClick={() => handleJoinTournament(tournament.id)}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
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
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🏆</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No tournaments available</h3>
              <p className="text-gray-600 mb-8 text-lg">Be the first to create a tournament in your area!</p>
              <Button 
                onClick={() => navigate('/create-tournament')}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-8 py-4 text-lg"
              >
                <Trophy className="h-5 w-5 mr-2" />
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
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white px-10 py-4 text-lg rounded-full"
              >
                View All Tournaments
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Featured Venues Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-block p-4 bg-green-100 rounded-full mb-6">
              <MapPin className="h-12 w-12 text-green-600" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Featured Sports Venues
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Discover the best sports facilities across Nepal with stunning locations and top-notch amenities
            </p>
          </motion.div>

          {venuesLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 text-lg">Loading venues...</p>
            </div>
          ) : featuredVenues.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {featuredVenues.map((venue, index) => (
                <motion.div
                  key={venue.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border-0 overflow-hidden">
                    {/* Venue Image with Overlay */}
                    <div className="relative h-56 overflow-hidden">
                      {venue.images && venue.images.length > 0 ? (
                        <img
                          src={venue.images[0]}
                          alt={venue.name}
                          className="w-full h-full object-cover transform hover:scale-110 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <div className="text-center text-white">
                            <div className="text-6xl mb-3">🏟️</div>
                            <div className="text-lg opacity-90">{venue.sports_types[0]}</div>
                          </div>
                        </div>
                      )}
                      
                      {/* Rating Badge */}
                      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 flex items-center gap-2 shadow-lg">
                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        <span className="font-semibold text-gray-800">{venue.rating}</span>
                      </div>

                      {/* Sports Type Badge */}
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-600 text-white shadow-lg">
                          {venue.sports_types[0]}
                        </span>
                      </div>
                    </div>

                    {/* Venue Info */}
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{venue.name}</h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">{venue.description}</p>
                      
                      {/* Location with Icon */}
                      <div className="flex items-center text-gray-500 text-sm mb-4">
                        <MapPin className="h-5 w-5 mr-2 text-red-500" />
                        <span className="font-medium">{venue.district}, {venue.province}</span>
                      </div>
                      
                      {/* Google Maps Link */}
                      {venue.googleMapsLink && (
                        <div className="mb-4">
                          <a
                            href={venue.googleMapsLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 text-sm rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MapPin className="h-4 w-4" />
                            View on Google Maps
                          </a>
                        </div>
                      )}

                      {/* Sports Types */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {venue.sports_types.slice(0, 3).map((sport: string, idx: number) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full font-medium"
                          >
                            {sport}
                          </span>
                        ))}
                        {venue.sports_types.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-medium">
                            +{venue.sports_types.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Pricing and Reviews */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center text-green-600">
                          <span className="text-2xl font-bold">रू {venue.price_per_hour}</span>
                          <span className="text-sm ml-1 text-gray-500">/hr</span>
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
                        className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 py-3 rounded-xl font-semibold"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-8xl mb-6">🏟️</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No venues available</h3>
              <p className="text-gray-600 mb-8 text-lg">Check back later for featured venues!</p>
            </div>
          )}

          {/* View All Venues Button */}
          {featuredVenues.length > 0 && (
            <div className="text-center">
              <Button
                onClick={() => navigate('/venues')}
                variant="outline"
                size="lg"
                className="border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white px-10 py-4 text-lg rounded-full"
              >
                View All Venues
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Enhanced Features Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
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
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group"
              >
                <div className="text-center p-8 bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-gray-100">
                  <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    <div className="text-white">
                      {feature.icon}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-block p-4 bg-white/20 backdrop-blur-sm rounded-full mb-8">
              <Zap className="h-16 w-16 text-yellow-400" />
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
              Join thousands of sports enthusiasts who are already using our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button
                size="lg"
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-10 py-5 text-xl font-semibold rounded-full shadow-2xl transform hover:scale-105 transition-all duration-300"
              >
                <Award className="mr-3 h-6 w-6" />
                Sign Up Now
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/facilities')}
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-10 py-5 text-xl font-semibold rounded-full backdrop-blur-sm bg-white/10 transition-all duration-300"
              >
                <Search className="mr-3 h-6 w-6" />
                Explore Facilities
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};