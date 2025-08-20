import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Trophy,
  Star,
  Award,
  Calendar,
  Globe,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Phone,
  Mail,
  Users,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { profileService, playerStatsService, achievementService } from '../../lib/database';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const ViewPlayerProfile: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [showContact, setShowContact] = useState(false);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
    }
  }, [playerId]);

  const loadPlayerData = async () => {
    if (!playerId) return;
    
    try {
      setLoading(true);
      
      // Load profile data
      const profileData = await profileService.getProfile(playerId);
      setProfile(profileData);
      
      // Load player stats
      try {
        const statsData = await playerStatsService.getPlayerStats(playerId);
        setStats(statsData);
      } catch (error) {
        console.log('No stats available for this player');
      }
      
      // Load achievements
      try {
        const achievementsData = await achievementService.getPlayerAchievements(playerId);
        setAchievements(achievementsData);
      } catch (error) {
        console.log('No achievements available for this player');
      }
      
    } catch (error) {
      console.error('Error loading player data:', error);
      toast.error('Failed to load player profile');
      navigate('/tournament-map');
    } finally {
      setLoading(false);
    }
  };

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
    const socialLinks = profile?.social_links || {};
    return socialLinks[platform as keyof typeof socialLinks];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading player profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Player Not Found</h2>
          <p className="text-gray-600 mb-4">The player profile you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/tournament-map')}>
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="h-12 w-12 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{profile.full_name}</h1>
                <div className="flex items-center space-x-4 text-gray-600">
                  {profile.location && (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.date_of_birth && (
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{getAgeFromDate(profile.date_of_birth)} years old</span>
                    </div>
                  )}
                  {profile.skill_level && (
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4" />
                      <span className="capitalize">{profile.skill_level}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Contact Toggle Button */}
              {profile.privacy_settings?.show_contact && (
                <Button
                  variant="outline"
                  onClick={() => setShowContact(!showContact)}
                  className="flex items-center space-x-2"
                >
                  {showContact ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  <span>{showContact ? 'Hide Contact' : 'Show Contact'}</span>
                </Button>
              )}
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            {profile.bio && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  <p className="text-gray-700 leading-relaxed">{profile.bio}</p>
                </Card>
              </motion.div>
            )}

            {/* Sports & Skills */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                  Sports & Skills
                </h3>
                <div className="space-y-4">
                  {profile.favorite_sports && profile.favorite_sports.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Favorite Sports</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {profile.favorite_sports.map((sport: string, index: number) => (
                          <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {sport}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.preferred_position && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Preferred Position</label>
                      <p className="text-gray-900">{profile.preferred_position}</p>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Statistics */}
            {stats && profile.privacy_settings?.show_stats && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-600" />
                    Performance Statistics
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{stats.matches_played || 0}</div>
                      <div className="text-sm text-gray-600">Matches Played</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.matches_won || 0}</div>
                      <div className="text-sm text-gray-600">Matches Won</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{stats.matches_lost || 0}</div>
                      <div className="text-sm text-gray-600">Matches Lost</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{stats.performance_rating || 0}</div>
                      <div className="text-sm text-gray-600">Rating</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Achievements */}
            {achievements.length > 0 && profile.privacy_settings?.show_achievements && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-yellow-600" />
                    Achievements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-3 h-3 rounded-full bg-${achievement.badge_color || 'blue'}-500`}></div>
                        <div>
                          <div className="font-medium text-gray-900">{achievement.title}</div>
                          <div className="text-sm text-gray-600">{achievement.description}</div>
                          {achievement.tournament_name && (
                            <div className="text-xs text-blue-600">{achievement.tournament_name}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            {profile.privacy_settings?.show_contact && showContact && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-green-600" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    {profile.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-700">{profile.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span className="text-gray-700">{profile.email}</span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Physical Information */}
            {(profile.height || profile.weight) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Physical Details</h3>
                  <div className="space-y-3">
                    {profile.height && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Height:</span>
                        <span className="font-medium">{profile.height} cm</span>
                      </div>
                    )}
                    {profile.weight && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Weight:</span>
                        <span className="font-medium">{profile.weight} kg</span>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Social Links */}
            {profile.social_links && Object.keys(profile.social_links).length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Globe className="h-5 w-5 mr-2 text-blue-600" />
                    Social Links
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(profile.social_links).map(([platform, url]) => {
                      if (!url) return null;
                      return (
                        <a
                          key={platform}
                          href={url as string}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          {getSocialIcon(platform)}
                          <span className="capitalize text-blue-600 hover:text-blue-800">
                            {platform}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Organization Info */}
            {profile.organization_name && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium text-gray-900">{profile.organization_name}</div>
                      {profile.organization_description && (
                        <div className="text-sm text-gray-600 mt-1">{profile.organization_description}</div>
                      )}
                    </div>
                    {profile.website && (
                      <a
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Profile Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Info</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Member since:</span>
                    <span>{formatDate(profile.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last updated:</span>
                    <span>{formatDate(profile.updated_at)}</span>
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
