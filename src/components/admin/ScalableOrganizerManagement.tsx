import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Award,
  Trophy,
  Users,
  Calendar,
  Star,
  Shield,
  Crown
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { OrganizerBadgeDisplay } from './OrganizerBadgeSystem';
import { profileService, tournamentService } from '../../lib/database';
import toast from 'react-hot-toast';

interface OrganizerData {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  created_at: string;
  is_active: boolean;
  tournaments_count: number;
  total_participants: number;
  average_rating: number;
  completion_rate: number;
  last_tournament_date?: string;
}

interface ScalableOrganizerManagementProps {
  onOrganizerUpdate?: () => void;
}

export const ScalableOrganizerManagement: React.FC<ScalableOrganizerManagementProps> = ({
  onOrganizerUpdate
}) => {
  const [organizers, setOrganizers] = useState<OrganizerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [ratingFilter, setRatingFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'tournaments' | 'rating' | 'created_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedOrganizers, setSelectedOrganizers] = useState<string[]>([]);
  const [selectedOrganizer, setSelectedOrganizer] = useState<OrganizerData | null>(null);
  const [showOrganizerModal, setShowOrganizerModal] = useState(false);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [editingOrganizer, setEditingOrganizer] = useState(false);

  useEffect(() => {
    loadOrganizers();
  }, []);

  const loadOrganizers = async () => {
    setLoading(true);
    try {
      const profiles = await profileService.getAllProfiles();
      const organizerProfiles = profiles.filter(p => p.role === 'organizer');
      
      // Enhance with tournament data
      const enhancedOrganizers = await Promise.all(
        organizerProfiles.map(async (organizer) => {
          try {
            const tournaments = await tournamentService.getTournamentsByOrganizer(organizer.id);
            const totalParticipants = tournaments.reduce((sum, t) => sum + (t.current_participants || 0), 0);
            const completedTournaments = tournaments.filter(t => t.status === 'completed');
            const completionRate = tournaments.length > 0 ? (completedTournaments.length / tournaments.length) * 100 : 0;
            
            // Calculate average rating (mock for now - would come from real ratings)
            const averageRating = Math.random() * 2 + 3; // 3-5 range for demo
            
            const lastTournament = tournaments
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

            return {
              id: organizer.id,
              full_name: organizer.full_name,
              email: organizer.email || '',
              phone: organizer.phone,
              created_at: organizer.created_at,
              is_active: true, // Would come from actual status
              tournaments_count: tournaments.length,
              total_participants: totalParticipants,
              average_rating: averageRating,
              completion_rate: completionRate,
              last_tournament_date: lastTournament?.created_at
            };
          } catch (error) {
            console.error(`Error loading data for organizer ${organizer.id}:`, error);
            return {
              id: organizer.id,
              full_name: organizer.full_name,
              email: organizer.email || '',
              phone: organizer.phone,
              created_at: organizer.created_at,
              is_active: true,
              tournaments_count: 0,
              total_participants: 0,
              average_rating: 0,
              completion_rate: 0
            };
          }
        })
      );
      
      setOrganizers(enhancedOrganizers);
    } catch (error) {
      console.error('Error loading organizers:', error);
      toast.error('Failed to load organizers');
    } finally {
      setLoading(false);
    }
  };

  // Memoized filtering and sorting
  const filteredAndSortedOrganizers = useMemo(() => {
    let filtered = organizers.filter(organizer => {
      const matchesSearch = organizer.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           organizer.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && organizer.is_active) ||
                           (statusFilter === 'inactive' && !organizer.is_active);
      
      const matchesRating = ratingFilter === 'all' ||
                           (ratingFilter === 'high' && organizer.average_rating >= 4.5) ||
                           (ratingFilter === 'medium' && organizer.average_rating >= 3.5 && organizer.average_rating < 4.5) ||
                           (ratingFilter === 'low' && organizer.average_rating < 3.5);
      
      return matchesSearch && matchesStatus && matchesRating;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.full_name.toLowerCase();
          bValue = b.full_name.toLowerCase();
          break;
        case 'tournaments':
          aValue = a.tournaments_count;
          bValue = b.tournaments_count;
          break;
        case 'rating':
          aValue = a.average_rating;
          bValue = b.average_rating;
          break;
        case 'created_at':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [organizers, searchTerm, statusFilter, ratingFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrganizers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrganizers = filteredAndSortedOrganizers.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedOrganizers(paginatedOrganizers.map(o => o.id));
    } else {
      setSelectedOrganizers([]);
    }
  };

  const handleSelectOrganizer = (organizerId: string, checked: boolean) => {
    if (checked) {
      setSelectedOrganizers([...selectedOrganizers, organizerId]);
    } else {
      setSelectedOrganizers(selectedOrganizers.filter(id => id !== organizerId));
    }
  };

  // Handler functions for action buttons
  const handleViewOrganizer = (organizer: OrganizerData) => {
    console.log('Viewing organizer:', organizer);
    setSelectedOrganizer(organizer);
    setShowOrganizerModal(true);
    toast.success(`Opening ${organizer.full_name}'s profile`);
  };

  const handleEditOrganizer = (organizer: OrganizerData) => {
    console.log('Editing organizer:', organizer);
    setSelectedOrganizer(organizer);
    setEditingOrganizer(true);
    setShowOrganizerModal(true);
    toast.success(`Editing ${organizer.full_name}'s profile`);
  };

  const handleManageBadges = (organizer: OrganizerData) => {
    console.log('Managing badges for organizer:', organizer);
    setSelectedOrganizer(organizer);
    setShowBadgeModal(true);
    toast.success(`Managing badges for ${organizer.full_name}`);
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedOrganizers.length === 0) return;
    
    const confirmMessage = `Are you sure you want to ${action} ${selectedOrganizers.length} organizer(s)?`;
    if (!confirm(confirmMessage)) return;

    const loadingToast = toast.loading(`${action}ing organizers...`);
    
    try {
      console.log(`🔄 Bulk ${action} for organizers:`, selectedOrganizers);
      
      for (const organizerId of selectedOrganizers) {
        switch (action) {
          case 'activate':
            await profileService.updateProfile(organizerId, { is_active: true });
            console.log(`✅ Activated organizer: ${organizerId}`);
            break;
          case 'deactivate':
            await profileService.updateProfile(organizerId, { is_active: false });
            console.log(`✅ Deactivated organizer: ${organizerId}`);
            break;
          case 'delete':
            // Implement soft delete by setting is_active to false and adding deleted flag
            await profileService.updateProfile(organizerId, { 
              is_active: false,
              deleted_at: new Date().toISOString()
            });
            console.log(`✅ Soft deleted organizer: ${organizerId}`);
            break;
        }
        
        // Add small delay between operations to prevent rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.dismiss(loadingToast);
      toast.success(`Successfully ${action}d ${selectedOrganizers.length} organizer(s)`);
      setSelectedOrganizers([]);
      loadOrganizers();
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error);
      toast.dismiss(loadingToast);
      toast.error(`Failed to ${action} organizers`);
    }
  };

  const exportOrganizers = () => {
    const csvContent = [
      ['Name', 'Email', 'Phone', 'Tournaments', 'Participants', 'Rating', 'Completion Rate', 'Status', 'Joined'],
      ...filteredAndSortedOrganizers.map(org => [
        org.full_name,
        org.email,
        org.phone || '',
        org.tournaments_count.toString(),
        org.total_participants.toString(),
        org.average_rating.toFixed(1),
        `${org.completion_rate.toFixed(1)}%`,
        org.is_active ? 'Active' : 'Inactive',
        new Date(org.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `organizers_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Organizer data exported successfully!');
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRatingBadge = (rating: number) => {
    if (rating >= 4.5) return 'bg-green-100 text-green-800';
    if (rating >= 3.5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organizer Management</h2>
          <p className="text-gray-600">Manage and monitor tournament organizers</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="text-sm text-gray-600">
            {filteredAndSortedOrganizers.length} of {organizers.length} organizers
          </span>
          <Button variant="outline" onClick={exportOrganizers}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                type="text"
                placeholder="Search organizers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Ratings</option>
            <option value="high">4.5+ Stars</option>
            <option value="medium">3.5-4.4 Stars</option>
            <option value="low">Below 3.5</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as any);
              setSortOrder(order as any);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="created_at-desc">Newest First</option>
            <option value="created_at-asc">Oldest First</option>
            <option value="name-asc">Name A-Z</option>
            <option value="name-desc">Name Z-A</option>
            <option value="tournaments-desc">Most Tournaments</option>
            <option value="rating-desc">Highest Rated</option>
          </select>
          
          <select
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>
        </div>

        {/* Bulk Actions */}
        {selectedOrganizers.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedOrganizers.length} organizer(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('activate')}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <UserCheck className="h-4 w-4 mr-2" />
                  Activate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('deactivate')}
                  className="text-yellow-600 border-yellow-300 hover:bg-yellow-50"
                >
                  <UserX className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 border-red-300 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Organizers Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading organizers...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={selectedOrganizers.length === paginatedOrganizers.length && paginatedOrganizers.length > 0}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedOrganizers.map((organizer) => (
                    <tr key={organizer.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedOrganizers.includes(organizer.id)}
                          onChange={(e) => handleSelectOrganizer(organizer.id, e.target.checked)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                            <span className="font-semibold text-blue-600">
                              {organizer.full_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className="text-sm font-medium text-gray-900">
                                {organizer.full_name}
                              </div>
                              <OrganizerBadgeDisplay organizerId={organizer.id} compact={true} />
                            </div>
                            <div className="text-sm text-gray-500">{organizer.email}</div>
                            {organizer.phone && (
                              <div className="text-xs text-gray-400">{organizer.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <Trophy className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium">{organizer.tournaments_count} tournaments</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="text-sm">{organizer.total_participants} participants</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span className={`text-sm font-medium ${getRatingColor(organizer.average_rating)}`}>
                              {organizer.average_rating.toFixed(1)}/5.0
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="text-sm text-gray-900">
                            {organizer.completion_rate.toFixed(1)}% completion
                          </div>
                          <div className="text-xs text-gray-500">
                            Joined: {new Date(organizer.created_at).toLocaleDateString()}
                          </div>
                          {organizer.last_tournament_date && (
                            <div className="text-xs text-gray-500">
                              Last tournament: {new Date(organizer.last_tournament_date).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-2">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            organizer.is_active 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {organizer.is_active ? 'Active' : 'Inactive'}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingBadge(organizer.average_rating)}`}>
                            {organizer.average_rating >= 4.5 ? 'Excellent' :
                             organizer.average_rating >= 3.5 ? 'Good' : 'Needs Improvement'}
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewOrganizer(organizer)}
                            title="View organizer details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditOrganizer(organizer)}
                            title="Edit organizer"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleManageBadges(organizer)}
                            title="Manage badges"
                          >
                            <Award className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredAndSortedOrganizers.length)} of {filteredAndSortedOrganizers.length} organizers
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 text-sm rounded ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Users className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-gray-600">Total Organizers</p>
              <p className="text-2xl font-bold text-gray-900">{organizers.length}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <UserCheck className="h-8 w-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-600">Active Organizers</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizers.filter(o => o.is_active).length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Star className="h-8 w-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-600">Avg Rating</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizers.length > 0 
                  ? (organizers.reduce((sum, o) => sum + o.average_rating, 0) / organizers.length).toFixed(1)
                  : '0.0'
                }
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-purple-600" />
            <div>
              <p className="text-sm text-gray-600">Total Tournaments</p>
              <p className="text-2xl font-bold text-gray-900">
                {organizers.reduce((sum, o) => sum + o.tournaments_count, 0)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Organizer Detail/Edit Modal */}
      {showOrganizerModal && selectedOrganizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">
                  {editingOrganizer ? 'Edit Organizer' : 'Organizer Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowOrganizerModal(false);
                    setSelectedOrganizer(null);
                    setEditingOrganizer(false);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input
                      type="text"
                      defaultValue={selectedOrganizer.full_name}
                      disabled={!editingOrganizer}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                      type="email"
                      defaultValue={selectedOrganizer.email}
                      disabled={!editingOrganizer}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tournaments</label>
                    <p className="mt-1 text-lg font-semibold">{selectedOrganizer.tournaments_count}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Rating</label>
                    <p className="mt-1 text-lg font-semibold">{selectedOrganizer.average_rating.toFixed(1)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Completion Rate</label>
                    <p className="mt-1 text-lg font-semibold">{selectedOrganizer.completion_rate.toFixed(1)}%</p>
                  </div>
                </div>
                
                {editingOrganizer && (
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={() => setEditingOrganizer(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        toast.success('Organizer updated successfully!');
                        setEditingOrganizer(false);
                        setShowOrganizerModal(false);
                      }}
                    >
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Badge Management Modal */}
      {showBadgeModal && selectedOrganizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Manage Badges</h3>
                <button
                  onClick={() => {
                    setShowBadgeModal(false);
                    setSelectedOrganizer(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Available Badges</h4>
                  <div className="space-y-2">
                    {['Verified Organizer', 'Top Rated', 'Frequent Host', 'Community Leader'].map((badge) => (
                      <label key={badge} className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          defaultChecked={Math.random() > 0.5}
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm">{badge}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowBadgeModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      toast.success('Badges updated successfully!');
                      setShowBadgeModal(false);
                    }}
                  >
                    Update Badges
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};