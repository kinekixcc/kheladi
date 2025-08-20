import { supabase } from './supabase';

export interface ImageUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export const imageUploadService = {
  // Upload a single image to Supabase storage
  async uploadImage(file: File, folder: string = 'venue-images'): Promise<ImageUploadResult> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { success: false, error: 'File must be an image' };
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return { success: false, error: 'File size must be less than 5MB' };
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('venue-images')
        .upload(filePath, file);

      if (error) {
        console.error('Upload error:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: 'No data returned from upload' };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('venue-images')
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        return { success: false, error: 'Failed to get public URL' };
      }

      return { success: true, url: urlData.publicUrl };
    } catch (error: any) {
      console.error('Image upload error:', error);
      return { success: false, error: error.message || 'Upload failed' };
    }
  },

  // Upload multiple images
  async uploadMultipleImages(files: File[], folder: string = 'venue-images'): Promise<ImageUploadResult[]> {
    const results: ImageUploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadImage(file, folder);
      results.push(result);
    }
    
    return results;
  },

  // Delete an image from storage
  async deleteImage(filePath: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.storage
        .from('venue-images')
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



