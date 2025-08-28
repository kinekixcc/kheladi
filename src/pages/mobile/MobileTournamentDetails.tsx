import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Trophy,
  Phone,
  Mail,
  FileText,
  Share2,
  Heart,
  QrCode,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { useAuth } from '../../context/AuthContext';
import { tournamentService } from '../../lib/database';
import { QRCodeScanner } from '../../components/mobile/QRCodeScanner';
import toast from 'react-hot-toast';

export const MobileTournamentDetails: React.FC = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tournament, setTournament] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (tournamentId) {
      loadTournament();
    }
  }, [tournamentId]);

  const loadTournament = async () => {
    try {
      const data = await tournamentService.getTournamentById(tournamentId!);
      setTournament(data);
    } catch (error) {
      console.error('Error loading tournament:', error);
      toast.error('Failed to load tournament');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScan = (data: string) => {
    // Handle QR code data
    console.log('QR Code scanned:', data);
    toast.success('QR Code scanned successfully!');
    
    // Parse tournament ID from QR data
    if (data.startsWith('tournament:')) {
      const scannedTournamentId = data.split(':')[1];
      // Navigate to scanned tournament or show info
      toast.success(`Scanned tournament: ${scannedTournamentId}`);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tournament.name,
          text: tournament.description,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'active':
        return <Trophy className="w-5 h-5 text-blue-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tournament...</p>
        </div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Tournament not found</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      <div className="relative h-64 bg-gradient-to-br from-blue-600 to-purple-700">
        {tournament.images && tournament.images.length > 0 ? (
          <img
            src={tournament.images[0]}
            alt={tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Trophy className="w-24 h-24 text-white opacity-50" />
          </div>
        )}
        
        {/* Header Actions */}
        <div className="absolute top-4 left-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 touch-target"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </div>
        
        <div className="absolute top-4 right-4 flex space-x-2">
          <Button
            variant="ghost"
            onClick={() => setIsFavorite(!isFavorite)}
            className={`bg-black bg-opacity-50 hover:bg-black hover:bg-opacity-70 touch-target ${
              isFavorite ? 'text-red-500' : 'text-white'
            }`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
          </Button>
          <Button
            variant="ghost"
            onClick={handleShare}
            className="bg-black bg-opacity-50 text-white hover:bg-black hover:bg-opacity-70 touch-target"
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>

        {/* Tournament Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
          <h1 className="text-2xl font-bold text-white mb-1">{tournament.name}</h1>
          <div className="flex items-center space-x-2">
            <span className="text-white text-sm opacity-90">{tournament.sport_type}</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tournament.status)}`}>
              {tournament.status.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="flex space-x-3">
          <Button
            onClick={() => navigate(`/tournament/${tournament.id}/register`)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 touch-target"
          >
            Register Now
          </Button>
          <Button
            onClick={() => setShowQRScanner(true)}
            variant="outline"
            className="px-4 touch-target"
          >
            <QrCode className="w-5 h-5" />
          </Button>
        </div>

        {/* Tournament Info Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 text-center">
            <Calendar className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Start Date</p>
            <p className="font-semibold text-gray-900">
              {new Date(tournament.start_date).toLocaleDateString()}
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <MapPin className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Venue</p>
            <p className="font-semibold text-gray-900 truncate">
              {tournament.venue_name}
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <Users className="w-6 h-6 text-purple-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Teams</p>
            <p className="font-semibold text-gray-900">
              {tournament.current_teams || 0}/{tournament.max_teams || 0}
            </p>
          </Card>
          
          <Card className="p-4 text-center">
            <DollarSign className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Entry Fee</p>
            <p className="font-semibold text-gray-900">
              रू {tournament.entry_fee?.toLocaleString() || 0}
            </p>
          </Card>
        </div>

        {/* Description */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Description</h3>
          <p className="text-gray-700 leading-relaxed">{tournament.description}</p>
        </Card>

        {/* Rules & Requirements */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-blue-600" />
              Rules
            </h3>
            <p className="text-gray-700 leading-relaxed">{tournament.rules}</p>
          </Card>
          
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Users className="w-5 h-5 mr-2 text-green-600" />
              Requirements
            </h3>
            <p className="text-gray-700 leading-relaxed">{tournament.requirements}</p>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Contact Information</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">{tournament.contact_phone}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">{tournament.contact_email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">{tournament.venue_address}</span>
            </div>
          </div>
        </Card>

        {/* Additional Actions */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate(`/tournament/${tournament.id}/chat`)}
            variant="outline"
            className="w-full touch-target"
          >
            <Users className="w-5 h-5 mr-2" />
            Join Tournament Chat
          </Button>
          
          <Button
            onClick={() => navigate(`/tournament-map`)}
            variant="outline"
            className="w-full touch-target"
          >
            <MapPin className="w-5 h-5 mr-2" />
            View on Map
          </Button>
        </div>
      </div>

      {/* QR Code Scanner Modal */}
      <QRCodeScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </div>
  );
};







