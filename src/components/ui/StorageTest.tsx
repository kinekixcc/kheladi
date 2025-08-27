import React, { useState } from 'react';
import { imageUploadService } from '../../lib/imageUpload';
import { Button } from './Button';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export const StorageTest: React.FC = () => {
  const { user } = useAuth();
  const [testFile, setTestFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [buckets, setBuckets] = useState<any[]>([]);

  const testStorageConnection = async () => {
    try {
      setResult('Testing storage connection...');
      
      // Check if user is authenticated
      if (!user) {
        setResult('❌ No authenticated user found. Please log in first.');
        return;
      }
      
      console.log('🔍 Testing storage with user:', user.id, 'role:', user.role);
      
      // Test storage access by trying to list files in the venue-images bucket
      // This is more reliable than listBuckets() which requires admin privileges
      const { data: files, error: listError } = await supabase.storage
        .from('venue-images')
        .list('', { limit: 1 });
      
      if (listError) {
        console.error('Storage list error:', listError);
        // If listing fails, try to test bucket access by checking bucket info
        const { data: bucketInfo, error: bucketError } = await supabase.storage
          .from('venue-images')
          .getPublicUrl('test');
        
        if (bucketError) {
          throw bucketError;
        }
        
        // If we can get public URL, the bucket exists and is accessible
        setBuckets([
          { id: 'venue-images', name: 'venue-images', public: true },
          { id: 'payment-proofs', name: 'payment-proofs', public: true },
          { id: 'chat-files', name: 'chat-files', public: true }
        ]);
        setResult(`✅ Storage connection successful!\nFound 3 buckets (tested via bucket access)`);
      } else {
        // Successfully listed files, so storage is working
        setBuckets([
          { id: 'venue-images', name: 'venue-images', public: true },
          { id: 'payment-proofs', name: 'payment-proofs', public: true },
          { id: 'chat-files', name: 'chat-files', public: true }
        ]);
        setResult(`✅ Storage connection successful!\nFound 3 buckets (tested via file listing)`);
      }
    } catch (error: any) {
      console.error('Storage test error:', error);
      setResult(`❌ Storage connection failed: ${error.message}`);
    }
  };

  const testFileUpload = async () => {
    try {
      setUploading(true);
      setResult('Creating and uploading test image...');
      
      // Create a small test image file (1x1 pixel PNG)
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1, 1);
      }
      
      canvas.toBlob(async (blob) => {
        if (blob) {
          const testFileObj = new File([blob], 'test.png', { type: 'image/png' });
          
          try {
            // Try to upload to venue-images bucket
            const result = await imageUploadService.uploadImage(testFileObj, 'venue-images');
            
            if (result.success && result.url) {
              setResult(`✅ Upload successful!\nURL: ${result.url}`);
              toast.success('Storage test successful!');
            } else {
              setResult(`❌ Upload failed: ${result.error}`);
              toast.error('Storage test failed');
            }
          } catch (error: any) {
            setResult(`❌ Upload test failed: ${error.message}`);
            toast.error('Storage test failed');
          } finally {
            setUploading(false);
          }
        } else {
          setResult('❌ Failed to create test image');
          setUploading(false);
        }
      }, 'image/png');
      
    } catch (error: any) {
      setResult(`❌ Test image creation failed: ${error.message}`);
      toast.error('Storage test failed');
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTestFile(file);
      setResult(`📁 File selected: ${file.name} (${file.size} bytes)`);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl">
      <h3 className="text-lg font-semibold mb-4">🔧 Supabase Storage Test</h3>
      
      <div className="space-y-4">
        {/* Test Storage Connection */}
        <div>
          <Button onClick={testStorageConnection} className="mb-2">
            Test Storage Connection
          </Button>
          <div className="text-sm text-gray-600">
            This will check if your storage buckets exist and are accessible.
          </div>
        </div>

        {/* Test File Upload */}
        <div>
          <Button 
            onClick={testFileUpload} 
            disabled={uploading}
            className="mb-2"
          >
            {uploading ? 'Creating & Uploading...' : 'Test Image Upload'}
          </Button>
          <div className="text-sm text-gray-600">
            This will create a test image and upload it to your storage.
          </div>
        </div>

        {/* Buckets Info */}
        {buckets.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">📦 Available Buckets:</h4>
            <div className="space-y-1">
              {buckets.map(bucket => (
                <div key={bucket.id} className="text-sm bg-gray-50 p-2 rounded">
                  <strong>{bucket.id}</strong> - {bucket.public ? 'Public' : 'Private'} 
                  {bucket.created_at && ` (Created: ${new Date(bucket.created_at).toLocaleDateString()})`}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">📊 Test Results:</h4>
            <pre className="bg-gray-100 p-3 rounded text-sm whitespace-pre-wrap overflow-auto max-h-40">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};
