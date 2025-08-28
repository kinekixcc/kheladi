import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, Info, CreditCard, QrCode, Building2, CheckCircle, Upload, FileText, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { imageUploadService } from '../lib/imageUpload';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface TournamentCommissionData {
  tournament_name: string;
  entry_fee: number;
  max_participants: number;
  total_revenue: number;
  commission_percentage: number;
  commission_amount: number;
  organizer_earnings: number;
  organizer_name?: string;
  tournament_data: any;
}

export const TournamentCommissionPayment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'esewa' | 'qr_code' | 'bank_transfer'>('esewa');
  const [commissionData, setCommissionData] = useState<TournamentCommissionData | null>(null);
  
  // Payment proof state
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [showProofUpload, setShowProofUpload] = useState(false);

  useEffect(() => {
    // Get tournament data from localStorage (set by CreateTournament)
    const tournamentData = localStorage.getItem('pending_tournament_commission');
    if (tournamentData) {
      try {
        const parsed = JSON.parse(tournamentData);
        console.log('🔍 TournamentCommissionPayment: Loaded data from localStorage:', parsed);
        
        // Validate required fields
        if (!parsed.tournament_name || !parsed.commission_amount || !parsed.tournament_data) {
          throw new Error('Missing required tournament data');
        }
        
        setCommissionData(parsed);
      } catch (error) {
        console.error('Failed to parse tournament data:', error);
        toast.error('Invalid tournament data. Please try creating the tournament again.');
        navigate('/create-tournament');
      }
    } else {
      toast.error('No tournament data found. Please create a tournament first.');
      navigate('/create-tournament');
    }
  }, [navigate]);

  // Debug useEffect to monitor state changes
  useEffect(() => {
    console.log('🔄 State changed - proofFile:', !!proofFile, 'proofUrl:', !!proofUrl, 'uploadingProof:', uploadingProof);
  }, [proofFile, proofUrl, uploadingProof]);

  const handlePaymentSuccess = async () => {
    if (!commissionData) return;
    
    setLoading(true);
    try {
      // Create the tournament in the database
      const { tournamentService } = await import('../lib/database');
      const { paymentService } = await import('../lib/paymentService');
      
      // Debug: Log the tournament data being sent to database
      console.log('🔍 TournamentCommissionPayment: About to create tournament with data:', commissionData.tournament_data);
      console.log('🖼️ Images field in tournament data:', commissionData.tournament_data.images);
      console.log('🖼️ Images field type:', typeof commissionData.tournament_data.images);
      console.log('🖼️ Images array length:', Array.isArray(commissionData.tournament_data.images) ? commissionData.tournament_data.images.length : 'Not an array');
      
      // Create tournament
      const createdTournament = await tournamentService.createTournament(commissionData.tournament_data);
      
      // Debug: Log what was actually created in the database
      console.log('✅ Tournament created in database:', createdTournament);
      console.log('🖼️ Images field in created tournament:', createdTournament.images);
      
      // Create commission record with paid status
      await paymentService.createTournamentCommission({
        tournament_id: createdTournament.id,
        organizer_id: user?.id || '',
        commission_amount: commissionData.commission_amount,
        commission_percentage: commissionData.commission_percentage,
        total_amount: commissionData.total_revenue
      });
      
      // Update payment status to paid
      await paymentService.updateTournamentCommissionStatus(
        createdTournament.id,
        'paid'
      );
      
      // Add notification for admin if approval is required
      if (commissionData.tournament_data.requires_approval) {
        try {
          const { notificationService } = await import('../lib/database');
          await notificationService.createTournamentSubmissionNotification(
            createdTournament.id,
            createdTournament.name,
            createdTournament.organizer_name
          );
          toast.success('Tournament created successfully! Commission payment completed. Awaiting admin approval.');
        } catch (notificationError) {
          console.error('Failed to create notification:', notificationError);
          // Don't fail the tournament creation for notification issues
        }
      } else {
        toast.success('Tournament created successfully! Commission payment completed. It is now live and players can join.');
      }
      
      // Clear localStorage
      localStorage.removeItem('pending_tournament_commission');
      
      navigate('/organizer-dashboard');
      
    } catch (error) {
      console.error('Failed to create tournament after payment:', error);
      toast.error('Payment successful but tournament creation failed. Please contact support.');
      navigate('/organizer-dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Generate receipt HTML for payment proof
  const generateReceiptHTML = (data: any, paymentMethod: string, transactionId: string, paymentDate: string, receiptId: string) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #333; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0;">Tournament Commission Receipt</h1>
          <p style="color: #666; margin: 5px 0;">Receipt ID: ${receiptId}</p>
          <p style="color: #666; margin: 5px 0;">Transaction ID: ${transactionId}</p>
          <p style="color: #666; margin: 5px 0;">Date: ${new Date(paymentDate).toLocaleDateString()}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Tournament Details</h2>
          <p><strong>Tournament Name:</strong> ${data.tournament_data?.name || 'N/A'}</p>
          <p><strong>Organizer:</strong> ${data.organizer_name || 'N/A'}</p>
          <p><strong>Entry Fee:</strong> रू ${data.entry_fee?.toLocaleString() || 'N/A'}</p>
          <p><strong>Max Teams:</strong> ${data.tournament_data?.max_teams || 'N/A'}</p>
          <p><strong>Team Size:</strong> ${data.tournament_data?.team_size_min || 'N/A'} - ${data.tournament_data?.team_size_max || 'N/A'} players</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Payment Details</h2>
          <p><strong>Payment Method:</strong> ${paymentMethod}</strong></p>
          <p><strong>Total Revenue:</strong> रू ${data.total_revenue?.toLocaleString() || 'N/A'}</strong></p>
          <p><strong>Commission Rate:</strong> ${data.commission_percentage || 5}%</strong></p>
          <p><strong>Commission Amount:</strong> रू ${data.commission_amount?.toLocaleString() || 'N/A'}</strong></p>
          <p><strong>Organizer Earnings:</strong> रू ${data.organizer_earnings?.toLocaleString() || 'N/A'}</strong></p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h2 style="color: #333; border-bottom: 1px solid #ccc; padding-bottom: 10px;">Platform Information</h2>
          <p><strong>Platform:</strong> Playo Tournament Platform</strong></p>
          <p><strong>Commission Type:</strong> Tournament Commission</strong></p>
          <p><strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAID</span></strong></p>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #333;">
          <p style="color: #666; font-size: 12px;">This receipt serves as proof of payment for tournament commission.</p>
          <p style="color: #666; font-size: 12px;">Please keep this receipt for your records.</p>
        </div>
      </div>
    `;
  };

  // Convert HTML to image (placeholder function)
  const htmlToImage = async (htmlString: string): Promise<Blob> => {
    // For now, create a simple canvas-based image
    // In production, you might want to use html2canvas or similar library
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    
    canvas.width = 600;
    canvas.height = 800;
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = '#000000';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    
    // Simple text representation of receipt
    const lines = [
      'Tournament Commission Receipt',
      'Payment Successful!',
      'Commission: रू ' + (commissionData?.commission_amount || 0),
      'Tournament: ' + (commissionData?.tournament_data?.name || 'N/A'),
      'Date: ' + new Date().toLocaleDateString()
    ];
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, 100 + (index * 30));
    });
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else throw new Error('Failed to create blob');
      }, 'image/png');
    });
  };

  // Handle payment proof upload
  const handleProofUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Please upload an image (JPG, PNG) or PDF file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    console.log('📁 File selected:', file.name, file.size, file.type);
    setProofFile(file);
    console.log('✅ proofFile state set to:', file.name);
    setUploadingProof(true);

    try {
      // Try to upload to Supabase storage first
      const result = await imageUploadService.uploadImage(file, 'payment-proofs');
      
      if (result.success && result.url) {
        console.log('✅ File uploaded to storage:', result.url);
        setProofUrl(result.url);
        toast.success('Payment proof uploaded successfully!');
      } else {
        throw new Error(result.error || 'Failed to upload payment proof');
      }
    } catch (uploadError) {
      console.error('❌ Storage upload failed:', uploadError);
      toast.error('Failed to upload payment proof. Please check your storage configuration.');
      setProofFile(null);
    } finally {
      setUploadingProof(false);
      console.log('🔄 Upload state updated - proofFile:', !!file, 'proofUrl:', !!proofUrl);
    }
  };

  // Download receipt as text file
  const downloadReceipt = () => {
    if (!commissionData) return;

    const receiptContent = `
TOURNAMENT COMMISSION PAYMENT RECEIPT
=====================================

Tournament Name: ${commissionData.tournament_name}
Organizer: ${commissionData.organizer_name || user?.full_name || 'N/A'}
Entry Fee: रू ${commissionData.entry_fee}
Max Participants: ${commissionData.max_participants}
Total Revenue: रू ${commissionData.total_revenue}
Commission Percentage: ${commissionData.commission_percentage}%
Commission Amount: रू ${commissionData.commission_amount}
Organizer Earnings: रू ${commissionData.organizer_earnings}

Payment Method: ${selectedPaymentMethod.replace('_', ' ')}
Transaction Date: ${new Date().toLocaleDateString()}
Transaction Time: ${new Date().toLocaleTimeString()}
Status: Paid

Thank you for using खेल खेलेको!
Nepal's Premier Sports Platform
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tournament_commission_receipt_${commissionData.tournament_name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success('Receipt downloaded successfully!');
  };

  // Remove uploaded proof
  const removeProof = () => {
    setProofFile(null);
    setProofUrl('');
  };

  const handleDummyPayment = async () => {
    if (!commissionData) return;
    
    setLoading(true);
    try {
      // Generate receipt data
      const receiptId = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const paymentDate = new Date().toISOString();
      
      // Create receipt HTML (for PDF generation or display)
      const receiptHTML = generateReceiptHTML(commissionData, 'Dummy Payment', transactionId, paymentDate, receiptId);
      
      // Convert receipt to image/PDF and upload
      const receiptBlob = await htmlToImage(receiptHTML);
      const receiptFile = new File([receiptBlob], `receipt-${receiptId}.png`, { type: 'image/png' });
      
              // Try to upload receipt to Supabase storage
      setUploadingProof(true);
      let receiptUrl = '';
      
      try {
        const receiptResult = await imageUploadService.uploadImage(receiptFile, 'payment-proofs');
        if (receiptResult.success && receiptResult.url) {
          receiptUrl = receiptResult.url;
        } else {
          throw new Error(receiptResult.error || 'Failed to upload receipt');
        }
      } catch (uploadError) {
        console.error('❌ Storage upload failed:', uploadError);
        toast.error('Failed to upload receipt. Please check your storage configuration.');
        setLoading(false);
        return;
      }
      
      setProofUrl(receiptUrl);
      
      // Create tournament and commission with receipt
      const { tournamentService } = await import('../lib/database');
      const { paymentService } = await import('../lib/paymentService');
      
                     // Create clean tournament data with all required fields for validation and interface
        const tournamentData = {
          // Basic tournament info
          name: commissionData.tournament_data?.name || 'Tournament',
          description: commissionData.tournament_data?.description || 'Tournament description',
          sport_type: commissionData.tournament_data?.sport_type || 'General',
          tournament_type: commissionData.tournament_data?.tournament_type || 'single_elimination',
          
          // Organizer info (required by Tournament interface)
          organizer_id: user?.id || '',
          organizer_name: commissionData.organizer_name || 'Unknown Organizer',
          
          // Facility info (required by Tournament interface)
          facility_id: commissionData.tournament_data?.facility_id || 'default-facility',
          facility_name: commissionData.tournament_data?.facility_name || 'Main Sports Complex',
          
          // Entry fee and prize
          entry_fee: commissionData.entry_fee || 0,
          prize_pool: commissionData.tournament_data?.prize_pool || 0,
          
          // Team registration settings (only fields that exist in actual database)
          max_teams: commissionData.tournament_data?.max_teams || 10,
          
          // Team size and participants (required by Tournament interface)
          team_size: commissionData.tournament_data?.team_size_max || 5,
          max_participants: (commissionData.tournament_data?.max_teams || 10) * (commissionData.tournament_data?.team_size_max || 5),
          current_teams: 0,
          current_participants: 0,
          
          // Dates (REQUIRED by validation schema)
          start_date: commissionData.tournament_data?.start_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end_date: commissionData.tournament_data?.end_date || new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          registration_deadline: commissionData.tournament_data?.registration_deadline || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          
          // Venue and location (REQUIRED by validation schema)
          venue_name: commissionData.tournament_data?.venue_name || 'Main Sports Complex',
          venue_address: commissionData.tournament_data?.venue_address || '123 Sports Street, Kathmandu',
          province: commissionData.tournament_data?.province || 'Bagmati',
          district: commissionData.tournament_data?.district || 'Kathmandu',
          
          // Rules and requirements (REQUIRED by validation schema)
          rules: commissionData.tournament_data?.rules || 'Standard tournament rules apply. All participants must follow fair play guidelines and respect tournament officials.',
          requirements: commissionData.tournament_data?.requirements || 'All participants must be registered and provide valid identification. Minimum age requirement: 13 years.',
          
          // Contact info (REQUIRED by validation schema)
          contact_phone: commissionData.tournament_data?.contact_phone || '+9771234567890',
          contact_email: commissionData.tournament_data?.contact_email || 'organizer@example.com',
          
          // Admin approval (REQUIRED by validation schema)
          requires_approval: true,
          
          // Status (required by Tournament interface)
          status: 'pending_approval' as const,
          
          // Optional fields with defaults
          is_recurring: false,
          allow_individual_players: true,
          chat_enabled: true,
          visibility: 'public' as const,
          tags: [],
          
          // Images (from tournament creation)
          images: commissionData.tournament_data?.images || [],
          
          // Coordinates (optional)
          latitude: commissionData.tournament_data?.latitude || undefined,
          longitude: commissionData.tournament_data?.longitude || undefined
        };
       
       console.log('🔍 TournamentCommissionPayment: Prepared tournament data:', tournamentData);
      
      const createdTournament = await tournamentService.createTournament(tournamentData);
      
      // Create commission with receipt URL as payment proof
      await paymentService.createTournamentCommission({
        tournament_id: createdTournament.id,
        organizer_id: user?.id || '',
        commission_amount: commissionData.commission_amount,
        commission_percentage: commissionData.commission_percentage,
        total_amount: commissionData.total_revenue,
        payment_proof_url: receiptUrl // Use the receipt URL from Supabase storage
      });
      
      // Clear localStorage
      localStorage.removeItem('pending_tournament_commission');
      
      // Show success and receipt
      toast.success('Commission payment successful! Tournament created.');
      setShowReceipt(true);
      
    } catch (error) {
      console.error('Error processing dummy payment:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setLoading(false);
      setUploadingProof(false);
    }
  };

  const handlePaymentFailure = () => {
    toast.error('Payment failed. Please try again or choose a different payment method.');
  };

  const handlePaymentCancelled = () => {
    toast('Payment was cancelled. You can try again or choose a different payment method.');
  };

  const handleBackToTournament = () => {
    // Ask user if they want to go back and modify tournament details
    if (window.confirm('Are you sure you want to go back and modify tournament details? Your current data will be lost.')) {
      localStorage.removeItem('pending_tournament_commission');
      navigate('/create-tournament');
    }
  };

  if (!commissionData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

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
            onClick={handleBackToTournament}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tournament Creation
          </Button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Tournament Commission Payment</h1>
          <p className="text-gray-600">Pay the platform commission to activate your tournament</p>
          
          {/* Progress Indicator */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  ✓
                </div>
                <span className="ml-2 text-sm text-gray-600">Tournament Details</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  2
                </div>
                <span className="ml-2 text-sm text-gray-600">Commission Payment</span>
              </div>
              <div className="w-12 h-0.5 bg-gray-300"></div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  3
                </div>
                <span className="ml-2 text-sm text-gray-600">Tournament Created</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Payment Summary */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-8"
        >
          <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-900 mb-2">
                Tournament Commission Payment
              </h2>
              <p className="text-blue-700 mb-4">
                Complete this payment to activate your tournament: <strong>{commissionData.tournament_name}</strong>
              </p>
              <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full">
                <span className="text-blue-800 font-semibold">
                  Amount Due: रू {commissionData.commission_amount.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Commission Breakdown */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <Calculator className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Commission Breakdown</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Tournament Name:</span>
                  <span className="font-medium text-gray-900">{commissionData.tournament_name}</span>
                </div>
                
                                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Entry Fee:</span>
                   <span className="font-medium">रू {commissionData.entry_fee.toLocaleString()}</span>
                 </div>
                 
                 <div className="flex justify-between items-center">
                   <span className="text-gray-600">Max Teams:</span>
                   <span className="font-medium">
                     {commissionData.tournament_data?.max_teams || 'N/A'}
                   </span>
                 </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-gray-600">Total Revenue:</span>
                  <span className="font-semibold text-green-600">रू {commissionData.total_revenue.toLocaleString()}</span>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 flex items-center">
                      Platform Commission ({commissionData.commission_percentage}%)
                      <Info className="h-3 w-3 ml-1 text-gray-400" />
                    </span>
                    <span className="text-red-600">-रू {commissionData.commission_amount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center text-sm border-t pt-2">
                    <span className="text-gray-600">Total Platform Fees:</span>
                    <span className="text-red-600 font-medium">-रू {commissionData.commission_amount.toLocaleString()}</span>
                  </div>
                </div>
                
                <div className="flex justify-between items-center border-t pt-2">
                  <span className="text-lg font-semibold text-gray-900">Your Earnings:</span>
                  <span className="text-xl font-bold text-green-600">रू {commissionData.organizer_earnings.toLocaleString()}</span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-800">
                  <Info className="h-3 w-3 inline mr-1" />
                  Platform fees help us maintain the service, provide customer support, and continuously improve the platform.
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Payment Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
              
              {/* Payment Method Selection */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="esewa"
                    name="paymentMethod"
                    value="esewa"
                    checked={selectedPaymentMethod === 'esewa'}
                    onChange={() => setSelectedPaymentMethod('esewa')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="esewa" className="flex items-center text-gray-700">
                    <CreditCard className="h-4 w-4 mr-2 text-green-600" />
                    eSewa (Recommended)
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="qr_code"
                    name="paymentMethod"
                    value="qr_code"
                    checked={selectedPaymentMethod === 'qr_code'}
                    onChange={() => setSelectedPaymentMethod('qr_code')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="qr_code" className="flex items-center text-gray-700">
                    <QrCode className="h-4 w-4 mr-2 text-blue-600" />
                    QR Code Payment
                  </label>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id="bank_transfer"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={selectedPaymentMethod === 'bank_transfer'}
                    onChange={() => setSelectedPaymentMethod('bank_transfer')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                                     <label htmlFor="bank_transfer" className="flex items-center text-gray-700">
                     <Building2 className="h-4 w-4 mr-2 text-purple-600" />
                     Bank Transfer
                   </label>
                </div>
              </div>

                             {/* Payment Processing */}
               {selectedPaymentMethod === 'esewa' && (
                 <div className="space-y-4">
                   <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                     <h4 className="font-medium text-green-900 mb-2">eSewa Payment (Demo)</h4>
                     <p className="text-sm text-green-800">
                       This is a demo payment system. Click the button below to simulate payment completion.
                     </p>
                   </div>
                   
                   {/* Payment Proof Upload */}
                   <div className="space-y-3">
                     <label className="block text-sm font-medium text-gray-700">
                       <FileText className="h-4 w-4 inline mr-1" />
                       Upload Payment Proof *
                     </label>
                     <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                       {proofFile ? (
                         <div className="text-center">
                           <div className="flex items-center justify-center mb-2">
                             <CheckCircle className="h-8 w-8 text-green-500" />
                           </div>
                           <p className="text-sm font-medium text-green-600 mb-1">Proof uploaded successfully!</p>
                           <p className="text-xs text-gray-500 mb-2">{proofFile.name}</p>
                           <Button
                             onClick={removeProof}
                             variant="outline"
                             size="sm"
                             className="text-red-600 hover:text-red-700"
                           >
                             <X className="h-3 w-3 mr-1" />
                             Remove
                           </Button>
                         </div>
                       ) : (
                         <label className="cursor-pointer flex flex-col items-center">
                           <input
                             type="file"
                             accept="image/*,.pdf"
                             onChange={handleProofUpload}
                             className="hidden"
                             id="proof-upload-esewa"
                           />
                           <div className="text-center">
                             {uploadingProof ? (
                               <div className="flex items-center gap-2">
                                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                 <span className="text-sm text-gray-500">Uploading...</span>
                               </div>
                             ) : (
                               <>
                                 <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                 <p className="text-sm text-gray-500">
                                   <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                                 </p>
                                 <p className="text-xs text-gray-500">Screenshot, receipt, or PDF up to 5MB</p>
                               </>
                             )}
                           </div>
                         </label>
                       )}
                     </div>
                   </div>
                   
                   {loading ? (
                     <div className="text-center p-6">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                       <p className="text-sm text-gray-600">Processing payment...</p>
                     </div>
                   ) : (
                     <Button
                       onClick={handleDummyPayment}
                       className="w-full"
                       size="lg"
                       disabled={loading || !proofFile}
                       title={`Button state: loading=${loading}, proofFile=${!!proofFile}, proofUrl=${!!proofUrl}`}
                     >
                       Complete Demo Payment
                     </Button>
                   )}
                 </div>
               )}

              {selectedPaymentMethod === 'qr_code' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">QR Code Payment</h4>
                    <p className="text-sm text-blue-800">
                      Scan the QR code with your mobile banking app to complete the payment.
                    </p>
                  </div>
                  
                  <div className="text-center p-6 bg-gray-100 rounded-lg">
                    <div className="w-48 h-48 bg-white mx-auto rounded-lg flex items-center justify-center">
                      <QrCode className="h-24 w-24 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">QR Code will be generated here</p>
                  </div>
                  
                  {/* Payment Proof Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <FileText className="h-4 w-4 inline mr-1" />
                      Upload Payment Proof *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {proofFile ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                          <p className="text-sm font-medium text-green-600 mb-1">Proof uploaded successfully!</p>
                          <p className="text-xs text-gray-500 mb-2">{proofFile.name}</p>
                          <Button
                            onClick={removeProof}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleProofUpload}
                            className="hidden"
                            id="proof-upload-qr"
                          />
                          <div className="text-center">
                            {uploadingProof ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-gray-500">Uploading...</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                  <span className="text-blue-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">Screenshot, receipt, or PDF up to 5MB</p>
                              </>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleDummyPayment}
                    className="w-full"
                    size="lg"
                    disabled={loading || !proofFile}
                    title={`QR Button state: loading=${loading}, proofFile=${!!proofFile}, proofUrl=${!!proofUrl}`}
                  >
                    {loading ? 'Processing...' : 'Complete Demo Payment'}
                  </Button>
                </div>
              )}

              {selectedPaymentMethod === 'bank_transfer' && (
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">Bank Transfer</h4>
                    <p className="text-sm text-purple-800">
                      Transfer the commission amount to our bank account and upload the payment proof.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="font-medium text-gray-900 mb-2">Bank Details</h5>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p><span className="font-medium">Bank:</span> Example Bank</p>
                      <p><span className="font-medium">Account:</span> 1234567890</p>
                      <p><span className="font-medium">IFSC:</span> EXBK0001234</p>
                      <p><span className="font-medium">Amount:</span> रू {commissionData.commission_amount.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  {/* Payment Proof Upload */}
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-700">
                      <FileText className="h-4 w-4 inline mr-1" />
                      Upload Payment Proof *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {proofFile ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center mb-2">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                          </div>
                          <p className="text-sm font-medium text-green-600 mb-1">Proof uploaded successfully!</p>
                          <p className="text-xs text-gray-500 mb-2">{proofFile.name}</p>
                          <Button
                            onClick={removeProof}
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                          >
                            <X className="h-3 w-3 mr-1" />
                            Remove
                          </Button>
                        </div>
                      ) : (
                        <label className="cursor-pointer flex flex-col items-center">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleProofUpload}
                            className="hidden"
                            id="proof-upload-bank"
                          />
                          <div className="text-center">
                            {uploadingProof ? (
                              <div className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                                <span className="text-sm text-gray-500">Uploading...</span>
                              </div>
                            ) : (
                              <>
                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">
                                  <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                                </p>
                                <p className="text-xs text-gray-500">Screenshot, receipt, or PDF up to 5MB</p>
                              </>
                            )}
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                  
                  <Button
                    onClick={handleDummyPayment}
                    className="w-full"
                    size="lg"
                    disabled={loading || !proofFile}
                  >
                    {loading ? 'Processing...' : 'Complete Demo Payment'}
                  </Button>
                </div>
              )}

              {/* Debug Info - Remove in production */}
              <div className="mt-6 p-4 bg-gray-100 border border-gray-300 rounded-lg">
                <p className="text-sm text-gray-700 font-mono">
                  <strong>Debug Info:</strong> proofFile: {proofFile ? `✅ ${proofFile.name}` : '❌ None'}, 
                  proofUrl: {proofUrl ? `✅ ${proofUrl.substring(0, 50)}...` : '❌ None'}, 
                  uploadingProof: {uploadingProof ? '🔄 Yes' : '❌ No'}
                </p>
              </div>

              {/* Important Notice */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> Your tournament will only be created and activated after the commission payment is verified. 
                  <strong>Payment proof upload is required for all payment methods.</strong> Please upload a screenshot, receipt, or PDF of your payment confirmation.
                </p>
              </div>
            </Card>
                     </motion.div>
         </div>

         {/* Payment Receipt Modal */}
         {showReceipt && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="bg-white rounded-lg max-w-md w-full p-6"
             >
               <div className="text-center">
                 <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                   <CheckCircle className="h-8 w-8 text-green-600" />
                 </div>
                 <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Successful!</h3>
                 <p className="text-gray-600 mb-4">Your tournament has been created successfully.</p>
               </div>

               {/* Receipt Details */}
               <div className="bg-gray-50 rounded-lg p-4 mb-4">
                 <h4 className="font-medium text-gray-900 mb-3">Payment Receipt</h4>
                 <div className="space-y-2 text-sm">
                   <div className="flex justify-between">
                     <span className="text-gray-600">Transaction ID:</span>
                     <span className="font-mono text-gray-900">TXN_123456</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Amount:</span>
                     <span className="font-semibold text-green-600">रू {commissionData?.commission_amount.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Tournament:</span>
                     <span className="font-medium text-gray-900">{commissionData?.tournament_name}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Payment Method:</span>
                     <span className="font-medium text-gray-900 capitalize">{selectedPaymentMethod.replace('_', ' ')}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-gray-600">Date:</span>
                     <span className="font-medium text-gray-900">{new Date().toLocaleDateString()}</span>
                   </div>
                 </div>
               </div>

               {/* QR Code for Receipt */}
               <div className="text-center mb-4">
                 <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-lg mx-auto flex items-center justify-center">
                   <QrCode className="h-20 w-20 text-gray-400" />
                 </div>
                 <p className="text-xs text-gray-500 mt-2">Payment Receipt QR Code</p>
               </div>

               {/* Action Buttons */}
               <div className="flex space-x-3">
                 <Button
                   onClick={() => {
                     downloadReceipt();
                   }}
                   variant="outline"
                   className="flex-1"
                 >
                   Download Receipt
                 </Button>
                 <Button
                   onClick={() => {
                     setShowReceipt(false);
                     navigate('/organizer-dashboard');
                   }}
                   className="flex-1"
                 >
                   Go to Dashboard
                 </Button>
               </div>
             </motion.div>
           </motion.div>
         )}
       </div>
     </div>
   );
 };


