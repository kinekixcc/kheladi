import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Star,
  Clock,
  Trophy,
  Users,
  Award,
  Medal,
  Settings,
  Eye,
  Bell,
  Search,
  Gamepad2,
  User,
  Calendar,
  Sun,
  Moon,
  RefreshCw,
  CheckCircle,
  MessageSquare,
  Filter,
  Grid3X3,
  List,
  ChevronRight,
  Plus,
  TrendingUp,
  Target,
  Zap,
  DollarSign,
  MessageCircle,
  Heart,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  tournamentService,
  registrationService,
} from '../lib/database';
import { PlayerStatsManager } from '../utils/playerStatsManager';
import { Button } from '../components/ui/Button';
import { PlayerTournamentBrowser } from '../components/player/PlayerTournamentBrowser';
import { PlayerProfile } from '../components/player/PlayerProfile';
import { NotificationCenter } from '../components/notifications/NotificationCenter';
import { PlayerTeamManagement } from '../components/team/PlayerTeamManagement';
import { ResponsiveLayout, ResponsiveGrid, ResponsiveCard, ResponsiveText } from '../components/layout/ResponsiveLayout';
import { 
  usePerformanceMonitor, 
  useMemoryOptimization, 
  useNetworkStatus, 
  debounce
} from '../utils/performanceOptimizer';
import { Tournament } from '../types';

/* ---------- Mock fallbacks (unchanged functionality) ---------- */
const mockTournaments: Tournament[] = [
  {
    id: '1',
    name: 'Summer Football Championship',
    description: 'Annual summer football tournament for all skill levels',
    sport_type: 'Football',
    organizer_id: 'org-1',
    organizer_name: 'Central Sports Club',
    facility_id: 'facility-1',
    facility_name: 'Central Sports Complex',
    start_date: '2024-06-15',
    end_date: '2024-06-20',
    registration_deadline: '2024-06-10',
    max_participants: 32,
    current_participants: 24,
    entry_fee: 1500,
    prize_pool: 50000,
    rules: 'Standard football rules apply',
    requirements: 'Age 16+, valid ID required',
    status: 'approved',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop'],
    venue_name: 'Central Sports Complex',
    venue_address: '123 Sports Street',
    province: 'Bagmati',
    district: 'Kathmandu',
    contact_phone: '+977-1-123456',
    contact_email: 'info@centralsports.com',
    visibility: 'public',
    requires_approval: false,
    is_recurring: false,
    chat_enabled: true,
  },
  {
    id: '2',
    name: 'Basketball Pro League',
    description: 'Professional basketball league for experienced players',
    sport_type: 'Basketball',
    organizer_id: 'org-2',
    organizer_name: 'Elite Basketball Association',
    facility_id: 'facility-2',
    facility_name: 'Elite Arena',
    start_date: '2024-06-22',
    end_date: '2024-06-25',
    registration_deadline: '2024-06-18',
    max_participants: 24,
    current_participants: 18,
    entry_fee: 2000,
    prize_pool: 75000,
    rules: 'FIBA rules with local modifications',
    requirements: 'Age 18+, previous tournament experience',
    status: 'approved',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop'],
    venue_name: 'Elite Arena',
    venue_address: '456 Basketball Court',
    province: 'Bagmati',
    district: 'Lalitpur',
    contact_phone: '+977-1-654321',
    contact_email: 'info@elitebasketball.com',
    visibility: 'public',
    requires_approval: false,
    is_recurring: false,
    chat_enabled: true,
  },
  {
    id: '3',
    name: 'Cricket Premier Cup',
    description: 'Premier cricket tournament with high stakes',
    sport_type: 'Cricket',
    organizer_id: 'org-3',
    organizer_name: 'Nepal Cricket Board',
    facility_id: 'facility-3',
    facility_name: 'National Stadium',
    start_date: '2024-07-01',
    end_date: '2024-07-10',
    registration_deadline: '2024-06-25',
    max_participants: 30,
    current_participants: 30,
    entry_fee: 3000,
    prize_pool: 100000,
    rules: 'ICC rules with local adaptations',
    requirements: 'Age 18+, cricket experience required',
    status: 'approved',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400&h=200&fit=crop'],
    venue_name: 'National Stadium',
    venue_address: '789 Cricket Ground',
    province: 'Bagmati',
    district: 'Kathmandu',
    contact_phone: '+977-1-987654',
    contact_email: 'info@nepalcricket.com',
    visibility: 'public',
    requires_approval: false,
    is_recurring: false,
    chat_enabled: true,
  },
];

const mockAchievements = [
  {
    id: '1',
    title: 'First Victory',
    description: 'Won your first tournament',
    icon: '🏆',
    earned_date: '2024-05-15',
    type: 'tournament',
    badge_color: 'bg-yellow-500',
    progress: 100,
    total: 1,
  },
  {
    id: '2',
    title: 'Team Player',
    description: 'Joined 5 different teams',
    icon: '👥',
    earned_date: '2024-05-10',
    type: 'team',
    badge_color: 'bg-blue-500',
    progress: 100,
    total: 5,
  },
  {
    id: '3',
    title: 'Tournament Champion',
    description: 'Win 5 tournaments',
    icon: '👑',
    earned_date: null,
    type: 'tournament',
    badge_color: 'bg-purple-500',
    progress: 60,
    total: 5,
  },
  {
    id: '4',
    title: 'Goal Scorer',
    description: 'Score 100 goals',
    icon: '⚽',
    earned_date: null,
    type: 'performance',
    badge_color: 'bg-green-500',
    progress: 89,
    total: 100,
  },
  {
    id: '5',
    title: 'Clean Player',
    description: 'Play 50 matches without cards',
    icon: '🟢',
    earned_date: null,
    type: 'performance',
    badge_color: 'bg-emerald-500',
    progress: 45,
    total: 50,
  },
  {
    id: '6',
    title: 'Social Butterfly',
    description: 'Connect with 20 players',
    icon: '🦋',
    earned_date: null,
    type: 'social',
    badge_color: 'bg-pink-500',
    progress: 15,
    total: 20,
  },
];

