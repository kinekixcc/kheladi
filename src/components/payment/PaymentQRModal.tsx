import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { paymentService } from '../../lib/paymentService';
import toast from 'react-hot-toast';

interface PaymentQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentType: 'tournament_commission' | 'player_registration';
  paymentId: string;
  amount: number;
  title: string;
  description: string;
}

export const PaymentQRModal: React.FC<PaymentQRModalProps> = ({
  isOpen,
  onClose,
  paymentType,
  paymentId,
  amount,
  title,
  description
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'esewa' | 'bank'>('esewa');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUrl, setProofUrl] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProofFile(file);
      // In a real app, you'd upload this to Supabase Storage
      // For now, we'll create a local URL
      const url = URL.createObjectURL(file);
      setProofUrl(url);
    }
  };

  const handleSubmitPayment = async () => {
    if (!proofFile) {
      toast.error('Please upload payment proof');
      return;
    }

    setIsSubmitting(true);
    try {
      // In a real app, upload file to Supabase Storage first
      // const uploadedUrl = await uploadFile(proofFile);
      
      // For now, use the local URL
      const success = await paymentService.updatePaymentStatus(
        paymentId,
        paymentType,
        'paid',
        proofUrl
      );

      if (success) {
        toast.success('Payment proof submitted successfully!');
        onClose();
      } else {
        toast.error('Failed to submit payment proof');
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
      toast.error('Failed to submit payment proof');
    } finally {
      setIsSubmitting(false);
    }
  };

  const downloadQR = (type: 'esewa' | 'bank') => {
    // In a real app, you'd have actual QR code images
    // For now, create a placeholder download
    const link = document.createElement('a');
    link.href = type === 'esewa' ? '/esewa-qr.png' : '/bank-qr.png';
    link.download = `${type}-qr-code.png`;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Payment Amount */}
          <div className="p-6 border-b bg-gray-50">
            <div className="text-center">
              <p className="text-sm text-gray-600">Total Amount to Pay</p>
              <p className="text-3xl font-bold text-green-600">रु {amount.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Nepali Rupees</p>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Choose Payment Method</h3>
            
            {/* eSewa QR */}
            <div className="mb-4">
              <button
                onClick={() => setSelectedMethod('esewa')}
                className={`w-full p-4 border rounded-lg text-left transition-colors ${
                  selectedMethod === 'esewa'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600 font-bold text-sm">e</span>
                    </div>
                    <div>
                      <p className="font-medium">eSewa QR Payment</p>
                      <p className="text-sm text-gray-600">Scan QR code with eSewa app</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedMethod === 'esewa' ? 'border-green-500 bg-green-500' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'esewa' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* Bank QR */}
            <div className="mb-6">
              <button
                onClick={() => setSelectedMethod('bank')}
                className={`w-full p-4 border rounded-lg text-left transition-colors ${
                  selectedMethod === 'bank'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-blue-600 font-bold text-sm">🏦</span>
                    </div>
                    <div>
                      <p className="font-medium">Bank QR Payment</p>
                      <p className="text-sm text-gray-600">Scan QR code with any banking app</p>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    selectedMethod === 'bank' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
                  }`}>
                    {selectedMethod === 'bank' && (
                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                    )}
                  </div>
                </div>
              </button>
            </div>

            {/* QR Code Display */}
            {selectedMethod && (
              <div className="mb-6 text-center">
                <div className="bg-gray-100 rounded-lg p-6 mb-4">
                  <div className="w-48 h-48 bg-white rounded-lg mx-auto flex items-center justify-center border-2 border-dashed border-gray-300">
                    {selectedMethod === 'esewa' ? (
                      <div className="text-center">
                        <div className="text-4xl mb-2">📱</div>
                        <p className="text-sm text-gray-600">eSewa QR Code</p>
                        <p className="text-xs text-gray-500">Personal Account</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-2">🏦</div>
                        <p className="text-sm text-gray-600">Bank QR Code</p>
                        <p className="text-xs text-gray-500">Scan to Pay</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <Button
                  onClick={() => downloadQR(selectedMethod)}
                  variant="outline"
                  className="flex items-center gap-2 mx-auto"
                >
                  <Download className="h-4 w-4" />
                  Download QR Code
                </Button>
              </div>
            )}

            {/* Payment Instructions */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Payment Instructions:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Download the QR code above</li>
                <li>2. Open your {selectedMethod === 'esewa' ? 'eSewa' : 'banking'} app</li>
                <li>3. Scan the QR code</li>
                <li>4. Enter amount: रु {amount.toLocaleString()}</li>
                <li>5. Complete the payment</li>
                <li>6. Take a screenshot of payment confirmation</li>
                <li>7. Upload the proof below</li>
              </ol>
            </div>

            {/* Upload Proof */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Payment Proof
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="proof-upload"
                />
                <label
                  htmlFor="proof-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  {proofFile ? (
                    <div className="text-green-600">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium">Proof uploaded successfully!</p>
                      <p className="text-sm text-gray-600">{proofFile.name}</p>
                    </div>
                  ) : (
                    <div className="text-gray-600">
                      <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                      <p className="font-medium">Click to upload payment proof</p>
                      <p className="text-sm text-gray-500">Screenshot or PDF of payment confirmation</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmitPayment}
              disabled={!proofFile || isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Payment Proof'}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


