import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Calendar, DollarSign, Users, Building2, FileText } from 'lucide-react';
import { Card } from '../ui/Card';

interface PaymentReceiptProps {
  commissionData: {
    tournament_name: string;
    entry_fee: number;
    max_participants: number;
    total_revenue: number;
    commission_percentage: number;
    commission_amount: number;
    organizer_earnings: number;
    tournament_data: any;
  };
  paymentMethod: string;
  transactionId: string;
  paymentDate: string;
  receiptId: string;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  commissionData,
  paymentMethod,
  transactionId,
  paymentDate,
  receiptId
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto p-6"
    >
      <Card className="p-8 bg-white shadow-lg">
        {/* Header */}
        <div className="text-center border-b-2 border-green-200 pb-6 mb-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Receipt</h1>
          <p className="text-green-600 font-semibold">Commission Payment Successful</p>
          <p className="text-sm text-gray-500 mt-1">Receipt ID: {receiptId}</p>
        </div>

        {/* Tournament Details */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-blue-600" />
            Tournament Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Tournament Name</p>
              <p className="font-medium text-gray-900">{commissionData.tournament_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Entry Fee</p>
              <p className="font-medium text-gray-900">रु {commissionData.entry_fee.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Max Participants</p>
              <p className="font-medium text-gray-900">{commissionData.max_participants}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="font-medium text-gray-900">रु {commissionData.total_revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Commission Details */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-purple-600" />
            Commission Details
          </h2>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Commission Rate</p>
                <p className="font-medium text-gray-900">{commissionData.commission_percentage}%</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Commission Amount</p>
                <p className="font-medium text-gray-900 text-purple-600">रु {commissionData.commission_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Organizer Earnings</p>
                <p className="font-medium text-gray-900 text-green-600">रु {commissionData.organizer_earnings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-indigo-600" />
            Payment Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium text-gray-900">{paymentMethod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Transaction ID</p>
              <p className="font-medium text-gray-900 font-mono text-sm">{transactionId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Date</p>
              <p className="font-medium text-gray-900">{paymentDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium text-green-600">Paid</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500 mb-2">
            This receipt serves as proof of commission payment for tournament hosting.
          </p>
          <p className="text-xs text-gray-400">
            Please keep this receipt for your records and admin verification.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};





