import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  MapPin,
  Plus,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { venueWorkflowService } from '../../lib/venueWorkflowService';
import { supabase } from '../../lib/supabase';
import { VenueWorkflowStats, SportsFacility } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { AddVenueForm } from './AddVenueForm';
import { RevenueDashboard } from './RevenueDashboard';
import { VenueStatusBadge } from '../venue/VenueStatusBadge';
import toast from 'react-hot-toast';

interface VenueWorkflowManagementProps {
  onAddVenue: () => void;
}

export const VenueWorkflowManagement: React.FC<VenueWorkflowManagementProps> = ({ onAddVenue }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'leads' | 'claims' | 'venues' | 'revenue'>('overview');
  const [stats, setStats] = useState<VenueWorkflowStats>({
    totalVenues: 0,
    seededVenues: 0,
    verifiedVenues: 0,
    claimedVenues: 0,
    bookableVenues: 0,
    suspendedVenues: 0,
    totalLeads: 0,
    newLeads: 0,
    totalClaims: 0,
    pendingClaims: 0,
    averageQualityScore: 0
  });
  const [leads, setLeads] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [venues, setVenues] = useState<SportsFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [venuesLoading, setVenuesLoading] = useState(false);
  const [showAddVenueForm, setShowAddVenueForm] = useState(false);

  useEffect(() => {
    if (activeTab === 'overview') {
      loadStats();
      loadVenues(); // Also load venues for overview display
    } else if (activeTab === 'leads') {
      loadLeads();
    } else if (activeTab === 'claims') {
      loadClaims();
    } else if (activeTab === 'venues') {
      loadVenues();
    }
  }, [activeTab]);

  const loadStats = async () => {
    try {
      setLoading(true);
      console.log('📊 Loading workflow stats...');
      const statsData = await venueWorkflowService.getWorkflowStats();
      console.log('✅ Stats loaded:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('❌ Error loading stats:', error);
      toast.error('Failed to load workflow stats');
    } finally {
      setLoading(false);
    }
  };

  const loadLeads = async () => {
    try {
      setLeadsLoading(true);
      const leadsData = await venueWorkflowService.getAllLeads();
      setLeads(leadsData);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load leads');
    } finally {
      setLeadsLoading(false);
    }
  };

  const loadClaims = async () => {
    try {
      setClaimsLoading(true);
      const claimsData = await venueWorkflowService.getAllClaimRequests();
      setClaims(claimsData);
    } catch (error) {
      console.error('Error loading claims:', error);
      toast.error('Failed to load claims');
    } finally {
      setClaimsLoading(false);
    }
  };

  const loadVenues = async () => {
    try {
      setVenuesLoading(true);
      console.log('🔄 Starting to load venues...');

      // Load directly from database for admin view
      console.log('🔄 Loading all venues from database...');
      const { data, error } = await supabase
        .from('sports_facilities')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Database query error:', error);
        throw error;
      }

      console.log('✅ Database returned:', data);
      console.log('📊 Venues loaded for overview:', data?.length || 0, 'venues');
      console.log('🔍 Sample venue data:', data?.[0]);
      
      if (data && data.length > 0) {
        console.log('✅ Setting venues state with', data.length, 'venues');
        setVenues(data);
      } else {
        console.log('⚠️ No venues found in database');
        
        // Check if we're in development mode and show sample data
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Development mode: Creating sample venue data for testing');
          const sampleVenues = [
            {
              id: 'sample-1',
              name: 'Sample Futsal Court',
              description: 'A sample venue for testing purposes',
              district: 'Kathmandu',
              province: 'Bagmati',
              status: 'seeded',
              data_quality_score: 75,
              created_at: new Date().toISOString()
            },
            {
              id: 'sample-2', 
              name: 'Test Basketball Court',
              description: 'Another sample venue for testing',
              district: 'Lalitpur',
              province: 'Bagmati',
              status: 'verified',
              data_quality_score: 85,
              created_at: new Date().toISOString()
            }
          ];
          setVenues(sampleVenues);
        } else {
          setVenues([]);
        }
      }

    } catch (error) {
      console.error('❌ Error loading venues:', error);
      toast.error('Failed to load venues');
      // Set empty array as final fallback
      setVenues([]);
    } finally {
      setVenuesLoading(false);
      console.log('🏁 Finished loading venues. State now contains:', venues.length, 'venues');
    }
  };

  const handleLeadStatusUpdate = async (leadId: string, status: string) => {
    try {
      await venueWorkflowService.updateLeadStatus(leadId, status);
      toast.success('Lead status updated successfully');
      loadLeads();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleClaimVerification = async (claimId: string, verified: boolean) => {
    try {
      await venueWorkflowService.verifyClaimRequest(claimId, verified ? 'verified' : 'rejected', user?.id || '');
      toast.success(`Claim ${verified ? 'verified' : 'rejected'} successfully`);
      loadClaims();
    } catch (error) {
      console.error('Error verifying claim:', error);
      toast.error('Failed to verify claim');
    }
  };

  const handleDeleteVenue = async (venueId: string) => {
    if (!confirm('Are you sure you want to delete this venue? This action cannot be undone.')) return;
    
    try {
      await venueWorkflowService.deleteVenue(venueId, user?.id || '');
      toast.success('Venue deleted successfully');
      loadVenues();
      loadStats(); // Refresh stats after deleting venue
    } catch (error) {
      console.error('Error deleting venue:', error);
      toast.error('Failed to delete venue');
    }
  };

  const handleViewVenue = (venueId: string) => {
    // Navigate to venue detail page
    window.open(`/venue/${venueId}`, '_blank');
  };

  const handleEditVenue = (venueId: string) => {
    // Navigate to venue edit page
    window.open(`/admin/venue/${venueId}/edit`, '_blank');
  };

  // Handler functions for venue actions
  const handleApproveVenue = async (venueId: string) => {
    try {
      setLoading(true);
      await venueWorkflowService.updateVenueStatus(venueId, 'verified', user?.id || 'admin');
      toast.success('Venue approved successfully!');
      loadVenues(); // Refresh the list
    } catch (error) {
      console.error('Failed to approve venue:', error);
      toast.error('Failed to approve venue');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectVenue = async (venueId: string, reason: string) => {
    try {
      setLoading(true);
      await venueWorkflowService.updateVenueStatus(venueId, 'suspended', user?.id || 'admin');
      toast.success('Venue rejected successfully!');
      loadVenues(); // Refresh the list
    } catch (error) {
      console.error('Failed to reject venue:', error);
      toast.error('Failed to reject venue');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimVenue = async (venueId: string, claimData: any) => {
    try {
      setLoading(true);
      await venueWorkflowService.claimVenue(venueId, user?.id || 'admin');
      toast.success('Venue claimed successfully!');
      loadVenues(); // Refresh the list
    } catch (error) {
      console.error('Failed to claim venue:', error);
      toast.error('Failed to claim venue');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyVenue = async (venueId: string) => {
    try {
      setLoading(true);
      await venueWorkflowService.updateVenueStatus(venueId, 'verified', user?.id || 'admin');
      toast.success('Venue verified successfully!');
      loadVenues(); // Refresh the list
    } catch (error) {
      console.error('Failed to verify venue:', error);
      toast.error('Failed to verify venue');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVenueStatus = async (venueId: string, newStatus: string) => {
    try {
      setLoading(true);
      await venueWorkflowService.updateVenueStatus(venueId, newStatus, user?.id || 'admin');
      toast.success(`Venue status updated to ${newStatus}!`);
      loadVenues(); // Refresh the list
    } catch (error) {
      console.error('Failed to update venue status:', error);
      toast.error('Failed to update venue status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Venue Workflow Management</h1>
              <p className="text-gray-600">Manage venue leads, claims, and workflow</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowAddVenueForm(true)}
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Venue
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'leads', label: 'Leads', icon: Users, count: stats.newLeads },
                { id: 'claims', label: 'Claims', icon: CheckCircle, count: stats.pendingClaims },
                { id: 'venues', label: 'Venues', icon: MapPin, count: stats.totalVenues },
                { id: 'revenue', label: 'Revenue', icon: DollarSign }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">
                        {tab.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Overview Summary */}
            <Card className="p-6 bg-blue-50 border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">Overview Summary</h3>
                  <p className="text-blue-700">
                    {venuesLoading ? 'Loading venue data...' : 
                     venues.length === 0 ? 'No venues found in the system' :
                     `Currently displaying ${venues.length} venues with real-time data`
                    }
                  </p>
                  {/* Debug Info */}
                  <div className="mt-2 text-xs text-blue-600">
                    <p>Debug: venues.length = {venues.length}</p>
                    <p>venuesLoading = {venuesLoading.toString()}</p>
                    <p>State venues: {JSON.stringify(venues.slice(0, 2).map(v => ({ id: v.id, name: v.name, status: v.status })))}</p>
                    <Button
                      onClick={() => {
                        console.log('🔄 Manual refresh triggered');
                        loadVenues();
                        loadStats();
                      }}
                      size="sm"
                      className="mt-2 text-xs"
                    >
                      🔄 Manual Refresh
                    </Button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-600">Last Updated</p>
                  <p className="text-lg font-semibold text-blue-900">
                    {venuesLoading ? '...' : new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <MapPin className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Venues</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {venuesLoading ? '...' : venues.length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">New Leads</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {venuesLoading ? '...' : venues.filter(v => v.status === 'seeded').length}
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending Claims</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {venuesLoading ? '...' : venues.filter(v => v.status === 'claimed' && !v.verified).length}
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Venue Status Distribution */}
            {venuesLoading ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Venue Status Distribution</h3>
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading venue data...</span>
                </div>
              </Card>
            ) : venues.length > 0 ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Venue Status Distribution</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(() => {
                    const statusCounts = venues.reduce((acc, venue) => {
                      const status = venue.status || 'seeded';
                      acc[status] = (acc[status] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>);

                    const statusColors = {
                      seeded: 'bg-blue-100 text-blue-800',
                      verified: 'bg-green-100 text-green-800',
                      claimed: 'bg-purple-100 text-purple-800',
                      suspended: 'bg-red-100 text-red-800',
                      pending: 'bg-yellow-100 text-yellow-800'
                    };

                    return Object.entries(statusCounts).map(([status, count]) => (
                      <div key={status} className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'}`}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{count}</p>
                        <p className="text-sm text-gray-500">venues</p>
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            ) : null}

            {/* Venue Quality Summary */}
            {venuesLoading ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Venue Quality Overview</h3>
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading quality data...</span>
                </div>
              </Card>
            ) : venues.length > 0 ? (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Venue Quality Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Average Quality Score</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {Math.round(venues.reduce((sum, v) => sum + (v.data_quality_score || 0), 0) / venues.length)}/100
                    </p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">High Quality Venues</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {venues.filter(v => (v.data_quality_score || 0) >= 80).length}
                    </p>
                    <p className="text-sm text-gray-500">≥80 score</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Needs Improvement</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {venues.filter(v => (v.data_quality_score || 0) < 50).length}
                    </p>
                    <p className="text-sm text-gray-500">&lt;50 score</p>
                  </div>
                </div>
              </Card>
            ) : null}

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => setActiveTab('venues')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <MapPin className="h-4 w-4" />
                  View Venues
                </Button>
                <Button
                  onClick={() => setActiveTab('leads')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Review Leads
                </Button>
                <Button
                  onClick={() => setActiveTab('claims')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Verify Claims
                </Button>
                <Button
                  onClick={() => setActiveTab('revenue')}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <DollarSign className="h-4 w-4" />
                  View Revenue
                </Button>
              </div>
            </Card>

            {/* Recent Venues */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Recent Venues</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => {
                      loadVenues();
                      loadStats();
                    }}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                    disabled={venuesLoading}
                  >
                    <div className={`h-4 w-4 ${venuesLoading ? 'animate-spin' : ''}`}>
                      {venuesLoading ? '⟳' : '↻'}
                    </div>
                    Refresh
                  </Button>
                  <Button
                    onClick={() => setActiveTab('venues')}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <MapPin className="h-4 w-4" />
                    View All Venues
                  </Button>
                </div>
              </div>
              
              {venuesLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Loading venues...</span>
                </div>
              ) : venues.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">No venues found</h4>
                  <p className="text-gray-600 mb-4">Get started by adding your first venue.</p>
                  <Button onClick={() => setShowAddVenueForm(true)}>
                    Add Your First Venue
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {venues.slice(0, 5).map((venue) => (
                    <div key={venue.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{venue.name}</h4>
                          <p className="text-sm text-gray-500">
                            {venue.district}, {venue.province}
                          </p>
                          <div className="flex items-center space-x-2 mt-1">
                            <VenueStatusBadge status={venue.status || 'seeded'} />
                            <span className="text-xs text-gray-500">
                              Quality: {venue.data_quality_score || 0}/100
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVenue(venue.id)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVenue(venue.id)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {venues.length > 5 && (
                    <div className="text-center pt-4">
                      <Button
                        onClick={() => setActiveTab('venues')}
                        variant="outline"
                        className="flex items-center gap-2 mx-auto"
                      >
                        <MapPin className="h-4 w-4" />
                        View All {venues.length} Venues
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Venues Tab */}
        {activeTab === 'venues' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Venue Management</h2>
              <Button
                onClick={() => setShowAddVenueForm(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Venue
              </Button>
            </div>

            {venuesLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">Loading venues...</span>
              </div>
            ) : venues.length === 0 ? (
              <Card className="p-8 text-center">
                <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No venues found</h3>
                <p className="text-gray-600 mb-4">Get started by adding your first venue.</p>
                <Button onClick={() => setShowAddVenueForm(true)}>
                  Add Your First Venue
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6">
                {venues.map((venue) => (
                  <Card key={venue.id} className="p-6">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">{venue.name}</h3>
                          <VenueStatusBadge status={venue.status || 'seeded'} />
                        </div>
                        <p className="text-gray-600 mb-3">{venue.description}</p>
                        
                        {/* Venue Images */}
                        {venue.images && venue.images.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Photos:</p>
                            <div className="flex gap-2 overflow-x-auto">
                              {venue.images.slice(0, 3).map((image, index) => (
                                <img
                                  key={index}
                                  src={image}
                                  alt={`Venue photo ${index + 1}`}
                                  className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                />
                              ))}
                              {venue.images.length > 3 && (
                                <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center text-xs text-gray-500">
                                  +{venue.images.length - 3} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">District:</span>
                            <p className="text-gray-600">{venue.district}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Province:</span>
                            <p className="text-gray-600">{venue.province}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Status:</span>
                            <p className="text-gray-600 capitalize">{venue.status || 'seeded'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">Quality Score:</span>
                            <p className="text-gray-600">{venue.data_quality_score || 0}/100</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewVenue(venue.id)}
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditVenue(venue.id)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteVenue(venue.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Revenue Tab */}
        {activeTab === 'revenue' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <RevenueDashboard />
          </motion.div>
        )}
      </div>

      {/* Add Venue Modal */}
      {showAddVenueForm && (
        <AddVenueForm
          onClose={() => setShowAddVenueForm(false)}
          onSuccess={() => {
            setShowAddVenueForm(false);
            loadVenues();
            loadStats(); // Refresh stats after adding venue
            toast.success('Venue added successfully!');
          }}
        />
      )}
    </div>
  );
};
