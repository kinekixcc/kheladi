import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Trophy, 
  CreditCard,
  BarChart3,
  Calendar,
  Target,
  Zap,
  RefreshCw,
  Download,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Star
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import toast from 'react-hot-toast';

interface RevenueMetrics {
  totalRevenue: number;
  monthlyRevenue: number;
  transactionVolume: number;
  commissionEarnings: number;
  subscriptionRevenue: number;
  averageTransactionValue: number;
  conversionRate: number;
  churnRate: number;
}

interface TransactionSimulation {
  id: string;
  type: 'tournament_fee' | 'subscription' | 'premium_listing';
  amount: number;
  commission: number;
  timestamp: string;
  status: 'completed' | 'pending' | 'failed';
  user_type: 'organizer' | 'player';
}

export const RevenueTestingSystem: React.FC = () => {
  const [metrics, setMetrics] = useState<RevenueMetrics>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    transactionVolume: 0,
    commissionEarnings: 0,
    subscriptionRevenue: 0,
    averageTransactionValue: 0,
    conversionRate: 0,
    churnRate: 0
  });

  const [transactions, setTransactions] = useState<TransactionSimulation[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1000); // ms between transactions

  useEffect(() => {
    loadExistingData();
  }, []);

  const loadExistingData = () => {
    try {
      const savedTransactions = localStorage.getItem('revenue_test_transactions');
      if (savedTransactions) {
        const parsedTransactions = JSON.parse(savedTransactions);
        setTransactions(parsedTransactions);
        calculateMetrics(parsedTransactions);
      }
    } catch (error) {
      console.error('Error loading existing revenue data:', error);
    }
  };

  const calculateMetrics = (transactionList: TransactionSimulation[]) => {
    const completedTransactions = transactionList.filter(t => t.status === 'completed');
    const totalRevenue = completedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalCommission = completedTransactions.reduce((sum, t) => sum + t.commission, 0);
    
    // Calculate monthly revenue (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const monthlyTransactions = completedTransactions.filter(t => 
      new Date(t.timestamp) >= thirtyDaysAgo
    );
    const monthlyRevenue = monthlyTransactions.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate subscription revenue
    const subscriptionRevenue = completedTransactions
      .filter(t => t.type === 'subscription')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const averageTransactionValue = completedTransactions.length > 0 
      ? totalRevenue / completedTransactions.length 
      : 0;

    setMetrics({
      totalRevenue,
      monthlyRevenue,
      transactionVolume: completedTransactions.length,
      commissionEarnings: totalCommission,
      subscriptionRevenue,
      averageTransactionValue,
      conversionRate: Math.random() * 15 + 10, // Simulated
      churnRate: Math.random() * 5 + 2 // Simulated
    });
  };

  const generateRandomTransaction = (): TransactionSimulation => {
    const types: TransactionSimulation['type'][] = ['tournament_fee', 'subscription', 'premium_listing'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let amount: number;
    let commission: number;
    
    switch (type) {
      case 'tournament_fee':
        amount = Math.floor(Math.random() * 2000) + 500; // 500-2500
        commission = amount * 0.05; // 5% commission
        break;
      case 'subscription':
        amount = Math.random() > 0.5 ? 999 : 2499; // Basic or Pro plan
        commission = amount * 0.1; // 10% commission for subscriptions
        break;
      case 'premium_listing':
        amount = 500;
        commission = amount; // Full amount for premium listings
        break;
    }

    return {
      id: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      amount,
      commission,
      timestamp: new Date().toISOString(),
      status: Math.random() > 0.05 ? 'completed' : 'failed', // 95% success rate
      user_type: Math.random() > 0.3 ? 'organizer' : 'player'
    };
  };

  const startSimulation = () => {
    setIsSimulating(true);
    toast.success('Revenue simulation started');
    
    const interval = setInterval(() => {
      const newTransaction = generateRandomTransaction();
      setTransactions(prev => {
        const updated = [newTransaction, ...prev.slice(0, 99)]; // Keep last 100 transactions
        localStorage.setItem('revenue_test_transactions', JSON.stringify(updated));
        calculateMetrics(updated);
        return updated;
      });
    }, simulationSpeed);

    // Store interval ID for cleanup
    (window as any).revenueSimulationInterval = interval;
  };

  const stopSimulation = () => {
    setIsSimulating(false);
    if ((window as any).revenueSimulationInterval) {
      clearInterval((window as any).revenueSimulationInterval);
      delete (window as any).revenueSimulationInterval;
    }
    toast.info('Revenue simulation stopped');
  };

  const resetData = () => {
    if (confirm('Are you sure you want to reset all revenue test data?')) {
      // Stop simulation if running
      if (isSimulating) {
        stopSimulation();
      }
      
      setTransactions([]);
      setMetrics({
        totalRevenue: 0,
        monthlyRevenue: 0,
        transactionVolume: 0,
        commissionEarnings: 0,
        subscriptionRevenue: 0,
        averageTransactionValue: 0,
        conversionRate: 0,
        churnRate: 0
      });
      localStorage.removeItem('revenue_test_transactions');
      
      // Also clear dummy payment processor data
      const { dummyPaymentProcessor } = require('../../lib/dummyPaymentSystem');
      dummyPaymentProcessor.clearTransactions();
      
      toast.success('Revenue test data reset');
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Transaction ID', 'Type', 'Amount', 'Commission', 'Status', 'User Type', 'Timestamp'],
      ...transactions.map(t => [
        t.id,
        t.type,
        t.amount.toString(),
        t.commission.toString(),
        t.status,
        t.user_type,
        new Date(t.timestamp).toLocaleString()
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenue_test_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Revenue data exported!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics Testing</h2>
          <p className="text-gray-600">Simulate and test revenue tracking with realistic data</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Speed:</label>
            <select
              value={simulationSpeed}
              onChange={(e) => setSimulationSpeed(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option value={500}>Fast (0.5s)</option>
              <option value={1000}>Normal (1s)</option>
              <option value={2000}>Slow (2s)</option>
            </select>
          </div>
          {isSimulating ? (
            <Button onClick={stopSimulation} className="bg-red-600 hover:bg-red-700">
              <Pause className="h-4 w-4 mr-2" />
              Stop Simulation
            </Button>
          ) : (
            <Button onClick={startSimulation} className="bg-green-600 hover:bg-green-700">
              <Play className="h-4 w-4 mr-2" />
              Start Simulation
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">रू {metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">All time</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Monthly Revenue</p>
              <p className="text-2xl font-bold text-gray-900">रू {metrics.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-blue-600 mt-1">Last 30 days</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Commission Earned</p>
              <p className="text-2xl font-bold text-gray-900">रू {metrics.commissionEarnings.toLocaleString()}</p>
              <p className="text-sm text-purple-600 mt-1">Platform fees</p>
            </div>
            <Zap className="h-8 w-8 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.transactionVolume}</p>
              <p className="text-sm text-orange-600 mt-1">Total processed</p>
            </div>
            <CreditCard className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Sources</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Tournament Fees</span>
              </div>
              <span className="font-semibold">रू {(metrics.totalRevenue * 0.7).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Subscriptions</span>
              </div>
              <span className="font-semibold">रू {metrics.subscriptionRevenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-gray-600">Premium Listings</span>
              </div>
              <span className="font-semibold">रू {(metrics.totalRevenue * 0.1).toLocaleString()}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Avg Transaction Value</span>
              <span className="font-semibold">रू {metrics.averageTransactionValue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-semibold text-green-600">{metrics.conversionRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Churn Rate</span>
              <span className="font-semibold text-red-600">{metrics.churnRate.toFixed(1)}%</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-medium">Success Rate</span>
              <span className="font-bold text-green-600">
                {transactions.length > 0 
                  ? ((transactions.filter(t => t.status === 'completed').length / transactions.length) * 100).toFixed(1)
                  : 0
                }%
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Test Transactions</h3>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={exportData}>
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={resetData}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No test transactions yet</p>
            <p className="text-gray-500 text-sm">Start simulation to generate test data</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.slice(0, 20).map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  transaction.status === 'completed' ? 'bg-green-50 border-green-200' :
                  transaction.status === 'failed' ? 'bg-red-50 border-red-200' :
                  'bg-yellow-50 border-yellow-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-full ${
                    transaction.type === 'tournament_fee' ? 'bg-blue-100 text-blue-600' :
                    transaction.type === 'subscription' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {transaction.type === 'tournament_fee' && <Trophy className="h-4 w-4" />}
                    {transaction.type === 'subscription' && <Crown className="h-4 w-4" />}
                    {transaction.type === 'premium_listing' && <Star className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {transaction.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-gray-600">
                      {transaction.user_type} • {new Date(transaction.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">रू {transaction.amount.toLocaleString()}</p>
                  <p className="text-xs text-gray-600">Commission: रू {transaction.commission.toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>

      {/* Simulation Controls */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Simulation Controls</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Simulation Status
            </label>
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              isSimulating ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="font-medium">{isSimulating ? 'Running' : 'Stopped'}</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction Rate
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {isSimulating ? `1 per ${simulationSpeed/1000}s` : 'Paused'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Points
            </label>
            <p className="text-lg font-semibold text-gray-900">
              {transactions.length} transactions
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};