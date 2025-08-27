import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Trophy, 
  DollarSign, 
  Calendar,
  Activity,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { tournamentService, registrationService, profileService } from '../../lib/database';
import toast from 'react-hot-toast';

interface AnalyticsData {
  totalRevenue: number;
  platformCommission: number;
  organizerRevenue: number;
  averageTransactionValue: number;
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  userGrowthRate: number;
  totalTournaments: number;
  activeTournaments: number;
  pendingApproval: number;
  completedTournaments: number;
  tournamentCompletionRate: number;
  totalRegistrations: number;
  confirmedRegistrations: number;
  pendingRegistrations: number;
  registrationConversionRate: number;
  monthlyGrowthRate: number;
  revenueGrowthRate: number;
  averageResponseTime: number;
  systemUptime: number;
  errorRate: number;
  activeSessions: number;
}

export const RealTimeAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activityData, setActivityData] = useState<any[]>([]);

  useEffect(() => {
    loadRealAnalyticsData();
    
    // Set up periodic refresh for real-time feel
    const interval = setInterval(loadRealAnalyticsData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadRealAnalyticsData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading real admin analytics data...');
      
      // Load real data from database
      const [tournaments, registrations, profiles] = await Promise.all([
        tournamentService.getAllTournaments(),
        registrationService.getAllRegistrations(),
        profileService.getAllProfiles()
      ]);

      console.log('📊 Tournaments loaded:', tournaments.length);
      console.log('📝 Registrations loaded:', registrations.length);
      console.log('👥 Profiles loaded:', profiles.length);

      // Calculate real revenue metrics
      const confirmedRegistrations = registrations.filter(reg => reg.status === 'confirmed');
      console.log('✅ Confirmed registrations:', confirmedRegistrations.length);
      
      const totalRevenue = confirmedRegistrations.reduce((sum, reg) => sum + (reg.entry_fee || 0), 0);
      console.log('💰 Total revenue calculated:', totalRevenue);
      
      const platformCommission = totalRevenue * 0.15; // 15% platform fee
      const organizerRevenue = totalRevenue - platformCommission;

      // Calculate real user metrics
      const activeUsers = profiles.filter(p => p.is_active).length;
      const newUsersThisMonth = profiles.filter(p => {
        const createdDate = new Date(p.created_at);
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return createdDate >= monthStart;
      }).length;

      // Calculate real tournament metrics
      const activeTournaments = tournaments.filter(t => t.status === 'active').length;
      const pendingApproval = tournaments.filter(t => t.status === 'pending_approval').length;
      const completedTournaments = tournaments.filter(t => t.status === 'completed').length;

      // Calculate real registration metrics
      const totalRegistrations = registrations.length;
      const confirmedRegistrationsCount = confirmedRegistrations.length;
      const pendingRegistrations = registrations.filter(reg => reg.status === 'pending_payment').length;

      // Calculate growth metrics
      const lastMonthRegistrations = registrations.filter(reg => {
        const regDate = new Date(reg.created_at);
        const lastMonth = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
        const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        return regDate >= lastMonth && regDate < thisMonth;
      }).length;

      const growthRate = lastMonthRegistrations > 0 
        ? ((confirmedRegistrationsCount - lastMonthRegistrations) / lastMonthRegistrations) * 100 
        : 0;

      setAnalyticsData({
        // Revenue Metrics
        totalRevenue: totalRevenue,
        platformCommission: platformCommission,
        organizerRevenue: organizerRevenue,
        averageTransactionValue: confirmedRegistrationsCount > 0 ? totalRevenue / confirmedRegistrationsCount : 0,
        
        // User Metrics
        totalUsers: profiles.length,
        activeUsers: activeUsers,
        newUsersThisMonth: newUsersThisMonth,
        userGrowthRate: profiles.length > 0 ? (newUsersThisMonth / profiles.length) * 100 : 0,
        
        // Tournament Metrics
        totalTournaments: tournaments.length,
        activeTournaments: activeTournaments,
        pendingApproval: pendingApproval,
        completedTournaments: completedTournaments,
        tournamentCompletionRate: tournaments.length > 0 ? (completedTournaments / tournaments.length) * 100 : 0,
        
        // Registration Metrics
        totalRegistrations: totalRegistrations,
        confirmedRegistrations: confirmedRegistrationsCount,
        pendingRegistrations: pendingRegistrations,
        registrationConversionRate: totalRegistrations > 0 ? (confirmedRegistrationsCount / totalRegistrations) * 100 : 0,
        
        // Growth Metrics
        monthlyGrowthRate: growthRate,
        revenueGrowthRate: 0, // Would calculate from historical data
        
        // Performance Metrics
        averageResponseTime: 150, // Would come from actual API monitoring
        systemUptime: 99.8, // Would come from actual system monitoring
        errorRate: 0.2, // Would come from actual error tracking
        activeSessions: Math.floor(Math.random() * 50) + 20 // Would come from real-time monitoring
      });

      // Load real-time activity data
      const recentActivity = await loadRecentActivity();
      setActivityData(recentActivity);

    } catch (error) {
      console.error('Error loading real analytics data:', error);
      toast.error('Failed to load analytics data');
      
      // Fallback to zero values instead of fake data
      setAnalyticsData({
        totalRevenue: 0,
        platformCommission: 0,
        organizerRevenue: 0,
        averageTransactionValue: 0,
        totalUsers: 0,
        activeUsers: 0,
        newUsersThisMonth: 0,
        userGrowthRate: 0,
        totalTournaments: 0,
        activeTournaments: 0,
        pendingApproval: 0,
        completedTournaments: 0,
        tournamentCompletionRate: 0,
        totalRegistrations: 0,
        confirmedRegistrations: 0,
        pendingRegistrations: 0,
        registrationConversionRate: 0,
        monthlyGrowthRate: 0,
        revenueGrowthRate: 0,
        averageResponseTime: 0,
        systemUptime: 0,
        errorRate: 0,
        activeSessions: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Load recent real activity
  const loadRecentActivity = async () => {
    try {
      const [recentTournaments, recentRegistrations, recentUsers] = await Promise.all([
        tournamentService.getAllTournaments(),
        registrationService.getAllRegistrations(),
        profileService.getAllProfiles()
      ]);

      const activities: Array<{
        id: string;
        type: string;
        action: string;
        timestamp: string;
        icon: string;
        color: string;
      }> = [];

      // Add recent tournament activities
      recentTournaments.slice(0, 5).forEach(tournament => {
        activities.push({
          id: `tournament_${tournament.id}`,
          type: 'tournament',
          action: `Tournament "${tournament.name}" ${tournament.status}`,
          timestamp: tournament.created_at,
          icon: '🏆',
          color: 'blue'
        });
      });

      // Add recent registration activities
      recentRegistrations.slice(0, 5).forEach(registration => {
        activities.push({
          id: `registration_${registration.id}`,
          type: 'registration',
          action: `New registration for tournament`,
          timestamp: registration.created_at,
          icon: '👤',
          color: 'green'
        });
      });

      // Add recent user activities
      recentUsers.slice(0, 5).forEach(user => {
        activities.push({
          id: `user_${user.id}`,
          type: 'user',
          action: `New user "${user.full_name}" joined`,
          timestamp: user.created_at,
          icon: '👋',
          color: 'purple'
        });
      });

      // Sort by timestamp and return latest 10
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

    } catch (error) {
      console.error('Error loading recent activity:', error);
      return [];
    }
  };

  const exportAnalytics = () => {
    if (!analyticsData) return;
    
    const csvContent = [
      ['Metric', 'Value'],
      ['Total Users', analyticsData.totalUsers.toString()],
      ['Total Tournaments', analyticsData.totalTournaments.toString()],
      ['Total Registrations', analyticsData.totalRegistrations.toString()],
      ['Total Revenue', `रू ${analyticsData.totalRevenue.toLocaleString()}`],
      ['Monthly User Growth', analyticsData.monthlyGrowthRate.toFixed(2) + '%'],
      ['Monthly Tournament Growth', 'N/A'], // No direct monthly tournament growth in this interface
      ['Monthly Revenue Growth', 'N/A'], // No direct monthly revenue growth in this interface
      [''],
      ['Top Sports', 'Count'],
      ['Football', '0'],
      ['Basketball', '0'],
      ['Cricket', '0']
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `analytics_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Failed to load analytics data</p>
        <Button onClick={loadRealAnalyticsData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Real-Time Analytics</h2>
          <p className="text-gray-600">Live platform performance and insights</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" onClick={loadRealAnalyticsData} loading={refreshing}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalUsers}</p>
              <p className="text-sm text-green-600 mt-1">+{analyticsData.newUsersThisMonth} this month</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Tournaments</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalTournaments}</p>
              <p className="text-sm text-green-600 mt-1">+{analyticsData.activeTournaments} active</p>
            </div>
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">रू {analyticsData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+रू {analyticsData.monthlyGrowthRate.toFixed(2)}% this month</p>
            </div>
            <DollarSign className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Registrations</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalRegistrations}</p>
              <p className="text-sm text-gray-600 mt-1">Total participants</p>
            </div>
            <Activity className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Charts and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sports */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Sports</h3>
          <div className="space-y-3">
            {[
              { sport: 'Football', count: 0, percentage: 0 },
              { sport: 'Basketball', count: 0, percentage: 0 },
              { sport: 'Cricket', count: 0, percentage: 0 }
            ].map((sport, index) => (
              <div key={sport.sport} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                    index === 0 ? 'bg-yellow-500' :
                    index === 1 ? 'bg-gray-400' :
                    index === 2 ? 'bg-orange-500' :
                    'bg-blue-500'
                  }`}>
                    {index + 1}
                  </div>
                  <span className="font-medium text-gray-900">{sport.sport}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{sport.count}</div>
                  <div className="text-sm text-gray-500">{sport.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {activityData.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className={`p-2 rounded-full ${
                  activity.type === 'tournament' ? 'bg-blue-100 text-blue-600' :
                  activity.type === 'registration' ? 'bg-green-100 text-green-600' :
                  'bg-purple-100 text-purple-600'
                }`}>
                  {activity.type === 'tournament' && <Trophy className="h-4 w-4" />}
                  {activity.type === 'registration' && <Users className="h-4 w-4" />}
                  {activity.type === 'user' && <Users className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};