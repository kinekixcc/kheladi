import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Download, ArrowRight, Trophy, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { verifyESewaPayment } from '../../lib/esewa';
import { dummyPaymentProcessor } from '../../lib/dummyPaymentSystem';
import { useNotifications } from '../../context/NotificationContext';
import { registrationService } from '../../lib/database';
import toast from 'react-hot-toast';

export const PaymentSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addNotification } = useNotifications();
  const [verifying, setVerifying] = useState(true);
  const [paymentVerified, setPaymentVerified] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const tournamentId = searchParams.get('tournament_id');
        const userId = searchParams.get('user_id');
        const transactionUuid = searchParams.get('transaction_uuid');
        
        // Get pending payment details
        const pendingPayment = localStorage.getItem('pending_payment');
        if (!pendingPayment) {
          toast.error('Payment details not found');
          navigate('/player-dashboard');
          return;
        }

        const paymentInfo = JSON.parse(pendingPayment);
        setPaymentDetails(paymentInfo);

        // Verify payment (dummy system or eSewa)
        let isVerified = false;
        
        if (paymentInfo.payment_method && ['esewa', 'bank_transfer', 'card'].includes(paymentInfo.payment_method)) {
          // This is from dummy payment system
          isVerified = await dummyPaymentProcessor.verifyPayment(transactionUuid || paymentInfo.transaction_uuid);
        } else {
          // This is from real eSewa
          isVerified = await verifyESewaPayment(
            transactionUuid || paymentInfo.transaction_uuid,
            `TOURNAMENT_${tournamentId}`,
            paymentInfo.amount
          );
        }

        if (isVerified) {
          setPaymentVerified(true);
          
          // Update registration status to paid in database
          try {
            // Find the registration and update it
            const registrations = await registrationService.getPlayerRegistrations(userId || '');
            const registration = registrations.find(reg => reg.tournament_id === tournamentId);
            
            if (registration) {
              await registrationService.updateRegistration(registration.id, {
                entry_fee_paid: true,
                payment_status: 'completed',
                transaction_id: transactionUuid || paymentInfo.transaction_uuid
              });
              console.log('✅ Registration payment status updated in database');
            }
          } catch (dbError) {
            console.warn('⚠️ Failed to update registration in database, using localStorage fallback:', dbError);
            
            // Fallback to localStorage update
            const registrations = JSON.parse(localStorage.getItem(`player_registrations_${userId}`) || '[]');
            const updatedRegistrations = registrations.map((reg: any) => 
              reg.tournament_id === tournamentId 
                ? { ...reg, entry_fee_paid: true, payment_status: 'completed', transaction_id: transactionUuid }
                : reg
            );
            localStorage.setItem(`player_registrations_${userId}`, JSON.stringify(updatedRegistrations));
          }

          // Add success notification
          addNotification({
            type: 'tournament_registration_success',
            title: 'Payment Successful!',
            message: `Payment of रू ${paymentInfo.amount} for "${paymentInfo.tournament_name}" has been completed successfully.`,
            userId: userId || '',
            tournamentId: tournamentId || '',
            tournamentName: paymentInfo.tournament_name,
            targetRole: 'player'
          });

          // Clear pending payment
          localStorage.removeItem('pending_payment');
          
          toast.success('Payment verified successfully!');
        } else {
          toast.error('Payment verification failed');
          navigate('/payment/failure');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        toast.error('Payment verification failed');
        navigate('/payment/failure');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [searchParams, navigate, addNotification]);

  const downloadReceipt = () => {
    if (!paymentDetails) return;

    const receiptContent = `
PAYMENT RECEIPT
===============

Tournament: ${paymentDetails.tournament_name}
Amount: रू ${paymentDetails.amount}
Transaction ID: ${paymentDetails.transaction_uuid}
Date: ${new Date(paymentDetails.timestamp).toLocaleDateString()}
Time: ${new Date(paymentDetails.timestamp).toLocaleTimeString()}
Payment Method: eSewa
Status: Completed

Thank you for your payment!
खेल खेलेको - Nepal's Sports Platform
    `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `receipt_${paymentDetails.transaction_uuid}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifying Payment
          </h2>
          <p className="text-gray-600">
            Please wait while we verify your payment with eSewa...
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-8 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="h-12 w-12 text-green-600" />
            </motion.div>

            {/* Success Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your tournament registration payment has been completed successfully.
            </p>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Trophy className="h-5 w-5 mr-2 text-blue-600" />
                  Payment Details
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tournament:</span>
                    <span className="font-medium text-gray-900">{paymentDetails.tournament_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid:</span>
                    <span className="font-medium text-green-600">रू {paymentDetails.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm text-gray-900">{paymentDetails.transaction_uuid}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium text-gray-900">eSewa</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date & Time:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(paymentDetails.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Completed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8 text-left">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                What's Next?
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Your tournament registration is now confirmed</li>
                <li>• You will receive further details from the organizer</li>
                <li>• Check your dashboard for tournament updates</li>
                <li>• Keep your transaction ID for future reference</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={downloadReceipt}
                variant="outline"
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>
              
              <Button
                onClick={() => navigate('/player-dashboard')}
                className="flex items-center"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            {/* Footer */}
            <p className="text-sm text-gray-500 mt-8">
              Thank you for using खेल खेलेको! If you have any questions, please contact support.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};