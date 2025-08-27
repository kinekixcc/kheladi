import React, { useState } from 'react';
import { Card } from './Card';
import { Button } from './Button';
import { supabase } from '../../lib/supabase';
import { Database, TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const StorageConnectionTest: React.FC = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [testFile, setTestFile] = useState<File | null>(null);
  const [testStatus, setTestStatus] = useState<string>('');

  const testStorageConnection = async () => {
    setTesting(true);
    const results: any = {};

    try {
      console.log('🧪 Testing Supabase storage connection...');
      
      // Test 1: Basic Supabase connection
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
          results.auth_connection = { success: false, error: authError.message };
        } else {
          results.auth_connection = { success: true, message: 'Auth connection working' };
        }
      } catch (err: any) {
        results.auth_connection = { success: false, error: err.message };
      }

      // Test 2: Storage buckets listing (with timeout)
      try {
        console.log('🔍 Testing storage buckets listing...');
        const bucketPromise = supabase.storage.listBuckets();
        const bucketTimeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Storage buckets listing timed out after 10 seconds')), 10000)
        );
        
        const { data: buckets, error: bucketError } = await Promise.race([bucketPromise, bucketTimeoutPromise]) as any;
        
        if (bucketError) {
          results.storage_buckets = { success: false, error: bucketError.message };
        } else {
          results.storage_buckets = { 
            success: true, 
            message: `Found ${buckets?.length || 0} buckets`,
            buckets: buckets?.map((b: any) => b.id) || []
          };
        }
      } catch (err: any) {
        results.storage_buckets = { 
          success: false, 
          error: err.message.includes('timed out') ? 'Timed out - storage connection issue' : err.message 
        };
      }

      // Test 3: Try to create a test bucket
      try {
        console.log('🔧 Testing bucket creation...');
        const testBucketName = `test-bucket-${Date.now()}`;
        
        const { error: createError } = await supabase.storage.createBucket(testBucketName, {
          public: true,
          allowedMimeTypes: ['image/*'],
          fileSizeLimit: 5242880
        });
        
        if (createError) {
          results.bucket_creation = { success: false, error: createError.message };
        } else {
          results.bucket_creation = { success: true, message: 'Test bucket created successfully' };
          
          // Clean up test bucket - skip for now as removeBucket doesn't exist
          console.log('Skipping bucket cleanup - removeBucket not available');
        }
      } catch (err: any) {
        results.bucket_creation = { success: false, error: err.message };
      }

      // Test 4: Check Supabase configuration
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        
        results.configuration = {
          success: !!(supabaseUrl && supabaseAnonKey),
          supabase_url: supabaseUrl ? '✅ Set' : '❌ Missing',
          supabase_anon_key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
          message: supabaseUrl && supabaseAnonKey ? 'Environment variables configured' : 'Environment variables missing'
        };
      } catch (err: any) {
        results.configuration = { success: false, error: err.message };
      }

      setTestResults(results);
      
      // Show summary
      const failedTests = Object.keys(results).filter(key => !results[key].success);
      
      if (failedTests.length === 0) {
        toast.success('✅ All storage tests passed!');
      } else {
        toast.error(`❌ ${failedTests.length} tests failed. Check results below.`);
      }

    } catch (error) {
      console.error('💥 Storage test failed:', error);
      toast.error('Storage test failed');
    } finally {
      setTesting(false);
    }
  };

  const testDirectUpload = async () => {
    if (!testFile) {
      toast.error('Please select a file first');
      return;
    }

    setTestStatus('Testing direct upload...');
    
    try {
      console.log('🧪 Testing direct upload to tournament-images bucket...');
      
      // Test direct upload without any service layer
      const { data, error } = await supabase.storage
        .from('tournament-images')
        .upload(`test-${Date.now()}.jpg`, testFile, {
          cacheControl: '3600',
          upsert: true
        });
      
      console.log('🧪 Direct upload result:', { data, error });
      
      if (error) {
        console.error('❌ Direct upload error:', error);
        setTestStatus(`❌ Direct upload failed: ${error.message}`);
        toast.error(`Direct upload failed: ${error.message}`);
      } else {
        console.log('✅ Direct upload successful:', data);
        setTestStatus('✅ Direct upload successful! RLS policies working.');
        toast.success('Direct upload successful! RLS policies working.');
      }
    } catch (error: any) {
      console.error('❌ Direct upload exception:', error);
      setTestStatus(`❌ Direct upload exception: ${error.message}`);
      toast.error(`Direct upload exception: ${error.message}`);
    }
  };

  const listBuckets = async () => {
    setTestStatus('Listing buckets...');
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        setTestStatus(`❌ Error listing buckets: ${error.message}`);
        toast.error(`Error listing buckets: ${error.message}`);
      } else {
        setTestStatus(`✅ Successfully listed ${data.length} buckets.`);
        toast.success(`Successfully listed ${data.length} buckets.`);
      }
    } catch (error: any) {
      setTestStatus(`❌ Exception listing buckets: ${error.message}`);
      toast.error(`Exception listing buckets: ${error.message}`);
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
        <Database className="h-6 w-6 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">Storage Connection Test</h3>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🔧 Storage Connection Test</h3>
        
        {/* File Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Test File
          </label>
          <input
            type="file"
            onChange={(e) => setTestFile(e.target.files?.[0] || null)}
            accept="image/*"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={testStorageConnection} disabled={!testFile}>
            🔍 Test Storage Connection
          </Button>
          
          <Button onClick={testDirectUpload} disabled={!testFile} variant="outline">
            🧪 Test Direct Upload
          </Button>
          
          <Button onClick={listBuckets} variant="outline">
            📦 List Buckets
          </Button>
        </div>

        {/* Status Display */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700">Status:</p>
          <p className="text-sm text-gray-600">{testStatus}</p>
        </div>

        {/* Results */}
        {testResults && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-700">Test Results:</p>
            <pre className="text-xs text-blue-600 mt-2 overflow-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">What This Tests:</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Basic Supabase authentication connection</li>
          <li>Storage buckets listing (with timeout)</li>
          <li>Bucket creation permissions</li>
          <li>Environment variable configuration</li>
        </ul>
      </div>

      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h4 className="font-medium text-yellow-900 mb-2">Common Issues:</h4>
        <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
          <li><strong>Missing environment variables</strong> - Check .env file</li>
          <li><strong>Storage permissions</strong> - Check Supabase dashboard</li>
          <li><strong>Network issues</strong> - Check internet connection</li>
          <li><strong>Supabase service down</strong> - Check Supabase status</li>
        </ul>
      </div>
    </Card>
  );
};

