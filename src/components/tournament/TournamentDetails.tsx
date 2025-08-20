import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trophy, 
  Clock, 
  Phone, 
  Mail,
  Share2,
  Heart,
  Flag,
  Download,
  Eye,
  UserPlus,
  Star,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { tournamentService, registrationService } from '../../lib/database';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { TournamentBracket } from './TournamentBracket';
import { TournamentImageDisplay } from './TournamentImageDisplay';
import { Tournament } from '../../types';
import toast from 'react-hot-toast';

export const TournamentDetails: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bracket' | 'participants' | 'teams' | 'chat' | 'invites' | 'rules'>('overview');
  const [isRegistered, setIsRegistered] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTournamentDetails();
    checkRegistrationStatus();
    loadParticipants();
    
    // Listen for tournament deletion
    const handleTournamentDeleted = (event: CustomEvent) => {
      const { tournamentId } = event.detail;
      if (tournamentId === tournamentId) {
        // Tournament was deleted, redirect to tournament map
        navigate('/tournament-map');
        toast.error('This tournament is no longer available');
      }
    };
    
    window.addEventListener('tournamentDeleted', handleTournamentDeleted as EventListener);
    
    return () => {
      window.removeEventListener('tournamentDeleted', handleTournamentDeleted as EventListener);
    };
  }, [tournamentId, user]);

  const loadTournamentDetails = () => {
    try {
      const loadTournament = async () => {
        if (!tournamentId) return;
        
        try {
          const tournamentData = await tournamentService.getTournamentById(tournamentId);
          
          // Check tournament status - only allow access to approved tournaments for players
          if (tournamentData.status === 'pending_approval') {
            if (user?.role === 'organizer' && tournamentData.organizer_id === user.id) {
              // Organizer can see their own pending tournament
              setTournament(tournamentData);
            } else {
              // Players and other users cannot see pending tournaments
              toast.error('This tournament is pending admin approval and is not yet available');
              navigate('/tournament-map');
              return;
            }
          } else if (tournamentData.status === 'rejected') {
            if (user?.role === 'organizer' && tournamentData.organizer_id === user.id) {
              // Organizer can see their own rejected tournament
              setTournament(tournamentData);
            } else {
              // Players and other users cannot see rejected tournaments
              toast.error('This tournament has been rejected and is not available');
              navigate('/tournament-map');
              return;
            }
          } else if (tournamentData.status === 'draft') {
            if (user?.role === 'organizer' && tournamentData.organizer_id === user.id) {
              // Organizer can see their own draft tournament
              setTournament(tournamentData);
            } else {
              // Players and other users cannot see draft tournaments
              toast.error('This tournament is a draft and is not available');
              navigate('/tournament-map');
              return;
            }
          } else {
            // Approved, active, or completed tournaments are visible to all
            setTournament(tournamentData);
          }
        } catch (error) {
          console.error('Error loading tournament:', error);
          toast.error('Tournament not found');
          navigate('/tournament-map');
        } finally {
          setLoading(false);
        }
      };
      
      loadTournament();
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament details');
    }
  };

  const checkRegistrationStatus = () => {
    if (!user?.id || !tournamentId) return;
    
    const checkRegistration = async () => {
      try {
        const isUserRegistered = await registrationService.isPlayerRegistered(tournamentId, user.id);
        setIsRegistered(!!isUserRegistered);
      } catch (error) {
        console.error('Error checking registration status:', error);
      }
    };
    
    checkRegistration();
  };

  const loadParticipants = () => {
    if (!tournamentId) return;
    
    const loadTournamentParticipants = async () => {
      try {
        const registrations = await registrationService.getTournamentRegistrations(tournamentId);
        const confirmedParticipants = registrations.filter(reg => reg.status === 'confirmed');
        setParticipants(confirmedParticipants);
      } catch (error) {
        console.error('Error loading participants:', error);
      }
    };
    
    loadTournamentParticipants();
  };

  const handleRegister = () => {
    if (!user) {
      toast.error('Please login to register for tournaments');
      navigate('/login');
      return;
    }
    
    if (!tournament) return;
    
    // Check if registration is still open
    const registrationDeadline = new Date(tournament.registration_deadline);
    const now = new Date();
    
    if (now > registrationDeadline) {
      toast.error('Registration deadline has passed');
      return;
    }
    
    // Check if tournament is full
    if (tournament.current_participants >= tournament.max_participants) {
      toast.error('Tournament is full');
      return;
    }
    
    navigate(`/tournament/${tournamentId}/register`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament?.name,
          text: `Check out this ${tournament?.sport_type} tournament!`,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const getStatusBadge = () => {
    if (!tournament) return null;
    
    const now = new Date();
    const startDate = new Date(tournament.start_date);
    const endDate = new Date(tournament.end_date);
    const registrationDeadline = new Date(tournament.registration_deadline);
    
    // Reset time to start of day for date comparison
    now.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);
    registrationDeadline.setHours(0, 0, 0, 0);
    
    if (now < registrationDeadline && tournament.current_participants < tournament.max_participants) {
      return <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">Registration Open</span>;
    } else if (now < startDate) {
      return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">Upcoming</span>;
    } else if (now >= startDate && now <= endDate) {
      return <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">In Progress</span>;
    } else {
      return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">Completed</span>;
    }
  };

  const canRegister = () => {
    if (!tournament || !user) return false;
    if (isRegistered) return false;
    
    const now = new Date();
    const registrationDeadline = new Date(tournament.registration_deadline);
    
    // Reset time to start of day for date comparison
    now.setHours(0, 0, 0, 0);
    registrationDeadline.setHours(0, 0, 0, 0);
    
    return now < registrationDeadline && tournament.current_participants < tournament.max_participants;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament details...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Tournament Not Found</h2>
          <p className="text-gray-600 mb-4">The tournament you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/tournament-map')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
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
          <Button
            variant="ghost"
            onClick={() => navigate('/tournament-map')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournaments
          </Button>
        </motion.div>

        {/* Tournament Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="p-8">
            {/* Tournament Images */}
            {((tournament as any).images?.length > 0) && (
              <div className="mb-6">
                <TournamentImageDisplay
                  images={(tournament as any).images}
                  tournamentName={tournament.name}
                  className="max-w-2xl"
                />
              </div>
            )}
            
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{tournament.name}</h1>
                    <p className="text-lg text-gray-600">{tournament.sport_type} Tournament</p>
                  </div>
                  {getStatusBadge()}
                </div>
                
                {/* Approval Status for Organizers */}
                {user?.role === 'organizer' && tournament.organizer_id === user.id && (
                  <div className="mb-4">
                    {tournament.status === 'pending_approval' && (
                      <div className="inline-flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 text-sm rounded-lg border border-yellow-300">
                        <Clock className="h-4 w-4 mr-2" />
                        Pending Admin Approval
                      </div>
                    )}
                    {tournament.status === 'rejected' && (
                      <div className="inline-flex items-center px-3 py-2 bg-red-100 text-red-800 text-sm rounded-lg border border-red-300">
                        <Flag className="h-4 w-4 mr-2" />
                        Rejected by Admin
                        {tournament.admin_notes && (
                          <span className="ml-2 text-xs">({tournament.admin_notes})</span>
                        )}
                      </div>
                    )}
                    {tournament.status === 'approved' && (
                      <div className="inline-flex items-center px-3 py-2 bg-green-100 text-green-800 text-sm rounded-lg border border-green-300">
                        <Trophy className="h-4 w-4 mr-2" />
                        Approved by Admin
                      </div>
                    )}
                    {tournament.status === 'draft' && (
                      <div className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-800 text-sm rounded-lg border border-gray-300">
                        <Eye className="h-4 w-4 mr-2" />
                        Draft Mode
                      </div>
                    )}
                  </div>
                )}
                
                <p className="text-gray-700 mb-6 max-w-3xl">{tournament.description}</p>
                
                {/* Key Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Tournament Dates</p>
                      <p className="font-semibold">{tournament.start_date} - {tournament.end_date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="text-sm text-gray-600">Venue</p>
                      <p className="font-semibold">{tournament.facility_name}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Participants</p>
                      <p className="font-semibold">{tournament.current_participants}/{tournament.max_participants}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="text-sm text-gray-600">Entry Fee</p>
                      <p className="font-semibold">रू {tournament.entry_fee}</p>
                    </div>
                  </div>
                </div>
                
                {/* Registration Deadline */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-semibold text-orange-800">Registration Deadline</p>
                      <p className="text-orange-700">{tournament.registration_deadline}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="lg:ml-8 mt-6 lg:mt-0">
                <div className="flex flex-col space-y-3 min-w-[200px]">
                  {canRegister() ? (
                    <Button
                      size="lg"
                      onClick={handleRegister}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <UserPlus className="h-5 w-5 mr-2" />
                      Register Now
                    </Button>
                  ) : isRegistered ? (
                    <Button
                      size="lg"
                      disabled
                      className="bg-blue-600 text-white cursor-not-allowed"
                    >
                      <Trophy className="h-5 w-5 mr-2" />
                      Already Registered
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      disabled
                      className="bg-gray-400 text-white cursor-not-allowed"
                    >
                      Registration Closed
                    </Button>
                  )}
                  
                  <Button variant="outline" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Tournament
                  </Button>
                  
                  <Button variant="outline">
                    <Heart className="h-4 w-4 mr-2" />
                    Add to Favorites
                  </Button>
                </div>
                
                {/* Prize Pool */}
                <Card className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                  <div className="text-center">
                    <Trophy className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Total Prize Pool</p>
                    <p className="text-2xl font-bold text-yellow-600">रू {tournament.prize_pool.toLocaleString()}</p>
                  </div>
                </Card>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: <Eye className="h-4 w-4" /> },
                { id: 'bracket', label: 'Tournament Bracket', icon: <Trophy className="h-4 w-4" /> },
                { id: 'participants', label: 'Participants', icon: <Users className="h-4 w-4" /> },
                { id: 'teams', label: 'Teams', icon: <Users className="h-4 w-4" /> },
                { id: 'chat', label: 'Chat', icon: <MessageCircle className="h-4 w-4" /> },
                { id: 'invites', label: 'Invites', icon: <UserPlus className="h-4 w-4" /> },
                { id: 'rules', label: 'Rules & Info', icon: <Flag className="h-4 w-4" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </motion.div>

        {/* Tab Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Tournament Info */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Tournament Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Format</h4>
                      <p className="text-gray-600">{(tournament as any).tournament_type?.replace('_', ' ') || 'Single Elimination'}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Sport</h4>
                      <p className="text-gray-600">{tournament.sport_type}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Max Participants</h4>
                      <p className="text-gray-600">{tournament.max_participants}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Current Registrations</h4>
                      <p className="text-gray-600">{tournament.current_participants}</p>
                    </div>
                  </div>
                </Card>

                {/* Venue Details */}
                <Card className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Venue Details</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Location</h4>
                      <p className="text-gray-600">{tournament.facility_name}</p>
                      {(tournament as any).venue_address && (
                        <p className="text-sm text-gray-500 mt-1">{(tournament as any).venue_address}</p>
                      )}
                    </div>
                    {(tournament as any).latitude && (tournament as any).longitude && (
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://www.google.com/maps?q=${(tournament as any).latitude},${(tournament as any).longitude}`, '_blank')}
                        >
                          <MapPin className="h-4 w-4 mr-2" />
                          View on Map
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Organizer Info */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizer</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-gray-900">{tournament.organizer_name}</p>
                    </div>
                    {(tournament as any).contact_phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{(tournament as any).contact_phone}</span>
                      </div>
                    )}
                    {(tournament as any).contact_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{(tournament as any).contact_email}</span>
                      </div>
                    )}
                    <Button variant="outline" size="sm" className="w-full">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Contact Organizer
                    </Button>
                  </div>
                </Card>

                {/* Quick Stats */}
                <Card className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Entry Fee</span>
                      <span className="font-medium">रू {tournament.entry_fee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prize Pool</span>
                      <span className="font-medium">रू {tournament.prize_pool.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Spots Left</span>
                      <span className="font-medium">{tournament.max_participants - tournament.current_participants}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-gray-600">Status</span>
                      {getStatusBadge()}
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'bracket' && (
            <TournamentBracket
              tournament={tournament}
              matches={[]} // This would come from the database
              isOrganizer={user?.id === tournament.organizer_id}
            />
          )}

          {activeTab === 'participants' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Registered Participants ({participants.length})
                </h3>
                {user?.id === tournament.organizer_id && (
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Export List
                  </Button>
                )}
              </div>
              
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No participants registered yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {participants.map((participant, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="font-semibold text-blue-600">
                            {participant.player_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{participant.player_name}</p>
                          <p className="text-sm text-gray-600">{participant.experience_level}</p>
                          {participant.team_name && (
                            <p className="text-xs text-gray-500">Team: {participant.team_name}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'teams' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Tournament Teams</h3>
                {user && (
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                )}
              </div>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Team management coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">Create and join teams for this tournament</p>
              </div>
            </Card>
          )}

          {activeTab === 'chat' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Tournament Chat</h3>
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Real-time chat</span>
                </div>
              </div>
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Chat functionality coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">Connect with other participants in real-time</p>
              </div>
            </Card>
          )}

          {activeTab === 'invites' && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Match Invites</h3>
                {user && (
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Send Invite
                  </Button>
                )}
              </div>
              <div className="text-center py-8">
                <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Match invites coming soon!</p>
                <p className="text-sm text-gray-500 mt-2">Send and receive match invitations</p>
              </div>
            </Card>
          )}

          {activeTab === 'rules' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Tournament Rules</h3>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {tournament.rules}
                  </div>
                </div>
              </Card>
              
              <Card className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h3>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700">
                    {tournament.requirements}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};