// Mock enhanced registration data for demonstration
const mockRegistrations = [
  {
    id: '1',
    tournament_id: '1',
    status: 'confirmed',
    registration_date: '2024-05-10',
    tournament_name: 'Summer Football Championship',
    tournament_sport_type: 'Football',
    tournament_start_date: '2024-06-15',
    tournament_end_date: '2024-06-20',
    tournament_facility_name: 'Central Sports Complex',
    tournament_entry_fee: 1500,
    tournament_image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    tournament_status: 'open',
    tournament_max_participants: 32,
    tournament_current_participants: 24,
  },
  {
    id: '2',
    tournament_id: '2',
    status: 'registered',
    registration_date: '2024-05-12',
    tournament_name: 'Basketball Pro League',
    tournament_sport_type: 'Basketball',
    tournament_start_date: '2024-06-22',
    tournament_end_date: '2024-06-25',
    tournament_facility_name: 'Elite Arena',
    tournament_entry_fee: 2000,
    tournament_image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop',
    tournament_status: 'open',
    tournament_max_participants: 24,
    tournament_current_participants: 18,
  },
];

// Mock performance data
const mockPerformanceData = {
  winRate: 68,
  totalMatches: 45,
  wins: 31,
  losses: 14,
  draws: 0,
  goalsScored: 89,
  goalsConceded: 52,
  cleanSheets: 12,
  assists: 23,
  yellowCards: 8,
  redCards: 1,
};

// Mock match history
const mockMatchHistory = [
  {
    id: '1',
    date: '2024-05-20',
    tournament: 'Summer Football Championship',
    opponent: 'Team Alpha',
    result: 'W',
    score: '3-1',
    goals: 2,
    assists: 1,
    yellowCards: 0,
    redCards: 0,
    rating: 8.5,
  },
  {
    id: '2',
    date: '2024-05-18',
    tournament: 'Basketball Pro League',
    opponent: 'Elite Warriors',
    result: 'L',
    score: '78-85',
    points: 18,
    rebounds: 5,
    assists: 4,
    rating: 7.2,
  },
  {
    id: '3',
    date: '2024-05-15',
    tournament: 'Summer Football Championship',
    opponent: 'City United',
    result: 'W',
    score: '2-0',
    goals: 1,
    assists: 0,
    yellowCards: 1,
    redCards: 0,
    rating: 8.8,
  },
];

// Mock team data
const mockTeams = [
  {
    id: '1',
    name: 'Thunder Strikers',
    sport: 'Football',
    role: 'Captain',
    members: 15,
    maxMembers: 18,
    wins: 12,
    losses: 3,
    draws: 2,
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
    nextMatch: '2024-06-01',
    nextOpponent: 'City United',
  },
  {
    id: '2',
    name: 'Elite Ballers',
    sport: 'Basketball',
    role: 'Player',
    members: 8,
    maxMembers: 12,
    wins: 8,
    losses: 5,
    draws: 0,
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&h=200&fit=crop',
    nextMatch: '2024-06-05',
    nextOpponent: 'Sky Hawks',
  },
];

// Mock team invitations
const mockTeamInvitations = [
  {
    id: '1',
    teamName: 'Phoenix Rising',
    sport: 'Football',
    inviter: 'John Smith',
    message: 'We need a striker for our upcoming tournament. Join us!',
    expires: '2024-06-01',
  },
  {
    id: '2',
    teamName: 'Lightning Fast',
    sport: 'Cricket',
    inviter: 'Mike Johnson',
    message: 'Looking for an all-rounder. Perfect fit for our team!',
    expires: '2024-06-03',
  },
];

// Mock community data
const mockCommunityData = {
  friends: [
    { id: '1', name: 'Alex Chen', sport: 'Football', status: 'online', lastActive: '2 min ago' },
    { id: '2', name: 'Sarah Wilson', sport: 'Basketball', status: 'offline', lastActive: '1 hour ago' },
    { id: '3', name: 'Raj Patel', sport: 'Cricket', status: 'online', lastActive: '5 min ago' },
  ],
  recentActivities: [
    { id: '1', player: 'Alex Chen', action: 'won', tournament: 'Summer Football Championship', time: '2 hours ago' },
    { id: '2', player: 'Sarah Wilson', action: 'joined', team: 'Elite Ballers', time: '4 hours ago' },
    { id: '3', player: 'Raj Patel', action: 'achieved', achievement: 'Tournament Champion', time: '1 day ago' },
  ],
};

