import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import { Database, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const QuickSupabaseCheck: React.FC = () => {
  const [checkResults, setCheckResults] = useState<any>({});
  const [checking, setChecking] = useState(false);

  const quickCheck = async () => {
    setChecking(true);
    const results: any = {};

    try {
      // Check 1: Environment variables
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      results.env_vars = {
        success: !!(supabaseUrl && supabaseAnonKey),
        supabase_url: supabaseUrl || '❌ Missing',
        supabase_anon_key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
        message: supabaseUrl && supabaseAnonKey ? 'Environment variables OK' : 'Missing environment variables'
      };

      // Check 2: Basic Supabase connection
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          results.basic_connection = { success: false, error: error.message };
        } else {
          results.basic_connection = { success: true, message: 'Basic connection working' };
        }
      } catch (err: any) {
        results.basic_connection = { success: false, error: err.message };
      }

      // Check 3: Storage service status (with very short timeout)
      try {
        console.log('🔍 Quick storage check...');
        const storagePromise = supabase.storage.listBuckets();
        const storageTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage check timed out after 5 seconds')), 5000)
        );
        
        const { data: buckets, error: bucketError } = await Promise.race([storagePromise, storageTimeout]) as any;
        
        if (bucketError) {
          results.storage_status = { success: false, error: bucketError.message };
        } else {
          results.storage_status = { 
            success: true, 
            message: `Storage working - ${buckets?.length || 0} buckets found`,
            buckets: buckets?.map((b: any) => b.id) || []
          };
        }
      } catch (err: any) {
        results.storage_status = { 
          success: false, 
          error: err.message.includes('timed out') ? 'Storage service timeout - likely disabled or down' : err.message 
        };
      }

      setCheckResults(results);
      
      // Show summary
      const failedChecks = Object.keys(results).filter(key => !results[key].success);
      
      if (failedChecks.length === 0) {
        toast.success('✅ All checks passed!');
      } else {
        toast.error(`❌ ${failedChecks.length} checks failed. Check results below.`);
      }

    } catch (error) {
      console.error('Quick check failed:', error);
      toast.error('Quick check failed');
    } finally {
      setChecking(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-5 w-5 text-green-500" /> : 
      <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <AlertCircle className="h-6 w-6 text-orange-600" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Supabase Check</h3>
      </div>

      <Button
        onClick={quickCheck}
        disabled={checking}
        className="mb-6"
      >
        <Database className="h-4 w-4 mr-2" />
        {checking ? 'Checking...' : 'Quick Check'}
      </Button>

      {Object.keys(checkResults).length > 0 && (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Check Results:</h4>
          
          {Object.entries(checkResults).map(([key, result]: [string, any]) => (
            <div key={key} className={`p-3 border rounded-lg ${getStatusColor(result.success)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getStatusIcon(result.success)}
                  <span className="font-medium">{key.replace(/_/g, ' ')}</span>
                </div>
                
                <div className="text-sm">
                  <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                    {result.success ? '✅ OK' : '❌ Failed'}
                  </span>
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
              
              {result.supabase_url && (
                <div className="mt-2 text-sm text-gray-600">
                  <div>URL: {result.supabase_url}</div>
                  <div>Key: {result.supabase_anon_key}</div>
                </div>
              )}
              
              {result.buckets && result.buckets.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Buckets: {result.buckets.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
        <h4 className="font-medium text-orange-900 mb-2">Common Solutions:</h4>
        <ul className="text-sm text-orange-800 space-y-1 list-disc list-inside">
          <li><strong>Missing .env file</strong> - Create .env file with Supabase credentials</li>
          <li><strong>Storage disabled</strong> - Enable Storage in Supabase dashboard</li>
          <li><strong>Wrong credentials</strong> - Check URL and anon key in .env</li>
          <li><strong>Storage policies</strong> - Check storage permissions in Supabase</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Next Steps:</h4>
        <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
          <li>Run this quick check to see what's failing</li>
          <li>Check your .env file for Supabase credentials</li>
          <li>Go to Supabase dashboard and enable Storage</li>
          <li>Check storage policies and permissions</li>
        </ol>
      </div>
    </Card>
  );
};





