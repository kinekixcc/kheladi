import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Phone, MapPin, Search, Filter, RefreshCw, Eye, MessageSquare } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { venueWorkflowService } from '../lib/venueWorkflowService';
import { VenueLead, VenueClaimRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const MyRequests: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'leads' | 'claims'>('leads');
  const [loading, setLoading] = useState(true);
  
  // Leads state
  const [leads, setLeads] = useState<VenueLead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');
  
  // Claims state
  const [claims, setClaims] = useState<VenueClaimRequest[]>([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimSearchTerm, setClaimSearchTerm] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (activeTab === 'leads') {
      loadLeads();
    } else {
      loadClaims();
    }
  }, [user, activeTab, navigate]);

  const loadLeads = async () => {
    if (!user) return;
    
    try {
      setLeadsLoading(true);
      const data = await venueWorkflowService.getUserLeads(user.id);
      setLeads(data);
    } catch (error) {
      console.error('Error loading leads:', error);
      toast.error('Failed to load your lead requests');
    } finally {
      setLeadsLoading(false);
      setLoading(false);
    }
  };

  const loadClaims = async () => {
    if (!user) return;
    
    try {
      setClaimsLoading(true);
      const data = await venueWorkflowService.getUserClaimRequests(user.id);
      setClaims(data);
    } catch (error) {
      console.error('Error loading claims:', error);
      toast.error('Failed to load your claim requests');
    } finally {
      setClaimsLoading(false);
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'closed_won': return 'bg-green-100 text-green-800';
      case 'closed_lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getClaimStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'verified': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'new': return 'Your request has been submitted and is waiting for the venue to contact you.';
      case 'contacted': return 'The venue has contacted you about your request.';
      case 'closed_won': return 'Your request was successful! You have a confirmed booking.';
      case 'closed_lost': return 'Your request could not be fulfilled.';
      default: return 'Status unknown.';
    }
  };

  const getClaimStatusDescription = (status: string) => {
    switch (status) {
      case 'new': return 'Your claim request is under review. We will contact you within 24-48 hours.';
      case 'verified': return 'Congratulations! Your claim has been verified. You can now manage this venue.';
      case 'rejected': return 'Your claim request was not approved. Please contact support for more information.';
      default: return 'Status unknown.';
    }
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = lead.venue?.name?.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
                         lead.venue?.district?.toLowerCase().includes(leadSearchTerm.toLowerCase());
    const matchesStatus = leadStatusFilter === 'all' || lead.status === leadStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.venue?.name?.toLowerCase().includes(claimSearchTerm.toLowerCase()) ||
                         claim.venue?.district?.toLowerCase().includes(claimSearchTerm.toLowerCase());
    const matchesStatus = claimStatusFilter === 'all' || claim.status === claimStatusFilter;
    return matchesSearch && matchesStatus;
  });

  if (!user) {
    return null;
  }

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
              <h1 className="text-3xl font-bold text-gray-900">My Requests</h1>
              <p className="text-gray-600">Track your venue lead requests and claim requests</p>
            </div>
            <Button
              onClick={() => navigate('/venues')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Browse Venues
            </Button>
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
                { id: 'leads', label: 'Lead Requests', count: leads.length, icon: Calendar },
                { id: 'claims', label: 'Claim Requests', count: claims.length, icon: MessageSquare }
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
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Search your lead requests by venue name or location..."
                      value={leadSearchTerm}
                      onChange={(e) => setLeadSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={leadStatusFilter}
                  onChange={(e) => setLeadStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed_won">Closed Won</option>
                  <option value="closed_lost">Closed Lost</option>
                </select>

                <Button
                  onClick={loadLeads}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Leads List */}
            {leadsLoading ? (
              <Card className="p-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading your lead requests...</p>
                </div>
              </Card>
            ) : filteredLeads.length === 0 ? (
              <Card className="p-6">
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No lead requests found</h3>
                  <p className="text-gray-600 mb-4">
                    {leads.length === 0 
                      ? "You haven't submitted any venue lead requests yet."
                      : "No lead requests match your current filters."
                    }
                  </p>
                  <Button onClick={() => navigate('/venues')}>
                    Browse Venues
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredLeads.map((lead) => (
                  <Card key={lead.id} className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {lead.venue?.name || 'Unknown Venue'}
                            </h3>
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {lead.venue?.district}, {lead.venue?.province}
                            </div>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(lead.status)}`}>
                            {lead.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span className="text-sm">Date: {lead.requested_date}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="text-sm">Time: {formatTime(lead.start_minute)}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Clock className="h-4 w-4 mr-2" />
                            <span className="text-sm">Duration: {lead.duration_min} min</span>
                          </div>
                        </div>
                        
                        {lead.notes && (
                          <div className="mb-3">
                            <div className="flex items-start text-gray-600">
                              <MessageSquare className="h-4 w-4 mr-2 mt-0.5" />
                              <span className="text-sm">{lead.notes}</span>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600">
                          {getStatusDescription(lead.status)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => navigate(`/venues/${lead.venue?.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          View Venue
                        </Button>
                        {lead.status === 'new' && (
                          <Button
                            onClick={() => navigate(`/venues/${lead.venue?.id}`)}
                            size="sm"
                          >
                            Contact Venue
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Claims Tab */}
        {activeTab === 'claims' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Search and Filters */}
            <Card className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <Input
                      type="text"
                      placeholder="Search your claim requests by venue name or location..."
                      value={claimSearchTerm}
                      onChange={(e) => setClaimSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <select
                  value={claimStatusFilter}
                  onChange={(e) => setClaimStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">All Statuses</option>
                  <option value="new">New</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>

                <Button
                  onClick={loadClaims}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </Card>

            {/* Claims List */}
            {claimsLoading ? (
              <Card className="p-6">
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading your claim requests...</p>
                </div>
              </Card>
            ) : filteredClaims.length === 0 ? (
              <Card className="p-6">
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No claim requests found</h3>
                  <p className="text-gray-600 mb-4">
                    {claims.length === 0 
                      ? "You haven't submitted any venue claim requests yet."
                      : "No claim requests match your current filters."
                    }
                  </p>
                  <Button onClick={() => navigate('/venues')}>
                    Browse Venues
                  </Button>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredClaims.map((claim) => (
                  <Card key={claim.id} className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {claim.venue?.name || 'Unknown Venue'}
                            </h3>
                            <div className="flex items-center text-gray-500 text-sm mt-1">
                              <MapPin className="h-4 w-4 mr-1" />
                              {claim.venue?.district}, {claim.venue?.province}
                            </div>
                          </div>
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getClaimStatusColor(claim.status)}`}>
                            {claim.status}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="flex items-center text-gray-600">
                            <Phone className="h-4 w-4 mr-2" />
                            <span className="text-sm">{claim.phone}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            <span className="text-sm">{claim.email}</span>
                          </div>
                        </div>
                        
                        {claim.message && (
                          <div className="mb-3">
                            <div className="flex items-start text-gray-600">
                              <MessageSquare className="h-4 w-4 mr-2 mt-0.5" />
                              <span className="text-sm">{claim.message}</span>
                            </div>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-600">
                          {getClaimStatusDescription(claim.status)}
                        </p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={() => navigate(`/venues/${claim.venue?.id}`)}
                          variant="outline"
                          size="sm"
                        >
                          View Venue
                        </Button>
                        {claim.status === 'verified' && (
                          <Button
                            onClick={() => navigate(`/venues/${claim.venue?.id}`)}
                            size="sm"
                          >
                            Manage Venue
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};


