import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, Trophy, DollarSign, Plus, Settings, BarChart3, Clock, CheckCircle, XCircle, User, Phone, Mail, Eye, UserCheck, UserX, Download, Filter, Search, Archive, TrendingUp, Activity, Zap, Star, Target, Award, Users2, CalendarDays, BarChart, PieChart, LineChart, ArrowUpRight, ArrowDownRight, RefreshCw, MoreHorizontal, Edit3, Trash2, Copy, Share2, EyeOff, Bell, BellOff, Lock, Unlock, Globe, Shield, Crown, Rocket, Heart, Sparkles, MessageSquare } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { tournamentService, registrationService } from '../lib/database';
import { isSupabaseConfigured } from '../lib/supabase';
import { auditLogService } from '../lib/auditLog';

import { TournamentManagement } from '../components/organizer/TournamentManagement';
import { RevenueAnalytics } from '../components/monetization/RevenueAnalytics';
import { EventSchedulingSystem } from '../components/organizer/EventSchedulingSystem';
import { TournamentStatusManager } from '../components/organizer/TournamentStatusManager';
import { SupabaseConnectionBanner } from '../components/ui/SupabaseConnectionBanner';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import toast from 'react-hot-toast';
import { PlayerProfileModal } from '../components/admin/PlayerProfileModal';
import { OrganizerChatManager } from '../components/chat/OrganizerChatManager';
import { MobileOrganizerDashboard } from '../components/organizer/MobileOrganizerDashboard';

