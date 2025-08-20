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

interface AnalyticsData {
  totalUsers: number;
  totalTournaments: number;
  totalRegistrations: number;
  totalRevenue: number;
  monthlyGrowth: {
    users: number;
    tournaments: number;
    revenue: number;
  };
  topSports: Array<{ sport: string; count: number; percentage: number }>;
  recentActivity: Array<{
    id: string;
    type: 'registration' | 'tournament' | 'user';
    description: string;
    timestamp: string;
    metadata?: any;
  }>;
}

export const RealTimeAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    loadAnalyticsData();
    
    // Set up periodic refresh for real-time feel
    const interval = setInterval(loadAnalyticsData, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    if (!loading) setRefreshing(true);
    
    try {
      const [profiles, tournaments, registrations] = await Promise.all([
        profileService.getAllProfiles(),
        tournamentService.getAllTournaments(),
        registrationService.getAllRegistrations()
      ]);

      // Calculate revenue from tournaments
      const totalRevenue = tournaments
        .filter(t => t.status === 'approved' || t.status === 'completed')
        .reduce((sum, t) => sum + (t.entry_fee * (t.current_participants || 0)), 0);

      // Calculate sport distribution
      const sportCounts: { [key: string]: number } = {};
      tournaments.forEach(t => {
        sportCounts[t.sport_type] = (sportCounts[t.sport_type] || 0) + 1;
      });

      const topSports = Object.entries(sportCounts)
        .map(([sport, count]) => ({
          sport,
          count,
          percentage: (count / tournaments.length) * 100
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Generate recent activity from real data
      const recentActivity = [
        ...tournaments.slice(-5).map(t => ({
          id: t.id,
          type: 'tournament' as const,
          description: `Tournament "${t.name}" ${t.status === 'pending_approval' ? 'submitted for approval' : 'updated'}`,
          timestamp: t.updated_at || t.created_at,
          metadata: { tournamentId: t.id, organizerId: t.organizer_id }
        })),
        ...profiles.slice(-3).map(p => ({
          id: p.id,
          type: 'user' as const,
          description: `New ${p.role} "${p.full_name}" joined the platform`,
          timestamp: p.created_at,
          metadata: { userId: p.id, role: p.role }
        }))
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

      // Calculate real growth metrics
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const recentUsers = profiles.filter(p => 
        new Date(p.created_at) >= thirtyDaysAgo
      ).length;
      
      const recentTournaments = tournaments.filter(t => 
        new Date(t.created_at) >= thirtyDaysAgo
      ).length;
      
      const recentRevenue = tournaments
        .filter(t => new Date(t.created_at) >= thirtyDaysAgo && (t.status === 'approved' || t.status === 'completed'))
        .reduce((sum, t) => sum + (t.entry_fee * (t.current_participants || 0)), 0);

      setAnalyticsData({
        totalUsers: profiles.length,
        totalTournaments: tournaments.length,
        totalRegistrations: registrations.length,
        totalRevenue,
        monthlyGrowth: {
          users: recentUsers,
          tournaments: recentTournaments,
          revenue: recentRevenue
        },
        topSports,
        recentActivity
      });
    } catch (error) {
      console.error('Error loading analytics data:', error);
      // Set zero values instead of fake data
      setAnalyticsData({
        totalUsers: 0,
        totalTournaments: 0,
        totalRegistrations: 0,
        totalRevenue: 0,
        monthlyGrowth: {
          users: 0,
          tournaments: 0,
          revenue: 0
        },
        topSports: [],
        recentActivity: []
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
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
      ['Monthly User Growth', analyticsData.monthlyGrowth.users.toString()],
      ['Monthly Tournament Growth', analyticsData.monthlyGrowth.tournaments.toString()],
      ['Monthly Revenue Growth', `रू ${analyticsData.monthlyGrowth.revenue.toLocaleString()}`],
      [''],
      ['Top Sports', 'Count'],
      ...analyticsData.topSports.map(sport => [sport.sport, sport.count.toString()])
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
        <Button onClick={loadAnalyticsData} className="mt-4">
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
          <Button variant="outline" onClick={loadAnalyticsData} loading={refreshing}>
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
              <p className="text-sm text-green-600 mt-1">+{analyticsData.monthlyGrowth.users} this month</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Tournaments</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.totalTournaments}</p>
              <p className="text-sm text-green-600 mt-1">+{analyticsData.monthlyGrowth.tournaments} this month</p>
            </div>
            <Trophy className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">रू {analyticsData.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+रू {analyticsData.monthlyGrowth.revenue.toLocaleString()} this month</p>
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
            {analyticsData.topSports.map((sport, index) => (
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
            {analyticsData.recentActivity.map((activity) => (
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
                  <p className="text-sm font-medium text-gray-900">{activity.description}</p>
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