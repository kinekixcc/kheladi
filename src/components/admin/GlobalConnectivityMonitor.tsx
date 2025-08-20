import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Users, 
  Activity, 
  Wifi, 
  Clock, 
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface ConnectionData {
  region: string;
  activeUsers: number;
  latency: number;
  status: 'healthy' | 'warning' | 'error';
  lastUpdate: string;
}

export const GlobalConnectivityMonitor: React.FC = () => {
  const [connectionData, setConnectionData] = useState<ConnectionData[]>([
    { region: 'Asia-Pacific', activeUsers: 1250, latency: 45, status: 'healthy', lastUpdate: '2 min ago' },
    { region: 'Europe', activeUsers: 320, latency: 120, status: 'healthy', lastUpdate: '1 min ago' },
    { region: 'North America', activeUsers: 180, latency: 200, status: 'warning', lastUpdate: '3 min ago' },
    { region: 'South Asia', activeUsers: 890, latency: 35, status: 'healthy', lastUpdate: '1 min ago' }
  ]);

  const [globalStats, setGlobalStats] = useState({
    totalActiveUsers: 2640,
    activeTournaments: 156,
    globalLatency: 85,
    uptime: 99.8
  });

  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    try {
      // Simulate API call to refresh global connectivity data with realistic updates
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update with simulated new data based on realistic patterns
      setConnectionData(prev => prev.map(region => ({
        ...region,
        activeUsers: Math.max(0, region.activeUsers + Math.floor(Math.random() * 40 - 20)),
        latency: Math.max(10, region.latency + Math.floor(Math.random() * 30 - 15)),
        status: Math.random() > 0.9 ? 'warning' : 'healthy', // Occasional warnings
        lastUpdate: 'Just now'
      })));
      
      // Update global stats
      setGlobalStats(prev => ({
        ...prev,
        totalActiveUsers: prev.totalActiveUsers + Math.floor(Math.random() * 20 - 10),
        activeTournaments: Math.max(0, prev.activeTournaments + Math.floor(Math.random() * 6 - 3)),
        globalLatency: Math.max(20, prev.globalLatency + Math.floor(Math.random() * 20 - 10)),
        uptime: Math.max(95, Math.min(100, prev.uptime + (Math.random() * 0.4 - 0.2)))
      }));
      
      console.log('🔄 Global connectivity data refreshed');
      toast.success('Connectivity data refreshed');
    } catch (error) {
      console.error('Failed to refresh data:', error);
      toast.error('Failed to refresh connectivity data');
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <Globe className="h-6 w-6 mr-2 text-blue-600" />
          Global Connectivity Monitor
        </h2>
        <Button onClick={refreshData} loading={refreshing} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Global Active Users</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.totalActiveUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+12% from last hour</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Tournaments</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.activeTournaments}</p>
              <p className="text-sm text-green-600 mt-1">+5 new today</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Avg Latency</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.globalLatency}ms</p>
              <p className="text-sm text-green-600 mt-1">Excellent</p>
            </div>
            <Wifi className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">System Uptime</p>
              <p className="text-2xl font-bold text-gray-900">{globalStats.uptime}%</p>
              <p className="text-sm text-green-600 mt-1">Last 30 days</p>
            </div>
            <TrendingUp className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
      </div>

      {/* Regional Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regional Connection Status</h3>
        
        <div className="space-y-4">
          {connectionData.map((region, index) => (
            <motion.div
              key={region.region}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(region.status)}
                  <div>
                    <p className="font-medium text-gray-900">{region.region}</p>
                    <p className="text-sm text-gray-600">Last updated: {region.lastUpdate}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="font-medium text-gray-900">{region.activeUsers}</p>
                  <p className="text-gray-600">Active Users</p>
                </div>
                <div className="text-center">
                  <p className="font-medium text-gray-900">{region.latency}ms</p>
                  <p className="text-gray-600">Latency</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(region.status)}`}>
                  {region.status}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Real-time Activity Feed */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Real-time Global Activity</h3>
        
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {[
            { action: 'Tournament created', location: 'Kathmandu, Nepal', user: 'Sabin Mahat', time: '2 sec ago', type: 'tournament' },
            { action: 'Player registered', location: 'Pokhara, Nepal', user: 'Rajesh Shrestha', time: '15 sec ago', type: 'registration' },
            { action: 'Payment completed', location: 'Chitwan, Nepal', user: 'रू 2,500', time: '1 min ago', type: 'payment' },
            { action: 'Tournament approved', location: 'Lalitpur, Nepal', user: 'Basketball Championship', time: '2 min ago', type: 'approval' },
            { action: 'New organizer joined', location: 'Biratnagar, Nepal', user: 'Sports Club Nepal', time: '5 min ago', type: 'user' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-600">{activity.location} • {activity.user}</p>
                </div>
              </div>
              <div className="ml-auto">
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};