export const PlayerDashboard: React.FC = () => {
  const { user } = useAuth();

  const [selectedTab, setSelectedTab] = useState<'overview' | 'tournaments' | 'my-tournaments' | 'chat' | 'achievements' | 'profile' | 'performance' | 'teams' | 'community'>('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [availableTournaments, setAvailableTournaments] = useState<Tournament[]>([]);

  const [tournamentsJoined, setTournamentsJoined] = useState(0);
  const [matchesWon, setMatchesWon] = useState(0);
  const [hoursPlayed, setHoursPlayed] = useState(0);
  const [playerRating, setPlayerRating] = useState(0);
  const [playerRegistrations, setPlayerRegistrations] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSport, setFilterSport] = useState('all');
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'participants'>('date');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  // New state variables for enhanced features
  const [performanceData, setPerformanceData] = useState(mockPerformanceData);
  const [matchHistory, setMatchHistory] = useState(mockMatchHistory);
  const [teams, setTeams] = useState<Array<{
    id: string;
    name: string;
    sport: string;
    role: string;
    members: number;
    maxMembers: number;
    wins: number;
    losses: number;
    draws: number;
    image: string;
    nextMatch?: string;
    nextOpponent?: string;
  }>>(mockTeams);
  const [teamInvitations, setTeamInvitations] = useState(mockTeamInvitations);
  const [communityData, setCommunityData] = useState(mockCommunityData);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);

  // Performance monitoring
  usePerformanceMonitor('PlayerDashboard');
  const { addCleanup } = useMemoryOptimization();
  const { isOnline } = useNetworkStatus();

  // Show network status warning
  useEffect(() => {
    if (!isOnline) {
      setError('You are currently offline. Some features may not work properly.');
    } else {
      setError(null);
    }
  }, [isOnline]);

  // Memoized values for performance
  const userId = useMemo(() => user?.id, [user?.id]);
  
  // Filtered tournaments based on search and filters
  const filteredTournaments = useMemo(() => {
    return availableTournaments.filter((tournament) => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tournament.sport_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tournament.facility_name.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSport = filterSport === 'all' || tournament.sport_type === filterSport;
      
      return matchesSearch && matchesSport;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'participants':
          return b.current_participants - a.current_participants;
        case 'date':
        default:
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime();
      }
    });
  }, [availableTournaments, searchQuery, filterSport, sortBy]);
  
  // Test tournament browsing functionality
  const testTournamentBrowsing = useCallback(() => {
    console.log('🧪 Testing tournament browsing functionality...');
    console.log('Available tournaments:', availableTournaments.length);
    console.log('Filtered tournaments:', filteredTournaments.length);
    console.log('Search query:', searchQuery);
    console.log('Sport filter:', filterSport);
    console.log('Sort by:', sortBy);
    console.log('View mode:', viewMode);
    
    // Test if tournaments are properly displayed
    if (availableTournaments.length > 0) {
      console.log('✅ Tournaments loaded successfully');
      console.log('First tournament:', availableTournaments[0]);
    } else {
      console.log('❌ No tournaments available');
    }
    
    // Test filtering
    if (filteredTournaments.length > 0) {
      console.log('✅ Filtering working correctly');
    } else {
      console.log('⚠️ Filtering may have issues');
    }
  }, [availableTournaments, filteredTournaments, searchQuery, filterSport, sortBy, viewMode]);

  // Comprehensive database connection test
  const testDatabaseConnection = useCallback(async () => {
    console.log('🔍 Testing database connection and tournament loading...');
    
    try {
      // Test 1: Check if Supabase is configured
      console.log('1️⃣ Testing Supabase configuration...');
      const { isSupabaseConfigured } = await import('../lib/supabase');
      console.log('Supabase configured:', isSupabaseConfigured);
      
      if (!isSupabaseConfigured) {
        console.error('❌ Supabase not configured! Check environment variables.');
        return;
      }
      
      // Test 2: Test direct database connection
      console.log('2️⃣ Testing direct database connection...');
      const { supabase } = await import('../lib/supabase');
      const { data: testData, error: testError } = await supabase
        .from('tournaments')
        .select('count')
        .limit(1);
      
      if (testError) {
        console.error('❌ Database connection failed:', testError);
        return;
      }
      
      console.log('✅ Database connection successful');
      
      // Test 3: Check total tournaments in database
      console.log('3️⃣ Checking total tournaments in database...');
      const { count: totalCount, error: countError } = await supabase
        .from('tournaments')
        .select('*', { count: 'exact', head: true });
      
      if (countError) {
        console.error('❌ Count query failed:', countError);
      } else {
        console.log('📊 Total tournaments in database:', totalCount);
      }
      
      // Test 4: Check public tournaments
      console.log('4️⃣ Checking public tournaments...');
      const { data: publicTournaments, error: publicError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('visibility', 'public')
        .in('status', ['approved', 'active', 'completed']);
      
      if (publicError) {
        console.error('❌ Public tournaments query failed:', publicError);
      } else {
        console.log('📊 Public tournaments found:', publicTournaments?.length || 0);
        console.log('Public tournaments data:', publicTournaments);
      }
      
      // Test 5: Check tournament visibility filtering
      console.log('5️⃣ Testing tournament visibility filtering...');
      const { tournamentUtils } = await import('../utils/tournamentUtils');
      
      if (publicTournaments && publicTournaments.length > 0) {
        const visibleTournaments = publicTournaments.filter(tournament => 
          tournamentUtils.isTournamentVisible(tournament)
        );
        console.log('📊 Visible tournaments after filtering:', visibleTournaments.length);
        console.log('Tournaments filtered out:', publicTournaments.length - visibleTournaments.length);
        
        if (visibleTournaments.length === 0) {
          console.log('⚠️ All tournaments filtered out by visibility rules!');
          console.log('Visibility filter details:', publicTournaments.map(t => ({
            id: t.id,
            name: t.name,
            end_date: t.end_date,
            is_archived: t.is_archived
          })));
        }
      }
      
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
    }
  }, []);
  
  const loadPlayerData = useCallback(async (showLoading = true) => {
    if (!userId) return;

    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      console.log('🔄 Loading player data for user:', userId);
      
      // Load data in parallel for better performance
      const [tournaments, registrations, stats] = await Promise.allSettled([
        tournamentService.getPublicTournaments(),
        registrationService.getPlayerRegistrations(userId),
        PlayerStatsManager.getInstance().getPlayerStats(userId)
      ]);

      // Handle successful responses
      if (tournaments.status === 'fulfilled') {
        console.log('✅ Tournaments loaded successfully:', tournaments.value?.length || 0, 'tournaments');
        console.log('📊 Tournament data:', tournaments.value);
        setAvailableTournaments(tournaments.value || []);
      } else {
        console.error('❌ Failed to load tournaments:', tournaments.reason);
        console.error('Tournament error details:', tournaments.reason);
        setError(`Failed to load tournaments: ${tournaments.reason?.message || 'Unknown error'}`);
      }
      
      if (registrations.status === 'fulfilled') {
        console.log('✅ Registrations loaded successfully:', registrations.value?.length || 0, 'registrations');
        const registrationData = registrations.value || [];
        
        // Enhance registrations with tournament details
        const enhancedRegistrations = await Promise.all(
          registrationData.map(async (registration) => {
            try {
              // Try to get tournament details if tournament_id exists
              if (registration.tournament_id) {
                const tournamentDetails = await tournamentService.getTournamentById(registration.tournament_id);
                return {
                  ...registration,
                  tournament_name: tournamentDetails?.name || 'Tournament Name',
                  tournament_sport_type: tournamentDetails?.sport_type || 'Sport Type',
                  tournament_start_date: tournamentDetails?.start_date,
                  tournament_end_date: tournamentDetails?.end_date,
                  tournament_facility_name: tournamentDetails?.facility_name || 'Location not set',
                  tournament_entry_fee: tournamentDetails?.entry_fee || 0,
                  tournament_image: tournamentDetails?.images?.[0],
                  tournament_status: tournamentDetails?.status,
                  tournament_max_participants: tournamentDetails?.max_participants,
                  tournament_current_participants: tournamentDetails?.current_participants,
                };
              }
              return registration;
            } catch (error) {
              console.warn('Failed to load tournament details for registration:', registration.id, error);
              return registration;
            }
          })
        );
        
        setPlayerRegistrations(enhancedRegistrations);
        setTournamentsJoined(enhancedRegistrations.length || 0);
      } else {
        console.error('❌ Failed to load registrations:', registrations.reason);
      }
      
      if (stats.status === 'fulfilled') {
        console.log('✅ Stats loaded successfully:', stats.value);
        const playerStats = stats.value;
        setMatchesWon(playerStats?.matchesWon || 0);
        setHoursPlayed(playerStats?.hoursPlayed || 0);
        setPlayerRating(playerStats?.overallRating || 0);
      } else {
        console.warn('Failed to load stats:', stats.reason);
      }

    } catch (error) {
      console.error('❌ Error loading player data:', error);
      console.error('Error details:', error);
      setError(`Failed to load player data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Only fallback to mock data if we have no tournaments at all
      if (availableTournaments.length === 0) {
        console.log('⚠️ Falling back to mock tournaments due to error');
        setAvailableTournaments(mockTournaments);
      }
      
      // Set default values for other data
      setMatchesWon(0);
      setHoursPlayed(0);
      setPlayerRating(0);
    } finally {
      setLoading(false);
    }
  }, [userId, availableTournaments.length]);

  // Refresh data function
  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await loadPlayerData(false);
    setRefreshing(false);
  }, [loadPlayerData]);

  // Debounced search function
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      setSearchQuery(query);
    }, 300),
    []
  );

  // Stats cards data
  const statsCards = useMemo(() => [
    {
      title: 'Tournaments Joined',
      value: tournamentsJoined,
      icon: Trophy,
      color: 'bg-blue-500',
      trend: '+2 this month',
    },
    {
      title: 'Matches Won',
      value: matchesWon,
      icon: Medal,
      color: 'bg-green-500',
      trend: '+5 this month',
    },
    {
      title: 'Hours Played',
      value: hoursPlayed,
      icon: Clock,
      color: 'bg-purple-500',
      trend: '+12 this month',
    },
    {
      title: 'Player Rating',
      value: playerRating,
      icon: Star,
      color: 'bg-yellow-500',
      trend: '+0.5 this month',
    },
  ], [tournamentsJoined, matchesWon, hoursPlayed, playerRating]);

  // Tab configuration - Simplified
  const tabConfig = useMemo(() => [
    { id: 'overview' as const, label: 'Overview', icon: Eye },
    { id: 'tournaments' as const, label: 'Browse', icon: Trophy },
    { id: 'my-tournaments' as const, label: 'My Tournaments', icon: Users },
    { id: 'performance' as const, label: 'Performance', icon: TrendingUp },
    { id: 'teams' as const, label: 'Teams', icon: Users },
    { id: 'achievements' as const, label: 'Achievements', icon: Award },
    { id: 'community' as const, label: 'Community', icon: Heart },
    { id: 'profile' as const, label: 'Profile', icon: User },
  ], []);

  // Theme toggle handler
  const toggleTheme = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Get badge color function
  const getBadgeColor = useCallback((status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  // Get tournament image function
  const getTournamentImage = useCallback((tournament: typeof availableTournaments[0]) => {
    // Check if tournament has a valid image URL
    if (tournament.images && tournament.images.length > 0 && (
      tournament.images[0].startsWith('http') || 
      tournament.images[0].startsWith('/') ||
      tournament.images[0].includes('.jpg') ||
      tournament.images[0].includes('.jpeg') ||
      tournament.images[0].includes('.png') ||
      tournament.images[0].includes('.webp')
    )) {
      return tournament.images[0];
    }
    
    // Fallback to sport-specific emojis
    const sportEmojis: { [key: string]: string } = {
      'Football': '⚽',
      'Basketball': '🏀',
      'Cricket': '🏏',
      'Tennis': '🎾',
      'Badminton': '🏸',
      'Table Tennis': '🏓',
      'Volleyball': '🏐',
      'Hockey': '🏑',
      'Rugby': '🏉',
      'Baseball': '⚾',
      'Swimming': '🏊',
      'Athletics': '🏃',
      'Boxing': '🥊',
      'Wrestling': '🤼',
      'Gymnastics': '🤸',
      'Cycling': '🚴',
      'Golf': '⛳',
      'Skiing': '⛷️',
      'Snowboarding': '🏂',
      'Surfing': '🏄',
    };
    
    return sportEmojis[tournament.sport_type] || '🏆';
  }, []);

  // Handle tournament details view
  const handleTournamentDetails = useCallback((tournament: typeof availableTournaments[0]) => {
    // Navigate to tournament details page
    window.location.href = `/tournament/${tournament.id}`;
  }, []);

  // Handle opening tournament chat
  const openTournamentChat = useCallback((tournamentId: string, tournamentName: string) => {
    if (!tournamentId) {
      alert('Tournament ID not available');
      return;
    }
    
    // Open tournament chat in a new window/tab
    const chatUrl = `/tournament/${tournamentId}/chat`;
    window.open(chatUrl, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
  }, []);

  // Load data on mount
  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      addCleanup(() => {
        // Cleanup any subscriptions or timers
      });
    };
  }, [addCleanup]);

  // Timeout fallback for stuck loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        setLoading(false);
        setError('Loading timeout. Please refresh the page.');
        // Set fallback data
        setAvailableTournaments(mockTournaments);
        setTournamentsJoined(0);
        setMatchesWon(0);
        setHoursPlayed(0);
        setPlayerRating(0);
      }
    }, 15000);

    return () => clearTimeout(timeout);
  }, [loading]);

  // Team invitation handlers
  const handleTeamInvitation = useCallback((invitationId: string, action: 'accept' | 'decline') => {
    setTeamInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    
    if (action === 'accept') {
      // Add to teams (mock implementation)
      const invitation = teamInvitations.find(inv => inv.id === invitationId);
      if (invitation) {
        const newTeam = {
          id: Date.now().toString(),
          name: invitation.teamName,
          sport: invitation.sport,
          role: 'Player',
          members: 1,
          maxMembers: 12,
          wins: 0,
          losses: 0,
          draws: 0,
          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
          nextMatch: undefined,
          nextOpponent: undefined,
        };
        setTeams(prev => [...prev, newTeam]);
      }
    }
    
    // Show success message
    alert(action === 'accept' ? 'Team invitation accepted!' : 'Team invitation declined.');
  }, [teamInvitations]);

  // Keyboard navigation for slider
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        const currentIndex = tabConfig.findIndex(tab => tab.id === selectedTab);
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabConfig.length - 1;
        setSelectedTab(tabConfig[prevIndex].id);
      } else if (event.key === 'ArrowRight') {
        const currentIndex = tabConfig.findIndex(tab => tab.id === selectedTab);
        const nextIndex = currentIndex < tabConfig.length - 1 ? currentIndex + 1 : 0;
        setSelectedTab(tabConfig[nextIndex].id);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [selectedTab, tabConfig]);

  // Sidebar state
  const [sidebarExpanded, setSidebarExpanded] = useState(true); // Start expanded by default
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Sidebar toggle functions
  const toggleSidebar = useCallback(() => {
    console.log('Toggle clicked! Current state:', sidebarExpanded);
    setSidebarExpanded(prev => {
      const newState = !prev;
      console.log('Sidebar state changing from', prev, 'to', newState);
      return newState;
    });
  }, [sidebarExpanded]);

  const openMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(true);
  }, []);

  const closeMobileSidebar = useCallback(() => {
    setMobileSidebarOpen(false);
  }, []);

  // Keyboard navigation for sidebar
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileSidebarOpen) {
        closeMobileSidebar();
      }
      if (event.key === 'b' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [mobileSidebarOpen, closeMobileSidebar, toggleSidebar]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your dashboard...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we fetch your data</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={refreshData} variant="primary">
              Try Again
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Refresh Page
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Navigation */}
      <div className="hidden lg:block">
        <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-40 ${
          isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        } ${sidebarExpanded ? 'w-64' : 'w-20'}`}>
          
          {/* Debug indicator */}
          <div className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1 py-0.5 rounded-bl">
            {sidebarExpanded ? 'EXP' : 'COL'}
          </div>
          
          {/* Sidebar Header */}
          <div className={`flex items-center justify-between p-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            {sidebarExpanded ? (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Gamepad2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    Kheleko
                  </span>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Player Dashboard
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
            )}
            
            <Button
              onClick={toggleSidebar}
              className={`p-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-gray-100 ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title={`${sidebarExpanded ? 'Collapse' : 'Expand'} sidebar (Ctrl+B)`}
              aria-label={`${sidebarExpanded ? 'Collapse' : 'Expand'} sidebar`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                {sidebarExpanded ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                )}
              </svg>
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav className="p-4 space-y-2" role="navigation" aria-label="Main navigation">
            {tabConfig.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 relative ${
                  selectedTab === tab.id
                    ? `${isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'} shadow-sm`
                    : `${isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`
                }`}
                aria-current={selectedTab === tab.id ? 'page' : undefined}
                title={sidebarExpanded ? undefined : tab.label}
              >
                {/* Current section indicator for collapsed state */}
                {!sidebarExpanded && selectedTab === tab.id && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-blue-600 rounded-r-full"></div>
                )}
                
                <tab.icon className={`h-5 w-5 flex-shrink-0 ${
                  selectedTab === tab.id ? 'text-current' : 'text-gray-500 group-hover:text-current'
                }`} aria-hidden="true" />
                {sidebarExpanded && (
                  <span className="font-medium">{tab.label}</span>
                )}
              </Button>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className={`absolute bottom-0 left-0 right-0 p-4 border-t ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className="space-y-2">
              {/* Theme Toggle */}
              <Button
                onClick={toggleTheme}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Toggle theme"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                {sidebarExpanded && (
                  <span className="text-sm">Theme</span>
                )}
              </Button>

              {/* User Profile */}
              <Button
                onClick={() => setSelectedTab('profile')}
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                  isDarkMode 
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                title="Profile"
              >
                <User className="h-5 w-5" />
                {sidebarExpanded && (
                  <span className="text-sm">{user?.full_name || 'Profile'}</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div className="lg:hidden">
        <motion.div
          initial={false}
          animate={{ opacity: mobileSidebarOpen ? 1 : 0, pointerEvents: mobileSidebarOpen ? 'auto' : 'none' }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={closeMobileSidebar}
        />
        
        <motion.div
          initial={{ x: -300 }}
          animate={{ x: mobileSidebarOpen ? 0 : -300 }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 h-full w-80 bg-white border-r border-gray-200 z-50 shadow-xl"
        >
          {/* Mobile Sidebar Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Gamepad2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg text-gray-900">Kheleko</span>
            </div>
            <Button
              onClick={closeMobileSidebar}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </Button>
          </div>

          {/* Mobile Navigation Menu */}
          <nav className="p-4 space-y-2" role="navigation" aria-label="Mobile navigation">
            {tabConfig.map((tab) => (
              <Button
                key={tab.id}
                onClick={() => {
                  setSelectedTab(tab.id);
                  closeMobileSidebar();
                }}
                className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg transition-all duration-200 group focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  selectedTab === tab.id
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                aria-current={selectedTab === tab.id ? 'page' : undefined}
              >
                <tab.icon className={`h-5 w-5 flex-shrink-0 ${
                  selectedTab === tab.id ? 'text-current' : 'text-gray-500 group-hover:text-current'
                }`} aria-hidden="true" />
                <span className="font-medium">{tab.label}</span>
              </Button>
            ))}
          </nav>

          {/* Mobile Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <div className="space-y-2">
              <Button
                onClick={toggleTheme}
                className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              >
                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                <span className="text-sm">Toggle Theme</span>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-64' : 'lg:ml-20'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Top Bar with Mobile Menu Button */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              {/* Mobile Menu Button */}
              <Button
                onClick={openMobileSidebar}
                className="lg:hidden p-2 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>

              {/* Sidebar Toggle Button (Desktop) */}
              <Button
                onClick={toggleSidebar}
                className="hidden lg:flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                title={`${sidebarExpanded ? 'Collapse' : 'Expand'} sidebar`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarExpanded ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  )}
                </svg>
                <span className="text-sm font-medium">
                  {sidebarExpanded ? 'Collapse' : 'Expand'}
                </span>
              </Button>

              {/* Welcome Section */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welcome back, {user?.full_name || 'Player'}! 👋
                </h2>
                <p className="text-gray-600">Ready for your next tournament adventure?</p>
                
                {/* Debug Info */}
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
                  <div>Sidebar: {sidebarExpanded ? 'Expanded (w-64)' : 'Collapsed (w-20)'}</div>
                  <div>Current Tab: {selectedTab}</div>
                  <div>Click the blue "Collapse/Expand" button to test</div>
                </div>
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Network Status */}
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isOnline ? '🟢' : '🔴'}
              </div>
              
              {/* Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
                className="p-2"
                title="Refresh data"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>

              {/* Notifications */}
              <Button
                variant="outline"
                size="sm"
                className="p-2 relative"
                title="Notifications"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              </Button>
            </div>
          </div>

          {/* Content Based on Selected Tab */}
          <AnimatePresence mode="wait">
            {selectedTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {statsCards.map((stat, index) => (
                    <motion.div
                      key={stat.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg ${stat.color} grid place-items-center`}>
                            <stat.icon className="h-6 w-6 text-white" />
                          </div>
                          <span className="text-xs text-gray-500">{stat.trend}</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</h3>
                        <p className="text-sm text-gray-600">{stat.title}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      onClick={() => setSelectedTab('tournaments')}
                      className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-blue-100 rounded-lg grid place-items-center mr-3 group-hover:bg-blue-200 transition-colors">
                        <Trophy className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Browse Tournaments</h4>
                        <p className="text-sm text-gray-500">Find your next challenge</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-blue-600 transition-colors" />
                    </Button>

                    <Button 
                      onClick={() => setSelectedTab('my-tournaments')}
                      className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-lg grid place-items-center mr-3 group-hover:bg-green-200 transition-colors">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">My Tournaments</h4>
                        <p className="text-sm text-gray-500">View your registrations</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-green-600 transition-colors" />
                    </Button>

                    <Button 
                      onClick={() => setSelectedTab('achievements')}
                      className="flex items-center p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-lg grid place-items-center mr-3 group-hover:bg-purple-200 transition-colors">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900">Achievements</h4>
                        <p className="text-sm text-gray-500">Track your progress</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 ml-auto group-hover:text-purple-600 transition-colors" />
                    </Button>
                  </div>
                  
                  {/* Test Button */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button 
                      onClick={testTournamentBrowsing}
                      className="flex items-center p-3 rounded-lg border border-orange-300 hover:border-orange-400 hover:bg-orange-50 transition-all group cursor-pointer mx-auto mb-3"
                    >
                      <div className="w-8 h-8 bg-orange-100 rounded-lg grid place-items-center mr-3 group-hover:bg-orange-200 transition-colors">
                        <Settings className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 text-sm">🧪 Test Tournament Browsing</h4>
                        <p className="text-xs text-gray-500">Check console for results</p>
                      </div>
                    </Button>
                    
                    <Button 
                      onClick={testDatabaseConnection}
                      className="flex items-center p-3 rounded-lg border border-red-300 hover:border-red-400 hover:bg-red-50 transition-all group cursor-pointer mx-auto"
                    >
                      <div className="w-8 h-8 bg-red-100 rounded-lg grid place-items-center mr-3 group-hover:bg-red-200 transition-colors">
                        <Settings className="h-4 w-4 text-red-600" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-medium text-gray-900 text-sm">🔍 Test Database Connection</h4>
                        <p className="text-xs text-gray-500">Deep database diagnostics</p>
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Enhanced Notifications */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="font-medium text-blue-900">Tournament Reminder</div>
                        <div className="text-sm text-blue-700">Summer Football Championship starts in 2 hours</div>
                      </div>
                      <Button 
                        onClick={() => setSelectedTab('my-tournaments')}
                        className="text-blue-600 text-sm hover:text-blue-800"
                      >
                        View
                      </Button>
                    </div>
                    
                    <div className="flex items-center p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="font-medium text-green-900">Achievement Unlocked</div>
                        <div className="text-sm text-green-700">You've earned "First Victory" achievement!</div>
                      </div>
                      <Button 
                        onClick={() => setSelectedTab('achievements')}
                        className="text-green-600 text-sm hover:text-green-800"
                      >
                        View
                      </Button>
                    </div>
                    
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="font-medium text-purple-900">Team Invitation</div>
                        <div className="text-sm text-purple-700">Phoenix Rising invited you to join their team</div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => handleTeamInvitation('1', 'accept')}
                          className="text-green-600 text-sm hover:text-green-800"
                        >
                          Accept
                        </Button>
                        <Button 
                          onClick={() => handleTeamInvitation('1', 'decline')}
                          className="text-red-600 text-sm hover:text-red-800"
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                      <div className="flex-1">
                        <div className="font-medium text-yellow-900">Match Update</div>
                        <div className="text-sm text-yellow-700">Your match vs Team Alpha has been rescheduled</div>
                      </div>
                      <Button 
                        onClick={() => setSelectedTab('performance')}
                        className="text-yellow-600 text-sm hover:text-yellow-800"
                      >
                        Details
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Trophy className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">You won</span> Summer Football Championship
                        </div>
                        <div className="text-xs text-gray-500">2 hours ago</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">You joined</span> Elite Ballers team
                        </div>
                        <div className="text-xs text-gray-500">1 day ago</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <Award className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Achievement unlocked:</span> First Victory
                        </div>
                        <div className="text-xs text-gray-500">2 days ago</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                      <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">
                          <span className="font-medium">Registered for</span> Basketball Pro League
                        </div>
                        <div className="text-xs text-gray-500">3 days ago</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'tournaments' && (
              <motion.div
                key="tournaments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Search and Filters */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search tournaments..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <select
                        value={filterSport}
                        onChange={(e) => setFilterSport(e.target.value)}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">All Sports</option>
                        <option value="Football">Football</option>
                        <option value="Basketball">Basketball</option>
                        <option value="Cricket">Cricket</option>
                        <option value="Tennis">Tennis</option>
                        <option value="Badminton">Badminton</option>
                      </select>
                      
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as 'date' | 'name' | 'participants')}
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="date">Sort by Date</option>
                        <option value="name">Sort by Name</option>
                        <option value="participants">Sort by Participants</option>
                      </select>
                      
                      <div className="flex border border-gray-300 rounded-lg">
                        <Button
                          onClick={() => setViewMode('grid')}
                          className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'} border-r border-gray-300 rounded-l-lg hover:bg-blue-50 transition-colors`}
                        >
                          <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => setViewMode('list')}
                          className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'} rounded-r-lg hover:bg-blue-50 transition-colors`}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tournaments Grid/List */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Available Tournaments ({filteredTournaments.length})
                    </h3>
                    <div className="text-sm text-gray-600">
                      Showing {filteredTournaments.length} of {availableTournaments.length} tournaments
                    </div>
                  </div>
                  
                  {filteredTournaments.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No tournaments found</h3>
                      <p className="text-gray-600 mb-4">
                        {searchQuery || filterSport !== 'all' 
                          ? 'Try adjusting your search or filters'
                          : 'No tournaments are currently available'
                        }
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button
                          onClick={() => {
                            setSearchQuery('');
                            setFilterSport('all');
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Clear Filters
                        </Button>
                        <Button
                          onClick={() => setSelectedTab('overview')}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Back to Overview
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
                      {filteredTournaments.map((tournament) => (
                        <div
                          key={tournament.id}
                          className={`border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${
                            viewMode === 'list' ? 'flex items-center space-x-4 p-4' : 'p-4'
                          }`}
                        >
                          {/* Tournament Image */}
                          <div className={`${viewMode === 'list' ? 'w-20 h-20 flex-shrink-0' : 'w-full h-32 mb-4'}`}>
                            {tournament.images && tournament.images.length > 0 ? (
                              <img
                                src={tournament.images[0]}
                                alt={tournament.name}
                                className={`w-full h-full object-cover rounded-lg`}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className={`w-full h-full bg-gray-200 rounded-lg flex items-center justify-center text-4xl`}>
                                {getTournamentImage(tournament)}
                              </div>
                            )}
                          </div>
                          
                          {/* Tournament Details */}
                          <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                            <h3 className="font-semibold text-gray-900 mb-2 text-lg">{tournament.name}</h3>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center">
                                <Trophy className="h-4 w-4 mr-2 text-yellow-500 flex-shrink-0" />
                                <span>{tournament.sport_type}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <MapPin className="h-4 w-4 mr-2 text-red-500 flex-shrink-0" />
                                <span className="truncate">{tournament.facility_name}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0" />
                                <span>{new Date(tournament.start_date).toLocaleDateString()}</span>
                              </div>
                              
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-2 text-green-500 flex-shrink-0" />
                                <span>{tournament.current_participants}/{tournament.max_participants} participants</span>
                              </div>
                              
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-2 text-purple-500 flex-shrink-0" />
                                <span>रू {tournament.entry_fee}</span>
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="mt-3">
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                tournament.status === 'approved' ? 'bg-green-100 text-green-800' :
                                tournament.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                tournament.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
                              </span>
                            </div>
                            
                            {/* Action Button */}
                            <div className="mt-4">
                              <Button
                                onClick={() => handleTournamentDetails(tournament)}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                              >
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedTab === 'my-tournaments' && (
              <motion.div
                key="my-tournaments"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">My Tournament Registrations</h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                      {playerRegistrations.length} tournament{playerRegistrations.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  {/* Conditional Content */}
                  {playerRegistrations.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">No tournaments yet</h4>
                      <p className="text-gray-600 mb-4">Start by browsing available tournaments</p>
                      <Button onClick={() => setSelectedTab('tournaments')} className="bg-blue-600 hover:bg-blue-700">
                        Browse Tournaments
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {playerRegistrations.map((registration) => (
                        <div key={registration.id} className="bg-gray-50 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all overflow-hidden">
                          {/* Tournament Header with Image */}
                          <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50 overflow-hidden">
                            {/* Image or Emoji */}
                            {registration.tournament_image && (
                              registration.tournament_image.startsWith('http') || 
                              registration.tournament_image.startsWith('/') ||
                              registration.tournament_image.includes('.jpg') ||
                              registration.tournament_image.includes('.jpeg') ||
                              registration.tournament_image.includes('.png') ||
                              registration.tournament_image.includes('.webp')
                            ) ? (
                              <img 
                                src={registration.tournament_image} 
                                alt={registration.tournament_name || 'Tournament'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <div className="text-5xl">
                                  {getTournamentImage({ sport_type: registration.tournament_sport_type || 'Sport' } as any)}
                                </div>
                              </div>
                            )}
                            
                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                                registration.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200' :
                                registration.status === 'rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                'bg-yellow-100 text-yellow-800 border border-yellow-200'
                              }`}>
                                {registration.status === 'confirmed' ? '✅ Confirmed' :
                                 registration.status === 'rejected' ? '❌ Rejected' :
                                 '⏳ Pending Review'}
                              </span>
                            </div>
                            
                            {/* Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          </div>

                          {/* Tournament Content */}
                          <div className="p-6">
                            {/* Tournament Header */}
                            <div className="mb-4">
                              <h4 className="font-semibold text-gray-900 text-lg mb-1">
                                {registration.tournament_name || 'Tournament Name'}
                              </h4>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <Trophy className="h-4 w-4 text-blue-500" />
                                <span className="font-medium">{registration.tournament_sport_type || 'Sport Type'}</span>
                                <span className="text-gray-400">•</span>
                                <span>{registration.tournament_facility_name || 'Location not set'}</span>
                              </div>
                            </div>

                            {/* Tournament Details */}
                            <div className="space-y-3 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <Calendar className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-700">Start Date</div>
                                  <div className="truncate">
                                    {registration.tournament_start_date ? 
                                      new Date(registration.tournament_start_date).toLocaleDateString() : 
                                      'Date not set'
                                    }
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-700">Location</div>
                                  <div className="truncate">
                                    {registration.tournament_facility_name || 'Location not set'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <DollarSign className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-700">Entry Fee</div>
                                  <div className="truncate">रू {registration.tournament_entry_fee || '0'}</div>
                                </div>
                              </div>
                              <div className="flex items-center text-sm text-gray-600">
                                <Clock className="h-4 w-4 mr-3 text-gray-400 flex-shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-medium text-gray-700">Registered</div>
                                  <div className="truncate">
                                    {registration.registration_date ? 
                                      new Date(registration.registration_date).toLocaleDateString() : 
                                      'Date not set'
                                    }
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex space-x-3">
                              <Button 
                                onClick={() => {
                                  if (registration.tournament_id) {
                                    window.location.href = `/tournament/${registration.tournament_id}`;
                                  } else {
                                    alert('Tournament details not available');
                                  }
                                }}
                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                View Tournament
                              </Button>
                              <Button 
                                variant="outline"
                                className="px-4"
                                onClick={() => {
                                  const details = `
Tournament: ${registration.tournament_name || 'Tournament'}
Sport: ${registration.tournament_sport_type || 'Sport Type'}
Status: ${registration.status}
Location: ${registration.tournament_facility_name || 'Location not set'}
Start Date: ${registration.tournament_start_date ? new Date(registration.tournament_start_date).toLocaleDateString() : 'Not set'}
Entry Fee: रू ${registration.tournament_entry_fee || '0'}
Registration Date: ${registration.registration_date ? new Date(registration.registration_date).toLocaleDateString() : 'Not set'}
                                  `;
                                  alert(details);
                                }}
                              >
                                <MessageCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {selectedTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat & Communication</h3>
                  
                  {/* Chat Overview */}
                  <div className="mb-6">
                    <p className="text-gray-600 mb-4">Stay connected with tournament organizers and other players</p>
                  </div>
                  
                  {/* Tournament Chats */}
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Your Tournament Chats</h4>
                    {playerRegistrations.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <p className="text-gray-600 mb-3">No tournament chats available</p>
                        <p className="text-sm text-gray-500">Join tournaments to start chatting</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {playerRegistrations.slice(0, 3).map((registration) => (
                          <div 
                            key={registration.id} 
                            className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all cursor-pointer"
                            onClick={() => openTournamentChat(registration.tournament_id, registration.tournament_name)}
                          >
                            <div className="w-10 h-10 bg-blue-100 rounded-lg grid place-items-center mr-3">
                              <Trophy className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-gray-900">
                                  {registration.tournament_name || 'Tournament'}
                                </span>
                                <span className="text-xs text-gray-500 bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  {registration.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600">
                                {registration.tournament_sport_type || 'Sport'} • {registration.tournament_facility_name || 'Location'}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              className="ml-3 bg-blue-600 hover:bg-blue-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                openTournamentChat(registration.tournament_id, registration.tournament_name);
                              }}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Chat
                            </Button>
                          </div>
                        ))}
                        
                        {playerRegistrations.length > 3 && (
                          <div className="text-center py-3">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedTab('my-tournaments')}
                            >
                              View All ({playerRegistrations.length} tournaments)
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-green-300 transition-colors">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg grid place-items-center mr-3">
                          <MessageSquare className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Browse Tournaments</h4>
                          <p className="text-sm text-gray-500">Find new tournaments</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">Discover tournaments and join their chat rooms</p>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => setSelectedTab('tournaments')}
                      >
                        Browse Now
                      </Button>
                    </div>
                    
                    <div className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors">
                      <div className="flex items-center mb-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg grid place-items-center mr-3">
                          <Users className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">My Tournaments</h4>
                          <p className="text-sm text-gray-500">Manage registrations</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">View all your tournament registrations and chats</p>
                      <Button 
                        className="w-full bg-purple-600 hover:bg-purple-700"
                        onClick={() => setSelectedTab('my-tournaments')}
                      >
                        View All
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'performance' && (
              <motion.div
                key="performance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Win Rate</h3>
                    <div className="text-3xl font-bold text-green-600">{performanceData.winRate}%</div>
                    <div className="text-sm text-gray-600">Last 30 days</div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Total Matches</h3>
                    <div className="text-3xl font-bold text-blue-600">{performanceData.totalMatches}</div>
                    <div className="text-sm text-gray-600">All time</div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Goals Scored</h3>
                    <div className="text-3xl font-bold text-purple-600">{performanceData.goalsScored}</div>
                    <div className="text-sm text-gray-600">This season</div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Player Rating</h3>
                    <div className="text-3xl font-bold text-yellow-600">{playerRating}</div>
                    <div className="text-sm text-gray-600">Current rating</div>
                  </div>
                </div>

                {/* Detailed Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Match Results</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Wins</span>
                        <span className="font-semibold text-green-600">{performanceData.wins}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Losses</span>
                        <span className="font-semibold text-red-600">{performanceData.losses}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Draws</span>
                        <span className="font-semibold text-gray-600">{performanceData.draws}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Assists</span>
                        <span className="font-semibold text-blue-600">{performanceData.assists}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Clean Sheets</span>
                        <span className="font-semibold text-green-600">{performanceData.cleanSheets}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Cards</span>
                        <span className="font-semibold text-yellow-600">{performanceData.yellowCards + performanceData.redCards}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Match History */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Recent Matches</h3>
                  <div className="space-y-3">
                    {matchHistory.map((match) => (
                      <div key={match.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                            match.result === 'W' ? 'bg-green-500' : 
                            match.result === 'L' ? 'bg-red-500' : 'bg-gray-500'
                          }`}>
                            {match.result}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{match.tournament}</div>
                            <div className="text-sm text-gray-600">vs {match.opponent}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{match.score}</div>
                          <div className="text-sm text-gray-600">{match.date}</div>
                          <div className="text-xs text-gray-500">Rating: {match.rating}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'teams' && (
              <motion.div
                key="teams"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <PlayerTeamManagement />
              </motion.div>
            )}

            {selectedTab === 'community' && (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Friends */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">My Connections</h3>
                    <Button 
                      onClick={() => alert('Friend request feature coming soon!')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Friend
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {communityData.friends.map((friend) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className={`w-3 h-3 rounded-full ${
                            friend.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                          }`}></div>
                          <div>
                            <div className="font-medium text-gray-900">{friend.name}</div>
                            <div className="text-sm text-gray-600">{friend.sport}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">{friend.lastActive}</div>
                          <Button size="sm" variant="outline">
                            Message
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activities */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                  <div className="space-y-3">
                    {communityData.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          {activity.action === 'won' && <Trophy className="h-4 w-4 text-blue-600" />}
                          {activity.action === 'joined' && <Users className="h-4 w-4 text-blue-600" />}
                          {activity.action === 'achieved' && <Award className="h-4 w-4 text-blue-600" />}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-900">
                            <span className="font-medium">{activity.player}</span>
                            {' '}{activity.action === 'won' && 'won'}
                            {' '}{activity.action === 'joined' && 'joined'}
                            {' '}{activity.action === 'achieved' && 'achieved'}
                            {' '}{activity.tournament || activity.team || activity.achievement}
                          </div>
                          <div className="text-xs text-gray-500">{activity.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'achievements' && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Achievement Progress Overview */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievement Progress</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {mockAchievements.filter(a => a.earned_date).length}
                      </div>
                      <div className="text-sm text-blue-700">Achievements Earned</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(mockAchievements.reduce((acc, a) => acc + (a.progress / a.total * 100), 0) / mockAchievements.length)}%
                      </div>
                      <div className="text-sm text-green-700">Overall Progress</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {mockAchievements.length}
                      </div>
                      <div className="text-sm text-purple-700">Total Achievements</div>
                    </div>
                  </div>
                </div>

                {/* All Achievements */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">All Achievements</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mockAchievements.map((achievement) => (
                      <div key={achievement.id} className={`text-center p-6 rounded-lg border transition-colors ${
                        achievement.earned_date 
                          ? 'border-yellow-300 bg-yellow-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="text-4xl mb-3">{achievement.icon}</div>
                        <h4 className="font-medium text-gray-900 mb-2">{achievement.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                        
                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                achievement.earned_date ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${achievement.progress / achievement.total * 100}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {achievement.progress}/{achievement.total}
                          </div>
                        </div>
                        
                        {achievement.earned_date ? (
                          <div className="text-xs text-yellow-700 font-medium">
                            ✅ Earned {achievement.earned_date}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500">
                            {Math.round(achievement.progress / achievement.total * 100)}% Complete
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {selectedTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <PlayerProfile />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Team Creation Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Create New Team</h3>
              <Button 
                onClick={() => setShowTeamModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Team Name</label>
                <input 
                  type="text" 
                  placeholder="Enter team name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sport</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="">Select sport</option>
                  <option value="Football">Football</option>
                  <option value="Basketball">Basketball</option>
                  <option value="Cricket">Cricket</option>
                  <option value="Tennis">Tennis</option>
                  <option value="Badminton">Badminton</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Max Members</label>
                <input 
                  type="number" 
                  min="2" 
                  max="50"
                  placeholder="Enter max members"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea 
                  placeholder="Enter team description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                ></textarea>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <Button 
                onClick={() => setShowTeamModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  // Handle team creation
                  setShowTeamModal(false);
                  // Add success notification
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Team
              </Button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};











