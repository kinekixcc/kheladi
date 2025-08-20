-- ========================================
-- SETUP VENUE IMAGE STORAGE
-- ========================================

-- Create storage bucket for venue images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'venue-images',
  'venue-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload
CREATE POLICY "Allow authenticated users to upload venue images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'venue-images' AND 
    auth.role() = 'authenticated'
  );

-- Create storage policy to allow public to view venue images
CREATE POLICY "Allow public to view venue images" ON storage.objects
  FOR SELECT USING (bucket_id = 'venue-images');

-- Create storage policy to allow venue owners to update their images
CREATE POLICY "Allow venue owners to update their images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'venue-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create storage policy to allow venue owners to delete their images
CREATE POLICY "Allow venue owners to delete their images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'venue-images' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ========================================
-- STORAGE SETUP COMPLETE!
-- ========================================


