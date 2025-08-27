import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, Info, CreditCard, QrCode, User, CheckCircle, Upload, FileText, X, Trophy, Building2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { imageUploadService } from '../lib/imageUpload';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface PlayerRegistrationData {
  tournament_name: string;
  entry_fee: number;
  platform_fee: number;
  total_amount: number;
  player_name: string;
  tournament_data: any;
  registration_data: any;
}

export const PlayerRegistrationPayment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'esewa' | 'qr_code' | 'bank_transfer'>('qr_code');
  const [registrationData, setRegistrationData] = useState<PlayerRegistrationData | null>(null);
  
  // Payment proof state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState(false);

  useEffect(() => {
    // Get registration data from localStorage (set by TournamentRegistration)
    const storedData = localStorage.getItem('pending_player_registration');
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData);
        console.log('🔍 PlayerRegistrationPayment: Loaded data from localStorage:', parsed);
        
        // Validate required fields
        if (!parsed.tournament_name || !parsed.entry_fee || !parsed.tournament_data || !parsed.registration_data) {
          throw new Error('Missing required registration data');
        }
        
        setRegistrationData(parsed);
      } catch (error) {
        console.error('Failed to parse registration data:', error);
        toast.error('Invalid registration data. Please try registering again.');
        navigate('/tournament-map');
      }
    } else {
      toast.error('No registration data found. Please register for a tournament first.');
      navigate('/tournament-map');
    }
  }, [navigate]);

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading registration details...</p>
        </div>
      </div>
    );
  }

  if (showReceipt) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
            <p className="text-gray-600 mb-6">
              Your tournament registration has been completed successfully.
            </p>
            <div className="space-y-3 mb-6 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Tournament:</span>
                <span className="font-medium">{registrationData.tournament_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Player:</span>
                <span className="font-medium">{registrationData.player_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Amount:</span>
                <span className="font-medium">रू {registrationData.total_amount}</span>
              </div>
            </div>
            <Button
              onClick={() => navigate('/player-dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </Card>
        </motion.div>
      </div>
    );
  }

  const handlePaymentSuccess = async () => {
    if (!registrationData) return;
    
    setLoading(true);
    try {
      // Import services
      const { registrationService } = await import('../lib/database');
      const { paymentService } = await import('../lib/paymentService');
      
      // Check if player is already registered for this tournament
      const isAlreadyRegistered = await registrationService.isPlayerRegistered(
        registrationData.tournament_data.id, 
        user?.id || ''
      );
      
      if (isAlreadyRegistered) {
        console.log('⚠️ Player already registered for this tournament');
        toast.error('You are already registered for this tournament!');
        
        // Clear localStorage and redirect to dashboard
        localStorage.removeItem('pending_player_registration');
        navigate('/player-dashboard');
        return;
      }
      
      // Create registration
      const createdRegistration = await registrationService.createRegistration(registrationData.registration_data);
      console.log('✅ Registration created:', createdRegistration);
      
      // Create payment fee record with paid status
      await paymentService.createPlayerRegistrationFee({
        tournament_id: registrationData.tournament_data.id,
        player_id: user?.id || '',
        registration_fee: registrationData.entry_fee,
        commission_amount: registrationData.platform_fee,
        total_amount: registrationData.total_amount
      });
      
      // Note: Tournament participant count will be updated automatically by database trigger
      // when the registration is created (update_tournament_participant_count function)
      
      // Add notification for player
      try {
        const { notificationService } = await import('../lib/database');
        await notificationService.createNotification({
          type: 'tournament_registration_success',
          title: 'Registration Successful!',
          message: `Your registration for "${registrationData.tournament_name}" has been completed successfully.`,
          user_id: user?.id || '',
          tournament_id: registrationData.tournament_data.id,
          tournament_name: registrationData.tournament_name,
          target_role: 'player'
        });
        
        // Add notification for organizer
        await notificationService.createNotification({
          type: 'new_tournament_available',
          title: 'New Tournament Registration',
          message: `${registrationData.player_name} has registered for "${registrationData.tournament_name}"`,
          user_id: registrationData.tournament_data.organizer_id,
          tournament_id: registrationData.tournament_data.id,
          tournament_name: registrationData.tournament_name,
          target_role: 'organizer'
        });
        
        toast.success('Registration completed successfully! Payment completed.');
      } catch (notificationError) {
        console.error('Failed to create notifications:', notificationError);
        // Continue even if notifications fail
      }
      
      // Clear localStorage
      localStorage.removeItem('pending_player_registration');
      
      // Show success receipt
      setShowReceipt(true);
      
    } catch (error: any) {
      console.error('Failed to complete registration:', error);
      
      // Handle specific error cases
      if (error?.code === '23505' && error?.message?.includes('duplicate key')) {
        toast.error('You are already registered for this tournament!');
        
        // Clear localStorage and redirect to dashboard
        localStorage.removeItem('pending_player_registration');
        navigate('/player-dashboard');
      } else {
        toast.error('Failed to complete registration. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
            Back to Registration
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tournament Registration Payment</h1>
          <p className="text-gray-600">Complete your registration for {registrationData.tournament_name}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Payment Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Details</h2>
              
              {/* Payment Method Selection */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Select Payment Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedPaymentMethod('qr_code')}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedPaymentMethod === 'qr_code'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <QrCode className="h-8 w-8 mx-auto mb-2" />
                    <span className="font-medium">QR Code</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPaymentMethod('esewa')}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedPaymentMethod === 'esewa'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="h-8 w-8 mx-auto mb-2" />
                    <span className="font-medium">eSewa</span>
                  </button>
                  
                  <button
                    onClick={() => setSelectedPaymentMethod('bank_transfer')}
                    className={`p-4 border rounded-lg text-center transition-colors ${
                      selectedPaymentMethod === 'bank_transfer'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className="h-8 w-8 mx-auto mb-2" />
                    <span className="font-medium">Bank Transfer</span>
                  </button>
                </div>
              </div>

              {/* Payment Proof Upload */}
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-3">Payment Proof</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Please upload a screenshot or photo of your payment confirmation.
                </p>
                
                {!proofUrl ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setProofFile(file);
                          // For now, just set a dummy URL
                          setProofUrl('dummy-proof');
                        }
                      }}
                      className="hidden"
                      id="proof-upload"
                    />
                    <label
                      htmlFor="proof-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Payment Proof
                    </label>
                  </div>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Payment Proof</span>
                      <button
                        onClick={() => setProofUrl('')}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center p-3 bg-gray-100 rounded">
                      <FileText className="h-5 w-5 text-gray-600 mr-2" />
                      <span className="text-sm text-gray-700">Proof uploaded</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handlePaymentSuccess}
                  disabled={loading || !proofUrl}
                  className="flex-1"
                >
                  {loading ? 'Processing...' : 'Complete Payment'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/tournament-map')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Payment Summary */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Trophy className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900">{registrationData.tournament_name}</p>
                    <p className="text-sm text-gray-600">Tournament Registration</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Entry Fee:</span>
                    <span className="font-medium">रू {registrationData.entry_fee}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Platform Fee:</span>
                    <span className="font-medium">रू {registrationData.platform_fee}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-lg">रू {registrationData.total_amount}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Platform Fee</p>
                    <p>
                      A small platform fee is charged to cover operational costs and ensure quality service.
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
