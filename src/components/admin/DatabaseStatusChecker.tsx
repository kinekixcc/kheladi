import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase } from '../../lib/supabase';
import { CheckCircle, XCircle, AlertCircle, Database, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface TableStatus {
  name: string;
  exists: boolean;
  rowCount: number;
  error?: string;
}

export const DatabaseStatusChecker: React.FC = () => {
  const [tableStatuses, setTableStatuses] = useState<TableStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'checking' | 'ready' | 'missing' | 'error'>('checking');

  const checkDatabaseTables = async () => {
    setLoading(true);
    setOverallStatus('checking');
    
    const tablesToCheck = [
      'tournament_commission_refunds',
      'tournament_rejections', 
      'audit_logs',
      'tournament_commissions',
      'tournaments',
      'profiles'
    ];

    const statuses: TableStatus[] = [];

    for (const tableName of tablesToCheck) {
      try {
        // Check if table exists by trying to select from it
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (error) {
          statuses.push({
            name: tableName,
            exists: false,
            rowCount: 0,
            error: error.message
          });
        } else {
          statuses.push({
            name: tableName,
            exists: true,
            rowCount: count || 0
          });
        }
      } catch (err) {
        statuses.push({
          name: tableName,
          exists: false,
          rowCount: 0,
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }

    setTableStatuses(statuses);
    
    // Determine overall status
    const missingTables = statuses.filter(s => !s.exists);
    if (missingTables.length === 0) {
      setOverallStatus('ready');
      toast.success('✅ All required database tables are ready!');
    } else if (missingTables.length <= 2) {
      setOverallStatus('missing');
      toast.warning(`⚠️ ${missingTables.length} tables are missing. Please run the SQL script.`);
    } else {
      setOverallStatus('error');
      toast.error('❌ Multiple database tables are missing. Database setup required.');
    }
    
    setLoading(false);
  };

  useEffect(() => {
    checkDatabaseTables();
  }, []);

  const getStatusIcon = (status: TableStatus) => {
    if (status.exists) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    } else if (status.error) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    } else {
      return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: TableStatus) => {
    if (status.exists) return 'text-green-700 bg-green-50 border-green-200';
    if (status.error) return 'text-red-700 bg-red-50 border-red-200';
    return 'text-yellow-700 bg-yellow-50 border-yellow-200';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Database Status Checker</h3>
        </div>
        <Button
          onClick={checkDatabaseTables}
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <div className={`mb-6 p-4 rounded-lg border-2 ${
        overallStatus === 'ready' ? 'bg-green-50 border-green-200' :
        overallStatus === 'missing' ? 'bg-yellow-50 border-yellow-200' :
        overallStatus === 'error' ? 'bg-red-50 border-red-200' :
        'bg-blue-50 border-blue-200'
      }`}>
        <div className="flex items-center space-x-2">
          {overallStatus === 'ready' && <CheckCircle className="h-5 w-5 text-green-600" />}
          {overallStatus === 'missing' && <AlertCircle className="h-5 w-5 text-yellow-600" />}
          {overallStatus === 'error' && <XCircle className="h-5 w-5 text-red-600" />}
          {overallStatus === 'checking' && <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />}
          
          <span className="font-medium">
            {overallStatus === 'ready' && '✅ Database Ready - All tables exist!'}
            {overallStatus === 'missing' && '⚠️ Database Partially Ready - Some tables missing'}
            {overallStatus === 'error' && '❌ Database Setup Required - Multiple tables missing'}
            {overallStatus === 'checking' && '🔍 Checking database status...'}
          </span>
        </div>
      </div>

      {/* Table Statuses */}
      <div className="space-y-3">
        {tableStatuses.map((status) => (
          <div
            key={status.name}
            className={`p-3 rounded-lg border ${getStatusColor(status)}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getStatusIcon(status)}
                <span className="font-medium">{status.name}</span>
              </div>
              
              <div className="text-sm">
                {status.exists ? (
                  <span className="text-green-600">
                    {status.rowCount} rows
                  </span>
                ) : (
                  <span className="text-red-600">
                    Missing
                  </span>
                )}
              </div>
            </div>
            
            {status.error && (
              <div className="mt-2 text-sm text-red-600">
                Error: {status.error}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Required */}
      {overallStatus !== 'ready' && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Action Required:</h4>
          <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
            <li>Go to your Supabase Dashboard</li>
            <li>Click "SQL Editor" (left sidebar)</li>
            <li>Click "New Query"</li>
            <li>Copy and paste the SQL script provided</li>
            <li>Click "Run" to execute</li>
            <li>Come back and click "Refresh" above</li>
          </ol>
        </div>
      )}
    </Card>
  );
};





