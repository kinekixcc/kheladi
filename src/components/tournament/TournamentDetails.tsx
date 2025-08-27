import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  Trophy, 
  DollarSign, 
  Phone, 
  Mail, 
  FileText,
  UserPlus,
  Share2,
  Eye,
  Clock
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { tournamentService } from '../../lib/database';
import { Tournament } from '../../types';
import toast from 'react-hot-toast';
import { tournamentUtils } from '../../utils/tournamentUtils';

export const TournamentDetails: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'bracket' | 'participants' | 'chat'>('overview');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadTournamentDetails();
    }
  }, [tournamentId]);

  useEffect(() => {
    // Listen for tournament deletion events
    const handleTournamentDeleted = () => {
      toast.error('This tournament has been deleted');
      navigate('/tournament-map');
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
          console.error('Failed to load tournament:', error);
          toast.error('Failed to load tournament details');
          navigate('/tournament-map');
        } finally {
          setLoading(false);
        }
      };
      
      loadTournament();
    } catch (error) {
      console.error('Error in loadTournamentDetails:', error);
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!tournament) return null;
    
    const status = tournamentUtils.getTournamentStatus(tournament);
    return (
      <span className={`px-3 py-1 ${status.color} text-sm rounded-full`}>
        {status.label}
      </span>
    );
  };

  const canRegister = () => {
    if (!tournament || !user) return false;
    
    const result = tournamentUtils.canUserRegister(tournament, user, isRegistered);
    return result.canRegister;
  };

  const handleRegister = () => {
    navigate(`/tournament/${tournamentId}/register`);
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: tournament?.name || 'Tournament',
        text: `Check out this ${tournament?.sport_type} tournament!`,
        url: window.location.href
      });
    } catch (error) {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
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
          <p className="text-gray-600">Tournament not found</p>
          <Button onClick={() => navigate('/tournament-map')} className="mt-4">
            Back to Tournaments
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/tournament-map')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{tournament.name}</h1>
                <p className="text-gray-600">{tournament.sport_type} Tournament</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {getStatusBadge()}
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              {canRegister() && (
                <Button onClick={handleRegister} className="flex items-center">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Register Now
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tournament Description */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">About This Tournament</h2>
              <p className="text-gray-700 leading-relaxed">{tournament.description}</p>
            </Card>

            {/* Tournament Rules & Requirements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-600" />
                  Tournament Rules
                </h3>
                <p className="text-gray-700">{tournament.rules}</p>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-green-600" />
                  Requirements
                </h3>
                <p className="text-gray-700">{tournament.requirements}</p>
              </Card>
            </div>

            {/* Tab Navigation */}
            <Card className="p-6">
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {['overview', 'bracket', 'participants', 'chat'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Tournament Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-5 w-5 mr-3 text-blue-500" />
                        <div>
                          <p className="font-medium">Start Date</p>
                          <p>{new Date(tournament.start_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-5 w-5 mr-3 text-red-500" />
                        <div>
                          <p className="font-medium">End Date</p>
                          <p>{new Date(tournament.end_date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-5 w-5 mr-3 text-orange-500" />
                        <div>
                          <p className="font-medium">Registration Deadline</p>
                          <p>{new Date(tournament.registration_deadline).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="h-5 w-5 mr-3 text-green-500" />
                        <div>
                          <p className="font-medium">Participants</p>
                          <p>{tournament.current_participants}/{tournament.max_participants}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'bracket' && (
                <div className="text-center py-12">
                  <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tournament Bracket</h3>
                  <p className="text-gray-600">Bracket will be available once registration closes</p>
                </div>
              )}

              {activeTab === 'participants' && (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Participants</h3>
                  <p className="text-gray-600">Participant list will be available once registration closes</p>
                </div>
              )}

              {activeTab === 'chat' && (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Tournament Chat</h3>
                  <p className="text-gray-600">Chat will be available once registration closes</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
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

            {/* Venue Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Venue Details</h3>
              <div className="space-y-3">
                <div className="flex items-start text-gray-600">
                  <MapPin className="h-5 w-5 mr-3 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">{tournament.venue_name}</p>
                    <p className="text-sm">{tournament.venue_address}</p>
                    <p className="text-sm">{tournament.district}, {tournament.province}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Contact Information */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Organizer</h3>
              <div className="space-y-3">
                <div className="flex items-center text-gray-600">
                  <Phone className="h-5 w-5 mr-3 text-green-500" />
                  <span>{tournament.contact_phone}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Mail className="h-5 w-5 mr-3 text-blue-500" />
                  <span>{tournament.contact_email}</span>
                </div>
                <div className="flex items-center text-gray-600">
                  <Users className="h-5 w-5 mr-3 text-purple-500" />
                  <span>{tournament.organizer_name}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};