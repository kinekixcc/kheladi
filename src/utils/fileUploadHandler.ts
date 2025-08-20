// File upload utilities for tournament creation
export interface FileUploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

export class FileUploadHandler {
  private static instance: FileUploadHandler;
  
  static getInstance(): FileUploadHandler {
    if (!FileUploadHandler.instance) {
      FileUploadHandler.instance = new FileUploadHandler();
    }
    return FileUploadHandler.instance;
  }

  // Validate file before upload
  validateFile(file: File, type: 'image' | 'pdf'): { valid: boolean; error?: string } {
    const maxSizes = {
      image: 5 * 1024 * 1024, // 5MB
      pdf: 10 * 1024 * 1024   // 10MB
    };

    const allowedTypes = {
      image: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      pdf: ['application/pdf']
    };

    // Check file size
    if (file.size > maxSizes[type]) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizes[type] / (1024 * 1024)}MB`
      };
    }

    // Check file type
    if (!allowedTypes[type].includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type. Allowed: ${allowedTypes[type].join(', ')}`
      };
    }

    return { valid: true };
  }

  // Process image files for tournament
  async processImages(files: File[]): Promise<string[]> {
    console.log('📸 Processing tournament images...');
    
    const processedUrls: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = this.validateFile(file, 'image');
      
      if (!validation.valid) {
        console.warn(`⚠️ Skipping invalid image ${file.name}: ${validation.error}`);
        continue;
      }

      try {
        // In production, upload to cloud storage (Supabase Storage, AWS S3, etc.)
        // For development, use placeholder URLs
        const placeholderUrl = this.getPlaceholderImageUrl(i);
        processedUrls.push(placeholderUrl);
        
        console.log(`✅ Processed image ${i + 1}/${files.length}: ${file.name}`);
      } catch (error) {
        console.error(`❌ Failed to process image ${file.name}:`, error);
        // Continue with other images
      }
    }
    
    console.log(`✅ Image processing complete: ${processedUrls.length} images processed`);
    return processedUrls;
  }

  // Process PDF document
  async processPDF(file: File): Promise<string | null> {
    console.log('📄 Processing PDF document...');
    
    const validation = this.validateFile(file, 'pdf');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    try {
      // In production, upload to cloud storage
      // For development, return placeholder URL
      const placeholderUrl = `https://example.com/documents/${file.name}_${Date.now()}.pdf`;
      
      console.log('✅ PDF processing complete');
      return placeholderUrl;
    } catch (error) {
      console.error('❌ PDF processing failed:', error);
      throw new Error('Failed to process PDF document');
    }
  }

  // Get placeholder image URLs for development
  private getPlaceholderImageUrl(index: number): string {
    const placeholderImages = [
      'https://images.pexels.com/photos/274422/pexels-photo-274422.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/209977/pexels-photo-209977.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=800',
      'https://images.pexels.com/photos/1884574/pexels-photo-1884574.jpeg?auto=compress&cs=tinysrgb&w=800'
    ];
    
    return placeholderImages[index % placeholderImages.length];
  }

  // Clean up temporary files
  cleanup(): void {
    // Clean up any temporary files or resources
    console.log('🧹 Cleaning up file upload resources');
  }
}

export const fileUploadHandler = FileUploadHandler.getInstance();