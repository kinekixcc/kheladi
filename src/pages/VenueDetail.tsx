import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Phone, Mail, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { supabase } from '../lib/supabase';

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

export const VenueDetail: React.FC = () => {
  const { venueId } = useParams<{ venueId: string }>();
  const navigate = useNavigate();
  const [venue, setVenue] = useState<SimpleVenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (venueId) {
      loadVenue();
    }
  }, [venueId]);

  const loadVenue = async () => {
    if (!venueId) return;
    
    try {
      setLoading(true);
      console.log('🔄 Loading venue:', venueId);
      
      const { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .eq('id', venueId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Venue loaded:', data);
      setVenue(data);
    } catch (error) {
      console.error('❌ Error loading venue:', error);
    } finally {
      setLoading(false);
    }
  };

  const nextImage = () => {
    if (!venue?.images) return;
    setCurrentImageIndex((prev) => 
      prev === venue.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (!venue?.images) return;
    setCurrentImageIndex((prev) => 
      prev === 0 ? venue.images.length - 1 : prev - 1
    );
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!venue) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Venue Not Found</h2>
          <Button onClick={() => navigate('/venues')}>Back to Venues</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Button
            variant="outline"
            onClick={() => navigate('/venues')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Venues
          </Button>
        </motion.div>

        {/* Venue Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{venue.name}</h1>
            <p className="text-xl text-gray-600 mb-4">{venue.description}</p>
            
            {/* Location */}
            <div className="flex items-center text-gray-600 mb-2">
              <MapPin className="h-5 w-5 mr-2" />
              <span>{venue.location || `${venue.district}, ${venue.province}`}</span>
            </div>
            
            {/* Rating */}
            <div className="flex items-center text-gray-600 mb-4">
              <Star className="h-5 w-5 mr-2 text-yellow-500 fill-current" />
              <span className="font-medium">{venue.rating || 0}</span>
              <span className="text-gray-500 ml-1">({venue.total_reviews || 0} reviews)</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="overflow-hidden relative">
                <div className="h-96 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  {venue.images && venue.images.length > 0 ? (
                    <>
                      <img
                        src={venue.images[currentImageIndex]}
                        alt={`${venue.name} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Navigation Arrows */}
                      {venue.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 backdrop-blur-sm"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 rounded-full p-2 backdrop-blur-sm"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      )}
                      
                      {/* Image Counter */}
                      <div className="absolute bottom-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                        {currentImageIndex + 1} / {venue.images.length}
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full text-white">
                      <div className="text-center">
                        <div className="text-6xl mb-2">🏟️</div>
                        <div className="text-lg opacity-80">Sports Venue</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Thumbnail Navigation */}
                {venue.images && venue.images.length > 1 && (
                  <div className="p-4 bg-gray-50">
                    <div className="flex gap-2 overflow-x-auto">
                      {venue.images.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => goToImage(index)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            index === currentImageIndex 
                              ? 'border-blue-500 ring-2 ring-blue-200' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <img
                            src={image}
                            alt={`Thumbnail ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Venue Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Venue</h3>
                <p className="text-gray-700 leading-relaxed">{venue.description}</p>
              </Card>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing & Contact */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-600">
                    रू {venue.price_per_hour || 0}
                  </div>
                  <div className="text-gray-500">per hour</div>
                </div>
                
                <div className="space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700">
                    Contact Venue
                  </Button>
                  <Button variant="outline" className="w-full">
                    Get Directions
                  </Button>
                </div>
              </Card>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {venue.contact_phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-700">{venue.contact_phone}</span>
                    </div>
                  )}
                  {venue.contact_email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-gray-500" />
                      <span className="text-gray-700">{venue.contact_email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <span className="text-gray-700">{venue.district}, {venue.province}</span>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Venue Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Venue Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Rating</span>
                    <span className="font-medium">{venue.rating || 0}/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviews</span>
                    <span className="font-medium">{venue.total_reviews || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price</span>
                    <span className="font-medium">रू {venue.price_per_hour || 0}/hr</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};


