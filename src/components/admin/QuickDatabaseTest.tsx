import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Database, TestTube, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const QuickDatabaseTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testDatabaseTables = async () => {
    setTesting(true);
    const results: any = {};

    try {
      // Test 1: Check if tables exist
      console.log('🧪 Testing database tables...');
      
      // Test tournament_commission_refunds table
      try {
        const { data, error } = await supabase
          .from('tournament_commission_refunds')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results.tournament_commission_refunds = { exists: false, error: error.message };
          console.error('❌ tournament_commission_refunds table error:', error);
        } else {
          results.tournament_commission_refunds = { exists: true, count: data?.length || 0 };
          console.log('✅ tournament_commission_refunds table exists');
        }
      } catch (err) {
        results.tournament_commission_refunds = { exists: false, error: 'Table does not exist' };
        console.error('❌ tournament_commission_refunds table missing');
      }

      // Test tournament_rejections table
      try {
        const { data, error } = await supabase
          .from('tournament_rejections')
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          results.tournament_rejections = { exists: false, error: error.message };
          console.error('❌ tournament_rejections table error:', error);
        } else {
          results.tournament_rejections = { exists: true, count: data?.length || 0 };
          console.log('✅ tournament_rejections table exists');
        }
      } catch (err) {
        results.tournament_rejections = { exists: false, error: 'Table does not exist' };
        console.error('❌ tournament_rejections table missing');
      }

      // Test 2: Try to insert a test record
      console.log('🧪 Testing insert operations...');
      
      if (results.tournament_rejections.exists) {
        try {
          const testRejection = {
            tournament_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            organizer_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            rejection_reason: 'Test rejection for database verification',
            admin_notes: 'This is a test record to verify table structure'
          };

          const { data, error } = await supabase
            .from('tournament_rejections')
            .insert([testRejection])
            .select();

          if (error) {
            results.insert_test = { success: false, error: error.message };
            console.error('❌ Insert test failed:', error);
          } else {
            results.insert_test = { success: true, message: 'Test record inserted successfully' };
            console.log('✅ Insert test passed');
            
            // Clean up test record
            await supabase
              .from('tournament_rejections')
              .delete()
              .eq('rejection_reason', 'Test rejection for database verification');
          }
        } catch (err) {
          results.insert_test = { success: false, error: 'Insert operation failed' };
          console.error('❌ Insert test failed:', err);
        }
      }

      setTestResults(results);
      
      // Show summary
      const missingTables = Object.keys(results).filter(key => 
        key !== 'insert_test' && !results[key].exists
      );
      
      if (missingTables.length === 0) {
        toast.success('✅ All database tables are ready!');
      } else {
        toast.error(`❌ Missing tables: ${missingTables.join(', ')}`);
      }

    } catch (error) {
      console.error('💥 Database test failed:', error);
      toast.error('Database test failed');
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (exists: boolean) => {
    return exists ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <TestTube className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Database Test</h3>
      </div>

      <Button
        onClick={testDatabaseTables}
        disabled={testing}
        className="mb-6"
      >
        <Database className="h-4 w-4 mr-2" />
        {testing ? 'Testing...' : 'Test Database Tables'}
      </Button>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Test Results:</h4>
          
          {Object.entries(testResults).map(([key, result]: [string, any]) => (
            <div key={key} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {key === 'insert_test' ? 
                    <TestTube className="h-4 w-4 text-blue-500" /> :
                    getStatusIcon(result.exists)
                  }
                  <span className="font-medium">{key.replace(/_/g, ' ')}</span>
                </div>
                
                <div className="text-sm">
                  {key === 'insert_test' ? (
                    <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                      {result.success ? '✅ Passed' : '❌ Failed'}
                    </span>
                  ) : (
                    <span className={result.exists ? 'text-green-600' : 'text-red-600'}>
                      {result.exists ? '✅ Exists' : '❌ Missing'}
                    </span>
                  )}
                </div>
              </div>
              
              {result.error && (
                <div className="mt-2 text-sm text-red-600">
                  Error: {result.error}
                </div>
              )}
              
              {result.message && (
                <div className="mt-2 text-sm text-green-600">
                  {result.message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What This Test Does:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Checks if required database tables exist</li>
          <li>Tests basic insert operations</li>
          <li>Verifies table permissions and structure</li>
          <li>Shows detailed error messages if something fails</li>
        </ul>
      </div>
    </Card>
  );
};





