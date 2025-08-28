import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { 
  Edit, 
  Save, 
  MapPin, 
  Trophy,
  Star,
  Award,
  Settings,
  Eye,
  Users,
  X
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { profileService, playerStatsService, achievementService } from '../../lib/database';
import { isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  date_of_birth: z.string().optional(),
  height: z.number().min(100).max(250).optional().or(z.literal('')),
  weight: z.number().min(30).max(200).optional().or(z.literal('')),
  preferred_position: z.string().optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional'])
});

type ProfileForm = z.infer<typeof profileSchema>;

export const PlayerProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [privacySettings, setPrivacySettings] = useState({
    show_stats: true,
    show_achievements: true,
    show_contact: false
  });
  const [showPerformanceModal, setShowPerformanceModal] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: user?.full_name || '',
      phone: '',
      bio: '',
      location: '',
      date_of_birth: '',
      height: undefined,
      weight: undefined,
      preferred_position: '',
      skill_level: 'intermediate'
    },
    mode: 'onChange'
  });

  useEffect(() => {
    if (user?.id) {
      loadPlayerData();
    }
  }, [user?.id]);

  // Reset form when profile data changes
  useEffect(() => {
    if (profile) {
      reset({
        full_name: profile.full_name || user?.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        location: profile.location || '',
        date_of_birth: profile.date_of_birth || '',
        height: profile.height || undefined,
        weight: profile.weight || undefined,
        preferred_position: profile.preferred_position || '',
        skill_level: profile.skill_level || 'intermediate'
      });
    }
  }, [profile, user?.full_name, reset]);

  const loadPlayerData = async () => {
    if (!user?.id) return;
    
    try {
      // Check if Supabase is configured
      if (!isSupabaseConfigured) {
        toast.error('Database connection not configured. Please check your environment settings.');
        return;
      }

      const [profileData, statsData, achievementsData] = await Promise.all([
        profileService.getProfile(user.id),
        playerStatsService.getAggregatedStats(user.id),
        achievementService.getPlayerAchievements(user.id)
      ]);
      
      setProfile(profileData);
      setStats(statsData);
      setAchievements(achievementsData);
      
      if (profileData) {
        reset({
          full_name: profileData.full_name,
          phone: profileData.phone || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          date_of_birth: profileData.date_of_birth || '',
          height: profileData.height || undefined,
          weight: profileData.weight || undefined,
          preferred_position: profileData.preferred_position || '',
          skill_level: profileData.skill_level || 'intermediate'
        });
        
        setPrivacySettings(profileData.privacy_settings || privacySettings);
      }
    } catch (error) {
      console.error('Error loading player data:', error);
      toast.error('Failed to load profile data. Please try again.');
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!user?.id) return;
    
    // Check if Supabase is configured
    if (!isSupabaseConfigured) {
      toast.error('Database connection not configured. Please check your environment settings.');
      return;
    }
    
    setSaving(true);
    try {
      // Clean up the data - remove empty strings and undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => 
          value !== '' && value !== undefined && value !== null
        )
      );

      const updatedProfile = {
        ...cleanedData,
        privacy_settings: privacySettings,
        updated_at: new Date().toISOString()
      };
      
      await profileService.updateProfile(user.id, updatedProfile);
      setProfile(prev => ({ ...prev, ...updatedProfile }));
      setEditing(false);
      toast.success('Profile updated successfully!');
      
      // Reload data to ensure consistency
      await loadPlayerData();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePrivacyChange = (setting: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }));
  };

  const getBadgeColor = (color: string) => {
    const colors: { [key: string]: string } = {
      gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      silver: 'bg-gray-100 text-gray-800 border-gray-300',
      bronze: 'bg-orange-100 text-orange-800 border-orange-300',
      blue: 'bg-blue-100 text-blue-800 border-blue-300',
      green: 'bg-green-100 text-green-800 border-green-300',
      purple: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    return colors[color] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  // Watch form values for real-time validation
  const watchedValues = watch();

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-blue-600">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user?.full_name}</h2>
              <p className="text-gray-600">{user?.email}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {profile?.skill_level || 'intermediate'}
                </span>
                {profile?.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    {profile.location}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant={editing ? 'outline' : 'primary'}
            onClick={() => setEditing(!editing)}
          >
            {editing ? (
              <>
                <Eye className="h-4 w-4 mr-2" />
                View Mode
              </>
            ) : (
              <>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Database Connection Status */}
      {!isSupabaseConfigured && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center text-red-800">
            <span className="text-lg mr-2">⚠️</span>
            <div>
              <p className="font-medium">Database Connection Issue</p>
              <p className="text-sm">Your profile cannot be saved because the database connection is not configured.</p>
              <p className="text-sm">Please check your environment variables and restart the application.</p>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Form */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editing ? 'Edit Profile Information' : 'Profile Information'}
            </h3>
            
            {editing ? (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      {...register('full_name')}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.full_name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Enter your full name"
                    />
                    {errors.full_name && (
                      <p className="text-sm text-red-600 mt-1">{errors.full_name.message}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      {...register('phone')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      {...register('location')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your city/location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Level *
                    </label>
                    <select
                      {...register('skill_level')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      {...register('date_of_birth')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      {...register('height', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? undefined : Number(value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="170"
                      min="100"
                      max="250"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      {...register('weight', { 
                        valueAsNumber: true,
                        setValueAs: (value) => value === '' ? undefined : Number(value)
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="70"
                      min="30"
                      max="200"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditing(false)}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    loading={saving}
                    disabled={!isValid || !isSupabaseConfigured}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium">{profile?.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-medium">{profile?.location || 'Not provided'}</p>
                  </div>
                </div>
                
                {profile?.bio && (
                  <div>
                    <p className="text-sm text-gray-600">Bio</p>
                    <p className="font-medium">{profile.bio}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Date of Birth</p>
                    <p className="font-medium">
                      {profile?.date_of_birth 
                        ? new Date(profile.date_of_birth).toLocaleDateString() 
                        : 'Not provided'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Height</p>
                    <p className="font-medium">
                      {profile?.height ? `${profile.height} cm` : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Weight</p>
                    <p className="font-medium">
                      {profile?.weight ? `${profile.weight} kg` : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* Privacy Settings */}
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              Privacy Settings
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Show Statistics</p>
                  <p className="text-sm text-gray-600">Allow others to see your performance stats</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.show_stats}
                  onChange={(e) => handlePrivacyChange('show_stats', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Show Achievements</p>
                  <p className="text-sm text-gray-600">Display your achievements on profile</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.show_achievements}
                  onChange={(e) => handlePrivacyChange('show_achievements', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Show Contact Info</p>
                  <p className="text-sm text-gray-600">Allow organizers to contact you</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacySettings.show_contact}
                  onChange={(e) => handlePrivacyChange('show_contact', e.target.checked)}
                  className="h-4 w-4 text-blue-600 rounded"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Player Stats */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Trophy className="h-5 w-5 mr-2 text-yellow-600" />
              Player Statistics
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tournaments Joined</span>
                <span className="font-medium">{stats?.totalTournaments || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Matches Won</span>
                <span className="font-medium">{stats?.matchesWon || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Win Rate</span>
                <span className="font-medium">{stats?.winRate?.toFixed(1) || 0}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Hours Played</span>
                <span className="font-medium">{stats?.hoursPlayed || 0}h</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-900 font-medium">Player Rating</span>
                <span className="font-bold text-yellow-600">{stats?.overallRating?.toFixed(1) || 0}</span>
              </div>
            </div>
          </Card>

          {/* Recent Achievements */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Award className="h-5 w-5 mr-2 text-purple-600" />
              Recent Achievements
            </h3>
            
            {achievements.length === 0 ? (
              <div className="text-center py-6">
                <Award className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No achievements yet</p>
                <p className="text-gray-400 text-xs">Participate in tournaments to earn achievements</p>
              </div>
            ) : (
              <div className="space-y-3">
                {achievements.slice(0, 3).map((achievement, index) => (
                  <div
                    key={achievement.id}
                    className={`p-3 rounded-lg border ${getBadgeColor(achievement.badge_color)}`}
                  >
                    <div className="flex items-center mb-1">
                      <Trophy className="h-4 w-4 mr-2" />
                      <h4 className="font-semibold text-sm">{achievement.title}</h4>
                    </div>
                    <p className="text-xs">{achievement.description}</p>
                    <p className="text-xs opacity-75 mt-1">
                      {new Date(achievement.earned_date).toLocaleDateString()}
                    </p>
                  </div>
                ))}
                
                {achievements.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full">
                    View All Achievements ({achievements.length})
                  </Button>
                )}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => navigate('/tournaments')}
              >
                <Trophy className="h-4 w-4 mr-2" />
                Find Tournaments
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.location.href = '/player-dashboard?tab=teams'}
              >
                <Users className="h-4 w-4 mr-2" />
                Manage Teams
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowPerformanceModal(true)}
              >
                <Star className="h-4 w-4 mr-2" />
                Rate Performance
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Performance Rating Modal */}
      {showPerformanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Rate Your Performance</h3>
                <button
                  onClick={() => setShowPerformanceModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    How would you rate your recent performance?
                  </label>
                  <div className="flex space-x-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        className="p-2 text-2xl hover:text-yellow-500 transition-colors"
                      >
                        <Star className="h-8 w-8" />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="Share your thoughts on your performance..."
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowPerformanceModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success('Performance rating submitted!');
                      setShowPerformanceModal(false);
                    }}
                  >
                    Submit Rating
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};