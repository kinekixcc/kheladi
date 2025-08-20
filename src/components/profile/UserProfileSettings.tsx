import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Bell,
  Settings,
  Save,
  Edit,
  Eye,
  Building,
  Award,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { profileService } from '../../lib/database';
import { isSupabaseConfigured } from '../../lib/supabase';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  date_of_birth: z.string().optional(),
  skill_level: z.enum(['beginner', 'intermediate', 'advanced', 'professional']).optional(),
  favorite_sports: z.array(z.string()).optional(),
  // Organizer-specific fields
  organization_name: z.string().optional(),
  organization_description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  social_links: z.object({
    facebook: z.string().optional(),
    instagram: z.string().optional(),
    twitter: z.string().optional()
  }).optional()
});

type ProfileForm = z.infer<typeof profileSchema>;

interface UserProfileSettingsProps {
  userId?: string; // For admin to edit other users
}

export const UserProfileSettings: React.FC<UserProfileSettingsProps> = ({ userId }) => {
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'personal' | 'organization' | 'security' | 'notifications'>('personal');
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    tournament_updates: true,
    registration_alerts: true,
    marketing_emails: false
  });
  const [privacySettings, setPrivacySettings] = useState({
    show_profile: true,
    show_contact: false,
    show_stats: true,
    show_achievements: true
  });

  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isOwnProfile || isAdmin;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (targetUserId) {
      loadProfile();
    }
  }, [targetUserId]);

  const loadProfile = async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const profileData = await profileService.getProfile(targetUserId);
      setProfile(profileData);
      
      if (profileData) {
        reset({
          full_name: profileData.full_name || '',
          phone: profileData.phone || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          date_of_birth: profileData.date_of_birth || '',
          skill_level: profileData.skill_level || 'beginner',
          favorite_sports: profileData.favorite_sports || [],
          organization_name: profileData.organization_name || '',
          organization_description: profileData.organization_description || '',
          website: profileData.website || '',
          social_links: profileData.social_links || {}
        });
        
        setNotificationSettings(profileData.notification_settings || notificationSettings);
        setPrivacySettings(profileData.privacy_settings || privacySettings);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProfileForm) => {
    if (!targetUserId || !canEdit) {
      toast.error('You do not have permission to edit this profile');
      return;
    }

    if (!isSupabaseConfigured) {
      toast.error('Database connection not available. Please check your connection.');
      return;
    }
    
    setSaving(true);
    try {
      // Clean the data - remove empty strings and undefined values
      const cleanedData = Object.fromEntries(
        Object.entries(data).filter(([_, value]) => 
          value !== '' && value !== undefined && value !== null
        )
      );

      // Include all profile fields including notification and privacy settings
      const updatedProfile = {
        ...cleanedData,
        notification_settings: notificationSettings,
        privacy_settings: privacySettings,
        updated_at: new Date().toISOString()
      };
      
      console.log('🔄 Updating profile for user:', targetUserId);
      console.log('📝 Profile data:', updatedProfile);
      
      const result = await profileService.updateProfile(targetUserId, updatedProfile);
      console.log('✅ Profile update result:', result);
      
      setProfile((prev: any) => ({ ...prev, ...updatedProfile }));
      
      // Reset form dirty state
      reset(data);
      
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('❌ Error updating profile:', error);
      
      let errorMessage = 'Failed to update profile';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.details) {
        errorMessage = error.details;
      }
      
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (setting: string, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [setting]: value }));
  };

  const handlePrivacyChange = (setting: string, value: boolean) => {
    setPrivacySettings(prev => ({ ...prev, [setting]: value }));
  };

  // Watch form values to detect changes
  const watchedValues = watch();

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </Card>
      </div>
    );
  }

  // Check if database is connected
  if (!isSupabaseConfigured) {
    return (
      <div className="space-y-6">
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center text-red-800">
            <AlertCircle className="h-5 w-5 mr-2" />
            <div>
              <p className="font-medium">Database Connection Issue</p>
              <p className="text-sm">Unable to connect to the database. Please check your connection and try again.</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isOwnProfile ? 'Profile Settings' : `${profile?.full_name}'s Profile`}
          </h2>
          <p className="text-gray-600">
            {isOwnProfile ? 'Manage your account settings and preferences' : 'Administrative profile management'}
          </p>
        </div>
        {!isOwnProfile && isAdmin && (
          <div className="flex items-center space-x-2 text-sm text-red-600">
            <Shield className="h-4 w-4" />
            <span>Admin Access</span>
          </div>
        )}
      </div>

      {/* Database Connection Status */}
      <Card className="p-4 bg-green-50 border-green-200">
        <div className="flex items-center text-green-800">
          <CheckCircle className="h-5 w-5 mr-2" />
          <div>
            <p className="font-medium">Database Connected</p>
            <p className="text-sm">Your profile changes will be saved to the database.</p>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('personal')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'personal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Personal Info</span>
          </button>
          
          {(profile?.role === 'organizer' || currentUser?.role === 'organizer') && (
            <button
              onClick={() => setActiveTab('organization')}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>Organization</span>
            </button>
          )}
          
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      {...register('full_name')}
                      disabled={!canEdit}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
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
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profile?.email || currentUser?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      {...register('phone')}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Location
                    </label>
                    <input
                      {...register('location')}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                      placeholder="Enter your location"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      {...register('date_of_birth')}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Skill Level
                    </label>
                    <select
                      {...register('skill_level')}
                      disabled={!canEdit}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="professional">Professional</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    {...register('bio')}
                    rows={3}
                    disabled={!canEdit}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 ${
                      errors.bio ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="Tell us about yourself..."
                  />
                  {errors.bio && (
                    <p className="text-sm text-red-600 mt-1">{errors.bio.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {watch('bio')?.length || 0}/500 characters
                  </p>
                </div>
              </Card>
            </div>
            
            {/* Profile Avatar */}
            <div>
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Picture</h3>
                <div className="text-center">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">
                      {(profile?.full_name || currentUser?.full_name)?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  {canEdit && (
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" />
                      Change Picture
                    </Button>
                  )}
                </div>
              </Card>
              
              {/* Account Status */}
              <Card className="p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Email Verified</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Profile Complete</span>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Account Status</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                      Active
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'organization' && (profile?.role === 'organizer' || currentUser?.role === 'organizer') && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name
                </label>
                <input
                  {...register('organization_name')}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="Your organization name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  {...register('website')}
                  disabled={!canEdit}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder="https://yourorganization.com"
                />
                {errors.website && (
                  <p className="text-sm text-red-600 mt-1">{errors.website.message}</p>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Description
              </label>
              <textarea
                {...register('organization_description')}
                rows={3}
                disabled={!canEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                placeholder="Describe your organization..."
              />
            </div>
            
            <div className="mt-4">
              <h4 className="font-medium text-gray-700 mb-3">Social Media Links</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    {...register('social_links.facebook')}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Facebook page URL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    {...register('social_links.instagram')}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Instagram profile URL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    {...register('social_links.twitter')}
                    disabled={!canEdit}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    placeholder="Twitter profile URL"
                  />
                </div>
              </div>
            </div>
            
            {/* Verification Status */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                <Award className="h-4 w-4 mr-2" />
                Verification Status
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Identity Verified</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Contact Verified</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-800">Organization Verified</span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Pending
                  </span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Password & Security</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Security Information</h4>
                  <p className="text-sm text-blue-800">
                    Password changes and two-factor authentication are managed through your account settings.
                    For security reasons, these features are handled separately from profile updates.
                  </p>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-700 mb-3">Account Security Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Email Verified</span>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Profile Complete</span>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Account Status</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Information</h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Privacy Settings</h4>
                  <p className="text-sm text-yellow-800">
                    Control what information is visible to other users.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Show Profile Publicly</p>
                      <p className="text-sm text-gray-600">Allow others to view your profile</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.show_profile}
                      onChange={(e) => handlePrivacyChange('show_profile', e.target.checked)}
                      disabled={!canEdit}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Show Contact Information</p>
                      <p className="text-sm text-gray-600">Display phone and email to other users</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.show_contact}
                      onChange={(e) => handlePrivacyChange('show_contact', e.target.checked)}
                      disabled={!canEdit}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Show Statistics</p>
                      <p className="text-sm text-gray-600">Display your performance stats</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.show_stats}
                      onChange={(e) => handlePrivacyChange('show_stats', e.target.checked)}
                      disabled={!canEdit}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Show Achievements</p>
                      <p className="text-sm text-gray-600">Display badges and achievements</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={privacySettings.show_achievements}
                      onChange={(e) => handlePrivacyChange('show_achievements', e.target.checked)}
                      disabled={!canEdit}
                      className="h-4 w-4 text-blue-600 rounded"
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'notifications' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Email Notifications</h4>
                <p className="text-sm text-blue-800">
                  Choose which types of emails you want to receive.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tournament Updates
                  </label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.tournament_updates}
                    onChange={() => handleNotificationChange('tournament_updates', !notificationSettings.tournament_updates)}
                    disabled={!canEdit}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Registration Alerts
                  </label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.registration_alerts}
                    onChange={() => handleNotificationChange('registration_alerts', !notificationSettings.registration_alerts)}
                    disabled={!canEdit}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marketing Emails
                  </label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.marketing_emails}
                    onChange={() => handleNotificationChange('marketing_emails', !notificationSettings.marketing_emails)}
                    disabled={!canEdit}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Push Notifications
                  </label>
                  <input
                    type="checkbox"
                    checked={notificationSettings.push_notifications}
                    onChange={() => handleNotificationChange('push_notifications', !notificationSettings.push_notifications)}
                    disabled={!canEdit}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-900 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Notification Status
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-green-800">Email Notifications Enabled</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-800">Push Notifications Enabled</span>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Save Button */}
        {canEdit && (
          <div className="flex justify-end space-x-4">
            <div className="flex items-center text-sm text-gray-600">
              {isDirty && (
                <span className="text-orange-600 mr-2">⚠️ You have unsaved changes</span>
              )}
            </div>
            <Button 
              type="submit" 
              loading={saving}
              disabled={!isDirty || saving}
              className="min-w-[120px]"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};