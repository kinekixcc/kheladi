import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { Users, Trophy, Settings, BarChart3, Shield, AlertTriangle, CheckCircle, XCircle, Award, DollarSign, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { tournamentService, profileService, notificationService } from '../lib/database';
import { realtimeManager } from '../lib/realtime';
import { SystemSettings } from '../components/admin/SystemSettings';
import { GlobalConnectivityMonitor } from '../components/admin/GlobalConnectivityMonitor';
import { AdminTournamentManagement } from '../components/admin/AdminTournamentManagement';
import { RealTimeAnalytics } from '../components/analytics/RealTimeAnalytics';
import { DynamicAdminControl } from '../components/admin/DynamicAdminControl';
import { RevenueTestingSystem } from '../components/monetization/RevenueTestingSystem';
import { ScalableOrganizerManagement } from '../components/admin/ScalableOrganizerManagement';
import { OrganizerBadgeSystem } from '../components/admin/OrganizerBadgeSystem';
import { VenueManagement } from '../components/admin/VenueManagement';
import { VenueWorkflowManagement } from '../components/admin/VenueWorkflowManagement';
import { AddVenueForm } from '../components/admin/AddVenueForm';
import { auditLogService } from '../lib/auditLog';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<'overview' | 'tournaments' | 'organizers' | 'analytics' | 'revenue' | 'control' | 'connectivity' | 'settings' | 'badges' | 'venues'>(() => {
    const saved = localStorage.getItem('adminSelectedTab');
    return (saved as any) || 'venues';
  });
  const [showAddVenueForm, setShowAddVenueForm] = useState(false);
  
  // Debug: Log tab changes and persist to localStorage
  useEffect(() => {
    console.log('🎯 AdminDashboard: Tab changed to:', selectedTab);
    console.trace('Tab change stack trace');
    localStorage.setItem('adminSelectedTab', selectedTab);
  }, [selectedTab]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [realtimeActivity, setRealtimeActivity] = useState<any[]>([]);

  useEffect(() => {
    loadAdminData();
    setupRealtimeSubscriptions();
    
    return () => {
      realtimeManager.cleanup();
    };
  }, []);

  const setupRealtimeSubscriptions = () => {
    // Subscribe to global activity for real-time dashboard updates
    realtimeManager.subscribeGlobalActivity((payload) => {
      console.log('Global activity update:', payload);
      
      const activity = {
        id: Date.now().toString(),
        type: payload.type,
        action: getActivityAction(payload),
        timestamp: new Date().toISOString(),
        data: payload.new || payload.old
      };
      
      setRealtimeActivity(prev => [activity, ...prev.slice(0, 19)]); // Keep last 20 activities
      
      // Refresh data if needed
      if (payload.type === 'tournament') {
        loadAdminData();
      }
    });
  };

  const getActivityAction = (payload: any) => {
    switch (payload.type) {
      case 'tournament':
        if (payload.eventType === 'INSERT') return 'New tournament created';
        if (payload.eventType === 'UPDATE') return 'Tournament updated';
        if (payload.eventType === 'DELETE') return 'Tournament deleted';
        break;
      case 'registration':
        if (payload.eventType === 'INSERT') return 'New registration';
        if (payload.eventType === 'UPDATE') return 'Registration updated';
        break;
      case 'user':
        if (payload.eventType === 'INSERT') return 'New user registered';
        if (payload.eventType === 'UPDATE') return 'User profile updated';
        break;
    }
    return 'System activity';
  };
  const loadAdminData = async () => {
    setLoading(true);
    try {
      console.log('🔄 ADMIN DASHBOARD: Loading comprehensive data...');
      
      const [tournamentsData, usersData] = await Promise.all([
        tournamentService.getAllTournaments(),
        profileService.getAllProfiles()
      ]);
      
      console.log('✅ Admin data loaded successfully');
      console.log('📊 Comprehensive tournament data:', {
        total: tournamentsData.length,
        pending: tournamentsData.filter(t => t.status === 'pending_approval').length,
        approved: tournamentsData.filter(t => t.status === 'approved').length,
        rejected: tournamentsData.filter(t => t.status === 'rejected').length,
        completed: tournamentsData.filter(t => t.status === 'completed').length,
        active: tournamentsData.filter(t => t.status === 'active').length,
        cancelled: tournamentsData.filter(t => t.status === 'cancelled').length
      });
      console.log('👥 User data loaded:', {
        total: usersData.length,
        admins: usersData.filter(u => u.role === 'admin').length,
        organizers: usersData.filter(u => u.role === 'organizer').length,
        players: usersData.filter(u => u.role === 'player').length
      });
      
      setTournaments(tournamentsData);
      setUsers(usersData);
      
    } catch (error) {
      console.error('❌ ADMIN DASHBOARD: Failed to load data:', error);
      
      // Provide specific error feedback
      if (error instanceof Error) {
        if (error.message.includes('Supabase not connected')) {
          toast.error('Database connection required. Please connect to Supabase.');
        } else if (error.message.includes('permission')) {
          toast.error('Insufficient permissions to access admin data.');
        } else {
          toast.error(`Admin data loading failed: ${error.message}`);
        }
      } else {
        toast.error('Failed to load admin dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: any) => {
    console.log('🎯 AdminDashboard: Manual tab change to:', tab);
    setSelectedTab(tab);
  };

  const handleUpdateUser = async (userId: string, updates: any) => {
    try {
      await profileService.updateProfile(userId, updates);
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, ...updates } : u
      ));
      toast.success('User updated successfully!');
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) {
      toast.error('User not found');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete user "${user.full_name}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      // In production, this would call the actual delete API
      console.log('🗑️ Deleting user:', userId);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast.success('User deleted successfully!');
      
      // Log the admin action
      await auditLogService.logAction(
        user?.id || '',
        user?.full_name || 'Admin',
        'DELETE_USER',
        'user',
        userId,
        user,
        null,
        { admin_action: true }
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  const pendingCount = tournaments.filter(t => t.status === 'pending_approval').length;
  const approvedCount = tournaments.filter(t => t.status === 'approved').length;
  const totalRevenue = tournaments
    .filter(t => t.status === 'approved')
    .reduce((sum, t) => sum + (t.entry_fee * (t.current_participants || 0)), 0);

  const stats = [
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Total Users',
      value: users.length.toString(),
      change: `${users.filter(u => u.role !== 'admin').length} active users`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Total Tournaments',
      value: tournaments.length.toString(),
      change: `${pendingCount} pending approval`,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: <AlertTriangle className="h-6 w-6" />,
      title: 'Pending Approvals',
      value: pendingCount.toString(),
      change: 'Require admin action',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Welcome back, {user?.full_name}! Manage tournaments and users
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-orange-600 font-medium">
                {pendingCount > 0 ? `${pendingCount} tournaments awaiting approval` : 'No pending tournaments'}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-4 w-4" /> },
                { id: 'tournaments', label: 'Tournaments', icon: <Trophy className="h-4 w-4" /> },
                { id: 'venues', label: 'Venues', icon: <MapPin className="h-4 w-4" /> },
                { id: 'organizers', label: 'Organizers', icon: <Users className="h-4 w-4" /> },
                { id: 'control', label: 'Control Center', icon: <Settings className="h-4 w-4" /> },
                { id: 'analytics', label: 'Real-Time Analytics', icon: <BarChart3 className="h-4 w-4" /> },
                { id: 'revenue', label: 'Revenue Testing', icon: <DollarSign className="h-4 w-4" /> },
                { id: 'connectivity', label: 'Global Monitor', icon: <Shield className="h-4 w-4" /> },
                { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
                { id: 'badges', label: 'Organizer Badges', icon: <Award className="h-4 w-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                  {tab.id === 'tournaments' && pendingCount > 0 && (
                    <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                      {pendingCount}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {selectedTab === 'overview' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {stat.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <div className={stat.color}>
                          {stat.icon}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Recent Activity */}
              <Card className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Recent Activity
                </h2>
                <div className="space-y-4">
                  {tournaments.length === 0 ? (
                    <div className="text-center py-8">
                      <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No tournament activity yet</p>
                    </div>
                  ) : (
                    tournaments
                      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                      .slice(0, 5)
                      .map((tournament) => (
                        <div key={tournament.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                          <Trophy className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {tournament.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {tournament.organizer_name} • {new Date(tournament.updated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            tournament.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                            tournament.status === 'approved' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {tournament.status.replace('_', ' ')}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </Card>
            </div>
          )}

          {selectedTab === 'tournaments' && (
            <AdminTournamentManagement 
              tournaments={tournaments} 
              onTournamentUpdate={loadAdminData} 
            />
          )}

          {selectedTab === 'venues' && (
            <VenueWorkflowManagement onAddVenue={() => setShowAddVenueForm(true)} />
          )}

          {selectedTab === 'organizers' && (
            <ScalableOrganizerManagement onOrganizerUpdate={loadAdminData} />
          )}

          {selectedTab === 'control' && (
            <DynamicAdminControl />
          )}

          {selectedTab === 'analytics' && (
            <RealTimeAnalytics />
          )}

          {selectedTab === 'revenue' && (
            <RevenueTestingSystem />
          )}

          {selectedTab === 'connectivity' && (
            <GlobalConnectivityMonitor />
          )}

          {selectedTab === 'settings' && (
            <SystemSettings />
          )}

          {selectedTab === 'badges' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900">Organizer Badge Management</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {users.filter(u => u.role === 'organizer').map((organizer) => {
                  const organizerTournaments = tournaments.filter(t => t.organizer_id === organizer.id);
                  const stats = {
                    tournaments_hosted: organizerTournaments.length,
                    total_participants: organizerTournaments.reduce((sum, t) => sum + (t.current_participants || 0), 0),
                    average_rating: 4.2, // This would come from actual ratings
                    completion_rate: 96
                  };
                  
                  return (
                    <OrganizerBadgeSystem
                      key={organizer.id}
                      organizerId={organizer.id}
                      organizerName={organizer.full_name}
                      organizerStats={stats}
                      onBadgeUpdate={() => {
                        // Refresh data if needed
                        console.log('Badge updated for organizer:', organizer.id);
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>

        {/* Tournament Approval Modal */}
        {/* Removed TournamentApprovalModal */}
      </div>

      {/* Add Venue Form Modal */}
      {showAddVenueForm && (
        <AddVenueForm
          onClose={() => setShowAddVenueForm(false)}
          onSuccess={() => {
            setShowAddVenueForm(false);
            loadAdminData(); // Refresh data after adding venue
          }}
        />
      )}
    </div>
  );
};