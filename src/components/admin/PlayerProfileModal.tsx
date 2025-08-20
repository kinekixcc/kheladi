import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Phone, MapPin, Calendar, Trophy, Users, Award, Globe, Linkedin, Twitter, Instagram, Facebook } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface PlayerProfile {
  id: string;
  full_name: string;
  bio?: string;
  favorite_sports?: string[];
  skill_level?: string;
  location?: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  preferred_position?: string;
  social_links?: {
    linkedin?: string;
    twitter?: string;
    instagram?: string;
    facebook?: string;
    website?: string;
  };
  notification_settings?: {
    marketing_emails: boolean;
    push_notifications: boolean;
    tournament_updates: boolean;
    email_notifications: boolean;
    registration_alerts: boolean;
  };
  privacy_settings?: {
    show_stats: boolean;
    show_contact: boolean;
    show_achievements: boolean;
  };
  organization_name?: string;
  organization_description?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

interface RegistrationData {
  id: string;
  player_name: string;
  email: string;
  phone: string;
  age: number;
  experience_level: string;
  team_name?: string;
  emergency_contact: string;
  medical_conditions?: string;
  status: string;
  entry_fee_paid: boolean;
  payment_status: string;
  registration_date: string;
  profiles: PlayerProfile;
  tournaments: {
    name: string;
    sport_type: string;
  };
}

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: RegistrationData;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  registration
}) => {
  // Early return if no registration data or profiles
  if (!isOpen || !registration || !registration.profiles) {
    return null;
  }

  const player = registration.profiles;
  
  const getAgeFromDate = (dateString: string) => {
    const birthDate = new Date(dateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'linkedin': return <Linkedin className="h-4 w-4" />;
      case 'twitter': return <Twitter className="h-4 w-4" />;
      case 'instagram': return <Instagram className="h-4 w-4" />;
      case 'facebook': return <Facebook className="h-4 w-4" />;
      case 'website': return <Globe className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const getSocialUrl = (platform: string) => {
    const socialLinks = player.social_links || {};
    return socialLinks[platform as keyof typeof socialLinks];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">{player.full_name}</h2>
                  <p className="text-blue-100">Player Profile</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Registration Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                Tournament Registration Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Tournament:</span>
                    <span className="font-medium">{registration.tournaments.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Registered:</span>
                    <span className="font-medium">{formatDate(registration.registration_date)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                      registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {registration.status === 'registered' ? 'Pending Review' : 
                       registration.status === 'confirmed' ? 'Confirmed' :
                       registration.status === 'rejected' ? 'Rejected' : registration.status}
                    </span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Award className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Experience:</span>
                    <span className="font-medium capitalize">{registration.experience_level}</span>
                  </div>
                  {registration.team_name && (
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Team:</span>
                      <span className="font-medium">{registration.team_name}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Age:</span>
                    <span className="font-medium">{registration.age} years</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-gray-900 font-medium">{player.full_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{registration.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{registration.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                    <p className="text-gray-900">{registration.emergency_contact}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {player.date_of_birth && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Date of Birth</label>
                      <p className="text-gray-900">{formatDate(player.date_of_birth)} ({getAgeFromDate(player.date_of_birth)} years)</p>
                    </div>
                  )}
                  {player.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location</label>
                      <p className="text-gray-900">{player.location}</p>
                    </div>
                  )}
                  {player.height && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Height</label>
                      <p className="text-gray-900">{player.height} cm</p>
                    </div>
                  )}
                  {player.weight && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Weight</label>
                      <p className="text-gray-900">{player.weight} kg</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Sports & Skills */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                Sports & Skills
              </h3>
              <div className="space-y-4">
                {player.favorite_sports && player.favorite_sports.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Favorite Sports</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {player.favorite_sports.map((sport, index) => (
                        <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                          {sport}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {player.skill_level && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Skill Level</label>
                    <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${
                      player.skill_level === 'professional' ? 'bg-purple-100 text-purple-800' :
                      player.skill_level === 'advanced' ? 'bg-orange-100 text-orange-800' :
                      player.skill_level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {player.skill_level}
                    </span>
                  </div>
                )}
                {player.preferred_position && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">Preferred Position</label>
                    <p className="text-gray-900">{player.preferred_position}</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Bio & Additional Info */}
            {player.bio && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio</h3>
                <p className="text-gray-700 leading-relaxed">{player.bio}</p>
              </Card>
            )}

            {/* Medical Information */}
            {registration.medical_conditions && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical Information</h3>
                <p className="text-gray-700">{registration.medical_conditions}</p>
              </Card>
            )}

            {/* Social Links */}
            {player.social_links && Object.keys(player.social_links).length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2 text-blue-600" />
                  Social Links
                </h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(player.social_links).map(([platform, url]) => {
                    if (!url) return null;
                    return (
                      <a
                        key={platform}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        {getSocialIcon(platform)}
                        <span className="capitalize">{platform}</span>
                      </a>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Organization Info */}
            {player.organization_name && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Organization Name</label>
                    <p className="text-gray-900 font-medium">{player.organization_name}</p>
                  </div>
                  {player.organization_description && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Description</label>
                      <p className="text-gray-700">{player.organization_description}</p>
                    </div>
                  )}
                  {player.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Website</label>
                      <a
                        href={player.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        {player.website}
                      </a>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Footer Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button 
                onClick={() => {
                  // Navigate to player's full profile page
                  window.open(`/player-profile/${player.id}`, '_blank');
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                View Full Profile
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
