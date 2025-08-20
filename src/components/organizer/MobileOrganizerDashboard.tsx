import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Users, DollarSign, Calendar, Plus, Search, Filter, 
  ChevronDown, ChevronUp, Menu, X, RefreshCw, Download,
  UserCheck, UserX, Eye, Phone, Mail, Clock, CheckCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface MobileOrganizerDashboardProps {
  tournaments: any[];
  registrations: any[];
  revenueData: any;
  onRefresh: () => void;
  onTabChange: (tab: 'tournaments' | 'participants' | 'revenue' | 'schedule' | 'manage' | 'chat') => void;
  selectedTab: 'tournaments' | 'participants' | 'revenue' | 'schedule' | 'manage' | 'chat';
  loading: boolean;
  isRefreshing: boolean;
}

export const MobileOrganizerDashboard: React.FC<MobileOrganizerDashboardProps> = ({
  tournaments,
  registrations,
  revenueData,
  onRefresh,
  onTabChange,
  selectedTab,
  loading,
  isRefreshing
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 lg:hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading mobile dashboard...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, count: tournaments.length },
    { id: 'participants', label: 'Participants', icon: Users, count: registrations.length },
    { id: 'revenue', label: 'Revenue', icon: DollarSign, count: 0 },
    { id: 'schedule', label: 'Schedule', icon: Calendar, count: 0 }
  ];

  const filteredRegistrations = registrations.filter((reg: any) => {
    const matchesSearch = reg.player_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reg.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || reg.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 lg:hidden">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200"
            >
              {showMobileMenu ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <h1 className="text-lg font-bold text-gray-900">Kheleko</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onRefresh}
              disabled={loading || isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-50"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <button className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800">
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg whitespace-nowrap transition-all min-w-fit ${
                  selectedTab === tab.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    selectedTab === tab.id 
                      ? 'bg-white bg-opacity-20' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-30"
              onClick={() => setShowMobileMenu(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-40"
            >
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="space-y-4">
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                    <Plus className="h-5 w-5 inline mr-3" />
                    Create Tournament
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                    <Users className="h-5 w-5 inline mr-3" />
                    Manage Participants
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                    <Calendar className="h-5 w-5 inline mr-3" />
                    Schedule Events
                  </button>
                  <button className="w-full text-left p-3 rounded-lg hover:bg-gray-100">
                    <DollarSign className="h-5 w-5 inline mr-3" />
                    View Analytics
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="px-4 pb-20">
        {selectedTab === 'tournaments' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Tournaments</h2>
              <span className="text-sm text-gray-500">{tournaments.length} total</span>
            </div>
            {tournaments.length === 0 ? (
              <Card className="p-6 text-center">
                <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h3>
                <p className="text-gray-600 mb-4">Create your first tournament to get started</p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Tournament</Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {tournaments.map((tournament: any) => (
                  <Card key={tournament.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900 text-base">{tournament.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        tournament.status === 'approved' ? 'bg-green-100 text-green-800' :
                        tournament.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tournament.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">📍</span>
                        <span>{tournament.location || 'Location not set'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">📅</span>
                        <span>{tournament.start_date ? new Date(tournament.start_date).toLocaleDateString() : 'Date not set'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">👥</span>
                        <span>{tournament.current_participants || 0} / {tournament.max_participants || '∞'} participants</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'participants' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">{filteredRegistrations.length} found</span>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-2 rounded-lg transition-colors ${
                    showFilters ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Mobile Filters */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm"
                >
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                      <Input
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="all">All Status</option>
                        <option value="registered">Pending Review</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {filteredRegistrations.length === 0 ? (
              <Card className="p-6 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No participants</h3>
                <p className="text-gray-600">Participants will appear here once they register</p>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredRegistrations.map((registration: any) => (
                  <Card key={registration.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-base">{registration.player_name || 'Unknown Player'}</h4>
                        <p className="text-sm text-gray-600">{registration.email || 'No email'}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        registration.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {registration.status}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-2 mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">📱</span>
                        <span>{registration.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">🎯</span>
                        <span>{registration.experience_level || 'Level not set'}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-400">📅</span>
                        <span>{registration.registration_date ? new Date(registration.registration_date).toLocaleDateString() : 'Date not set'}</span>
                      </div>
                    </div>

                    {registration.status === 'registered' && (
                      <div className="flex space-x-2">
                        <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800">
                          <UserCheck className="h-4 w-4 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 text-red-600 border-red-300 hover:bg-red-50">
                          <UserX className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedTab === 'revenue' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Revenue Overview</h2>
              <span className="text-sm text-gray-500">This month</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center hover:shadow-md transition-shadow">
                <DollarSign className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-gray-900">
                  रू {revenueData?.organizerEarnings?.toLocaleString() || '0'}
                </p>
                <p className="text-sm text-gray-600">Total Earnings</p>
              </Card>
              <Card className="p-4 text-center hover:shadow-md transition-shadow">
                <Users className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                <p className="text-2xl font-bold text-gray-900">
                  {registrations.filter((r: any) => r.status === 'confirmed').length}
                </p>
                <p className="text-sm text-gray-600">Confirmed</p>
              </Card>
            </div>
            
            <Card className="p-4">
              <h3 className="font-medium text-gray-900 mb-3">Recent Activity</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <p>• No recent transactions</p>
                <p>• Revenue updates in real-time</p>
              </div>
            </Card>
          </div>
        )}

        {selectedTab === 'schedule' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Event Schedule</h2>
              <span className="text-sm text-gray-500">Upcoming</span>
            </div>
            <Card className="p-6 text-center hover:shadow-md transition-shadow">
              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Schedule Management</h3>
              <p className="text-gray-600 mb-4">Manage your tournament schedules and events</p>
              <Button className="bg-blue-600 hover:bg-blue-700">Open Schedule</Button>
            </Card>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center justify-center"
        >
          <Plus className="h-7 w-7" />
        </motion.button>
      </div>
    </div>
  );
};
