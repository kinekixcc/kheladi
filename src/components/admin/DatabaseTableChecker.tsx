import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { Database, Eye, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export const DatabaseTableChecker: React.FC = () => {
  const [tableData, setTableData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const checkTables = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Check tournament_commissions table
      try {
        const { data, error } = await supabase
          .from('tournament_commissions')
          .select('*')
          .limit(10);
        
        if (error) {
          results.tournament_commissions = { exists: false, error: error.message };
        } else {
          results.tournament_commissions = { exists: true, data: data || [] };
        }
      } catch (err) {
        results.tournament_commissions = { exists: false, error: 'Table does not exist' };
      }

      // Check tournament_commission_refunds table
      try {
        const { data, error } = await supabase
          .from('tournament_commission_refunds')
          .select('*')
          .limit(10);
        
        if (error) {
          results.tournament_commission_refunds = { exists: false, error: error.message };
        } else {
          results.tournament_commission_refunds = { exists: true, data: data || [] };
        }
      } catch (err) {
        results.tournament_commission_refunds = { exists: false, error: 'Table does not exist' };
      }

      // Check tournament_rejections table
      try {
        const { data, error } = await supabase
          .from('tournament_rejections')
          .select('*')
          .limit(10);
        
        if (error) {
          results.tournament_rejections = { exists: false, error: error.message };
        } else {
          results.tournament_rejections = { exists: true, data: data || [] };
        }
      } catch (err) {
        results.tournament_rejections = { exists: false, error: 'Table does not exist' };
      }

      setTableData(results);
      
      const missingTables = Object.keys(results).filter(key => !results[key].exists);
      if (missingTables.length === 0) {
        toast.success('✅ All tables exist!');
      } else {
        toast.error(`❌ Missing tables: ${missingTables.join(', ')}`);
      }

    } catch (error) {
      console.error('Database check failed:', error);
      toast.error('Database check failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Database className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Database Table Contents</h3>
      </div>

      <Button
        onClick={checkTables}
        disabled={loading}
        className="mb-6"
      >
        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
        {loading ? 'Checking...' : 'Check Tables'}
      </Button>

      {Object.keys(tableData).length > 0 && (
        <div className="space-y-6">
          {Object.entries(tableData).map(([tableName, result]: [string, any]) => (
            <div key={tableName} className="border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                {tableName.replace(/_/g, ' ')}
                <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                  result.exists ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.exists ? 'Exists' : 'Missing'}
                </span>
              </h4>
              
              {result.error ? (
                <div className="text-red-600 text-sm">
                  Error: {result.error}
                </div>
              ) : result.exists ? (
                <div>
                  <div className="text-sm text-gray-600 mb-2">
                    {result.data.length} records found
                  </div>
                  {result.data.length > 0 ? (
                    <div className="bg-gray-50 p-3 rounded text-xs font-mono overflow-x-auto">
                      <pre>{JSON.stringify(result.data, null, 2)}</pre>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm italic">
                      Table exists but no data
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What This Shows:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Whether required tables exist in your database</li>
          <li>Actual data content in each table</li>
          <li>Specific error messages if tables are missing</li>
          <li>Help diagnose why refund system isn't working</li>
        </ul>
      </div>
    </Card>
  );
};


