import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Shield,
  Users,
  Trophy,
  MessageCircle,
  Calendar,
  DollarSign,
  Database,
  Zap,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Archive,
  Edit,
  Plus,
  Minus
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

interface FeatureToggle {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: 'core' | 'tournaments' | 'users' | 'monetization' | 'security' | 'ui';
  requiresRestart?: boolean;
  configurable?: boolean;
  config?: any;
}

interface AppConfig {
  features: FeatureToggle[];
  limits: {
    maxTournaments: number;
    maxUsers: number;
    maxTeams: number;
    maxChatMessages: number;
    maxFileSize: number;
  };
  settings: {
    requireApproval: boolean;
    allowPublicTournaments: boolean;
    enableChat: boolean;
    enableTeams: boolean;
    enableRecurring: boolean;
    enableInvites: boolean;
    enableNotifications: boolean;
    enableAuditLog: boolean;
  };
  appearance: {
    theme: 'light' | 'dark' | 'auto';
    primaryColor: string;
    logo: string;
    favicon: string;
  };
}

export const DynamicAdminControl: React.FC = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<AppConfig>({
    features: [
      {
        id: 'tournament_creation',
        name: 'Tournament Creation',
        description: 'Allow users to create tournaments',
        enabled: true,
        category: 'tournaments'
      },
      {
        id: 'public_tournaments',
        name: 'Public Tournaments',
        description: 'Show tournaments to all users without approval',
        enabled: true,
        category: 'tournaments'
      },
      {
        id: 'team_management',
        name: 'Team Management',
        description: 'Allow teams to be created and managed',
        enabled: true,
        category: 'tournaments'
      },
      {
        id: 'chat_system',
        name: 'Chat System',
        description: 'Enable in-app chat for tournaments and teams',
        enabled: true,
        category: 'tournaments'
      },
      {
        id: 'recurring_schedules',
        name: 'Recurring Schedules',
        description: 'Allow tournaments to be scheduled repeatedly',
        enabled: true,
        category: 'tournaments'
      },
      {
        id: 'match_invites',
        name: 'Match Invites',
        description: 'Allow players to send and receive match invitations',
        enabled: true,
        category: 'tournaments'
      },
      {
        id: 'user_registration',
        name: 'User Registration',
        description: 'Allow new users to register',
        enabled: true,
        category: 'users'
      },
      {
        id: 'admin_approval',
        name: 'Admin Approval',
        description: 'Require admin approval for tournaments',
        enabled: false,
        category: 'core'
      },
      {
        id: 'audit_logging',
        name: 'Audit Logging',
        description: 'Track all admin and user actions',
        enabled: true,
        category: 'security'
      },
      {
        id: 'real_time_updates',
        name: 'Real-time Updates',
        description: 'Enable live updates across the app',
        enabled: true,
        category: 'core'
      }
    ],
    limits: {
      maxTournaments: 1000,
      maxUsers: 10000,
      maxTeams: 500,
      maxChatMessages: 10000,
      maxFileSize: 10
    },
    settings: {
      requireApproval: false,
      allowPublicTournaments: true,
      enableChat: true,
      enableTeams: true,
      enableRecurring: true,
      enableInvites: true,
      enableNotifications: true,
      enableAuditLog: true
    },
    appearance: {
      theme: 'light',
      primaryColor: '#3B82F6',
      logo: '/logo.png',
      favicon: '/favicon.ico'
    }
  });

  const [activeTab, setActiveTab] = useState<'features' | 'limits' | 'settings' | 'appearance' | 'database' | 'maintenance'>('features');
  const [loading, setLoading] = useState(false);
  const [editingLimit, setEditingLimit] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // Load config from database or localStorage
      const savedConfig = localStorage.getItem('admin_config');
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error loading config:', error);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      // Save to database and localStorage
      localStorage.setItem('admin_config', JSON.stringify(config));
      
      // Apply changes to database
      await applyConfigChanges();
      
      toast.success('Configuration saved successfully!');
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const applyConfigChanges = async () => {
    // Apply feature toggles to database
    for (const feature of config.features) {
      if (feature.category === 'tournaments') {
        await updateTournamentSettings(feature);
      }
    }

    // Update app-wide settings
    await updateAppSettings();
  };

  const updateTournamentSettings = async (feature: FeatureToggle) => {
    try {
      if (feature.id === 'public_tournaments') {
        // Update all tournaments to be public/private
        const { error } = await supabase
          .from('tournaments')
          .update({ 
            visibility: feature.enabled ? 'public' : 'private',
            requires_approval: !feature.enabled
          })
          .neq('id', '00000000-0000-0000-0000-000000000000'); // Exclude dummy records

        if (error) throw error;
      }

      if (feature.id === 'admin_approval') {
        // Update approval requirement
        const { error } = await supabase
          .from('tournaments')
          .update({ requires_approval: feature.enabled })
          .neq('id', '00000000-0000-0000-0000-000000000000');

        if (error) throw error;
      }
    } catch (error) {
      console.error(`Error updating ${feature.id}:`, error);
    }
  };

  const updateAppSettings = async () => {
    try {
      // Update system-wide settings
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          id: 'app_config',
          config: config.settings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating app settings:', error);
    }
  };

  const toggleFeature = (featureId: string) => {
    setConfig(prev => ({
      ...prev,
      features: prev.features.map(f => 
        f.id === featureId ? { ...f, enabled: !f.enabled } : f
      )
    }));
  };

  const updateLimit = (key: keyof typeof config.limits, value: number) => {
    setConfig(prev => ({
      ...prev,
      limits: { ...prev.limits, [key]: value }
    }));
  };

  const updateSetting = (key: keyof typeof config.settings, value: boolean) => {
    setConfig(prev => ({
      ...prev,
      settings: { ...prev.settings, [key]: value }
    }));
  };

  const startEditingLimit = (key: string, currentValue: number) => {
    setEditingLimit(key);
    setEditingValue(currentValue.toString());
  };

  const saveLimitEdit = () => {
    if (editingLimit && editingValue) {
      const numValue = parseInt(editingValue);
      if (!isNaN(numValue) && numValue > 0) {
        updateLimit(editingLimit as keyof typeof config.limits, numValue);
      }
    }
    setEditingLimit(null);
    setEditingValue('');
  };

  const performMaintenance = async (action: string) => {
    setLoading(true);
    try {
      switch (action) {
        case 'clear_cache':
          localStorage.clear();
          sessionStorage.clear();
          toast.success('Cache cleared successfully');
          break;
        case 'cleanup_orphans':
          await cleanupOrphanedRecords();
          toast.success('Orphaned records cleaned up');
          break;
        case 'rebuild_indexes':
          await rebuildDatabaseIndexes();
          toast.success('Database indexes rebuilt');
          break;
        case 'validate_data':
          await validateDatabaseIntegrity();
          toast.success('Data validation completed');
          break;
      }
    } catch (error) {
      console.error(`Maintenance action ${action} failed:`, error);
      toast.error(`Maintenance action failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanupOrphanedRecords = async () => {
    // Clean up orphaned records
    const { error } = await supabase.rpc('cleanup_orphaned_records');
    if (error) throw error;
  };

  const rebuildDatabaseIndexes = async () => {
    // Rebuild database indexes
    const { error } = await supabase.rpc('rebuild_indexes');
    if (error) throw error;
  };

  const validateDatabaseIntegrity = async () => {
    // Validate database integrity
    const { error } = await supabase.rpc('validate_integrity');
    if (error) throw error;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'core': return <Zap className="h-4 w-4" />;
      case 'tournaments': return <Trophy className="h-4 w-4" />;
      case 'users': return <Users className="h-4 w-4" />;
      case 'monetization': return <DollarSign className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'ui': return <Eye className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'core': return 'bg-blue-100 text-blue-800';
      case 'tournaments': return 'bg-green-100 text-green-800';
      case 'users': return 'bg-purple-100 text-purple-800';
      case 'monetization': return 'bg-yellow-100 text-yellow-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'ui': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dynamic Admin Control</h2>
          <p className="text-gray-600">Control all app features without coding</p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={loadConfig}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload
          </Button>
          <Button
            onClick={saveConfig}
            disabled={loading}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'features', label: 'Feature Toggles', icon: <ToggleLeft className="h-4 w-4" /> },
            { id: 'limits', label: 'System Limits', icon: <Minus className="h-4 w-4" /> },
            { id: 'settings', label: 'App Settings', icon: <Settings className="h-4 w-4" /> },
            { id: 'appearance', label: 'Appearance', icon: <Eye className="h-4 w-4" /> },
            { id: 'database', label: 'Database', icon: <Database className="h-4 w-4" /> },
            { id: 'maintenance', label: 'Maintenance', icon: <Zap className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {config.features.map((feature) => (
                  <Card key={feature.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getCategoryIcon(feature.category)}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(feature.category)}`}>
                            {feature.category}
                          </span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {feature.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4">
                          {feature.description}
                        </p>
                        {feature.requiresRestart && (
                          <div className="flex items-center space-x-2 text-amber-600 text-sm">
                            <AlertTriangle className="h-4 w-4" />
                            <span>Requires app restart</span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <button
                          onClick={() => toggleFeature(feature.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                            feature.enabled ? 'bg-blue-600' : 'bg-gray-200'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              feature.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Limits Tab */}
          {activeTab === 'limits' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Limits</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(config.limits).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </label>
                      {editingLimit === key ? (
                        <div className="flex space-x-2">
                          <Input
                            type="number"
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            className="flex-1"
                            min="1"
                          />
                          <Button onClick={saveLimitEdit} size="sm">Save</Button>
                          <Button 
                            onClick={() => setEditingLimit(null)} 
                            variant="outline" 
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-semibold text-gray-900">{value}</span>
                          <Button
                            onClick={() => startEditingLimit(key, value)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(config.settings).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <label className="text-sm font-medium text-gray-700">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          {key === 'requireApproval' ? 'Require admin approval for tournaments' :
                           key === 'allowPublicTournaments' ? 'Allow tournaments to be public' :
                           key === 'enableChat' ? 'Enable in-app chat system' :
                           key === 'enableTeams' ? 'Allow team creation and management' :
                           key === 'enableRecurring' ? 'Allow recurring tournament schedules' :
                           key === 'enableInvites' ? 'Allow match invitations' :
                           key === 'enableNotifications' ? 'Send push notifications' :
                           key === 'enableAuditLog' ? 'Track all user actions' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => updateSetting(key as keyof typeof config.settings, !value)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          value ? 'bg-blue-600' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Appearance Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={config.appearance.theme}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, theme: e.target.value as any }
                      }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                    <input
                      type="color"
                      value={config.appearance.primaryColor}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        appearance: { ...prev.appearance, primaryColor: e.target.value }
                      }))}
                      className="w-full h-10 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Database Tab */}
          {activeTab === 'database' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => performMaintenance('validate_data')}
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                  >
                    <Database className="h-6 w-6" />
                    <span>Validate Data</span>
                  </Button>
                  <Button
                    onClick={() => performMaintenance('rebuild_indexes')}
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                  >
                    <Zap className="h-6 w-6" />
                    <span>Rebuild Indexes</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Maintenance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => performMaintenance('clear_cache')}
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                  >
                    <RefreshCw className="h-6 w-6" />
                    <span>Clear Cache</span>
                  </Button>
                  <Button
                    onClick={() => performMaintenance('cleanup_orphans')}
                    variant="outline"
                    className="h-20 flex-col space-y-2"
                  >
                    <Trash2 className="h-6 w-6" />
                    <span>Cleanup Orphans</span>
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


