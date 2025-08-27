import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FlaskConical, 
  Plus, 
  Trash2, 
  RefreshCw, 
  BarChart3, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { testDataService } from '../../lib/testDataService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { showTestFeatures } from '../../config/environment';

export const TestDataPanel: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<{
    testTournaments: number;
    testCommissions: number;
    totalTestRevenue: number;
  } | null>(null);
  const [showStats, setShowStats] = useState(false);

  // Hide test features in production
  if (!showTestFeatures) {
    return null;
  }

  // Generate single test tournament
  const handleCreateSingleTest = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const result = await testDataService.createTestTournamentWithCommission(user.id);
      
      toast.success(`Test tournament "${result.tournament.name}" created successfully!`);
      console.log('🧪 Test data created:', result);
      
      // Refresh stats
      await loadTestStats();
      
    } catch (error) {
      console.error('Error creating test tournament:', error);
      toast.error('Failed to create test tournament');
    } finally {
      setLoading(false);
    }
  };

  // Generate multiple test tournaments
  const handleCreateMultipleTests = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setLoading(true);
      const result = await testDataService.createMultipleTestTournaments(user.id, 3);
      
      toast.success(`Created ${result.tournaments.length} test tournaments successfully!`);
      console.log('🧪 Multiple test data created:', result);
      
      // Refresh stats
      await loadTestStats();
      
    } catch (error) {
      console.error('Error creating multiple test tournaments:', error);
      toast.error('Failed to create test tournaments');
    } finally {
      setLoading(false);
    }
  };

  // Clean up all test data
  const handleCleanupTestData = async () => {
    if (!user?.id) {
      toast.error('User not authenticated');
      return;
    }

    if (!window.confirm('Are you sure you want to delete ALL test data? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await testDataService.cleanupTestData(user.id);
      
      toast.success('All test data cleaned up successfully!');
      console.log('🧹 Test data cleaned up');
      
      // Reset stats
      setStats(null);
      setShowStats(false);
      
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      toast.error('Failed to clean up test data');
    } finally {
      setLoading(false);
    }
  };

  // Load test data statistics
  const loadTestStats = async () => {
    if (!user?.id) return;

    try {
      const testStats = await testDataService.getTestDataStats(user.id);
      setStats(testStats);
      setShowStats(true);
    } catch (error) {
      console.error('Error loading test stats:', error);
    }
  };

  // Toggle stats display
  const toggleStats = () => {
    if (showStats) {
      setShowStats(false);
    } else {
      loadTestStats();
    }
  };

  return (
    <Card className="p-6 border-2 border-orange-200 bg-orange-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-6 w-6 text-orange-600" />
          <h3 className="text-lg font-semibold text-orange-800">🧪 Test Data Generator</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
            Development Only
          </span>
        </div>
      </div>

      <p className="text-orange-700 text-sm mb-4">
        Generate test tournaments and commissions to test the payment system. 
        This data will be created in your database and can be used to verify the complete flow.
      </p>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Button
          onClick={handleCreateSingleTest}
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create Single Test
        </Button>

        <Button
          onClick={handleCreateMultipleTests}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Create 3 Test Tournaments
        </Button>

        <Button
          onClick={handleCleanupTestData}
          disabled={loading}
          variant="outline"
          className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50 flex items-center gap-2"
        >
          {loading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          Clean Up All Tests
        </Button>
      </div>

      {/* Stats Toggle */}
      <div className="flex justify-center">
        <Button
          onClick={toggleStats}
          variant="outline"
          size="sm"
          className="text-orange-600 hover:text-orange-700 border-orange-300"
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {showStats ? 'Hide' : 'Show'} Test Data Stats
        </Button>
      </div>

      {/* Statistics Display */}
      {showStats && stats && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-white rounded-lg border border-orange-200"
        >
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-orange-600" />
            Test Data Statistics
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.testTournaments}</div>
              <div className="text-sm text-gray-600">Test Tournaments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.testCommissions}</div>
              <div className="text-sm text-gray-600">Pending Commissions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">रु {stats.totalTestRevenue.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Total Test Revenue</div>
            </div>
          </div>

          {stats.testTournaments > 0 && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Test data ready! Check the Revenue Dashboard to see pending commissions.
                </span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Warning */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2 text-yellow-700">
          <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">⚠️ Important Notes:</p>
            <ul className="mt-1 space-y-1 text-xs">
              <li>• Test data is clearly marked with "Test" in the name</li>
              <li>• All test tournaments start with "pending_approval" status</li>
              <li>• Commissions are created with "pending" payment status</li>
              <li>• Use "Clean Up All Tests" to remove test data before production</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quick Test Instructions */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2 text-blue-700">
          <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-medium">🧪 Quick Testing Steps:</p>
            <ol className="mt-1 space-y-1 text-xs list-decimal list-inside">
              <li>Click "Create Single Test" to generate a test tournament</li>
              <li>Go to Revenue Dashboard to see the pending commission</li>
              <li>Test the payment verification workflow</li>
              <li>Use "Clean Up All Tests" when done testing</li>
            </ol>
          </div>
        </div>
      </div>
    </Card>
  );
};
