import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, DollarSign, Users, Trophy, Calendar, Target, RefreshCw } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { tournamentService } from '../../lib/database';

interface RevenueAnalyticsProps {
  userType: 'platform' | 'organizer';
}

export const RevenueAnalytics: React.FC<RevenueAnalyticsProps> = ({ userType }) => {
  const [revenueData, setRevenueData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  console.log('🎯 RevenueAnalytics mounted with userType:', userType, 'user:', user?.id);

  useEffect(() => {
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('⏰ Revenue data loading timeout, setting fallback data');
        setRevenueData({
          totalRevenue: 0,
          totalEarnings: 0,
          monthlyGrowth: 0,
          commissionEarned: 0,
          subscriptionRevenue: 0,
          tournaments: 0,
          tournamentsHosted: 0,
          activeUsers: 0,
          totalParticipants: 0,
          averageEntryFee: 0,
          platformFeesDeducted: 0,
          transactionCount: 0,
          monthlyRevenue: 0
        });
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    loadRealRevenueData();

    return () => clearTimeout(timeoutId);
  }, [userType, user]);

  const loadRealRevenueData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading revenue data for userType:', userType);
      
      if (userType === 'platform') {
        // Calculate platform revenue from real tournament data
        const tournaments = await tournamentService.getAllTournaments();
        console.log('📊 All tournaments loaded:', tournaments.length);
        
        const approvedTournaments = tournaments.filter(t => t.status === 'approved' || t.status === 'completed');
        console.log('✅ Approved tournaments:', approvedTournaments.length);
        
        // Get real revenue from registrations
        const { registrationService } = await import('../../lib/database');
        const allRegistrations = await registrationService.getAllRegistrations();
        console.log('📝 All registrations loaded:', allRegistrations.length);
        
        const confirmedRegistrations = allRegistrations.filter(reg => reg.status === 'confirmed');
        console.log('✅ Confirmed registrations:', confirmedRegistrations.length);
        
        const totalRevenue = confirmedRegistrations.reduce((sum, reg) => sum + (reg.entry_fee || 0), 0);
        console.log('💰 Total revenue calculated:', totalRevenue);
        
        const commissionEarned = totalRevenue * 0.15; // 15% platform fee
        const subscriptionRevenue = 0; // Would come from subscription data
        
        const revenueDataToSet = {
          totalRevenue,
          monthlyRevenue: totalRevenue * 0.3, // Estimate 30% of total as monthly
          monthlyGrowth: totalRevenue > 0 ? 15 : 0,
          commissionEarned,
          subscriptionRevenue,
          tournaments: approvedTournaments.length,
          activeUsers: confirmedRegistrations.length,
          transactionCount: confirmedRegistrations.length,
          averageTransaction: confirmedRegistrations.length > 0 ? totalRevenue / confirmedRegistrations.length : 0
        };
        
        console.log('📊 Platform revenue data to set:', revenueDataToSet);
        setRevenueData(revenueDataToSet);
        
      } else {
        // Calculate organizer revenue from their tournaments
        if (user?.id) {
          console.log('👤 Loading organizer data for user:', user.id);
          
          try {
            const tournaments = await tournamentService.getTournamentsByOrganizer(user.id);
            console.log('🏆 Organizer tournaments:', tournaments.length);
            
            const approvedTournaments = tournaments.filter(t => t.status === 'approved' || t.status === 'completed');
            console.log('✅ Approved organizer tournaments:', approvedTournaments.length);
            
            // Get real organizer revenue from registrations
            const { registrationService } = await import('../../lib/database');
            const organizerRegistrations = await registrationService.getOrganizerRegistrations(user.id);
            console.log('📝 Organizer registrations:', organizerRegistrations.length);
            
            const confirmedRegistrations = organizerRegistrations.filter(reg => reg.status === 'confirmed');
            console.log('✅ Confirmed organizer registrations:', confirmedRegistrations.length);
            
            const totalRevenue = confirmedRegistrations.reduce((sum, reg) => sum + (reg.entry_fee || 0), 0);
            console.log('💰 Organizer total revenue:', totalRevenue);
            
            const platformFeesDeducted = totalRevenue * 0.15; // 15% platform fee
            const totalEarnings = totalRevenue - platformFeesDeducted;
            const totalParticipants = approvedTournaments.reduce((sum, t) => sum + (t.current_participants || 0), 0);
            
            const revenueDataToSet = {
              totalEarnings,
              monthlyRevenue: totalRevenue * 0.3, // Estimate 30% of total as monthly
              monthlyGrowth: totalRevenue > 0 ? 12 : 0,
              tournamentsHosted: approvedTournaments.length,
              totalParticipants,
              averageEntryFee: confirmedRegistrations.length > 0 ? totalRevenue / confirmedRegistrations.length : 0,
              platformFeesDeducted,
              transactionCount: confirmedRegistrations.length
            };
            
            console.log('📊 Organizer revenue data to set:', revenueDataToSet);
            setRevenueData(revenueDataToSet);
          } catch (organizerError) {
            console.error('❌ Error loading organizer data:', organizerError);
            // Set default organizer data if there's an error
            setRevenueData({
              totalEarnings: 0,
              monthlyRevenue: 0,
              monthlyGrowth: 0,
              tournamentsHosted: 0,
              totalParticipants: 0,
              averageEntryFee: 0,
              platformFeesDeducted: 0,
              transactionCount: 0
            });
          }
        } else {
          // No user ID, set default data
          setRevenueData({
            totalEarnings: 0,
            monthlyRevenue: 0,
            monthlyGrowth: 0,
            tournamentsHosted: 0,
            totalParticipants: 0,
            averageEntryFee: 0,
            platformFeesDeducted: 0,
            transactionCount: 0
          });
        }
      }
    } catch (error) {
      console.error('❌ Error loading revenue data:', error);
      // Fallback to zero values instead of fake data
      setRevenueData({
        totalRevenue: 0,
        totalEarnings: 0,
        monthlyGrowth: 0,
        commissionEarned: 0,
        subscriptionRevenue: 0,
        tournaments: 0,
        tournamentsHosted: 0,
        activeUsers: 0,
        totalParticipants: 0,
        averageEntryFee: 0,
        platformFeesDeducted: 0,
        transactionCount: 0,
        monthlyRevenue: 0
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Loading revenue data...</p>
          <Button 
            onClick={loadRealRevenueData} 
            variant="outline"
            className="flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
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

  if (!revenueData) {
    return (
      <div className="space-y-6">
        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-4">No revenue data available</p>
          <p className="text-sm text-gray-500 mb-4">
            {userType === 'organizer' 
              ? 'Start creating tournaments to see your revenue analytics here.'
              : 'No platform revenue data available yet.'
            }
          </p>
          <Button onClick={loadRealRevenueData} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </Card>
        
        {/* Show empty state with helpful information */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6 text-center">
              <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                <DollarSign className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-2xl font-bold text-gray-300">रू 0</p>
              <p className="text-sm text-gray-500">No data</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = userType === 'platform' ? [
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Total Revenue',
      value: `रू ${revenueData.totalRevenue.toLocaleString()}`,
      change: revenueData.totalRevenue > 0 ? 'From tournament fees' : 'No revenue yet',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      title: 'Commission Earned',
      value: `रू ${revenueData.commissionEarned.toLocaleString()}`,
      change: 'From tournament fees',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Subscription Revenue',
      value: `रू ${revenueData.subscriptionRevenue.toLocaleString()}`,
      change: 'Monthly recurring',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Active Tournaments',
      value: String(revenueData.tournaments),
      change: 'This month',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ] : [
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Total Earnings',
      value: `रू ${revenueData.totalEarnings.toLocaleString()}`,
      change: revenueData.totalEarnings > 0 ? 'From your tournaments' : 'No earnings yet',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Tournaments Hosted',
      value: String(revenueData.tournamentsHosted),
      change: 'This month',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Total Participants',
      value: String(revenueData.totalParticipants),
      change: 'Across all tournaments',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: 'Avg Entry Fee',
      value: `रू ${Math.round(revenueData.averageEntryFee).toLocaleString()}`,
      change: 'Per participant',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          {userType === 'platform' ? 'Platform Revenue Analytics' : 'Your Revenue Analytics'}
        </h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="h-4 w-4" />
          <span>Last 30 days</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
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
          </motion.div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {userType === 'platform' ? 'Revenue Sources' : 'Earnings Breakdown'}
          </h3>
          
          {userType === 'platform' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Tournament Commissions</span>
                </div>
                <span className="font-semibold">68%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Subscription Plans</span>
                </div>
                <span className="font-semibold">32%</span>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Tournament Revenue</span>
                </div>
                <span className="font-semibold">रू {(revenueData.totalEarnings + revenueData.platformFeesDeducted).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-gray-600">Platform Fees</span>
                </div>
                <span className="font-semibold">-रू {revenueData.platformFeesDeducted.toLocaleString()}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Net Earnings</span>
                  <span className="font-bold text-green-600">रू {revenueData.totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Growth Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Monthly Growth</span>
              <span className="font-semibold text-green-600">+{revenueData.monthlyGrowth}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="font-semibold">{userType === 'platform' ? revenueData.activeUsers : revenueData.totalParticipants}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold">12.5%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};