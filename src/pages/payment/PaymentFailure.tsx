import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle, RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import toast from 'react-hot-toast';

export const PaymentFailure: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    // Get pending payment details
    const pendingPayment = localStorage.getItem('pending_payment');
    if (pendingPayment) {
      const paymentInfo = JSON.parse(pendingPayment);
      setPaymentDetails(paymentInfo);
    }
    
    toast.error('Payment was not completed');
  }, []);

  const retryPayment = () => {
    if (paymentDetails) {
      navigate(`/tournament/${paymentDetails.tournament_id}/register`);
    } else {
      navigate('/tournament-map');
    }
  };

  const contactSupport = () => {
    // In a real application, this would open a support chat or email
    toast.info('Please contact support at support@khelkheleko.com');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="p-8 text-center">
            {/* Failure Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="h-12 w-12 text-red-600" />
            </motion.div>

            {/* Failure Message */}
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Payment Failed
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Your payment could not be processed. Don't worry, no amount has been deducted from your account.
            </p>

            {/* Payment Details */}
            {paymentDetails && (
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Transaction Details
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tournament:</span>
                    <span className="font-medium text-gray-900">{paymentDetails.tournament_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium text-gray-900">रू {paymentDetails.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-sm text-gray-900">{paymentDetails.transaction_uuid}</span>
                  </div>
                  <div className="flex justify-between border-t pt-3">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium text-red-600 flex items-center">
                      <XCircle className="h-4 w-4 mr-1" />
                      Failed
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Common Reasons */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8 text-left">
              <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Common Reasons for Payment Failure
              </h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• Insufficient balance in your eSewa account</li>
                <li>• Network connectivity issues</li>
                <li>• Payment session timeout</li>
                <li>• Incorrect payment credentials</li>
                <li>• Bank server temporarily unavailable</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <Button
                onClick={retryPayment}
                className="flex items-center bg-green-600 hover:bg-green-700"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Payment Again
              </Button>
              
              <Button
                onClick={() => navigate('/player-dashboard')}
                variant="outline"
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>

            {/* Support */}
            <div className="border-t pt-6">
              <p className="text-sm text-gray-600 mb-3">
                Still having trouble? Our support team is here to help.
              </p>
              <Button
                onClick={contactSupport}
                variant="ghost"
                size="sm"
                className="text-blue-600 hover:text-blue-800"
              >
                Contact Support
              </Button>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 mt-6">
              No amount has been deducted from your account. You can safely retry the payment.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};