export const OrganizerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  
  // State management with proper initialization
  const [selectedTab, setSelectedTab] = useState<'tournaments' | 'participants' | 'revenue' | 'schedule' | 'manage' | 'chat'>('tournaments');
  const [selectedTournament, setSelectedTournament] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [sortBy, setSortBy] = useState<string>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showPlayerProfileModal, setShowPlayerProfileModal] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [dataVersion, setDataVersion] = useState(0); // For tracking data freshness
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring" as const,
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      y: -5,
      scale: 1.02,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 20
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    },
    hover: {
      x: 5,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  const tabVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 20
      }
    },
    active: {
      scale: 1.05,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 15
      }
    }
  };

  // Memoize user ID to prevent unnecessary re-renders
  const userId = useMemo(() => user?.id, [user?.id]);
  
  // Refs for managing intervals and preventing memory leaks
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const lastDataLoadRef = useRef<number>(0);
  const loadingRef = useRef(false);

  // Handle component unmounting
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      loadingRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, []);

  // Handle visibility change to pause/resume polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && userId && isMountedRef.current) {
        // Only resume if data is stale (older than 2 minutes)
        const timeSinceLastLoad = Date.now() - lastDataLoadRef.current;
        if (timeSinceLastLoad > 120000) { // 2 minutes
          setupRealtimeUpdates();
        }
      } else if (document.visibilityState === 'hidden') {
        // Pause polling when tab is hidden
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [userId]);

  // Single data loading effect - only run when necessary
  useEffect(() => {
    if (userId && isMountedRef.current && !hasAttemptedLoad) {
      setHasAttemptedLoad(true);
      setLoading(true);
      loadingRef.current = true;
      
      // Load data immediately and also set up a backup timer
      if (isMountedRef.current) {
        loadData();
        setupRealtimeUpdates();
      }
      
      // Backup timer in case immediate load fails
      const timer = setTimeout(() => {
        if (isMountedRef.current && loadingRef.current) {
          loadData();
        }
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [userId]); // Remove hasAttemptedLoad dependency to prevent re-triggering

  const setupRealtimeUpdates = useCallback(() => {
    // Clear any existing interval first
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
    
    // Set up polling for registration updates with longer intervals
    pollIntervalRef.current = setInterval(() => {
      // Only poll if user is still active, component is mounted, and tab is visible
      if (userId && isMountedRef.current && document.visibilityState === 'visible') {
        const timeSinceLastLoad = Date.now() - lastDataLoadRef.current;
        // Only refresh if data is older than 5 minutes
        if (timeSinceLastLoad > 300000) { // 5 minutes
          loadData();
        }
      }
    }, 60000); // Poll every 60 seconds instead of 30 seconds
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [userId]);

  // Calculate real revenue data from tournaments and registrations
  const calculateRealRevenueData = async (tournaments: any[], registrations: any[]) => {
    try {
      // Get confirmed registrations for this organizer's tournaments
      const confirmedRegistrations = registrations.filter(reg => reg.status === 'confirmed');
      
      // Calculate total revenue from entry fees
      const totalRevenue = confirmedRegistrations.reduce((sum, reg) => sum + (reg.entry_fee || 0), 0);
      
      // Calculate platform commission (5% as per our system)
      const platformCommission = totalRevenue * 0.05;
      
      // Calculate organizer earnings (95% after platform fee)
      const organizerEarnings = totalRevenue - platformCommission;
      
      // Get tournament statistics
      const approvedTournaments = tournaments.filter(t => t.status === 'approved' || t.status === 'completed');
      const totalParticipants = approvedTournaments.reduce((sum, t) => sum + (t.current_participants || 0), 0);
      
      const revenueData = {
        totalRevenue,
        platformCommission,
        organizerEarnings,
        transactionCount: confirmedRegistrations.length,
        tournamentsHosted: approvedTournaments.length,
        totalParticipants,
        averageEntryFee: confirmedRegistrations.length > 0 ? totalRevenue / confirmedRegistrations.length : 0
      };
      
      console.log('💰 Real revenue data calculated:', revenueData);
      return revenueData;
    } catch (error) {
      console.error('Error calculating real revenue data:', error);
      // Return zero values if calculation fails
      return {
        totalRevenue: 0,
        platformCommission: 0,
        organizerEarnings: 0,
        transactionCount: 0,
        tournamentsHosted: 0,
        totalParticipants: 0,
        averageEntryFee: 0
      };
    }
  };

  const loadData = useCallback(async () => {
    if (!userId || !isMountedRef.current) {
      return;
    }
    
    try {
      
      let tournamentsData, registrationsData;
      
      if (isSupabaseConfigured) {
        [tournamentsData, registrationsData] = await Promise.all([
          tournamentService.getTournamentsByOrganizer(userId),
          registrationService.getOrganizerRegistrations(userId)
        ]);
      } else {
        // Fallback: load from localStorage
        const organizerKey = `organizer_tournaments_${userId}`;
        tournamentsData = JSON.parse(localStorage.getItem(organizerKey) || '[]');
        
        const registrationKey = `organizer_registrations_${userId}`;
        registrationsData = JSON.parse(localStorage.getItem(registrationKey) || '[]');
      }
      

      
      // Transform data if profiles are flattened
      if (registrationsData.length > 0) {
        const transformedRegistrations = registrationsData.map((reg: any) => {
          if (reg.profiles) {
            return reg;
          }
          
          return {
            ...reg,
            profiles: {
              id: reg.player_id || reg.id,
              full_name: reg.player_name || reg.full_name,
              email: reg.email,
              phone: reg.phone,
              bio: reg.bio,
              favorite_sports: reg.favorite_sports,
              skill_level: reg.skill_level,
              location: reg.location,
              date_of_birth: reg.date_of_birth,
              height: reg.height,
              weight: reg.weight,
              preferred_position: reg.preferred_position,
              social_links: reg.social_links,
              notification_settings: reg.notification_settings,
              privacy_settings: reg.privacy_settings,
              organization_name: reg.organization_name,
              organization_description: reg.organization_description,
              website: reg.website,
              created_at: reg.created_at,
              updated_at: reg.updated_at
            }
          };
        });
        
        setRegistrations(transformedRegistrations);
      } else {
        setRegistrations(registrationsData);
      }
      
      // Batch state updates to prevent multiple re-renders
      setTournaments(tournamentsData || []);
      
      // Calculate real revenue data from tournament registrations
      const realRevenueData = await calculateRealRevenueData(tournamentsData, registrationsData);
      setRevenueData(realRevenueData);
      
      // Update tracking variables
      setLastRefreshTime(new Date());
      lastDataLoadRef.current = Date.now();
      setDataVersion(prev => prev + 1);
      
    } catch (error) {
      console.error('Error loading data:', error);
      if (isMountedRef.current) {
        toast.error(`Failed to load dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        loadingRef.current = false;
      } else {
        loadingRef.current = false;
      }
    }
  }, [userId]);

  // Fallback: if loading takes too long, show data anyway
  useEffect(() => {
    if (!hasAttemptedLoad) return; // Don't start timeout until we've attempted to load
    
    const timeout = setTimeout(() => {
      if (loading && isMountedRef.current) {
        setLoading(false);
        loadingRef.current = false;
        setTournaments([]);
        setRegistrations([]);
      }
    }, 5000); // Reduced to 5 second timeout

    return () => clearTimeout(timeout);
  }, [loading, hasAttemptedLoad]);
  
  // Emergency timeout - force loading to false after 8 seconds
  useEffect(() => {
    if (!hasAttemptedLoad) return;
    
    const emergencyTimeout = setTimeout(() => {
      setLoading(false);
      loadingRef.current = false;
      setHasAttemptedLoad(false); // Reset to allow retry
    }, 8000);
    
    return () => clearTimeout(emergencyTimeout);
  }, [hasAttemptedLoad]);
  
  // Global safety timeout - always show content after 10 seconds
  useEffect(() => {
    const globalTimeout = setTimeout(() => {
      setLoading(false);
      loadingRef.current = false;
      // Don't create fake tournaments, just show empty state
    }, 10000);
    
    return () => clearTimeout(globalTimeout);
  }, []); // Run once on mount

  // Clear dummy payment data on mount to ensure real data is shown
  useEffect(() => {
    // Clear any existing dummy payment transactions to prevent showing fake revenue
    try {
      const { dummyPaymentProcessor } = require('../lib/dummyPaymentSystem');
      dummyPaymentProcessor.clearTransactions();
      console.log('🧹 Cleared dummy payment transactions to show real revenue data');
    } catch (error) {
      console.log('No dummy payment system to clear');
    }
  }, []);

  // Memoize computed values to prevent unnecessary recalculations
  const organizerTournaments = useMemo(() => tournaments, [tournaments]);
  const organizerRegistrations = useMemo(() => registrations, [registrations]);

  // Calculate manageable tournaments (completed or cancelled tournaments that can be archived/hidden)
  const manageableTournaments = useMemo(() => 
    organizerTournaments.filter((t: any) => 
      t.status === 'completed' || t.status === 'cancelled'
    ), [organizerTournaments]
  );

  // Manual refresh function for user-initiated updates
  const handleManualRefresh = useCallback(async () => {
    if (loading || !isMountedRef.current) return;
    
    setIsRefreshing(true);
    try {
      await loadData();
      if (isMountedRef.current) {
        toast.success('Dashboard updated successfully!', {
          duration: 3000,
          position: 'top-right'
        });
      }
    } catch (error) {
      if (isMountedRef.current) {
        toast.error('Failed to refresh dashboard data. Please try again.', {
          duration: 5000,
          position: 'top-right'
        });
      }
    } finally {
      if (isMountedRef.current) {
        setIsRefreshing(false);
      }
    }
  }, [loadData, loading]);

  const handleQuickAction = useCallback((action: string) => {
    switch (action) {
      case 'create':
        navigate('/create-tournament');
        break;
      case 'analytics':
        setSelectedTab('revenue');
        break;
      case 'schedule':
        setSelectedTab('schedule');
        break;
      case 'manage':
        setSelectedTab('manage');
        break;
      default:
        break;
    }
  }, [navigate]);

  const handleExportData = useCallback(async (type: 'tournaments' | 'registrations' | 'revenue') => {
    try {
      let data: any[] = [];
      let filename = '';
      
      switch (type) {
        case 'tournaments':
          data = tournaments;
          filename = `tournaments_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'registrations':
          data = registrations;
          filename = `registrations_${new Date().toISOString().split('T')[0]}.json`;
          break;
        case 'revenue':
          data = revenueData ? [revenueData] : [];
          filename = `revenue_${new Date().toISOString().split('T')[0]}.json`;
          break;
      }
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} data exported successfully!`, {
        duration: 3000,
        position: 'top-right'
      });
    } catch (error) {
      toast.error('Failed to export data. Please try again.', {
        duration: 5000,
        position: 'top-right'
      });
    }
  }, [tournaments, registrations, revenueData]);

  const handleBulkAction = useCallback((action: string, selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      toast.error('Please select items to perform bulk actions.', {
        duration: 3000,
        position: 'top-right'
      });
      return;
    }
    
    switch (action) {
      case 'delete':
        // Handle bulk delete
        toast.success(`Delete ${selectedIds.length} selected items?`, {
          duration: 5000,
          position: 'top-right'
        });
        break;
      case 'export':
        // Handle bulk export
        handleExportData('tournaments');
        break;
      case 'status':
        // Handle bulk status change
        toast.success(`Update status for ${selectedIds.length} selected items?`, {
          duration: 5000,
          position: 'top-right'
        });
        break;
      default:
        break;
    }
  }, [handleExportData]);

  // Filter registrations based on selected filters
  const filteredRegistrations = organizerRegistrations.filter((registration: any) => {
    const matchesSearch = registration.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         registration.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (registration.tournaments?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTournament = selectedTournament === 'all' || registration.tournament_id === selectedTournament;
    const matchesStatus = statusFilter === 'all' || registration.status === statusFilter;
    
    return matchesSearch && matchesTournament && matchesStatus;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredRegistrations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, endIndex);

  // Calculate statistics based on real data
  const activeTournaments = organizerTournaments.filter((t: any) => t.status === 'approved').length;
  const pendingTournaments = organizerTournaments.filter((t: any) => t.status === 'pending_approval').length;
  const rejectedTournaments = organizerTournaments.filter((t: any) => t.status === 'rejected').length;
  const totalParticipants = organizerTournaments.reduce((sum: number, t: any) => sum + (t.current_participants || 0), 0);
  
  // Use real revenue data calculated from tournament registrations
  const totalRevenue = revenueData?.organizerEarnings || 0;
  const grossRevenue = revenueData?.totalRevenue || 0;
  const platformFees = revenueData?.platformCommission || 0;

  const stats = [
    {
      icon: <Trophy className="h-6 w-6" />,
      title: 'Active Tournaments',
      value: String(activeTournaments),
      change: activeTournaments > 0 ? `${activeTournaments} live tournaments` : 'No active tournaments',
      color: 'text-blue-600'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Total Participants',
      value: String(totalParticipants),
      change: totalParticipants > 0 ? `Across all tournaments` : 'No participants yet',
      color: 'text-green-600'
    },
    {
      icon: <DollarSign className="h-6 w-6" />,
      title: 'Revenue',
      value: `रू ${totalRevenue.toLocaleString()}`,
      change: totalRevenue > 0 ? `रू ${grossRevenue.toLocaleString()} gross (रू ${platformFees.toLocaleString()} fees)` : 'No revenue yet',
      color: 'text-yellow-600'
    },
    {
      icon: <Calendar className="h-6 w-6" />,
      title: 'Total Tournaments',
      value: String(organizerTournaments.length),
      change: organizerTournaments.length > 0 ? `${pendingTournaments} pending approval` : 'Create your first tournament',
      color: 'text-purple-600'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-black';
      default:
        return 'bg-gray-100 text-black';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending_approval':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Trophy className="h-4 w-4 text-blue-600" />;
    }
  };

  const handleApproveParticipant = (registrationId: string) => {
    const updateRegistration = async () => {
      try {
        const registration = registrations.find((reg: any) => reg.id === registrationId);
        if (!registration) return;

        await registrationService.updateRegistration(registrationId, { status: 'confirmed' });
        
        // Log the approval action
        await auditLogService.logAction(
          user?.id || '',
          user?.full_name || '',
          'APPROVE_REGISTRATION',
          'registration',
          registrationId,
          { status: 'registered' },
          { status: 'confirmed' }
        );
        
        // Update local state
        setRegistrations(prev => 
          prev.map(reg => 
            reg.id === registrationId ? { ...reg, status: 'confirmed' } : reg
          )
        );

        // Add notification for player
        addNotification({
          type: 'tournament_registration_success',
          title: 'Registration Confirmed!',
          message: `Your registration for "${registration.tournaments?.name || registration.tournament_name}" has been confirmed by the organizer.`,
          userId: registration.player_id,
          tournamentId: registration.tournament_id,
          tournamentName: registration.tournaments?.name || registration.tournament_name,
          targetRole: 'player'
        });

        toast.success('Participant approved successfully!');
      } catch (error) {
        console.error('Error approving participant:', error);
        toast.error('Failed to approve participant');
      }
    };
    
    updateRegistration();
  };

  const handleRejectParticipant = (registrationId: string) => {
    const updateRegistration = async () => {
      try {
        const registration = registrations.find((reg: any) => reg.id === registrationId);
        if (!registration) return;

        // Update registration status
        await registrationService.updateRegistration(registrationId, { status: 'rejected' });
        
        // Handle refund request creation
        let refundMessage = '';
        try {
          const { paymentService } = await import('../lib/paymentService');
          
          // Get the payment record for this registration
          const playerPayment = await paymentService.getPlayerPaymentByRegistration(
            registration.tournament_id, 
            registration.player_id
          );

          if (playerPayment) {
            // Create refund request
            const refundRequest = await paymentService.createRefundRequest({
              player_id: registration.player_id,
              tournament_id: registration.tournament_id,
              registration_id: registration.id,
              payment_id: playerPayment.id,
              refund_amount: playerPayment.total_amount,
              reason: 'Registration rejected by organizer',
              player_explanation: 'Organizer rejected my tournament registration'
            });

            if (refundRequest) {
              // Update refund status to indicate refund is pending
              await paymentService.updateRefundStatus(
                playerPayment.id,
                'pending'
              );

              refundMessage = ` A refund request for ₹${playerPayment.total_amount} has been created. Support will contact you at psychxccc@gmail.com within 24 hours to process your refund.`;
            }
          }
        } catch (refundError) {
          console.error('Error creating refund request:', refundError);
          refundMessage = ' There was an issue creating your refund request. Please contact support at psychxccc@gmail.com.';
        }

        // Decrease tournament participant count
        try {
          const { tournamentService } = await import('../lib/database');
          const currentTournament = tournaments.find(t => t.id === registration.tournament_id);
          
          if (currentTournament && currentTournament.current_participants > 0) {
            await tournamentService.updateTournament(registration.tournament_id, {
              current_participants: currentTournament.current_participants - 1
            });
          }
        } catch (countError) {
          console.error('Error updating participant count:', countError);
        }
        
        // Log the rejection action
        await auditLogService.logAction(
          user?.id || '',
          user?.full_name || '',
          'REJECT_REGISTRATION',
          'registration',
          registrationId,
          { status: 'registered' },
          { status: 'rejected' }
        );
        
        // Update local state
        setRegistrations(prev => 
          prev.map(reg => 
            reg.id === registrationId ? { ...reg, status: 'rejected' } : reg
          )
        );

        // Update tournaments state to reflect participant count change
        setTournaments(prev => 
          prev.map(t => 
            t.id === registration.tournament_id 
              ? { ...t, current_participants: Math.max(0, (t.current_participants || 1) - 1) }
              : t
          )
        );

        // Add notification for player
        addNotification({
          type: 'tournament_rejected',
          title: 'Registration Rejected - Refund Request Created',
          message: `Your registration for "${registration.tournaments?.name || registration.tournament_name}" has been rejected by the organizer.${refundMessage}`,
          userId: registration.player_id,
          tournamentId: registration.tournament_id,
          tournamentName: registration.tournaments?.name || registration.tournament_name,
          targetRole: 'player'
        });

        toast.success('Participant rejected and refund request created!');
      } catch (error) {
        console.error('Error rejecting participant:', error);
        toast.error('Failed to reject participant');
      }
    };
    
    updateRegistration();
  };

  const exportRegistrations = () => {
    const csvContent = [
      ['Player Name', 'Email', 'Phone', 'Age', 'Experience', 'Team', 'Tournament', 'Status', 'Registration Date'],
      ...filteredRegistrations.map((reg: any) => [
        reg.player_name,
        reg.email,
        reg.phone,
        reg.age,
        reg.experience_level,
        reg.team_name || 'Individual',
        reg.tournament_name,
        reg.status,
        new Date(reg.registration_date).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'tournament_registrations.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  // Show loading state while data is being fetched
  if (loading && hasAttemptedLoad) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-black">Loading organizer dashboard...</p>
        <p className="text-sm text-black mt-2">Please wait while we load your tournaments...</p>
          <div className="mt-4">
            <Button 
              onClick={() => {
                setLoading(false);
                loadingRef.current = false;
                setHasAttemptedLoad(false);
                // Force immediate data load
                setTimeout(() => {
                  if (isMountedRef.current) {
                    setLoading(true);
                    loadingRef.current = true;
                    loadData();
                  }
                }, 100);
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if user is not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
                  <h2 className="text-xl font-semibold text-black mb-2">Authentication Required</h2>
        <p className="text-black mb-4">Please log in to access the organizer dashboard</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </Card>
      </div>
    );
  }

  // Show error state if user is not an organizer
  if (user.role !== 'organizer') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
                  <h2 className="text-xl font-semibold text-black mb-2">Access Denied</h2>
        <p className="text-black mb-4">This dashboard is only available to tournament organizers</p>
          <Button onClick={() => navigate('/')}>
            Go to Home
          </Button>
        </Card>
      </div>
    );
  }

  // Render mobile dashboard for small screens
  if (window.innerWidth < 1024) {
    return (
      <MobileOrganizerDashboard
        tournaments={organizerTournaments}
        registrations={organizerRegistrations}
        revenueData={revenueData}
        onRefresh={handleManualRefresh}
        onTabChange={setSelectedTab}
        selectedTab={selectedTab}
        loading={loading}
        isRefreshing={isRefreshing}
      />
    );
  }
  
  // If we have no data but loading is complete, show empty state
  if (!loading && tournaments.length === 0 && registrations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏆</div>
                  <h1 className="text-2xl font-bold text-black mb-4">Welcome to Your Organizer Dashboard</h1>
        <p className="text-black mb-6">You haven't created any tournaments yet. Get started by creating your first tournament!</p>
          <Button 
            onClick={() => navigate('/create-tournament')}
            className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium shadow-md transition-all duration-200"
          >
            Create Tournament
          </Button>
          <div className="mt-4">
            <Button 
              onClick={() => {
                setHasAttemptedLoad(false);
                setLoading(true);
                loadingRef.current = true;
                loadData();
              }}
              className="px-4 py-2 bg-gray-50 text-black border border-gray-200 rounded-lg hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
            >
              Refresh Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          <motion.div 
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <div>
              <motion.h1 
                variants={itemVariants}
                className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3"
              >
                Organizer Dashboard
              </motion.h1>
              <motion.p 
                variants={itemVariants}
                className="text-black text-lg"
              >
                                  Welcome back, <span className="font-semibold text-black">{user?.full_name}</span>! 🎯
              </motion.p>
              <motion.div 
                variants={itemVariants}
                className="flex items-center space-x-4 mt-3"
              >
                <div className="flex items-center space-x-2 text-sm text-black">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span>Dashboard Active</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-black">
                  <Clock className="h-4 w-4" />
                  <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
              </motion.div>
            </div>
            <motion.div 
              variants={itemVariants}
              className="flex items-center space-x-3"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  variant="outline"
                  className="bg-gray-50 border-gray-200 text-black hover:bg-gray-100 hover:border-gray-300 transition-all duration-200"
                  onClick={handleManualRefresh}
                  disabled={loading || isRefreshing}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button 
                  className="bg-gray-900 hover:bg-gray-800 text-white shadow-md hover:shadow-lg transition-all duration-200"
                  onClick={() => navigate('/create-tournament')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tournament
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Status Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.05 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between text-sm text-black">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <div className={`w-2 h-2 rounded-full mr-2 ${loading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`}></div>
                {loading ? 'Refreshing data...' : 'Data up to date'}
              </span>
              <span>Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
              <span className="text-xs text-black">
                Data version: {dataVersion}
              </span>
            </div>
            <div className="text-xs text-black">
              Smart refresh every 5 minutes when tab is active
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover="hover"
              className="group"
            >
              <Card className="relative p-6 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-purple-50 border-2 border-transparent hover:border-blue-200 transition-all duration-300 shadow-sm hover:shadow-lg overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex-1">
                    <motion.p 
                      className="text-sm font-medium text-black mb-2 group-hover:text-black transition-colors duration-200"
                    >
                      {stat.title}
                    </motion.p>
                    <motion.p 
                      className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent group-hover:from-blue-600 group-hover:to-purple-600 transition-all duration-300"
                    >
                      {stat.value}
                    </motion.p>
                    <motion.p 
                      className="text-sm text-black mt-2 group-hover:text-black transition-colors duration-200"
                    >
                      {stat.change}
                    </motion.p>
                  </div>
                  <motion.div 
                    className={`${stat.color} p-3 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-blue-50 group-hover:to-purple-50 transition-all duration-300`}
                    whileHover={{ rotate: 5, scale: 1.1 }}
                  >
                    {stat.icon}
                  </motion.div>
                </div>
                <motion.div
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  initial={false}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>

        <SupabaseConnectionBanner />

        {/* Enhanced Navigation Tabs */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-8"
        >
          {/* Professional Navigation with Visual Appeal */}
          <div className="bg-gradient-to-r from-slate-50 to-blue-50 rounded-2xl border border-slate-200 shadow-lg p-4">
            <nav className="flex flex-wrap gap-3">
              <Button
                onClick={() => setSelectedTab('tournaments')}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedTab === 'tournaments'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border-0'
                    : 'bg-white text-black hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                <Trophy className={`h-5 w-5 ${selectedTab === 'tournaments' ? 'text-white' : 'text-blue-600'}`} />
                <span>Your Tournaments</span>
              </Button>
              <Button
                onClick={() => setSelectedTab('participants')}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedTab === 'participants'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border-0'
                    : 'bg-white text-black hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                <Users className={`h-5 w-5 ${selectedTab === 'participants' ? 'text-white' : 'text-green-600'}`} />
                <span>Manage Participants</span>
                {organizerRegistrations.length > 0 && (
                  <span className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs px-3 py-1 rounded-full ml-2 font-bold shadow-sm">
                    {organizerRegistrations.length}
                  </span>
                )}
              </Button>
              <Button
                onClick={() => setSelectedTab('revenue')}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedTab === 'revenue'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border-0'
                    : 'bg-white text-black hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                <DollarSign className={`h-5 w-5 ${selectedTab === 'revenue' ? 'text-white' : 'text-emerald-600'}`} />
                <span>Revenue Dashboard</span>
              </Button>
              <Button
                onClick={() => setSelectedTab('schedule')}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedTab === 'schedule'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border-0'
                    : 'bg-white text-black hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                <Calendar className={`h-5 w-5 ${selectedTab === 'schedule' ? 'text-white' : 'text-orange-600'}`} />
                <span>Schedule Events</span>
              </Button>
              <Button
                onClick={() => setSelectedTab('manage')}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedTab === 'manage'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border-0'
                    : 'bg-white text-black hover:bg-slate-50 hover:text-slate-800 hover:border-slate-300 border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                <Archive className={`h-5 w-5 ${selectedTab === 'manage' ? 'text-white' : 'text-slate-600'}`} />
                <span>Manage Events</span>
                {manageableTournaments.length > 0 && (
                  <span className="bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs px-3 py-1 rounded-full ml-2 font-bold shadow-sm">
                    {manageableTournaments.length}
                  </span>
                )}
              </Button>
              <Button
                onClick={() => setSelectedTab('chat')}
                className={`flex items-center space-x-3 px-6 py-4 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                  selectedTab === 'chat'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-xl shadow-blue-500/25 border-0'
                    : 'bg-white text-black hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-slate-200 shadow-md hover:shadow-lg'
                }`}
              >
                <MessageSquare className={`h-5 w-5 ${selectedTab === 'chat' ? 'text-white' : 'text-indigo-600'}`} />
                <span>Chat</span>
              </Button>
            </nav>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            {selectedTab === 'tournaments' ? (
              /* Your Tournaments Tab */
              <TournamentManagement 
                tournaments={organizerTournaments}
                onTournamentUpdate={loadData}
              />
            ) : selectedTab === 'participants' ? (
              /* Manage Participants Tab */
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-black">
                    Participant Management
                  </h2>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportRegistrations}
                      disabled={filteredRegistrations.length === 0}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export CSV
                    </Button>
                    <span className="text-sm text-black">
                      {filteredRegistrations.length} of {organizerRegistrations.length} registrations
                    </span>
                  </div>
                </div>
                
                {/* Filters */}
                {organizerRegistrations.length > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                                <label className="block text-sm font-medium text-black mb-1">
          Search Participants
        </label>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            type="text"
                            placeholder="Search by name, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                          />
                        </div>
                      </div>
                      
                      <div>
                                <label className="block text-sm font-medium text-black mb-1">
          Tournament
        </label>
                        <select
                          value={selectedTournament}
                          onChange={(e) => setSelectedTournament(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Tournaments</option>
                          {organizerTournaments.map((tournament: any) => (
                            <option key={tournament.id} value={tournament.id}>
                              {tournament.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                                <label className="block text-sm font-medium text-black mb-1">
          Status
        </label>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="all">All Status</option>
                          <option value="registered">Pending Review</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      
                      <div>
                                <label className="block text-sm font-medium text-black mb-1">
          Items per page
        </label>
                        <select
                          value={itemsPerPage}
                          onChange={(e) => {
                            setItemsPerPage(Number(e.target.value));
                            setCurrentPage(1);
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={10}>10 per page</option>
                          <option value={25}>25 per page</option>
                          <option value={50}>50 per page</option>
                          <option value={100}>100 per page</option>
                        </select>
                      </div>
                      
                      <div className="flex items-end">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('');
                            setSelectedTournament('all');
                            setStatusFilter('all');
                            setCurrentPage(1);
                          }}
                          className="w-full"
                        >
                          Clear Filters
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {organizerRegistrations.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-black mb-2">
                      No registrations yet
                    </h3>
                    <p className="text-black">
                      Player registrations will appear here once they sign up for your tournaments
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Registration Stats */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <span className="text-blue-800">
                            <strong>Showing:</strong> {startIndex + 1}-{Math.min(endIndex, filteredRegistrations.length)} of {filteredRegistrations.length} registrations
                          </span>
                          {filteredRegistrations.length !== organizerRegistrations.length && (
                            <span className="text-blue-600">
                              (Filtered from {organizerRegistrations.length} total)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                            {filteredRegistrations.filter(r => r.status === 'registered').length} Pending
                          </span>
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                            {filteredRegistrations.filter(r => r.status === 'confirmed').length} Confirmed
                          </span>
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                            {filteredRegistrations.filter(r => r.status === 'rejected').length} Rejected
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Registrations List */}
                    <div className="space-y-3">
                    {filteredRegistrations.length === 0 ? (
                      <div className="text-center py-8">
                        <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-black mb-2">
                          No registrations match your filters
                        </h3>
                        <p className="text-black">
                          Try adjusting your search criteria or filters
                        </p>
                      </div>
                    ) : (
                      paginatedRegistrations.map((registration: any) => (
                        <div
                          key={registration.id}
                          className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                            registration.status === 'confirmed' ? 'bg-green-50 border-green-200' :
                            registration.status === 'rejected' ? 'bg-red-50 border-red-200' :
                            'bg-blue-50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <User className={`h-4 w-4 ${
                                  registration.status === 'confirmed' ? 'text-green-600' :
                                  registration.status === 'rejected' ? 'text-red-600' :
                                  'text-blue-600'
                                }`} />
                                <h4 className="font-semibold text-black">
                                  {registration.player_name}
                                </h4>
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  registration.experience_level === 'professional' ? 'bg-purple-100 text-purple-800' :
                                  registration.experience_level === 'advanced' ? 'bg-orange-100 text-orange-800' :
                                  registration.experience_level === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-black'
                                }`}>
                                  {registration.experience_level}
                                </span>
                                {registration.team_name && (
                                  <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                                    Team: {registration.team_name}
                                  </span>
                                )}
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-black">
                                <div className="flex items-center space-x-1">
                                  <Trophy className="h-3 w-3 mr-1" />
                                  <span className="truncate">{registration.tournaments?.name || registration.tournament_name}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Mail className="h-3 w-3 mr-1" />
                                  <span className="truncate">{registration.email}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Phone className="h-3 w-3 mr-1" />
                                  <span>{registration.phone}</span>
                                </div>
                              </div>
                              
                                                              <p className="text-xs text-black mt-2">
                                Age: {registration.age} • Registered: {new Date(registration.registration_date).toLocaleDateString()}
                              </p>
                            </div>
                            
                            <div className="flex items-center space-x-3 ml-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                registration.status === 'registered' ? 'bg-yellow-100 text-yellow-800' :
                                registration.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                registration.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {registration.status === 'registered' ? 'Pending Review' : 
                                 registration.status === 'confirmed' ? 'Confirmed' :
                                 registration.status === 'rejected' ? 'Rejected' : registration.status}
                              </span>
                              
                              {registration.status === 'registered' && (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleApproveParticipant(registration.id)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1"
                                    title="Approve Registration"
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRejectParticipant(registration.id)}
                                    className="text-red-600 hover:text-red-800 border-red-300 hover:border-red-400 px-3 py-1"
                                    title="Reject Registration"
                                  >
                                    <UserX className="h-4 w-4 mr-1" />
                                    Reject
                                  </Button>
                                </div>
                              )}
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Only open modal if we have complete registration data
                                  if (registration && registration.profiles) {
                                    setSelectedRegistration(registration);
                                    setShowPlayerProfileModal(true);
                                  } else {
                                    // Show basic registration info in a simple modal or toast
                                    toast.error('Detailed player profile not available. Showing basic registration info.', {
                                      duration: 5000,
                                      position: 'top-right'
                                    });
                                    // You could show a simple info modal here instead
                                    console.log('Basic registration info:', {
                                      name: registration.player_name,
                                      email: registration.email,
                                      phone: registration.phone,
                                      age: registration.age,
                                      experience: registration.experience_level,
                                      status: registration.status
                                    });
                                  }
                                }}
                                className={`px-3 py-1 ${
                                  registration.profiles 
                                    ? 'text-blue-600 hover:text-blue-800 border-blue-300 hover:border-blue-400' 
                                    : 'text-gray-500 border-gray-300 cursor-not-allowed'
                                }`}
                                title={registration.profiles ? 'View Player Profile' : 'Profile data not available'}
                                disabled={!registration.profiles}
                              >
                                <User className="h-4 w-4 mr-1" />
                                {registration.profiles ? 'View Profile' : 'No Profile'}
                              </Button>
                            </div>
                          </div>
                          
                          {registration.medical_conditions && (
                            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <p className="text-xs text-yellow-800">
                                <strong>⚠️ Medical Note:</strong> {registration.medical_conditions}
                              </p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="mt-6 flex items-center justify-between">
                                                        <div className="text-sm text-black">
                          Page {currentPage} of {totalPages}
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                          >
                            Previous
                          </Button>
                          
                          {/* Page Numbers */}
                          <div className="flex space-x-1">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                              return (
                                <Button
                                  key={pageNum}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`px-3 py-1 text-sm rounded ${
                                    currentPage === pageNum
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-black hover:bg-gray-200'
                                  }`}
                                >
                                  {pageNum}
                                </Button>
                              );
                            })}
                          </div>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </Card>
            ) : selectedTab === 'revenue' ? (
            /* Revenue Dashboard Tab */
            <RevenueAnalytics userType="organizer" />
          ) : selectedTab === 'schedule' ? (
            /* Event Scheduling Tab - Now Functional */
            <EventSchedulingSystem 
              organizerId={user?.id || ''}
              tournaments={organizerTournaments}
              onEventUpdate={() => {
                // Refresh events when updated
                loadData();
              }}
            />
          ) : selectedTab === 'manage' ? (
            /* Tournament Status Management Tab */
            <TournamentStatusManager
              tournaments={organizerTournaments}
              onTournamentUpdate={loadData}
            />
          ) : selectedTab === 'chat' ? (
            /* Chat Tab - Placeholder */
            <OrganizerChatManager
              organizerId={user?.id || ''}
            />
          ) : null}
          </motion.div>

          {/* Enhanced Quick Actions Sidebar */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="space-y-6"
          >
            <motion.div variants={itemVariants}>
              <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 shadow-xl">
                <motion.h2 
                  variants={itemVariants}
                  className="text-xl font-bold text-black mb-6 flex items-center"
                >
                  <Zap className="h-6 w-6 mr-3 text-blue-600" />
                  Quick Actions
                </motion.h2>
                
                <div className="space-y-4">
                  {[
                    { icon: Plus, label: 'Create Tournament', action: 'create', color: 'from-blue-500 to-purple-600' },
                    { icon: Users, label: 'Manage Participants', action: 'participants', color: 'from-green-500 to-emerald-600' },
                    { icon: Calendar, label: 'Schedule Events', action: 'schedule', color: 'from-orange-500 to-red-600' },
                    { icon: Settings, label: 'Organization Settings', action: 'settings', color: 'from-slate-500 to-gray-600' },
                    { icon: BarChart3, label: 'View Analytics', action: 'analytics', color: 'from-indigo-500 to-blue-600' }
                  ].map((action, index) => (
                    <motion.div
                      key={action.action}
                      variants={itemVariants}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className="group"
                    >
                      <Button 
                        className={`w-full justify-start bg-gradient-to-r ${action.color} hover:shadow-xl text-white border-0 transition-all duration-300 transform group-hover:scale-105 shadow-lg`}
                        onClick={() => {
                          if (action.action === 'create') navigate('/create-tournament');
                          else if (action.action === 'settings') navigate('/organizer-profile');
                          else handleQuickAction(action.action);
                        }}
                      >
                        <action.icon className="mr-3 h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
                        <span className="font-bold text-white">{action.label}</span>
                        <ArrowUpRight className="ml-auto h-4 w-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-white" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </Card>
            </motion.div>

            {/* Enhanced Summary Card */}
            <motion.div variants={itemVariants}>
              <Card className="p-6 bg-gradient-to-br from-slate-50 to-blue-50 border-2 border-slate-200 shadow-xl">
                <motion.h3 
                  variants={itemVariants}
                  className="text-lg font-bold text-black mb-4 flex items-center"
                >
                  <BarChart className="h-6 w-6 mr-2 text-blue-600" />
                  Dashboard Summary
                </motion.h3>
                <div className="space-y-4">
                  {[
                    { label: 'Total Tournaments', value: organizerTournaments.length, color: 'text-gray-700', icon: Trophy },
                    { label: 'Active', value: activeTournaments, color: 'text-green-600', icon: CheckCircle },
                    { label: 'Pending Approval', value: pendingTournaments, color: 'text-yellow-600', icon: Clock },
                    { label: 'Total Registrations', value: organizerRegistrations.length, color: 'text-blue-600', icon: Users },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-white/50"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${item.color.replace('text-', 'bg-').replace('-600', '-100')}`}>
                          <item.icon className={`h-5 w-5 ${item.color}`} />
                        </div>
                        <span className="text-black text-sm font-semibold">{item.label}</span>
                      </div>
                      <span className={`font-bold text-lg ${item.color}`}>{item.value}</span>
                    </motion.div>
                  ))}
                  {rejectedTournaments > 0 && (
                    <motion.div
                      variants={itemVariants}
                      className="flex items-center justify-between p-4 rounded-xl bg-white/80 hover:bg-white shadow-md hover:shadow-lg transition-all duration-300 border border-white/50"
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-red-100">
                          <XCircle className="h-5 w-5 text-red-600" />
                        </div>
                        <span className="text-black text-sm font-semibold">Rejected</span>
                      </div>
                      <span className="font-bold text-lg text-red-600">{rejectedTournaments}</span>
                    </motion.div>
                  )}
                  <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 shadow-lg"
                    whileHover={{ scale: 1.02, y: -2 }}
                  >
                    <div className="flex items-center space-x-3">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-black font-medium">Total Revenue</span>
                    </div>
                    <span className="font-bold text-green-600 text-lg">रू {totalRevenue.toLocaleString()}</span>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Action Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring", stiffness: 200 }}
          className="fixed bottom-8 right-8 z-50"
        >
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            className="relative"
          >
            <Button
              className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 shadow-2xl hover:shadow-blue-500/25 transition-all duration-300"
              onClick={() => navigate('/create-tournament')}
            >
              <Plus className="h-8 w-8 text-white" />
            </Button>
            <motion.div
              className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>

        {/* Background Decorative Elements */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 20, 0],
              y: [0, -20, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute bottom-20 right-20 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, -30, 0],
              y: [0, 30, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
      {/* Player Profile Modal */}
      {selectedRegistration && selectedRegistration.profiles && (
        <PlayerProfileModal
          isOpen={showPlayerProfileModal}
          onClose={() => setShowPlayerProfileModal(false)}
          registration={selectedRegistration}
        />
      )}
    </div>
  );
};










