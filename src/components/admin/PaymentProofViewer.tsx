import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/Button';

interface PaymentProofViewerProps {
  isOpen: boolean;
  onClose: () => void;
  proofUrl: string;
  paymentDetails: {
    amount: number;
    tournamentName: string;
    organizerName: string;
    paymentMethod: string;
    paymentDate: string;
    commissionPercentage: number;
  };
}

export const PaymentProofViewer: React.FC<PaymentProofViewerProps> = ({
  isOpen,
  onClose,
  proofUrl,
  paymentDetails
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImage = proofUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isPDF = proofUrl.match(/\.pdf$/i);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = proofUrl;
    link.download = `payment-proof-${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setError('Failed to load payment proof image');
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
          className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Payment Proof Verification</h2>
              <p className="text-sm text-gray-600">Review payment proof before approval</p>
            </div>
            <Button
              onClick={onClose}
              variant="outline"
              size="sm"
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Details */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Payment Information</h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Tournament:</span>
                    <span className="text-sm text-gray-900">{paymentDetails.tournamentName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Organizer:</span>
                    <span className="text-sm text-gray-900">{paymentDetails.organizerName}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Amount:</span>
                    <span className="text-sm font-semibold text-green-600">
                      रू {paymentDetails.amount.toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Commission:</span>
                    <span className="text-sm text-gray-900">{paymentDetails.commissionPercentage}%</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Payment Method:</span>
                    <span className="text-sm text-gray-900 capitalize">{paymentDetails.paymentMethod}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-600">Date:</span>
                    <span className="text-sm text-gray-900">
                      {new Date(paymentDetails.paymentDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Proof
                  </Button>
                  
                  <Button
                    onClick={() => window.open(proofUrl, '_blank')}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                  >
                    <Eye className="h-4 w-4" />
                    View Full Size
                  </Button>
                </div>
              </div>

              {/* Proof Display */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Payment Proof</h3>
                
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  {isLoading && (
                    <div className="flex items-center justify-center h-64">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-center justify-center h-64 text-red-600">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-2 text-red-400" />
                        <p className="text-sm">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  {isImage && (
                    <img
                      src={proofUrl}
                      alt="Payment Proof"
                      className="w-full h-auto max-h-96 object-contain"
                      onLoad={handleImageLoad}
                      onError={handleImageError}
                      style={{ display: isLoading ? 'none' : 'block' }}
                    />
                  )}
                  
                  {isPDF && (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-3 text-blue-500" />
                        <p className="text-sm text-gray-600 mb-2">PDF Document</p>
                        <Button
                          onClick={() => window.open(proofUrl, '_blank')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Open PDF
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {!isImage && !isPDF && (
                    <div className="h-64 flex items-center justify-center">
                      <div className="text-center">
                        <FileText className="h-16 w-16 mx-auto mb-3 text-gray-400" />
                        <p className="text-sm text-gray-600">Unknown file type</p>
                        <Button
                          onClick={() => window.open(proofUrl, '_blank')}
                          variant="outline"
                        >
                          Open File
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="text-xs text-gray-500 text-center">
                  <p>Proof URL: {proofUrl.substring(0, 50)}...</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex justify-end gap-3">
              <Button
                onClick={onClose}
                variant="outline"
              >
                Close
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
