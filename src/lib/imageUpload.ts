import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const imageUploadService = {
  // Check if bucket exists, create if it doesn't
  async ensureBucketExists(bucketName: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if bucket '${bucketName}' exists...`);
      
      // List all buckets
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      if (listError) {
        console.error('❌ Failed to list buckets:', listError);
        return false;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.id === bucketName);
      console.log(`🔍 Bucket '${bucketName}' exists:`, bucketExists);
      
      if (!bucketExists) {
        console.log(`🔧 Creating bucket '${bucketName}'...`);
        const { error: createError } = await supabase.storage.createBucket(bucketName, {
          public: true,
          allowedMimeTypes: ['image/*', 'application/pdf'],
          fileSizeLimit: 5242880 // 5MB
        });
        
        if (createError) {
          console.error(`❌ Failed to create bucket '${bucketName}':`, createError);
          return false;
        }
        
        console.log(`✅ Bucket '${bucketName}' created successfully`);
        return true;
      }
      
      return true;
    } catch (error) {
      console.error(`❌ Error ensuring bucket '${bucketName}' exists:`, error);
      return false;
    }
  },

  // Upload a single image to Supabase storage
  async uploadImage(file: File, folder: string = 'venue-images'): Promise<ImageUploadResult> {
    try {
      console.log('🔍 File validation:', {
        name: file.name,
        type: file.type,
        size: file.size,
        extension: file.name.split('.').pop()?.toLowerCase()
      });
      
      // Enhanced file type validation
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const isImageByExtension = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExtension || '');
      const isImageByType = file.type.startsWith('image/');
      const isPdfByType = file.type === 'application/pdf';
      const isPdfByExtension = fileExtension === 'pdf';
      
      console.log('🔍 File validation details:', {
        fileName: file.name,
        fileType: file.type,
        fileExtension: fileExtension,
        isImageByExtension: isImageByExtension,
        isImageByType: isImageByType,
        isPdfByType: isPdfByType,
        isPdfByExtension: isPdfByExtension
      });
      
      // Validate file type (allow images and PDFs for payment proofs)
      if (folder === 'payment-proofs') {
        if (!isImageByType && !isPdfByType && !isImageByExtension && !isPdfByExtension) {
          console.log('❌ Payment proof validation failed - not an image or PDF');
          return { success: false, error: 'File must be an image (JPG, PNG) or PDF' };
        }
      } else {
        if (!isImageByType && !isImageByExtension) {
          console.log('❌ Image validation failed - not an image');
          return { success: false, error: 'File must be an image' };
        }
      }
      
      console.log('✅ File type validation passed');
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { success: false, error: 'File size must be less than 5MB' };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      // Use just the filename, not folder/filename to avoid double paths
      const filePath = fileName;

      // Upload to Supabase storage - use appropriate bucket based on folder
      let bucketName: string;
      if (folder === 'payment-proofs') {
        bucketName = 'payment-proofs'; // Use dedicated bucket for payment proofs
      } else if (folder === 'chat-files') {
        bucketName = 'chat-files'; // Use chat files bucket
      } else if (folder === 'venue-images') {
        bucketName = 'tournament-images'; // Use tournament-images bucket for tournament photos
      } else {
        bucketName = 'tournament-images'; // Default to tournament-images for other cases
      }
      
      // Bucket existence check bypassed - we know buckets exist
      console.log('🚀 Skipping bucket existence check - proceeding directly to upload...');
      
      console.log('📦 Uploading to bucket:', bucketName, 'path:', filePath);

      console.log('🚀 Attempting upload to Supabase storage...');
      console.log('📦 Upload details:', { bucketName, filePath, fileSize: file.size, fileType: file.type });
      
      try {
        console.log('🚀 Starting direct Supabase upload...');
        console.log('🔍 Upload parameters:', { bucketName, filePath, fileSize: file.size, fileType: file.type });
        
        // Add timeout to prevent infinite hanging
        const uploadPromise = supabase.storage
          .from(bucketName)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
            contentType: file.type || 'image/png'
          });
        
        // Add a reasonable timeout (30 seconds)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Upload timed out after 30 seconds')), 30000)
        );
        
        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;
        
        console.log('✅ Upload completed - data:', data, 'error:', error);
        
        if (error) {
          console.error('❌ Upload error:', error);
          console.error('❌ Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          return { success: false, error: error.message || 'Upload failed' };
        }
        
        if (!data) {
          console.error('❌ No data returned from upload');
          return { success: false, error: 'No data returned from upload' };
        }
        
        console.log('✅ Upload successful, data:', data);
        
        // Get public URL
        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);
        
        if (!urlData?.publicUrl) {
          console.error('❌ Failed to get public URL');
          return { success: false, error: 'Failed to get public URL' };
        }
        
        console.log('✅ File uploaded successfully:', urlData.publicUrl);
        return { success: true, url: urlData.publicUrl };
        
      } catch (uploadError: any) {
        console.error('❌ Upload exception:', uploadError);
        console.error('❌ Exception details:', {
          name: uploadError.name,
          message: uploadError.message,
          stack: uploadError.stack,
          code: uploadError.code
        });
        return { success: false, error: uploadError.message || 'Upload failed with exception' };
      }
    } catch (error: any) {
      console.error('Image upload error:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  },

  // Upload multiple images
  async uploadMultipleImages(files: File[], folder: string = 'venue-images'): Promise<ImageUploadResult[]> {
    console.log(`🔄 Starting upload of ${files.length} files to folder: ${folder}`);
    const results: ImageUploadResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      console.log(`📤 Uploading file ${i + 1}/${files.length}: ${file.name}`);
      
      const result = await this.uploadImage(file, folder);
      results.push(result);
      
      console.log(`📤 File ${i + 1} upload result:`, result.success ? '✅ Success' : '❌ Failed');
      
      if (!result.success) {
        console.error(`❌ File ${i + 1} upload failed:`, result.error);
      }
    }
    
    console.log(`🔄 Upload complete. Results:`, results);
    return results;
  },

  // Delete an image from storage
  async deleteImage(filePath: string, bucketName: string = 'venue-images'): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from(bucketName)
        .remove([filePath]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || 'Delete failed' };
    }
  }
};